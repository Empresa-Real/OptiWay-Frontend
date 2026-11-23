import { apiFetch } from "./http";

export interface ConsultaPatronesDemanda {
  productoId: number;
  tiendaIds: number[];
  desde: string;
  hasta: string;
}

export interface VentaDiaria {
  fecha: string;
  unidadesVendidas: number;
}

export interface DemandaTienda {
  tiendaId: number;
  unidadesVendidas: number;
  evolucion: VentaDiaria[];
}

export interface PatronesDemandaResponse {
  productoId: number;
  desde: string;
  hasta: string;
  tiendas: DemandaTienda[];
  tiendasMayorRotacion: number[];
  tiendasMenorRotacion: number[];
}

export function consultarPatronesDemanda({
  productoId,
  tiendaIds,
  desde,
  hasta,
}: ConsultaPatronesDemanda): Promise<PatronesDemandaResponse> {
  return apiFetch<PatronesDemandaResponse>("/api/demanda/patrones", {
    query: {
      productoId,
      tiendaIds: tiendaIds.join(","),
      desde,
      hasta,
    },
    fallback: "No se pudieron consultar los patrones de demanda.",
    forbidden: "Solo el planificador puede consultar los patrones de demanda.",
  });
}