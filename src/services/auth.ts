import { supabase } from "./supabase";
import type { User, Role } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface BackendUsuario {
  id: number;
  authUserId: string;
  nombre: string;
  email: string;
  rol: "ADMINISTRADOR" | "ENCARGADO_TIENDA" | "ENCARGADO_CD" | "PLANIFICADOR" | string;
  creadoPor?: string | null;
}

export function mapBackendRoleToFrontend(rol: string): Role | "planner" {
  switch (rol) {
    case "ADMINISTRADOR":
      return "admin";
    case "ENCARGADO_TIENDA":
      return "store";
    case "ENCARGADO_CD":
      return "dc";
    case "PLANIFICADOR":
      return "planner";
    default:
      return "store";
  }
}

export function mapBackendUserToFrontend(backendUser: BackendUsuario): User {
  return {
    id: backendUser.id,
    name: backendUser.nombre || backendUser.email.split("@")[0],
    email: backendUser.email,
    role: mapBackendRoleToFrontend(backendUser.rol),
    locationId: 1, // Fallback a ubicación 1 por defecto para pantallas de tienda/CD
    status: "active",
  };
}

export async function fetchUsuarioActual(token: string): Promise<BackendUsuario | null> {
  const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("El usuario no está registrado en el sistema. Contacta al administrador.");
    }
    const errorText = await response.text();
    throw new Error(`Error del servidor (${response.status}): ${errorText || "No autorizado"}`);
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Mensajes amigables para errores típicos de autenticación
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "El correo electrónico no ha sido confirmado aún." };
      }
      return { success: false, error: error.message };
    }

    const token = data.session?.access_token;
    if (!token) {
      return { success: false, error: "No se pudo obtener el token de sesión." };
    }

    // Consultar perfil y rol en el backend
    try {
      const backendUser = await fetchUsuarioActual(token);
      if (!backendUser) {
        return { success: false, error: "No se encontró el perfil del usuario en la base de datos." };
      }

      const frontendUser = mapBackendUserToFrontend(backendUser);
      return { success: true, user: frontendUser };
    } catch (apiError: any) {
      return {
        success: false,
        error: apiError?.message || "Error al comunicarse con el backend en Render.",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Ocurrió un error inesperado al intentar iniciar sesión.",
    };
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

    const backendUser = await fetchUsuarioActual(token);
    if (!backendUser) return null;

    return mapBackendUserToFrontend(backendUser);
  } catch {
    return null;
  }
}

export async function updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: false, error: "El enlace no es válido o ya ha expirado." };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al actualizar la contraseña." };
  }
}

