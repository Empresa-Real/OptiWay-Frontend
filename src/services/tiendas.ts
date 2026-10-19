import { supabase } from "./supabase";
import type { Store } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export interface BackendTienda {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  encargadoId?: number | null;
}

export interface CrearTiendaPayload {
  nombre: string;
  direccion: string;
  ciudad: string;
  encargadoId?: number | null;
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay una sesión activa. Inicia sesión nuevamente.");
  }
  return token;
}

/**
 * Obtiene la lista de tiendas registradas desde el backend.
 * Endpoint: GET /api/tiendas
 */
export async function getTiendas(): Promise<Store[]> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/tiendas`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener tiendas (${response.status}): ${errorText || response.statusText}`);
  }

  const data: BackendTienda[] = await response.json();

  return data.map((t) => ({
    id: t.id,
    name: t.nombre,
    address: t.direccion,
    city: t.ciudad,
    status: "active",
  }));
}

/**
 * Registra una nueva tienda en el sistema.
 * Endpoint: POST /api/tiendas
 */
export async function createTienda(payload: { name: string; address: string; city: string }): Promise<Store> {
  const token = await getAuthToken();

  const body: CrearTiendaPayload = {
    nombre: payload.name.trim(),
    direccion: payload.address.trim(),
    ciudad: payload.city.trim(),
    encargadoId: null,
  };

  const response = await fetch(`${API_BASE_URL}/api/tiendas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al crear tienda (${response.status}): ${errorText || response.statusText}`);
  }

  const created: BackendTienda = await response.json();

  return {
    id: created.id,
    name: created.nombre,
    address: created.direccion,
    city: created.ciudad,
    status: "active",
  };
}
