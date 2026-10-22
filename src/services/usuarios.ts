import type { User } from "../types";
import { mapBackendUserToFrontend, type BackendUsuario } from "./auth";
import { apiFetch } from "./http";

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
  const data = await apiFetch<BackendUsuario[]>("/api/usuarios", {
    fallback: "Error al consultar usuarios",
  });

  return data.map(mapBackendUserToFrontend);
}

/**
 * Consulta el detalle de un usuario por su ID interno.
 * Endpoint: GET /api/usuarios/{id}
 */
export async function getUsuarioById(id: number): Promise<BackendUsuario> {
  return apiFetch<BackendUsuario>(`/api/usuarios/${id}`, {
    fallback: `Error al consultar el usuario #${id}`,
  });
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
  const created = await apiFetch<BackendUsuario>("/api/usuarios", {
    method: "POST",
    body: {
      nombre: payload.nombre.trim(),
      email: payload.email.trim(),
      rol: mapFrontendRoleToBackend(payload.role),
    },
    fallback: "Error al crear usuario",
  });

  return mapBackendUserToFrontend(created);
}

/**
 * Actualiza el rol de un usuario existente.
 * Endpoint: PATCH /api/usuarios/{id}/rol
 */
export async function updateRolUsuario(id: number, role: User["role"] | string): Promise<BackendUsuario> {
  const rolEnum = ["admin", "store", "dc", "planner"].includes(role)
    ? mapFrontendRoleToBackend(role as User["role"])
    : role;

  return apiFetch<BackendUsuario>(`/api/usuarios/${id}/rol`, {
    method: "PATCH",
    body: { rol: rolEnum },
    fallback: `Error al actualizar rol del usuario #${id}`,
  });
}

/**
 * Elimina un usuario por su ID.
 * Endpoint: DELETE /api/usuarios/{id}
 */
export async function deleteUsuario(id: number): Promise<void> {
  await apiFetch<void>(`/api/usuarios/${id}`, {
    method: "DELETE",
    fallback: `Error al eliminar el usuario #${id}`,
  });
}
