import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registrarVenta } from "../ventas";
import { supabase } from "../supabase";

describe("Servicio de Ventas (ventas.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-ventas",
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

  describe("Registro de venta (registrarVenta)", () => {
    it("debe llamar a POST /api/tiendas/:id/ventas con el id en la URL", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 7,
          tiendaId: 3,
          productoId: 5,
          cantidad: 2,
          fechaHora: "2026-10-18T10:30:00",
        }),
      } as Response);

      const result = await registrarVenta({
        tiendaId: 3,
        productoId: "5",
        quantity: 2,
        fechaHora: "2026-10-18T10:30:00",
      });

      const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

      expect(url).toContain("/api/tiendas/3/ventas");
      expect(url).not.toMatch(/\/api\/ventas$/);
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer mock-jwt-token-ventas");
      expect(JSON.parse(init.body)).toEqual({
        productoId: 5,
        cantidad: 2,
        fechaHora: "2026-10-18T10:30:00",
      });
      expect(result).toEqual({
        id: 7,
        productId: "5",
        quantity: 2,
        date: "2026-10-18T10:30:00",
        storeId: 3,
      });
    });

    it("debe omitir fechaHora cuando no se envía, para que el servidor use su hora", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 8, tiendaId: 3, productoId: 5, cantidad: 1, fechaHora: "2026-10-22T09:00:00" }),
      } as Response);

      await registrarVenta({ tiendaId: 3, productoId: "5", quantity: 1 });

      const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      expect("fechaHora" in JSON.parse(init.body)).toBe(false);
    });

    it("debe traducir el error de stock insuficiente", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "Stock insuficiente para el producto 5" }),
      } as Response);

      await expect(registrarVenta({ tiendaId: 3, productoId: "5", quantity: 99 })).rejects.toThrow(
        "Stock insuficiente para registrar esta venta."
      );
    });

    it("debe traducir el error de permisos (403)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => JSON.stringify({ error: "Solo el encargado de la tienda puede registrar ventas." }),
      } as Response);

      await expect(registrarVenta({ tiendaId: 3, productoId: "5", quantity: 1 })).rejects.toThrow(
        /no tienes permisos para registrar ventas/i
      );
    });

    it("debe lanzar ApiError si no hay sesión activa", async () => {
      vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({ data: { session: null }, error: null });

      await expect(registrarVenta({ tiendaId: 3, productoId: "5", quantity: 1 })).rejects.toThrow(
        /no hay una sesión activa/i
      );
    });

    it("debe rechazar la venta sin tienda asignada sin llamar a la API", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await expect(registrarVenta({ tiendaId: 0, productoId: "5", quantity: 1 })).rejects.toThrow(
        /no tienes una tienda asignada/i
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
