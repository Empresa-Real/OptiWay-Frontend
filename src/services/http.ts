import { supabase } from "./supabase";

/**
 * Único punto de entrada HTTP del frontend.
 *
 * Antes cada servicio copiaba su propio `API_BASE_URL`, `getAuthToken` y
 * `parseErrorResponse` (6 copias), y cada copia priorizaba distinto los campos
 * de error (`error`, `message`, `detalle`). Un cambio de contrato había que
 * hacerlo en 6 lugares y era fácil dejar uno viejo.
 */

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
 * Limpia y traduce cualquier mensaje de error técnico o que contenga JSON incrustado
 * para que el usuario SIEMPRE vea un texto humano, claro y sin fragmentos de código o llaves {}.
 */
export function cleanErrorMessage(
  rawMessage: string,
  statusCode?: number,
  errorData?: Record<string, any> | null
): string {
  // 1. Si viene errorData estructurado (ej. respuesta de Supabase con "detalle" y "status")
  if (errorData) {
    const detalle = errorData.detalle;
    const subStatus = errorData.status;

    if (
      subStatus === 429 ||
      detalle?.code === 429 ||
      detalle?.error_code === "over_email_send_rate_limit" ||
      (typeof detalle?.msg === "string" && detalle.msg.includes("email rate limit")) ||
      (typeof detalle === "string" && detalle.includes("rate_limit"))
    ) {
      return "Se ha superado el límite de correos de invitación por hora de Supabase Auth. Por favor espera unos minutos antes de registrar otro usuario.";
    }

    if (
      subStatus === 422 ||
      detalle?.code === 422 ||
      detalle?.error_code === "email_address_invalid"
    ) {
      return "El correo electrónico no tiene un formato válido o fue rechazado por el proveedor de autenticación.";
    }

    if (typeof detalle?.msg === "string" && detalle.msg.trim()) {
      return detalle.msg.trim();
    }
    if (typeof detalle?.error_description === "string" && detalle.error_description.trim()) {
      return detalle.error_description.trim();
    }
  }

  if (!rawMessage) {
    if (statusCode === 409) return "El correo electrónico ya se encuentra registrado en el sistema.";
    if (statusCode === 403) return "No tienes permisos de administrador para realizar esta operación.";
    if (statusCode === 404) return "El usuario solicitado no fue encontrado en el sistema.";
    if (statusCode === 400) return "Los datos ingresados son inválidos. Por favor verifica los campos.";
    if (statusCode === 502) return "No fue posible conectar con el servicio de autenticación. Intenta nuevamente.";
    return "Ocurrió un error inesperado al procesar la solicitud.";
  }

  // 2. Límite de correos de invitación por hora de Supabase Auth
  if (
    rawMessage.includes("over_email_send_rate_limit") ||
    rawMessage.includes("email rate limit exceeded") ||
    rawMessage.includes("429")
  ) {
    return "Se ha superado el límite de correos de invitación por hora de Supabase Auth. Por favor espera unos minutos antes de registrar otro usuario.";
  }

  if (rawMessage === "Error de respuesta en Supabase Auth") {
    return "No fue posible enviar la invitación por correo en Supabase Auth. Por favor intenta de nuevo en unos minutos.";
  }

  // 3. Validaciones de negocio del backend (UsuarioService.java)
  if (rawMessage.includes("El correo ya esta registrado") || rawMessage.includes("El correo ya está registrado")) {
    return "El correo electrónico ya se encuentra registrado en el sistema.";
  }
  if (rawMessage.includes("El nombre del usuario no puede estar vacio")) {
    return "El nombre del usuario no puede estar vacío.";
  }
  if (rawMessage.includes("El email del usuario no puede estar vacio")) {
    return "El correo electrónico del usuario no puede estar vacío.";
  }
  if (rawMessage.includes("El rol no es valido")) {
    return "El rol seleccionado no es válido.";
  }
  if (rawMessage.includes("Acceso denegado")) {
    return "Acceso denegado: solo administradores pueden realizar esta operación.";
  }

  // 4. Si el mensaje contiene un fragmento JSON incrustado
  const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.msg && typeof parsed.msg === "string") {
        if (parsed.msg.includes("email rate limit")) {
          return "Límite de envío de correos alcanzado. Por favor espera unos minutos antes de registrar otro usuario.";
        }
        return parsed.msg;
      }
      if (parsed.error_description && typeof parsed.error_description === "string") {
        return parsed.error_description;
      }
      if (parsed.error && typeof parsed.error === "string") {
        return cleanErrorMessage(parsed.error, statusCode);
      }
      if (parsed.message && typeof parsed.message === "string") {
        return cleanErrorMessage(parsed.message, statusCode);
      }
    } catch {
      // Ignorar error de parseo
    }

    const stripped = rawMessage.replace(/\{[\s\S]*\}/, "").replace(/:\s*$/, "").trim();
    if (stripped.length > 5) {
      return stripped;
    }
  }

  // 5. Mapeo por palabras clave comunes
  const lower = rawMessage.toLowerCase();
  if (lower.includes("duplicate") || lower.includes("ya existe") || statusCode === 409) {
    return "El correo electrónico ya se encuentra registrado en el sistema.";
  }
  if (lower.includes("not found") || statusCode === 404) {
    return "El usuario solicitado no fue encontrado en el sistema.";
  }
  if (lower.includes("forbidden") || lower.includes("denegado")) {
    return "No tienes permisos de administrador para realizar esta operación.";
  }
  if (statusCode === 502) {
    return "No fue posible conectar con el servicio de autenticación. Intenta nuevamente.";
  }

  return rawMessage;
}

