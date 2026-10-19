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

  describe("Consulta de Tiendas (getTiendas)", () => {
    it("debe listar las tiendas correctamente con token de autenticación", async () => {
      const mockTiendas = [
        { id: 1, nombre: "Tienda Norte", direccion: "Calle 100", ciudad: "Bogotá", encargadoId: 2, activo: true },
        { id: 2, nombre: "Tienda Sur", direccion: "Cra 10", ciudad: "Medellín", encargadoId: null, activo: true },
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
      expect(tiendas[0].status).toBe("active");
      expect(tiendas[1].name).toBe("Tienda Sur");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tiendas"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token-tiendas",
          }),
        })
      );
    });

    it("debe lanzar ApiError si la sesión no es válida (401)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => JSON.stringify({ error: "Sesión no válida" }),
      } as Response);

      await expect(getTiendas()).rejects.toThrow(/sesión no válida/i);
    });
  });

  describe("Creación de Tiendas (createTienda)", () => {
    it("debe crear una tienda exitosamente mediante POST /api/tiendas", async () => {
      const mockCreated = {
        id: 3,
        nombre: "Tienda Centro",
        direccion: "Av 15 # 45",
        ciudad: "Cali",
        encargadoId: null,
        activo: true,
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
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token-tiendas",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            nombre: "Tienda Centro",
            direccion: "Av 15 # 45",
            ciudad: "Cali",
            encargadoId: null,
          }),
        })
      );
    });

    it("debe capturar y traducir error de validación cuando el nombre es obligatorio (400)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "El nombre de la tienda es obligatorio." }),
      } as Response);

      await expect(
        createTienda({
          name: "",
          address: "Calle 1",
          city: "Bogotá",
        })
      ).rejects.toThrow("El nombre de la tienda es obligatorio.");
    });

    it("debe capturar y traducir error cuando falta la dirección (400)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "La dirección es obligatoria." }),
      } as Response);

      await expect(
        createTienda({
          name: "Tienda Nueva",
          address: "",
          city: "Bogotá",
        })
      ).rejects.toThrow("La dirección de la tienda es obligatoria.");
    });

    it("debe capturar y traducir error de permisos cuando el usuario no es admin (403)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => JSON.stringify({ error: "Acceso denegado: solo administradores pueden crear tiendas." }),
      } as Response);

      await expect(
        createTienda({
          name: "Tienda Nueva",
          address: "Calle 10",
          city: "Medellín",
        })
      ).rejects.toThrow(/no tienes permisos de administrador/i);
    });

    it("debe lanzar ApiError si no hay sesión activa de Supabase", async () => {
      vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(
        createTienda({
          name: "Tienda Demo",
          address: "Av 1",
          city: "Cali",
        })
      ).rejects.toThrow(/no hay una sesión activa/i);
    });
  });

  describe("Asignación de Encargado (asignarEncargadoTienda)", () => {
    it("debe asignar un encargado mediante PUT /api/tiendas/:id/encargado", async () => {
      const mockUpdated = {
        id: 3,
        nombre: "Tienda Centro",
        direccion: "Av 15 # 45",
        ciudad: "Cali",
        encargadoId: 5,
        activo: true,
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

    it("debe permitir desasignar encargado enviando null", async () => {
      const mockUpdated = {
        id: 3,
        nombre: "Tienda Centro",
        direccion: "Av 15 # 45",
        ciudad: "Cali",
        encargadoId: null,
        activo: true,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUpdated,
      } as Response);

      const result = await asignarEncargadoTienda(3, null);

      expect(result.encargadoId).toBeNull();
    });

    it("debe lanzar error limpio si el usuario asignado no tiene rol de encargado de tienda", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () =>
          JSON.stringify({
            error: "Solo se puede asignar una tienda a un usuario con rol Encargado de tienda (Rol actual: ADMINISTRADOR).",
          }),
      } as Response);

      await expect(asignarEncargadoTienda(3, 9)).rejects.toThrow(
        /solo se puede asignar como encargado a un usuario con rol 'encargado de tienda'/i
      );
    });

    it("debe lanzar error limpio si la tienda no existe (404/400)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ error: "La tienda no existe." }),
      } as Response);

      await expect(asignarEncargadoTienda(999, 1)).rejects.toThrow(
        /la tienda solicitada no existe o fue eliminada/i
      );
    });
  });
});
