import { seedDCs } from "../data/seed";
import type { DC } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/**
 * GET /api/centros-distribucion
 */
export async function getCentrosDistribucion(): Promise<DC[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/centros-distribucion`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron obtener los centros de distribución`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Error al conectar con la API de Centros de Distribución. Usando datos semilla:", error);
    return seedDCs;
  }
}

/**
 * POST /api/centros-distribucion
 */
export async function createCentroDistribucion(data: {
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
}): Promise<DC> {
  try {
    const response = await fetch(`${API_BASE_URL}/centros-distribucion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo crear el centro de distribución`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Error al conectar con la API. Creando centro de distribución localmente:", error);
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
 * PUT /api/centros-distribucion/{id}/encargado
 */
export async function updateEncargadoCentroDistribucion(
  id: number,
  encargadoId: number | string
): Promise<DC> {
  try {
    const response = await fetch(`${API_BASE_URL}/centros-distribucion/${id}/encargado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encargadoId }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo actualizar el encargado`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Error al actualizar encargado en la API. Modificando localmente:", error);
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