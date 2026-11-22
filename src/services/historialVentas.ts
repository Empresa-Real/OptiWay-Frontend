import type { SalesHistoryItem } from "../types";
import {
  isMocksEnabled,
  getMockSalesHistory,
  getMockSalesWeeks,
} from "./mocks";

export interface HistorialVentasParams {
  tiendaId?: number;
  productoId?: string;
  desde?: string;
  hasta?: string;
}

/**
 * Obtiene el historial de ventas.
 * Endpoint: GET /api/ventas/historial?tiendaId=&productoId=&desde=&hasta=
 */
// TODO(backend): GET /api/ventas/historial?tiendaId=&productoId=&desde=&hasta=
export async function getHistorialVentas(
  params: HistorialVentasParams = {},
): Promise<SalesHistoryItem[]> {
  if (isMocksEnabled()) {
    let data = getMockSalesHistory();
    if (params.tiendaId !== undefined) {
      data = data.filter((s) => s.storeId === params.tiendaId);
    }
    if (params.productoId !== undefined) {
      data = data.filter((s) => s.productId === params.productoId);
    }
    const { desde, hasta } = params;
    if (desde !== undefined) {
      data = data.filter((s) => s.date >= desde);
    }
    if (hasta !== undefined) {
      data = data.filter((s) => s.date <= hasta);
    }
    return data;
  }
  throw new Error("Endpoint pendiente de backend");
}

/** Semanas disponibles en el historial de ventas. */
export function getSalesWeeks(): string[] {
  return getMockSalesWeeks();
}