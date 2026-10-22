import { supabase } from "./supabase";
import type { SaleRecord } from "../types";
import { ApiError, cleanErrorMessage } from "./usuarios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export interface BackendVenta {
  id: number;
  tiendaId: number;
  productoId: number;
  cantidad: number;
  fechaHora: string;
}

export interface RegistrarVentaPayload {
  tiendaId: number;
  productoId: string;
  quantity: number;
  fechaHora?: string;
}

/**
 * Procesa la respuesta de error de la API de ventas devolviendo un mensaje humano y limpio.
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

  // Traducción y limpieza de validaciones específicas del backend para ventas (VentaService.java)
  if (specificMessage.includes("El ID de la tienda es obligatorio")) {
    specificMessage = "El ID de la tienda es obligatorio.";
  } else if (specificMessage.includes("El ID del producto es obligatorio")) {
    specificMessage = "El ID del producto es obligatorio.";
  } else if (specificMessage.includes("La cantidad vendida es obligatoria")) {
    specificMessage = "La cantidad vendida es obligatoria.";
  } else if (specificMessage.includes("La cantidad vendida debe ser mayor a cero")) {
    specificMessage = "La cantidad debe ser mayor que cero.";
  } else if (specificMessage.includes("El ID de la tienda debe ser positivo")) {
    specificMessage = "El ID de la tienda debe ser válido.";
  } else if (specificMessage.includes("El ID del producto debe ser positivo")) {
    specificMessage = "El ID del producto debe ser válido.";
  } else if (specificMessage.includes("El producto no existe")) {
    specificMessage = "El producto solicitado no existe.";
  } else if (specificMessage.includes("La tienda no existe")) {
    specificMessage = "La tienda solicitada no existe.";
  } else if (specificMessage.includes("Stock insuficiente") || specificMessage.includes("stock insuficiente")) {
    specificMessage = "Stock insuficiente para registrar esta venta.";
  } else if (specificMessage.includes("Acceso denegado") || response.status === 403) {
    specificMessage = "No tienes permisos para registrar ventas.";
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
 * Registra una venta en una tienda.
 * Endpoint: POST /api/ventas
 */
export async function registrarVenta(payload: RegistrarVentaPayload): Promise<SaleRecord> {
  const token = await getAuthToken();

  const body = {
    tiendaId: payload.tiendaId,
    productoId: Number(payload.productoId),
    cantidad: payload.quantity,
    fechaHora: payload.fechaHora || new Date().toISOString(),
  };

  const response = await fetch(`${API_BASE_URL}/api/ventas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al registrar la venta");
  }

  const created: BackendVenta = await response.json();

  return {
    id: created.id,
    productId: String(created.productoId),
    quantity: created.cantidad,
    date: created.fechaHora,
    storeId: created.tiendaId,
  };
}
