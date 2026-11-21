import type { Recommendation, RecommendationDecision, Order } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";

/**
 * Referencia del usuario autenticado usada para mostrar nombres en la auditoría.
 * `authUserId` es el UUID de Supabase que el backend guarda en `creadoPor` y
 * `resueltoPorUsuarioId`; `User.id` del frontend es el id numérico local.
 */
export interface CurrentUserRef {
  authUserId: string | null;
  name: string;
}

export interface CrearRecomendacionPayload {
  productId: string;
  quantity: number;
  originDcId: number;
  destStoreId: number;
  confirmarFueraDeCobertura?: boolean;
}

export interface AprobarRecomendacionPayload {
  cantidad?: number;
  centroDistribucionOrigenId?: number;
  confirmarFueraDeCobertura?: boolean;
}

interface BackendRecomendacion {
  id: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  centroDistribucionOrigenId: number;
  tiendaDestinoId: number;
  estado: string;
  fueraDeCobertura: boolean;
  creadoPor: string | null;
  fechaCreacion: string | null;
  resueltoPorUsuarioId: string | null;
  accionTomada: string | null;
  fechaResolucion: string | null;
  motivoRechazo: string | null;
  cantidadPropuesta: number | null;
  centroDistribucionPropuestoId: number | null;
}

interface BackendOrdenReposicion {
  id: number;
  recomendacionId: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  centroDistribucionOrigenId: number;
  tiendaDestinoId: number;
  estado: string;
  creadoPor: string | null;
  fechaCreacion: string | null;
}

const RECOMENDACION_ERRORS: ErrorTranslations = [
  ["La cantidad solicitada debe ser un número mayor que cero", "Indica una cantidad válida."],
  ["La cantidad ajustada debe ser mayor que cero", "Indica una cantidad válida."],
  ["El motivo de rechazo es obligatorio", "Indica el motivo del rechazo."],
  ["La recomendación ya fue resuelta", "La recomendación ya fue aprobada o rechazada."],
  ["No se puede operar con un producto inactivo", "El producto está inactivo."],
  ["No se puede operar con una tienda inactiva", "La tienda está inactiva."],
  [
    "No se puede operar con un Centro de Distribución inactivo",
    "El Centro de Distribución está inactivo.",
  ],
];

const RECOMENDACION_FORBIDDEN = "Solo un Planificador puede gestionar recomendaciones de reposición.";

