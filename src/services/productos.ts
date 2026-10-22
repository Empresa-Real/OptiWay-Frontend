import { supabase } from "./supabase";
import type { Product } from "../types";
import { ApiError, cleanErrorMessage } from "./usuarios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

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

  if (specificMessage.includes("El identificador del producto es obligatorio")) {
    specificMessage = "El identificador del producto es obligatorio.";
  } else if (specificMessage.includes("El nombre del producto es obligatorio")) {
    specificMessage = "El nombre del producto es obligatorio.";
  } else if (specificMessage.includes("La categoría es obligatoria") || specificMessage.includes("La categoria es obligatoria")) {
    specificMessage = "La categoría del producto es obligatoria.";
  } else if (specificMessage.includes("El precio es obligatorio")) {
    specificMessage = "El precio del producto es obligatorio.";
  } else if (specificMessage.includes("La unidad de medida es obligatoria")) {
    specificMessage = "La unidad de medida del producto es obligatoria.";
  } else if (specificMessage.includes("El producto no existe")) {
    specificMessage = "El producto solicitado no existe o fue eliminado.";
  } else if (specificMessage.includes("Acceso denegado") || response.status === 403) {
    specificMessage = "No tienes permisos de administrador para gestionar productos.";
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
 * Obtiene la lista de productos del catálogo desde el backend.
 * Endpoint: GET /api/productos
 */
export async function getProductos(): Promise<Product[]> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/productos`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al obtener la lista de productos");
  }

  const data: BackendProducto[] = await response.json();

  return data.map((p) => ({
    id: String(p.id),
    name: p.nombre,
    category: p.categoria,
    price: Number(p.precio),
    unit: p.unidadMedida,
    status: p.activo ? ("active" as const) : ("inactive" as const),
  }));
}

/**
 * Registra un nuevo producto en el catálogo.
 * Endpoint: POST /api/productos
 */
export async function createProducto(payload: CrearProductoPayload): Promise<Product> {
  const token = await getAuthToken();

  const body = {
    identificador: payload.identificador.trim(),
    nombre: payload.nombre.trim(),
    categoria: payload.categoria.trim(),
    precio: payload.price,
    unidadMedida: payload.unit.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/api/productos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, "Error al crear el producto");
  }

  const created: BackendProducto = await response.json();

  return {
    id: String(created.id),
    name: created.nombre,
    category: created.categoria,
    price: Number(created.precio),
    unit: created.unidadMedida,
    status: created.activo ? ("active" as const) : ("inactive" as const),
  };
}

/**
 * Edita un producto existente en el catálogo.
 * Endpoint: PATCH /api/productos/{id}
 */
export async function updateProducto(id: string, payload: EditarProductoPayload): Promise<Product> {
  const token = await getAuthToken();

  const body = {
    nombre: payload.nombre.trim(),
    categoria: payload.categoria.trim(),
    precio: payload.price,
    unidadMedida: payload.unit.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al editar el producto #${id}`);
  }

  const updated: BackendProducto = await response.json();

  return {
    id: String(updated.id),
    name: updated.nombre,
    category: updated.categoria,
    price: Number(updated.precio),
    unit: updated.unidadMedida,
    status: updated.activo ? ("active" as const) : ("inactive" as const),
  };
}

/**
 * Cambia el estado (activo/inactivo) de un producto.
 * Endpoint: PATCH /api/productos/{id}/estado
 */
export async function cambiarEstadoProducto(id: string, activo: boolean): Promise<Product> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/productos/${id}/estado`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ activo }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response, `Error al cambiar el estado del producto #${id}`);
  }

  const updated: BackendProducto = await response.json();

  return {
    id: String(updated.id),
    name: updated.nombre,
    category: updated.categoria,
    price: Number(updated.precio),
    unit: updated.unidadMedida,
    status: updated.activo ? ("active" as const) : ("inactive" as const),
  };
}