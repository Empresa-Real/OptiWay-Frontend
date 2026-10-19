import { supabase } from "./supabase";
import type { User, Role } from "../types";
import { mapBackendRoleToFrontend, type BackendUsuario } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay una sesión activa. Inicia sesión nuevamente.");
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
    const errorText = await response.text();
    throw new Error(`Error al consultar usuarios (${response.status}): ${errorText || response.statusText}`);
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
 * Crea un nuevo usuario en la base de datos y envía la invitación.
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
    const errorText = await response.text();
    throw new Error(`Error al crear usuario (${response.status}): ${errorText || response.statusText}`);
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
