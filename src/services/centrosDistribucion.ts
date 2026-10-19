import { seedDCs } from "../data/seed";
import type { DC } from "../types";
import { supabase } from "./supabase";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export interface BackendCentroDistribucion {
  id: number;
  codigo?: string;
  nombre: string;
  direccion: string;
  capacidad: number;
  encargadoId?: number | null;
  tiendasAbastecidasIds?: number[];
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export function mapBackendCDToFrontend(backendCD: any): DC {
  return {
    id: backendCD.id,
    name: backendCD.nombre || backendCD.name || "CD",
    address: backendCD.direccion || backendCD.address || "",
    capacity: backendCD.capacidad ?? backendCD.capacity ?? 0,
    coverage: backendCD.tiendasAbastecidasIds || backendCD.coverage || [],
    status: "active",
    encargadoId: backendCD.encargadoId,
  };
}

/**
 * Consulta la lista de centros de distribución desde el backend.
 * Endpoint: GET /api/centros-distribucion
 */
export async function getCentrosDistribucion(): Promise<DC[]> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/centros-distribucion`, { headers });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron obtener los centros de distribución`);
    }
    const data: any[] = await response.json();
    return data.map(mapBackendCDToFrontend);
  } catch (error) {
    console.warn("Aviso al conectar con /api/centros-distribucion. Usando datos locales:", error);
    return seedDCs;
  }
}

/**
 * Registra un nuevo centro de distribución en el backend.
 * Endpoint: POST /api/centros-distribucion
 */
export async function createCentroDistribucion(data: {
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
}): Promise<DC> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = {
      nombre: data.name.trim(),
      direccion: data.address.trim(),
      capacidad: data.capacity,
      encargadoId: null,
      tiendasAbastecidasIds: data.coverage || [],
    };

    const response = await fetch(`${API_BASE_URL}/api/centros-distribucion`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo crear el centro de distribución`);
    }

    const created = await response.json();
    return mapBackendCDToFrontend(created);
  } catch (error) {
    console.warn("Aviso al crear CD en la API. Creando localmente:", error);
    return {
      id: Date.now(),
      name: data.name,
      address: data.address,
      capacity: data.capacity,
      coverage: data.coverage,
      status: "active",
    };
  }
}

/**
 * Asigna un encargado a un centro de distribución.
 * Endpoint: PUT /api/centros-distribucion/{id}/encargado
 */
export async function updateEncargadoCentroDistribucion(
  id: number,
  encargadoId: number | string
): Promise<DC> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/centros-distribucion/${id}/encargado`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ encargadoId: Number(encargadoId) }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo actualizar el encargado`);
    }

    const updated = await response.json();
    return mapBackendCDToFrontend(updated);
  } catch (error) {
    console.warn("Aviso al actualizar encargado en la API. Modificando localmente:", error);
    const dc = seedDCs.find((item) => item.id === id);
    if (!dc) {
      throw new Error("Centro de distribución no encontrado");
    }
    return {
      ...dc,
      encargadoId: Number(encargadoId),
    };
  }
}