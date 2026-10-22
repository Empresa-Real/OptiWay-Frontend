import type { InventoryItem } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";

export interface BackendInventario {
  id: number;
  tiendaId: number | null;
  centroDistribucionId: number | null;
  productoId: number;
  nombreProducto: string;
  categoriaProducto: string;
  cantidadActual: number;
  stockMinimo: number;
  stockBajo: boolean;
}

interface FiltrosInventario {
  nombre?: string;
  categoria?: string;
  productoId?: number;
}

export interface InventarioTiendaParams extends FiltrosInventario {
  tiendaId: number;
}

export interface InventarioCDParams extends FiltrosInventario {
  centroDistribucionId: number;
}

const INVENTARIO_ERRORS: ErrorTranslations = [
  ["La tienda no existe", "La ubicación solicitada no existe o fue eliminada."],
  ["El centro de distribución no existe", "La ubicación solicitada no existe o fue eliminada."],
];

function mapInventario(i: BackendInventario): InventoryItem {
  return {
    productId: String(i.productoId),
    quantity: i.cantidadActual,
    minStock: i.stockMinimo,
    nombreProducto: i.nombreProducto,
    categoriaProducto: i.categoriaProducto,
    stockBajo: i.stockBajo,
  };
}

/**
 * Consulta el inventario de una tienda específica.
 * Endpoint: GET /api/inventario?tiendaId=...
 */
export async function getInventarioTienda(params: InventarioTiendaParams): Promise<InventoryItem[]> {
  const data = await apiFetch<BackendInventario[]>("/api/inventario", {
    query: {
      tiendaId: params.tiendaId,
      nombre: params.nombre,
      categoria: params.categoria,
      productoId: params.productoId,
    },
    fallback: "Error al obtener el inventario de la tienda",
    errors: INVENTARIO_ERRORS,
    forbidden: "No tienes permisos para consultar este inventario.",
  });

  return data.map(mapInventario);
}

/**
 * Consulta el inventario de un centro de distribución específico.
 * Endpoint: GET /api/inventario/centro-distribucion?centroDistribucionId=...
 */
export async function getInventarioCD(params: InventarioCDParams): Promise<InventoryItem[]> {
  const data = await apiFetch<BackendInventario[]>("/api/inventario/centro-distribucion", {
    query: {
      centroDistribucionId: params.centroDistribucionId,
      nombre: params.nombre,
      categoria: params.categoria,
      productoId: params.productoId,
    },
    fallback: "Error al obtener el inventario del centro de distribución",
    errors: INVENTARIO_ERRORS,
    forbidden: "No tienes permisos para consultar este inventario.",
  });

  return data.map(mapInventario);
}
