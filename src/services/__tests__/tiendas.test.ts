import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTiendas, createTienda, asignarEncargadoTienda } from "../tiendas";
import { supabase } from "../supabase";

describe("Servicio de Tiendas (tiendas.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-tiendas",
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

  it("debe listar las tiendas correctamente", async () => {
    const mockTiendas = [
      { id: 1, nombre: "Tienda Norte", direccion: "Calle 100", ciudad: "Bogotá", encargadoId: 2 },
      { id: 2, nombre: "Tienda Sur", direccion: "Cra 10", ciudad: "Medellín", encargadoId: null },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockTiendas,
    } as Response);

    const tiendas = await getTiendas();

    expect(tiendas).toHaveLength(2);
    expect(tiendas[0].name).toBe("Tienda Norte");
    expect(tiendas[0].city).toBe("Bogotá");
    expect(tiendas[1].name).toBe("Tienda Sur");
  });

  it("debe crear una tienda mediante POST /api/tiendas", async () => {
    const mockCreated = {
      id: 3,
      nombre: "Tienda Centro",
      direccion: "Av 15 # 45",
      ciudad: "Cali",
      encargadoId: null,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockCreated,
    } as Response);

    const result = await createTienda({
      name: "Tienda Centro",
      address: "Av 15 # 45",
      city: "Cali",
    });

    expect(result.id).toBe(3);
    expect(result.name).toBe("Tienda Centro");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tiendas"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          nombre: "Tienda Centro",
          direccion: "Av 15 # 45",
          ciudad: "Cali",
          encargadoId: null,
        }),
      })
    );
  });

  it("debe asignar un encargado mediante PUT /api/tiendas/:id/encargado", async () => {
    const mockUpdated = {
      id: 3,
      nombre: "Tienda Centro",
      direccion: "Av 15 # 45",
      ciudad: "Cali",
      encargadoId: 5,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUpdated,
    } as Response);

    const result = await asignarEncargadoTienda(3, 5);

    expect(result.encargadoId).toBe(5);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tiendas/3/encargado"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ encargadoId: 5 }),
      })
    );
  });
});
