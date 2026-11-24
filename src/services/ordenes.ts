import type { Order } from "../types";
import { apiFetch } from "./http";
import {
  isMocksEnabled,
  getMockOrders,
} from "./mocks";

export interface OrdenReposicionResponse {
  id: number;
  recomendacionId: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  centroDistribucionOrigenId: number;
  tiendaDestinoId: number;
  estado: string;
  creadoPor: string | null;
  fechaCreacion: string;
}

function mapOrden(item: OrdenReposicionResponse): Order {
  return {
    id: item.id,
    recommendationId: item.recomendacionId,
    productId: String(item.productoId),
    nombreProducto: item.nombreProducto,
    quantity: item.cantidad,
    originDcId: item.centroDistribucionOrigenId,
    destStoreId: item.tiendaDestinoId,
    status: item.estado?.toUpperCase() === "APROBADA" ? "Aprobada" : item.estado,
    date: item.fechaCreacion,
  };
}

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
export async function getOrdenesCD(
  centroDistribucionId: number,
): Promise<Order[]> {
  const data = await apiFetch<OrdenReposicionResponse[]>(
    `/api/centros-distribucion/${centroDistribucionId}/ordenes`,
    {
      fallback: "No se pudieron cargar las órdenes entrantes.",
      forbidden: "No tienes permisos para consultar las órdenes de este centro de distribución.",
    },
  );
  return data.map(mapOrden);
}
