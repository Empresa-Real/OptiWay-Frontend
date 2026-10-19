import { supabase } from "./supabase";
import type { Store } from "../types";
import { ApiError, cleanErrorMessage } from "./usuarios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

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

/**
 * Procesa la respuesta de error de la API de tiendas devolviendo un mensaje humano y limpio.
 */
async function parseErrorResponse(response: Response, defaultMessage: string): Promise<ApiError> {
  let errorData: Record<string, any> | null = null;
  let specificMessage = "";

  try {
    const text = await response.text();
    try {
      errorData = JSON.parse(text);
      if (errorData && typeof errorData === "object") {
        if (typeof errorData.error === "string" && errorData.error.trim()) {
          specificMessage = errorData.error.trim();
        } else if (typeof errorData.message === "string" && errorData.message.trim()) {
          specificMessage = errorData.message.trim();
        }
      }
    } catch {
      if (text) {
        specificMessage = text.trim();
      }
    }
  } catch {
    // Si no se pudo leer el cuerpo
  }

  // Traducción y limpieza de validaciones específicas del backend para tiendas (TiendaService.java)
  if (specificMessage.includes("El nombre de la tienda es obligatorio")) {
    specificMessage = "El nombre de la tienda es obligatorio.";
  } else if (specificMessage.includes("La dirección es obligatoria") || specificMessage.includes("La direccion es obligatoria")) {
    specificMessage = "La dirección de la tienda es obligatoria.";
  } else if (specificMessage.includes("La ciudad es obligatoria")) {
    specificMessage = "La ciudad de la tienda es obligatoria.";
  } else if (specificMessage.includes("La tienda no existe")) {
    specificMessage = "La tienda solicitada no existe o fue eliminada.";
  } else if (specificMessage.includes("El usuario encargado no existe")) {
    specificMessage = "El usuario seleccionado como encargado no existe.";
  } else if (specificMessage.includes("Solo se puede asignar una tienda a un usuario con rol Encargado de tienda")) {
    specificMessage = "Solo se puede asignar como encargado a un usuario con rol 'Encargado de tienda'.";
  } else if (specificMessage.includes("Acceso denegado") || response.status === 403) {
    specificMessage = "No tienes permisos de administrador para gestionar tiendas.";
  }

  specificMessage = cleanErrorMessage(specificMessage || defaultMessage, response.status, errorData);

  return new ApiError(response.status, specificMessage, errorData);
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError(401, "No hay una sesión activa. Inicia sesión nuevamente.", {
      error: "No hay una sesión activa",
    });
  }
  return token;
}

/**
 * Obtiene la lista de tiendas registradas desde el backend.
 * Endpoint: GET /api/tiendas
 */
export async function getTiendas(): Promise<Store[]> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/tiendas`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al obtener la lista de tiendas");
  }

  const data: BackendTienda[] = await response.json();

  return data.map((t) => ({
    id: t.id,
    name: t.nombre,
    address: t.direccion,
    city: t.ciudad,
    status: t.activo !== false ? "active" : "inactive",
    encargadoId: t.encargadoId,
  }));
}

/**
 * Registra una nueva tienda en el sistema.
 * Endpoint: POST /api/tiendas
 */
export async function createTienda(payload: { name: string; address: string; city: string }): Promise<Store> {
  const token = await getAuthToken();

  const body: CrearTiendaPayload = {
    nombre: payload.name.trim(),
    direccion: payload.address.trim(),
    ciudad: payload.city.trim(),
    encargadoId: null,
  };

  const response = await fetch(`${API_BASE_URL}/api/tiendas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al crear la tienda");
  }

  const created: BackendTienda = await response.json();

  return {
    id: created.id,
    name: created.nombre,
    address: created.direccion,
    city: created.ciudad,
    status: created.activo !== false ? "active" : "inactive",
    encargadoId: created.encargadoId,
  };
}

/**
 * Asigna o desasigna un encargado a una tienda.
 * Endpoint: PUT /api/tiendas/{id}/encargado
 */
export async function asignarEncargadoTienda(id: number, encargadoId: number | null): Promise<BackendTienda> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/tiendas/${id}/encargado`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ encargadoId }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al asignar encargado a la tienda #${id}`);
  }

  return response.json();
}
