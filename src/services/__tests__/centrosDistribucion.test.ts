import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCentrosDistribucion,
  createCentroDistribucion,
  updateEncargadoCentroDistribucion,
  mapBackendCDToFrontend,
} from "../centrosDistribucion";
import { supabase } from "../supabase";

describe("Servicio de Centros de Distribución (centrosDistribucion.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-cd",
          refresh_token: "mock-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: { id: "user-1", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" },
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe mapear correctamente un CentroDistribucion de backend a frontend", () => {
    const backendCD = {
      id: 1,
      codigo: "CD-01",
      nombre: "CD Norte Bogotá",
      direccion: "Zona Franca Calle 13",
      capacidad: 50000,
      encargadoId: 3,
      tiendasAbastecidasIds: [1, 2],
    };

    const frontendCD = mapBackendCDToFrontend(backendCD);

    expect(frontendCD).toEqual({
      id: 1,
      name: "CD Norte Bogotá",
      address: "Zona Franca Calle 13",
      capacity: 50000,
      coverage: [1, 2],
      status: "active",
      encargadoId: 3,
    });
  });

  it("debe consultar centros de distribución mediante GET /api/centros-distribucion", async () => {
    const mockList = [
      { id: 1, nombre: "CD Norte", direccion: "Calle 80", capacidad: 10000, tiendasAbastecidasIds: [1] },
      { id: 2, nombre: "CD Sur", direccion: "Autopista Sur", capacidad: 20000, tiendasAbastecidasIds: [2, 3] },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockList,
    } as Response);

    const result = await getCentrosDistribucion();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("CD Norte");
    expect(result[1].name).toBe("CD Sur");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/centros-distribucion"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-jwt-token-cd",
        }),
      })
    );
  });

  it("debe crear un centro de distribución mediante POST /api/centros-distribucion", async () => {
    const mockCreated = {
      id: 10,
      nombre: "CD Occidente",
      direccion: "Av Esperanza",
      capacidad: 30000,
      tiendasAbastecidasIds: [1, 4],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockCreated,
    } as Response);

    const result = await createCentroDistribucion({
      name: "CD Occidente",
      address: "Av Esperanza",
      capacity: 30000,
      coverage: [1, 4],
    });

    expect(result.id).toBe(10);
    expect(result.name).toBe("CD Occidente");
    expect(result.capacity).toBe(30000);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/centros-distribucion"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          nombre: "CD Occidente",
          direccion: "Av Esperanza",
          capacidad: 30000,
          encargadoId: null,
          tiendasAbastecidasIds: [1, 4],
        }),
      })
    );
  });

  it("debe actualizar encargado mediante PUT /api/centros-distribucion/:id/encargado", async () => {
    const mockUpdated = {
      id: 1,
      nombre: "CD Norte",
      direccion: "Calle 80",
      capacidad: 10000,
      encargadoId: 8,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUpdated,
    } as Response);

    const result = await updateEncargadoCentroDistribucion(1, 8);

    expect(result.encargadoId).toBe(8);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/centros-distribucion/1/encargado"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ encargadoId: 8 }),
      })
    );
  });
});