function formatFecha(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function usuarioLabel(uuid: string | null | undefined, currentUser?: CurrentUserRef): string {
  if (!uuid) return "Sistema";
  if (currentUser?.authUserId && uuid === currentUser.authUserId && currentUser.name) {
    return currentUser.name;
  }
  return `Usuario ${uuid.slice(0, 8)}`;
}

function buildHistory(
  recomendacion: BackendRecomendacion,
  currentUser?: CurrentUserRef,
): RecommendationDecision[] {
  const entries: RecommendationDecision[] = [
    {
      date: formatFecha(recomendacion.fechaCreacion),
      user: usuarioLabel(recomendacion.creadoPor, currentUser),
      action: "Creada como propuesta",
    },
  ];

  if (!recomendacion.resueltoPorUsuarioId) return entries;

  const ajustes: string[] = [];
  if (
    recomendacion.cantidadPropuesta != null &&
    recomendacion.cantidadPropuesta !== recomendacion.cantidad
  ) {
    ajustes.push(`Cantidad ${recomendacion.cantidadPropuesta} → ${recomendacion.cantidad}`);
  }
  if (
    recomendacion.centroDistribucionPropuestoId != null &&
    recomendacion.centroDistribucionPropuestoId !== recomendacion.centroDistribucionOrigenId
  ) {
    ajustes.push(
      `CD ${recomendacion.centroDistribucionPropuestoId} → ${recomendacion.centroDistribucionOrigenId}`,
    );
  }

  let action = "Aprobada";
  if (recomendacion.accionTomada === "RECHAZADA") {
    action = `Rechazada: ${recomendacion.motivoRechazo ?? "sin motivo"}`;
  } else if (recomendacion.accionTomada === "AJUSTADA_Y_APROBADA") {
    action =
      ajustes.length > 0
        ? `Ajustada y aprobada (${ajustes.join(", ")})`
        : "Ajustada y aprobada";
  }

  entries.push({
    date: formatFecha(recomendacion.fechaResolucion),
    user: usuarioLabel(recomendacion.resueltoPorUsuarioId, currentUser),
    action,
  });

  return entries;
}

function mapEstado(estado: string): Recommendation["status"] {
  switch (estado?.toUpperCase()) {
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    default:
      return "Propuesta";
  }
}

function mapRecomendacion(
  recomendacion: BackendRecomendacion,
  currentUser?: CurrentUserRef,
): Recommendation {
  return {
    id: recomendacion.id,
    productId: String(recomendacion.productoId),
    quantity: recomendacion.cantidad,
    originDcId: recomendacion.centroDistribucionOrigenId,
    destStoreId: recomendacion.tiendaDestinoId,
    status: mapEstado(recomendacion.estado),
    history: buildHistory(recomendacion, currentUser),
    nombreProducto: recomendacion.nombreProducto,
    fueraDeCobertura: recomendacion.fueraDeCobertura,
  };
}

function mapOrden(orden: BackendOrdenReposicion): Order {
  return {
    id: orden.id,
    productId: String(orden.productoId),
    quantity: orden.cantidad,
    originDcId: orden.centroDistribucionOrigenId,
    destStoreId: orden.tiendaDestinoId,
    status: "Aprobada",
    date: formatFecha(orden.fechaCreacion),
    recommendationId: orden.recomendacionId,
    nombreProducto: orden.nombreProducto,
  };
}

/**
 * Obtiene la lista de recomendaciones.
 * Endpoint: GET /api/recomendaciones-reposicion
 */
export async function getRecomendaciones(currentUser?: CurrentUserRef): Promise<Recommendation[]> {
  const data = await apiFetch<BackendRecomendacion[]>("/api/recomendaciones-reposicion", {
    fallback: "No se pudieron obtener las recomendaciones",
    errors: RECOMENDACION_ERRORS,
    forbidden: RECOMENDACION_FORBIDDEN,
  });

  return data.map((recomendacion) => mapRecomendacion(recomendacion, currentUser));
}

/**
 * Crea una recomendación.
 * Endpoint: POST /api/recomendaciones-reposicion
 * Body: { productoId, cantidad, centroDistribucionOrigenId, tiendaDestinoId, confirmarFueraDeCobertura }
 */
export async function crearRecomendacion(
  payload: CrearRecomendacionPayload,
  currentUser?: CurrentUserRef,
): Promise<Recommendation> {
  const created = await apiFetch<BackendRecomendacion>("/api/recomendaciones-reposicion", {
    method: "POST",
    body: {
      productoId: Number(payload.productId),
      cantidad: payload.quantity,
      centroDistribucionOrigenId: payload.originDcId,
      tiendaDestinoId: payload.destStoreId,
      confirmarFueraDeCobertura: payload.confirmarFueraDeCobertura ?? false,
    },
    fallback: "No se pudo crear la recomendación",
    errors: RECOMENDACION_ERRORS,
    forbidden: RECOMENDACION_FORBIDDEN,
  });

  return mapRecomendacion(created, currentUser);
}

/**
 * Aprueba (o ajusta y aprueba) una recomendación y genera una orden "Aprobada".
 * Endpoint: PATCH /api/recomendaciones-reposicion/{id}/aprobar
 */
export async function aprobarRecomendacion(
  id: number,
  payload: AprobarRecomendacionPayload,
): Promise<Order> {
  const body: Record<string, unknown> = {};
  if (payload.cantidad !== undefined) body.cantidadAjustada = payload.cantidad;
  if (payload.centroDistribucionOrigenId !== undefined) {
    body.centroDistribucionOrigenId = payload.centroDistribucionOrigenId;
  }
  if (payload.confirmarFueraDeCobertura) {
    body.confirmarFueraDeCobertura = true;
  }

  const orden = await apiFetch<BackendOrdenReposicion>(
    `/api/recomendaciones-reposicion/${id}/aprobar`,
    {
      method: "PATCH",
      body,
      fallback: "No se pudo aprobar la recomendación",
      errors: RECOMENDACION_ERRORS,
      forbidden: RECOMENDACION_FORBIDDEN,
    },
  );

  return mapOrden(orden);
}

/**
 * Rechaza una recomendación con motivo obligatorio.
 * Endpoint: PATCH /api/recomendaciones-reposicion/{id}/rechazar
 * Body: { motivo }
 */
export async function rechazarRecomendacion(
  id: number,
  motivo: string,
  currentUser?: CurrentUserRef,
): Promise<Recommendation> {
  const updated = await apiFetch<BackendRecomendacion>(
    `/api/recomendaciones-reposicion/${id}/rechazar`,
    {
      method: "PATCH",
      body: { motivo },
      fallback: "No se pudo rechazar la recomendación",
      errors: RECOMENDACION_ERRORS,
      forbidden: RECOMENDACION_FORBIDDEN,
    },
  );

  return mapRecomendacion(updated, currentUser);
}
