import { ApiError, apiFetch, buildUrl, getAuthToken } from "./http";

export type ClasificacionRotacion = "RAPIDA" | "BAJA" | "SIN_VENTAS" | string;

export interface ReporteRotacionProducto {
  productoId: number;
  nombreProducto: string;
  categoriaProducto: string;
  unidadesVendidas: number;
  stockActual: number;
  tiempoPromedioEstimadoEnInventarioDias: number | null;
  clasificacionRotacion: ClasificacionRotacion;
}

export interface ReporteRotacionResponse {
  tiendaId: number;
  desde: string;
  hasta: string;
  metodoCalculo: string;
  productos: ReporteRotacionProducto[];
}

export interface ConsultaReporteRotacion {
  tiendaId: number;
  desde: string;
  hasta: string;
}

export function consultarReporteRotacion({
  tiendaId,
  desde,
  hasta,
}: ConsultaReporteRotacion): Promise<ReporteRotacionResponse> {
  return apiFetch<ReporteRotacionResponse>("/api/reportes/rotacion", {
    query: { tiendaId, desde, hasta },
    fallback: "No se pudo consultar el reporte de rotación.",
    forbidden: "Solo el planificador puede consultar el reporte de rotación.",
  });
}

export async function exportarReporteRotacionCsv({
  tiendaId,
  desde,
  hasta,
}: ConsultaReporteRotacion): Promise<{ blob: Blob; filename: string }> {
  const token = await getAuthToken();
  const url = buildUrl("/api/reportes/rotacion/exportar", {
    tiendaId,
    desde,
    hasta,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "No se pudo exportar el reporte de rotación.";
    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
      if (typeof data?.message === "string" && data.message.trim()) {
        message = data.message;
      }
    } catch {
      if (response.status === 403) {
        message = "Solo el planificador puede exportar el reporte de rotación.";
      }
    }
    throw new ApiError(response.status, message, data);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i.exec(disposition);
  const filename =
    match?.[1]?.trim() ||
    `reporte-rotacion-tienda-${tiendaId}-${desde}-${hasta}.csv`;

  const blob = await response.blob();
  return { blob, filename };
}
