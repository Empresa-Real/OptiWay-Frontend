import type { DC } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";
import { isMocksEnabled, getMockDCs } from "./mocks";

export interface BackendCentroDistribucion {
  id: number;
  codigo?: string;
  nombre: string;
  direccion: string;
  capacidad: number;
  encargadoId?: number | null;
  tiendasAbastecidasIds?: number[];
  estado?: string;
}

const CD_ERRORS: ErrorTranslations = [
  ["El nombre del centro de distribución es obligatorio", "El nombre del centro de distribución es obligatorio."],
  ["La dirección es obligatoria", "La dirección del centro de distribución es obligatoria."],
  ["La direccion es obligatoria", "La dirección del centro de distribución es obligatoria."],
  ["La capacidad es obligatoria", "La capacidad del centro de distribución es obligatoria."],
  ["El centro de distribución no existe", "El centro de distribución solicitado no existe o fue eliminado."],
  ["Centro de distribución no encontrado", "El centro de distribución solicitado no existe o fue eliminado."],
  [
    "Solo se puede asignar un centro de distribución a un usuario con rol Encargado de centro de distribución",
    "Solo se puede asignar como encargado a un usuario con rol 'Encargado de CD'.",
  ],
];

const CD_FORBIDDEN = "No tienes permisos de administrador para gestionar centros de distribución.";

export function mapBackendCDToFrontend(backendCD: BackendCentroDistribucion): DC {
  const estado = backendCD.estado?.toLowerCase() ?? "";
  return {
    id: backendCD.id,
    name: backendCD.nombre,
    address: backendCD.direccion,
    capacity: backendCD.capacidad ?? 0,
    coverage: backendCD.tiendasAbastecidasIds ?? [],
    status: estado.startsWith("inact") ? "inactive" : "active",
    encargadoId: backendCD.encargadoId ?? undefined,
  };
}

/**
 * Consulta la lista de centros de distribución desde el backend.
 * Endpoint: GET /api/centros-distribucion
 *
 * Cuando VITE_USE_MOCKS === 'true', devuelve los CDs del store único en
 * memoria (con el overlay de estados aplicado).
 */
export async function getCentrosDistribucion(): Promise<DC[]> {
  if (isMocksEnabled()) {
    return getMockDCs();
  }
  const data = await apiFetch<BackendCentroDistribucion[]>("/api/centros-distribucion", {
    fallback: "No se pudieron obtener los centros de distribución",
    errors: CD_ERRORS,
    forbidden: CD_FORBIDDEN,
  });

  return data.map(mapBackendCDToFrontend);
}

/**
 * Activa o desactiva un centro de distribución.
 * Endpoint: PATCH /api/centros-distribucion/{id}/estado
 *
 * Si se desactiva con tiendas asignadas, el backend responde 409; en ese caso
 * hay que reintentar con confirmarConTiendasAsignadas: true.
 */
export async function cambiarEstadoCentroDistribucion(
  id: number,
  activo: boolean,
  confirmarConTiendasAsignadas?: boolean,
): Promise<DC> {
  const updated = await apiFetch<BackendCentroDistribucion>(
    `/api/centros-distribucion/${id}/estado`,
    {
      method: "PATCH",
      body: { activo, confirmarConTiendasAsignadas },
      fallback: `No se pudo actualizar el estado del centro de distribución #${id}`,
      errors: CD_ERRORS,
      forbidden: CD_FORBIDDEN,
    },
  );

  return mapBackendCDToFrontend(updated);
}

/**
 * Registra un nuevo centro de distribución en el backend.
 * Endpoint: POST /api/centros-distribucion
 */
export async function createCentroDistribucion(data: {
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
}): Promise<DC> {
  const created = await apiFetch<BackendCentroDistribucion>("/api/centros-distribucion", {
    method: "POST",
    body: {
      nombre: data.name.trim(),
      direccion: data.address.trim(),
      capacidad: data.capacity,
      encargadoId: null,
      tiendasAbastecidasIds: data.coverage || [],
    },
    fallback: "No se pudo crear el centro de distribución",
    errors: CD_ERRORS,
    forbidden: CD_FORBIDDEN,
  });

  return mapBackendCDToFrontend(created);
}

/**
 * Asigna un encargado a un centro de distribución.
 * Endpoint: PUT /api/centros-distribucion/{id}/encargado
 */
export async function updateEncargadoCentroDistribucion(
  id: number,
  encargadoId: number | string
): Promise<DC> {
  const updated = await apiFetch<BackendCentroDistribucion>(`/api/centros-distribucion/${id}/encargado`, {
    method: "PUT",
    body: { encargadoId: Number(encargadoId) },
    fallback: "No se pudo actualizar el encargado",
    errors: CD_ERRORS,
    forbidden: CD_FORBIDDEN,
  });

  return mapBackendCDToFrontend(updated);
}
