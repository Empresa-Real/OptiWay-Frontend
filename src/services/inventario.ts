import { supabase } from "./supabase";
import type { InventoryItem } from "../types";
import { ApiError, cleanErrorMessage } from "./usuarios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

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

interface InventarioTiendaParams {
  tiendaId: number;
  nombre?: string;
  categoria?: string;
  productoId?: number;
}

interface InventarioCDParams {
  centroDistribucionId: number;
  nombre?: string;
  categoria?: string;
  productoId?: number;
}

/**
 * Procesa la respuesta de error de la API de inventario devolviendo un mensaje humano y limpio.
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

  if (specificMessage.includes("La tienda no existe") || specificMessage.includes("El centro de distribución no existe")) {
    specificMessage = "La ubicación solicitada no existe o fue eliminada.";
  } else if (specificMessage.includes("Acceso denegado") || response.status === 403) {
    specificMessage = "No tienes permisos para consultar este inventario.";
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
 * Consulta el inventario de una tienda específica.
 * Endpoint: GET /api/inventario?tiendaId=...
 */
export async function getInventarioTienda(params: InventarioTiendaParams): Promise<InventoryItem[]> {
  const token = await getAuthToken();

  const searchParams = new URLSearchParams({
    tiendaId: String(params.tiendaId),
  });
  if (params.nombre) searchParams.set("nombre", params.nombre);
  if (params.categoria) searchParams.set("categoria", params.categoria);
  if (params.productoId !== undefined) searchParams.set("productoId", String(params.productoId));

  const response = await fetch(`${API_BASE_URL}/api/inventario?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al obtener el inventario de la tienda");
  }

  const data: BackendInventario[] = await response.json();

  return data.map((i) => ({
    productId: String(i.productoId),
    quantity: i.cantidadActual,
    minStock: i.stockMinimo,
    nombreProducto: i.nombreProducto,
    categoriaProducto: i.categoriaProducto,
    stockBajo: i.stockBajo,
  }));
}

/**
 * Consulta el inventario de un centro de distribución específico.
 * Endpoint: GET /api/inventario/centro-distribucion?centroDistribucionId=...
 */
export async function getInventarioCD(params: InventarioCDParams): Promise<InventoryItem[]> {
  const token = await getAuthToken();

  const searchParams = new URLSearchParams({
    centroDistribucionId: String(params.centroDistribucionId),
  });
  if (params.nombre) searchParams.set("nombre", params.nombre);
  if (params.categoria) searchParams.set("categoria", params.categoria);
  if (params.productoId !== undefined) searchParams.set("productoId", String(params.productoId));

  const response = await fetch(`${API_BASE_URL}/api/inventario/centro-distribucion?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al obtener el inventario del centro de distribución");
  }

  const data: BackendInventario[] = await response.json();

  return data.map((i) => ({
    productId: String(i.productoId),
    quantity: i.cantidadActual,
    minStock: i.stockMinimo,
    nombreProducto: i.nombreProducto,
    categoriaProducto: i.categoriaProducto,
    stockBajo: i.stockBajo,
  }));
}
