import { supabase } from "./supabase";
import type { ReceiptRecord } from "../types";
import { ApiError, cleanErrorMessage } from "./usuarios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export interface BackendIngresoMercancia {
  id: number;
  centroDistribucionId: number;
  productoId: number;
  cantidad: number;
  origen: string;
  usuarioId: number;
  fechaIngreso: string;
}

export interface RegistrarIngresoPayload {
  productoId: string;
  quantity: number;
  origin: string;
}

/**
 * Procesa la respuesta de error de la API de ingreso de mercancía devolviendo un mensaje humano y limpio.
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

  // Traducción y limpieza de validaciones específicas del backend para ingreso de mercancía
  if (specificMessage.includes("El producto es obligatorio")) {
    specificMessage = "El producto es obligatorio.";
  } else if (specificMessage.includes("La cantidad es obligatoria")) {
    specificMessage = "La cantidad es obligatoria.";
  } else if (specificMessage.includes("La cantidad debe ser mayor que cero")) {
    specificMessage = "La cantidad debe ser mayor que cero.";
  } else if (specificMessage.includes("El origen es obligatorio")) {
    specificMessage = "El origen es obligatorio.";
  } else if (specificMessage.includes("El producto no existe")) {
    specificMessage = "El producto solicitado no existe.";
  } else if (specificMessage.includes("El centro de distribución no existe")) {
    specificMessage = "El centro de distribución no existe.";
  } else if (specificMessage.includes("Acceso denegado") || response.status === 403) {
    specificMessage = "No tienes permisos para registrar ingresos de mercancía.";
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
 * Registra un ingreso de mercancía en un centro de distribución.
 * Endpoint: POST /api/ingresos-mercancia
 */
export async function registrarIngreso(payload: RegistrarIngresoPayload): Promise<ReceiptRecord> {
  const token = await getAuthToken();

  const body = {
    productoId: Number(payload.productoId),
    cantidad: payload.quantity,
    origen: payload.origin.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/api/ingresos-mercancia`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al registrar el ingreso de mercancía");
  }

  const created: BackendIngresoMercancia = await response.json();

  return {
    id: created.id,
    productId: String(created.productoId),
    quantity: created.cantidad,
    origin: created.origen,
    date: created.fechaIngreso,
    dcId: created.centroDistribucionId,
  };
}
