import type { ReceiptRecord } from "../types";
import { ApiError, apiFetch, type ErrorTranslations } from "./http";

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
  centroDistribucionId: number;
  productoId: string;
  quantity: number;
  origin: string;
}

const INGRESO_ERRORS: ErrorTranslations = [
  ["El producto es obligatorio", "El producto es obligatorio."],
  ["La cantidad es obligatoria", "La cantidad es obligatoria."],
  ["La cantidad debe ser mayor que cero", "La cantidad debe ser mayor que cero."],
  ["El origen es obligatorio", "El origen es obligatorio."],
  ["El producto no existe", "El producto solicitado no existe."],
  ["Producto no encontrado", "El producto solicitado no existe."],
  ["El centro de distribución no existe", "El centro de distribución no existe."],
  ["Centro de distribución no encontrado", "El centro de distribución no existe."],
];

/**
 * Registra un ingreso de mercancía en un centro de distribución.
 * Endpoint: POST /api/centros-distribucion/{centroDistribucionId}/ingresos
 * (alias corto: POST /api/cd/{id}/ingresos). El id del CD viaja en la URL.
 */
export async function registrarIngreso(payload: RegistrarIngresoPayload): Promise<ReceiptRecord> {
  if (!Number.isInteger(payload.centroDistribucionId) || payload.centroDistribucionId <= 0) {
    throw new ApiError(400, "No tienes un centro de distribución asignado. Pide a un administrador que te asigne uno.", {
      error: "Centro de distribución no asignado",
    });
  }

  const created = await apiFetch<BackendIngresoMercancia>(
    `/api/centros-distribucion/${payload.centroDistribucionId}/ingresos`,
    {
      method: "POST",
      body: {
        productoId: Number(payload.productoId),
        cantidad: payload.quantity,
        origen: payload.origin.trim(),
      },
      fallback: "Error al registrar el ingreso de mercancía",
      errors: INGRESO_ERRORS,
      forbidden: "No tienes permisos para registrar ingresos de mercancía.",
    }
  );

  return {
    id: created.id,
    productId: String(created.productoId),
    quantity: created.cantidad,
    origin: created.origen,
    date: created.fechaIngreso,
    dcId: created.centroDistribucionId,
  };
}
