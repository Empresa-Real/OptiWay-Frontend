import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getInventarioTienda, getInventarioCD } from "../inventario";
import { supabase } from "../supabase";

const respuesta = [
  {
    id: 1,
    tiendaId: 5,
    centroDistribucionId: null,
    productoId: 10,
    nombreProducto: "Camisa Oxford",
    categoriaProducto: "Ropa",
    cantidadActual: 20,
    stockMinimo: 5,
    stockBajo: false,
  },
];

describe("Servicio de Inventario (inventario.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-inventario",
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

  it("envía el filtro de nombre al backend y mapea la respuesta", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => respuesta,
    } as Response);

    const items = await getInventarioTienda({ tiendaId: 5, nombre: "Camisa Oxford" });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/inventario?");
    expect(url).toContain("tiendaId=5");
    expect(url).toContain("nombre=Camisa+Oxford");

    expect(items).toEqual([
      {
        productId: "10",
        quantity: 20,
        minStock: 5,
        nombreProducto: "Camisa Oxford",
        categoriaProducto: "Ropa",
        stockBajo: false,
      },
    ]);
  });

  it("no envía parámetros vacíos cuando no hay búsqueda", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await getInventarioTienda({ tiendaId: 5 });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toMatch(/\/api\/inventario\?tiendaId=5$/);
    expect(url).not.toContain("nombre=");
  });

  it("consulta el inventario del CD y conserva productoId = 0", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await getInventarioCD({ centroDistribucionId: 2, categoria: "Ropa", productoId: 0 });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/inventario/centro-distribucion?");
    expect(url).toContain("centroDistribucionId=2");
    expect(url).toContain("categoria=Ropa");
    expect(url).toContain("productoId=0");
  });

  it("traduce el error cuando la ubicación no existe", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "La tienda no existe." }),
    } as Response);

    await expect(getInventarioTienda({ tiendaId: 999 })).rejects.toThrow(
      "La ubicación solicitada no existe o fue eliminada."
    );
  });

  it("lanza ApiError si no hay sesión activa", async () => {
    vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({ data: { session: null }, error: null });

    await expect(getInventarioTienda({ tiendaId: 5 })).rejects.toThrow(/no hay una sesión activa/i);
  });
});
