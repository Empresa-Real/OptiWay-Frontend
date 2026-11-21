import type { Order } from "../types";
import {
  isMocksEnabled,
  getMockOrders,
  getMockOrdenesCD,
} from "./mocks";

/**
 * Obtiene la lista de órdenes.
 * Endpoint: GET /api/ordenes
 */
// TODO(backend): GET /api/ordenes
export async function getOrdenes(): Promise<Order[]> {
  if (isMocksEnabled()) {
    return getMockOrders();
  }
  throw new Error("Endpoint pendiente de backend");
}

/**
 * Obtiene las órdenes de un centro de distribución (origen).
 * Endpoint: GET /api/centros-distribucion/{id}/ordenes
 */
// TODO(backend): GET /api/centros-distribucion/{id}/ordenes
export async function getOrdenesCD(
  centroDistribucionId: number,
): Promise<Order[]> {
  if (isMocksEnabled()) {
    return getMockOrdenesCD(centroDistribucionId);
  }
  throw new Error("Endpoint pendiente de backend");
}