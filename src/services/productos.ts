import type { Product } from "../types";
import { apiFetch, type ErrorTranslations } from "./http";

export interface BackendProducto {
  id: number;
  identificador: string;
  nombre: string;
  categoria: string;
  precio: number;
  unidadMedida: string;
  activo: boolean;
  estado: string;
}

export interface CrearProductoPayload {
  identificador: string;
  nombre: string;
  categoria: string;
  price: number;
  unit: string;
}

export interface EditarProductoPayload {
  nombre: string;
  categoria: string;
  price: number;
  unit: string;
}

export interface CambiarEstadoProductoPayload {
  activo: boolean;
}

const PRODUCTO_ERRORS: ErrorTranslations = [
  ["El identificador del producto es obligatorio", "El identificador del producto es obligatorio."],
  ["El nombre del producto es obligatorio", "El nombre del producto es obligatorio."],
  ["La categoría es obligatoria", "La categoría del producto es obligatoria."],
  ["La categoria es obligatoria", "La categoría del producto es obligatoria."],
  ["El precio es obligatorio", "El precio del producto es obligatorio."],
  ["La unidad de medida es obligatoria", "La unidad de medida del producto es obligatoria."],
  ["El producto no existe", "El producto solicitado no existe o fue eliminado."],
];

const PRODUCTO_FORBIDDEN = "No tienes permisos de administrador para gestionar productos.";

function mapBackendProducto(p: BackendProducto): Product {
  return {
    id: String(p.id),
    identificador: p.identificador,
    name: p.nombre,
    category: p.categoria,
    price: Number(p.precio),
    unit: p.unidadMedida,
    status: p.activo ? "active" : "inactive",
  };
}

/**
 * Obtiene la lista de productos del catálogo desde el backend.
 * Endpoint: GET /api/productos
 */
export async function getProductos(): Promise<Product[]> {
  const data = await apiFetch<BackendProducto[]>("/api/productos", {
    fallback: "Error al obtener la lista de productos",
    errors: PRODUCTO_ERRORS,
    forbidden: PRODUCTO_FORBIDDEN,
  });

  return data.map(mapBackendProducto);
}

/**
 * Registra un nuevo producto en el catálogo.
 * Endpoint: POST /api/productos
 */
export async function createProducto(payload: CrearProductoPayload): Promise<Product> {
  const created = await apiFetch<BackendProducto>("/api/productos", {
    method: "POST",
    body: {
      identificador: payload.identificador.trim(),
      nombre: payload.nombre.trim(),
      categoria: payload.categoria.trim(),
      precio: payload.price,
      unidadMedida: payload.unit.trim(),
    },
    fallback: "Error al crear el producto",
    errors: PRODUCTO_ERRORS,
    forbidden: PRODUCTO_FORBIDDEN,
  });

  return mapBackendProducto(created);
}

/**
 * Edita un producto existente en el catálogo.
 * Endpoint: PATCH /api/productos/{id}
 */
export async function updateProducto(id: string, payload: EditarProductoPayload): Promise<Product> {
  const updated = await apiFetch<BackendProducto>(`/api/productos/${id}`, {
    method: "PATCH",
    body: {
      nombre: payload.nombre.trim(),
      categoria: payload.categoria.trim(),
      precio: payload.price,
      unidadMedida: payload.unit.trim(),
    },
    fallback: `Error al editar el producto #${id}`,
    errors: PRODUCTO_ERRORS,
    forbidden: PRODUCTO_FORBIDDEN,
  });

  return mapBackendProducto(updated);
}

/**
 * Cambia el estado (activo/inactivo) de un producto.
 * Endpoint: PATCH /api/productos/{id}/estado
 */
export async function cambiarEstadoProducto(id: string, activo: boolean): Promise<Product> {
  const updated = await apiFetch<BackendProducto>(`/api/productos/${id}/estado`, {
    method: "PATCH",
    body: { activo },
    fallback: `Error al cambiar el estado del producto #${id}`,
    errors: PRODUCTO_ERRORS,
    forbidden: PRODUCTO_FORBIDDEN,
  });

  return mapBackendProducto(updated);
}
