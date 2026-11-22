import type { Store } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";
import { isMocksEnabled, getMockStores, initMockStore } from "./mocks";

export interface BackendTienda {
  id: number;
  codigo?: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  activo?: boolean;
  encargadoId?: number | null;
}

export interface CrearTiendaPayload {
  nombre: string;
  direccion: string;
  ciudad: string;
  encargadoId?: number | null;
}

const TIENDA_ERRORS: ErrorTranslations = [
  ["El nombre de la tienda es obligatorio", "El nombre de la tienda es obligatorio."],
  ["La dirección es obligatoria", "La dirección de la tienda es obligatoria."],
  ["La direccion es obligatoria", "La dirección de la tienda es obligatoria."],
  ["La ciudad es obligatoria", "La ciudad de la tienda es obligatoria."],
  ["La tienda no existe", "La tienda solicitada no existe o fue eliminada."],
  ["Tienda no encontrada", "La tienda solicitada no existe o fue eliminada."],
  ["El usuario encargado no existe", "El usuario seleccionado como encargado no existe."],
  [
    "Solo se puede asignar una tienda a un usuario con rol Encargado de tienda",
    "Solo se puede asignar como encargado a un usuario con rol 'Encargado de tienda'.",
  ],
];

const TIENDA_FORBIDDEN = "No tienes permisos de administrador para gestionar tiendas.";

function mapBackendTiendaToFrontend(t: BackendTienda): Store {
  return {
    id: t.id,
    name: t.nombre,
    address: t.direccion,
    city: t.ciudad,
    status: t.activo !== false ? "active" : "inactive",
    encargadoId: t.encargadoId,
  };
}

/**
 * Obtiene la lista de tiendas registradas desde el backend.
 * Endpoint: GET /api/tiendas
 *
 * Cuando VITE_USE_MOCKS === 'true', devuelve las tiendas del store único en
 * memoria (con el overlay de estados aplicado).
 */
export async function getTiendas(): Promise<Store[]> {
  if (isMocksEnabled()) {
    return getMockStores();
  }
  const data = await apiFetch<BackendTienda[]>("/api/tiendas", {
    fallback: "Error al obtener la lista de tiendas",
    errors: TIENDA_ERRORS,
    forbidden: TIENDA_FORBIDDEN,
  });

  return data.map(mapBackendTiendaToFrontend);
}

/**
 * Activa o desactiva una tienda.
 * Endpoint: PATCH /api/tiendas/{id}/estado
 *
 * Si se desactiva con órdenes en tránsito, el backend responde 409; en ese
 * caso hay que reintentar con confirmarConOrdenesEnTransito: true.
 */
export async function cambiarEstadoTienda(
  id: number,
  activo: boolean,
  confirmarConOrdenesEnTransito?: boolean,
): Promise<Store> {
  const updated = await apiFetch<BackendTienda>(
    `/api/tiendas/${id}/estado`,
    {
      method: "PATCH",
      body: { activo, confirmarConOrdenesEnTransito },
      fallback: `No se pudo actualizar el estado de la tienda #${id}`,
      errors: TIENDA_ERRORS,
      forbidden: TIENDA_FORBIDDEN,
    },
  );

  return mapBackendTiendaToFrontend(updated);
}

/**
 * Expone la inicialización del store de mocks para ser llamada desde App.tsx
 * tras cargar las listas reales.
 */
export { initMockStore };

/**
 * Registra una nueva tienda en el sistema.
 * Endpoint: POST /api/tiendas
 */
export async function createTienda(payload: { name: string; address: string; city: string }): Promise<Store> {
  const body: CrearTiendaPayload = {
    nombre: payload.name.trim(),
    direccion: payload.address.trim(),
    ciudad: payload.city.trim(),
    encargadoId: null,
  };

  const created = await apiFetch<BackendTienda>("/api/tiendas", {
    method: "POST",
    body,
    fallback: "Error al crear la tienda",
    errors: TIENDA_ERRORS,
    forbidden: TIENDA_FORBIDDEN,
  });

  return mapBackendTiendaToFrontend(created);
}

/**
 * Asigna o desasigna un encargado a una tienda.
 * Endpoint: PUT /api/tiendas/{id}/encargado
 */
export async function asignarEncargadoTienda(id: number, encargadoId: number | null): Promise<BackendTienda> {
  return apiFetch<BackendTienda>(`/api/tiendas/${id}/encargado`, {
    method: "PUT",
    body: { encargadoId },
    fallback: `Error al asignar encargado a la tienda #${id}`,
    errors: TIENDA_ERRORS,
    forbidden: TIENDA_FORBIDDEN,
  });
}
