import { supabase } from "./supabase";
import type { User, Role } from "../types";
import { mapBackendRoleToFrontend, type BackendUsuario } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/**
 * Error personalizado de la API que incluye el código HTTP,
 * el mensaje legible y el cuerpo JSON devuelto por el servidor.
 */
export class ApiError extends Error {
  status: number;
  data: Record<string, any> | null;

  constructor(status: number, message: string, data?: Record<string, any> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data || null;
  }
}

/**
 * Procesa la respuesta de error del backend extrayendo el JSON del cuerpo si existe.
 */
async function parseErrorResponse(response: Response, defaultMessage: string): Promise<ApiError> {
  let errorData: Record<string, any> | null = null;
  let message = `${defaultMessage} (${response.status})`;

  try {
    const text = await response.text();
    try {
      errorData = JSON.parse(text);
      if (errorData && typeof errorData === "object") {
        if (typeof errorData.error === "string") {
          message = errorData.error;
        } else if (typeof errorData.message === "string") {
          message = errorData.message;
        }
      }
    } catch {
      if (text) {
        message = text;
        errorData = { error: text };
      }
    }
  } catch {
    errorData = { error: response.statusText || "Error de conexión con el servidor" };
  }

  return new ApiError(response.status, message, errorData);
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
 * Mapea el rol de la interfaz de frontend al enum esperado por el backend de Spring Boot.
 */
export function mapFrontendRoleToBackend(role: User["role"]): string {
  switch (role) {
    case "admin":
      return "ADMINISTRADOR";
    case "store":
      return "ENCARGADO_TIENDA";
    case "dc":
      return "ENCARGADO_CD";
    case "planner":
      return "PLANIFICADOR";
    default:
      return "ENCARGADO_TIENDA";
  }
}

/**
 * Consulta la lista de todos los usuarios registrados.
 * Endpoint: GET /api/usuarios
 */
export async function getUsuarios(): Promise<User[]> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al consultar usuarios");
  }

  const data: BackendUsuario[] = await response.json();

  return data.map((u) => ({
    id: u.id,
    name: u.nombre || u.email.split("@")[0],
    email: u.email,
    role: mapBackendRoleToFrontend(u.rol),
    locationId: null,
    status: "active" as const,
  }));
}

/**
 * Consulta el detalle de un usuario por su ID interno.
 * Endpoint: GET /api/usuarios/{id}
 */
export async function getUsuarioById(id: number): Promise<BackendUsuario> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al consultar el usuario #${id}`);
  }

  return response.json();
}

/**
 * Crea un nuevo usuario en la base de datos y envía la invitación por correo.
 * Endpoint: POST /api/usuarios
 */
export async function createUsuario(payload: {
  nombre: string;
  email: string;
  role: User["role"];
}): Promise<User> {
  const token = await getAuthToken();

  const body = {
    nombre: payload.nombre.trim(),
    email: payload.email.trim(),
    rol: mapFrontendRoleToBackend(payload.role),
  };

  const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al crear usuario");
  }

  const created: BackendUsuario = await response.json();

  return {
    id: created.id,
    name: created.nombre || created.email.split("@")[0],
    email: created.email,
    role: mapBackendRoleToFrontend(created.rol),
    locationId: null,
    status: "active" as const,
  };
}

/**
 * Actualiza el rol de un usuario existente.
 * Endpoint: PATCH /api/usuarios/{id}/rol
 */
export async function updateRolUsuario(
  id: number,
  role: User["role"] | string
): Promise<BackendUsuario> {
  const token = await getAuthToken();

  const rolEnum = ["admin", "store", "dc", "planner"].includes(role)
    ? mapFrontendRoleToBackend(role as User["role"])
    : role;

  const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}/rol`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rol: rolEnum }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al actualizar rol del usuario #${id}`);
  }

  return response.json();
}

/**
 * Elimina un usuario por su ID.
 * Endpoint: DELETE /api/usuarios/{id}
 */
export async function deleteUsuario(id: number): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al eliminar el usuario #${id}`);
  }
}
