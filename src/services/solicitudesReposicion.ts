import type { ReplenishmentRequest } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";

export interface CrearSolicitudReposicionPayload {
  tiendaId: number;
  productoId: string;
  quantity: number;
}

interface BackendSolicitudReposicion {
  id: number;
  tiendaId: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  estado: string;
  usuarioId: number;
  fechaSolicitud: string;
}

const SOLICITUD_ERRORS: ErrorTranslations = [
  ["La cantidad es obligatoria", "Indica la cantidad deseada."],
  ["La cantidad debe ser mayor o igual a 1", "La cantidad debe ser mayor o igual a 1."],
  ["El ID del producto es obligatorio", "Selecciona un producto."],
  [
    "No se puede solicitar reposición para una tienda inactiva",
    "La tienda está inactiva; no se puede solicitar reposición.",
  ],
  [
    "Solo un encargado de tienda puede solicitar reposición manual",
    "Solo el encargado de la tienda puede solicitar reposición.",
  ],
];

function mapSolicitud(solicitud: BackendSolicitudReposicion): ReplenishmentRequest {
  return {
    id: solicitud.id,
    storeId: solicitud.tiendaId,
    productId: String(solicitud.productoId),
    quantity: solicitud.cantidad,
    date: solicitud.fechaSolicitud ? solicitud.fechaSolicitud.slice(0, 10) : "",
    status: solicitud.estado?.toUpperCase() === "ATENDIDA" ? "Atendida" : "Pendiente",
    nombreProducto: solicitud.nombreProducto,
  };
}

/**
 * Obtiene todas las solicitudes de reposición para el Planificador.
 * Endpoint: GET /api/solicitudes-reposicion
 */
export async function getSolicitudesReposicion(): Promise<ReplenishmentRequest[]> {
  const data = await apiFetch<BackendSolicitudReposicion[]>("/api/solicitudes-reposicion", {
    fallback: "No se pudieron obtener las solicitudes de reposición",
    errors: SOLICITUD_ERRORS,
    forbidden: "Solo un Planificador puede consultar las solicitudes de reposición.",
  });

  return data.map(mapSolicitud);
}

/**
 * Crea una solicitud de reposición para una tienda.
 * Endpoint: POST /api/tiendas/{id}/solicitudes-reposicion
 * Body: { productoId, cantidad }
 */
export async function crearSolicitudReposicion(
  payload: CrearSolicitudReposicionPayload,
): Promise<ReplenishmentRequest> {
  const created = await apiFetch<BackendSolicitudReposicion>(
    `/api/tiendas/${payload.tiendaId}/solicitudes-reposicion`,
    {
      method: "POST",
      body: {
        productoId: Number(payload.productoId),
        cantidad: payload.quantity,
      },
      fallback: "No se pudo crear la solicitud de reposición",
      errors: SOLICITUD_ERRORS,
      forbidden: "No tienes permisos para solicitar reposición en esta tienda.",
    },
  );

  return mapSolicitud(created);
}
