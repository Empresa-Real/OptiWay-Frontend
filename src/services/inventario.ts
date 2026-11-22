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

export interface AjusteInventarioResult {
  id: number;
  tiendaId: number | null;
  centroDistribucionId: number | null;
  productoId: number;
  cantidadAnterior: number;
  diferencia: number;
  cantidadNueva: number;
  usuarioId: number;
  fechaAjuste: string;
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
  ["Tienda no encontrada", "La ubicación solicitada no existe o fue eliminada."],
  ["El centro de distribución no existe", "La ubicación solicitada no existe o fue eliminada."],
  ["Centro de distribución no encontrado", "La ubicación solicitada no existe o fue eliminada."],
];

const AJUSTE_ERRORS: ErrorTranslations = [
  ["La nueva cantidad debe ser mayor o igual a cero", "La cantidad no puede ser negativa."],
  [
    "El producto no está registrado en el inventario",
    "El producto no está registrado en el inventario de esta ubicación.",
  ],
  [
    "Solo el ENCARGADO_CD asignado",
    "Solo el encargado del CD puede ajustar este inventario.",
  ],
  [
    "No tiene permisos para ajustar",
    "No tienes permisos para ajustar este inventario.",
  ],
];

function mapInventario(inventario: BackendInventario): InventoryItem {
  return {
    productId: String(inventario.productoId),
    quantity: inventario.cantidadActual,
    minStock: inventario.stockMinimo,
    nombreProducto: inventario.nombreProducto,
    categoriaProducto: inventario.categoriaProducto,
    stockBajo: inventario.stockBajo,
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

/**
 * Ajusta la cantidad de inventario de un producto en una ubicación.
 * Endpoint: POST /api/inventario/ajustes
 * Body: { tiendaId | centroDistribucionId, productoId, nuevaCantidad }
 *
 * El backend devuelve el ajuste registrado con la cantidad anterior, la
 * diferencia, la nueva cantidad, el usuario responsable y la fecha.
 */
export async function ajustarInventario(
  tipo: "tienda" | "cd",
  locationId: number,
  productId: string,
  nuevaCantidad: number,
): Promise<AjusteInventarioResult> {
  const body =
    tipo === "tienda"
      ? { tiendaId: locationId, productoId: Number(productId), nuevaCantidad }
      : { centroDistribucionId: locationId, productoId: Number(productId), nuevaCantidad };

  return apiFetch<AjusteInventarioResult>("/api/inventario/ajustes", {
    method: "POST",
    body,
    fallback: "No se pudo ajustar el inventario",
    errors: AJUSTE_ERRORS,
    forbidden: "No tienes permisos para ajustar este inventario.",
  });
}
