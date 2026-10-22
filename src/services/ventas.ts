import type { SaleRecord } from "../types";
import { ApiError, apiFetch, type ErrorTranslations } from "./http";

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

const VENTA_ERRORS: ErrorTranslations = [
  ["El ID del producto es obligatorio", "El ID del producto es obligatorio."],
  ["La cantidad vendida es obligatoria", "La cantidad vendida es obligatoria."],
  ["La cantidad vendida debe ser mayor a cero", "La cantidad debe ser mayor que cero."],
  ["El ID del producto debe ser positivo", "El ID del producto debe ser válido."],
  ["El producto no existe", "El producto solicitado no existe."],
  ["La tienda no existe", "La tienda solicitada no existe."],
  ["Stock insuficiente", "Stock insuficiente para registrar esta venta."],
  ["stock insuficiente", "Stock insuficiente para registrar esta venta."],
];

/**
 * Registra una venta en una tienda.
 * Endpoint: POST /api/tiendas/{tiendaId}/ventas
 * El id de la tienda viaja en la URL, no en el body.
 */
export async function registrarVenta(payload: RegistrarVentaPayload): Promise<SaleRecord> {
  if (!Number.isInteger(payload.tiendaId) || payload.tiendaId <= 0) {
    throw new ApiError(400, "No tienes una tienda asignada. Pide a un administrador que te asigne una.", {
      error: "Tienda no asignada",
    });
  }

  const body: { productoId: number; cantidad: number; fechaHora?: string } = {
    productoId: Number(payload.productoId),
    cantidad: payload.quantity,
  };
  // El backend espera LocalDateTime sin zona horaria. Si no hay fecha, se omite
  // y el servidor usa LocalDateTime.now(), tal como documenta RegistrarVentaRequest.
  if (payload.fechaHora) {
    body.fechaHora = payload.fechaHora;
  }

  const created = await apiFetch<BackendVenta>(`/api/tiendas/${payload.tiendaId}/ventas`, {
    method: "POST",
    body,
    fallback: "Error al registrar la venta",
    errors: VENTA_ERRORS,
    forbidden: "No tienes permisos para registrar ventas.",
  });

  return {
    id: created.id,
    productId: String(created.productoId),
    quantity: created.cantidad,
    date: created.fechaHora,
    storeId: created.tiendaId,
  };
}
