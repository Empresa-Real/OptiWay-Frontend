import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registrarIngreso } from "../ingresoMercancia";
import { supabase } from "../supabase";

describe("Servicio de Ingreso de Mercancía (ingresoMercancia.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-ingresos",
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

  describe("Registro de ingreso (registrarIngreso)", () => {
    it("debe llamar a POST /api/centros-distribucion/:id/ingresos con el id en la URL", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 101,
          centroDistribucionId: 2,
          productoId: 10,
          cantidad: 250,
          origen: "Proveedor Central",
          usuarioId: 4,
          fechaIngreso: "2026-10-18T10:30:00",
        }),
      } as Response);

      const result = await registrarIngreso({
        centroDistribucionId: 2,
        productoId: "10",
        quantity: 250,
        origin: "  Proveedor Central  ",
      });

      const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

      expect(url).toContain("/api/centros-distribucion/2/ingresos");
      expect(url).not.toContain("/api/ingresos-mercancia");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer mock-jwt-token-ingresos");
      expect(JSON.parse(init.body)).toEqual({
        productoId: 10,
        cantidad: 250,
        origen: "Proveedor Central",
      });
      expect(result).toEqual({
        id: 101,
        productId: "10",
        quantity: 250,
        origin: "Proveedor Central",
        date: "2026-10-18T10:30:00",
        dcId: 2,
      });
    });

    it("debe traducir el error cuando el origen es obligatorio", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "El origen es obligatorio" }),
      } as Response);

      await expect(
        registrarIngreso({ centroDistribucionId: 2, productoId: "10", quantity: 5, origin: " " })
      ).rejects.toThrow("El origen es obligatorio.");
    });

    it("debe traducir el error cuando el centro de distribución no existe", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "El centro de distribución no existe." }),
      } as Response);

      await expect(
        registrarIngreso({ centroDistribucionId: 999, productoId: "10", quantity: 5, origin: "Proveedor" })
      ).rejects.toThrow("El centro de distribución no existe.");
    });

    it("debe lanzar ApiError si no hay sesión activa", async () => {
      vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({ data: { session: null }, error: null });

      await expect(
        registrarIngreso({ centroDistribucionId: 2, productoId: "10", quantity: 5, origin: "Proveedor" })
      ).rejects.toThrow(/no hay una sesión activa/i);
    });

    it("debe rechazar el ingreso sin centro de distribución asignado sin llamar a la API", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await expect(
        registrarIngreso({ centroDistribucionId: 0, productoId: "10", quantity: 5, origin: "Proveedor" })
      ).rejects.toThrow(/no tienes un centro de distribución asignado/i);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
