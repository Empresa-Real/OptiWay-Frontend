import { supabase } from "./supabase";
import type { Asignacion, User, Role } from "../types";
import { apiFetch, ApiError } from "./http";

export interface BackendAsignacion {
  tipo: "TIENDA" | "CD" | string;
  id: number;
  nombre?: string | null;
}

export interface BackendUsuario {
  id: number;
  authUserId: string;
  nombre: string;
  email: string;
  rol: "ADMINISTRADOR" | "ENCARGADO_TIENDA" | "ENCARGADO_CD" | "PLANIFICADOR" | string;
  creadoPor?: string | null;
  /** Opcional hasta que el backend lo implemente. Ver docs/tickets/BACKEND-asignacion-usuario.md */
  asignacion?: BackendAsignacion | null;
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

/**
 * Traduce la asignación del backend al modelo del frontend.
 * Devuelve null si el backend no la envía o si el tipo no es reconocible.
 */
export function mapBackendAsignacion(asignacion?: BackendAsignacion | null): Asignacion | null {
  if (!asignacion || asignacion.id == null) return null;

  switch (asignacion.tipo) {
    case "TIENDA":
      return { tipo: "tienda", id: asignacion.id, nombre: asignacion.nombre ?? undefined };
    case "CD":
      return { tipo: "cd", id: asignacion.id, nombre: asignacion.nombre ?? undefined };
    default:
      return null;
  }
}

export function mapBackendUserToFrontend(backendUser: BackendUsuario): User {
  return {
    id: backendUser.id,
    name: backendUser.nombre || backendUser.email.split("@")[0],
    email: backendUser.email,
    role: mapBackendRoleToFrontend(backendUser.rol),
    asignacion: mapBackendAsignacion(backendUser.asignacion),
    status: "active",
  };
}

export async function fetchUsuarioActual(token: string): Promise<BackendUsuario | null> {
  try {
    return await apiFetch<BackendUsuario>("/api/usuarios/me", {
      token,
      fallback: "No autorizado",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Error("El usuario no está registrado en el sistema. Contacta al administrador.");
    }
    throw err;
  }
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

export interface HashAuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

export function extractAuthTokens(): HashAuthTokens {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, type: null, errorCode: null, errorDescription: null };
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  const search = window.location.search.startsWith("?") ? window.location.search.substring(1) : window.location.search;
  const searchParams = new URLSearchParams(search);

  return {
    accessToken: hashParams.get("access_token") || searchParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") || searchParams.get("refresh_token"),
    type: hashParams.get("type") || searchParams.get("type"),
    errorCode: hashParams.get("error_code") || searchParams.get("error_code") || hashParams.get("error") || searchParams.get("error"),
    errorDescription: hashParams.get("error_description") || searchParams.get("error_description"),
  };
}

export async function updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tokens = extractAuthTokens();

    if (tokens.errorCode || tokens.errorDescription) {
      const msg = tokens.errorDescription?.replace(/\+/g, " ") || "El enlace de invitación no es válido o ya ha expirado.";
      return { success: false, error: msg };
    }

    // 1. Establecer sesión con los tokens del hash si están presentes
    if (tokens.accessToken && tokens.refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) {
        return {
          success: false,
          error: "No se pudo verificar la invitación: " + sessionError.message,
        };
      }
    }

    // 2. Comprobar que la sesión esté lista antes de updateUser
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { success: false, error: "El enlace no es válido o ya ha expirado." };
    }

    // 3. Actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.user) {
      return { success: false, error: "No se pudo actualizar la contraseña del usuario." };
    }

    // 4. Limpiar tokens del hash tras el éxito para evitar reprocesamiento
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al actualizar la contraseña." };
  }
}


