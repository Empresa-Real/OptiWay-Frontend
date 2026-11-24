import { buildUrl } from "./http";

export interface EstadisticasPublicas {
  tiendas: number;
  centrosDistribucion: number;
  unidadesStock: number;
  unidadesEnTiendas: number;
  unidadesEnCentros: number;
  registrosInventario: number;
}

/**
 * Obtiene estadísticas públicas de la red logística.
 * Endpoint público: GET /api/estadisticas (sin Authorization ni cookie).
 */
export async function getEstadisticasPublicas(): Promise<EstadisticasPublicas> {
  const url = buildUrl("/api/estadisticas");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar las estadísticas.");
  }

  const data = (await response.json()) as Partial<EstadisticasPublicas>;
  return {
    tiendas: Number(data.tiendas ?? 0),
    centrosDistribucion: Number(data.centrosDistribucion ?? 0),
    unidadesStock: Number(data.unidadesStock ?? 0),
    unidadesEnTiendas: Number(data.unidadesEnTiendas ?? 0),
    unidadesEnCentros: Number(data.unidadesEnCentros ?? 0),
    registrosInventario: Number(data.registrosInventario ?? 0),
  };
}