/** Token de Supabase o ApiError 401 si no hay sesión. */
export async function getAuthToken(): Promise<string> {
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
 * Traducciones de mensajes del backend a texto para el usuario.
 * Cada entrada es [fragmento que envía el backend, mensaje a mostrar].
 * Se evalúan en orden; gana la primera coincidencia.
 */
export type ErrorTranslations = ReadonlyArray<readonly [needle: string, message: string]>;

export interface ApiRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Texto por defecto si el backend no envía un mensaje propio. */
  fallback: string;
  /** Traducciones específicas del dominio. */
  errors?: ErrorTranslations;
  /** Mensaje para 403 cuando el backend no da uno útil. */
  forbidden?: string;
  /** Token explícito (solo para llamadas previas a tener sesión, ej. /me en login). */
  token?: string;
}

function buildUrl(path: string, query?: ApiRequest["query"]): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * El backend documenta `ErrorResponse { error, message, code }`, pero en la
 * práctica también aparecen textos planos y respuestas de Supabase con
 * `detalle`. Devolvemos siempre un objeto para no romper el parseo.
 */
async function readErrorBody(response: Response): Promise<Record<string, any> | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : { error: String(parsed) };
    } catch {
      return { error: text.trim() };
    }
  } catch {
    return null;
  }
}

/**
 * `message` es el texto amigable en español que documenta el backend;
 * `error` es el detalle técnico. Preferimos el humano.
 */
function pickMessage(body: Record<string, any> | null): string {
  if (!body) return "";
  for (const key of ["message", "error"] as const) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (typeof body.detalle === "string" && body.detalle.trim()) return body.detalle.trim();
  if (typeof body.detalle?.msg === "string" && body.detalle.msg.trim()) return body.detalle.msg.trim();
  return "";
}

async function toApiError(response: Response, request: ApiRequest): Promise<ApiError> {
  const data = await readErrorBody(response);
  let message = pickMessage(data);

  // El 403 del backend suele traer el mensaje crudo de Spring Security
  // ("Access Denied"), que no le dice nada al usuario.
  if (response.status === 403 && request.forbidden) {
    message = request.forbidden;
  }

  const translated = request.errors?.find(([needle]) => message.includes(needle));
  if (translated) {
    message = translated[1];
  }

  return new ApiError(response.status, cleanErrorMessage(message || request.fallback, response.status, data), data);
}

/**
 * Realiza una petición autenticada al backend y devuelve el JSON tipado.
 * Lanza `ApiError` con mensaje humano ante cualquier respuesta no-2xx.
 */
export async function apiFetch<T>(path: string, request: ApiRequest): Promise<T> {
  const token = request.token ?? (await getAuthToken());

  const response = await fetch(buildUrl(path, request.query), {
    method: request.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw await toApiError(response, request);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
