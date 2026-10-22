import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiFetch,
  buildUrl,
  readErrorBody,
  pickContractMessage,
  ApiError,
  type BackendErrorResponse,
} from "../http";
import { supabase } from "../supabase";

describe("Punto de Entrada HTTP y Contrato de Error (http.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-valid-jwt",
          refresh_token: "mock-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: { id: "test-user-id" } as any,
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildUrl", () => {
    it("normaliza las barras de la base y del endpoint", () => {
      expect(buildUrl("api/tiendas", undefined, "https://api.example.com")).toBe(
        "https://api.example.com/api/tiendas"
      );
      expect(buildUrl("/api/tiendas", undefined, "https://api.example.com/")).toBe(
        "https://api.example.com/api/tiendas"
      );
    });

    it("codifica query params y conserva 0 y false, filtrando valores vacíos", () => {
      const url = new URL(
        buildUrl(
          "/api/tiendas",
          { pagina: 0, activa: false, nombre: "CD Ñandú", vacio: "", ausente: undefined, nulo: null },
          "https://api.example.com/"
        )
      );

      expect(url.pathname).toBe("/api/tiendas");
      expect(url.searchParams.get("pagina")).toBe("0");
      expect(url.searchParams.get("activa")).toBe("false");
      expect(url.searchParams.get("nombre")).toBe("CD Ñandú");
      expect(url.searchParams.has("vacio")).toBe(false);
      expect(url.searchParams.has("ausente")).toBe(false);
      expect(url.searchParams.has("nulo")).toBe(false);
    });

    it("rechaza endpoints que no sean rutas relativas", () => {
      expect(() => buildUrl("https://otro-host.example/api", undefined, "https://api.example.com")).toThrow(
        "El endpoint debe ser una ruta relativa"
      );
      expect(() => buildUrl("//otro-host.example/api", undefined, "https://api.example.com")).toThrow(
        "El endpoint debe ser una ruta relativa"
      );
    });
  });

  describe("Contrato congelado BackendErrorResponse", () => {
    it("debe parsear y normalizar un ErrorResponse conforme al contrato oficial", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          message: "Stock insuficiente para la tienda seleccionada.",
          error: "INSUFFICIENT_STOCK",
          code: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

      const parsed = await readErrorBody(mockResponse);

      expect(parsed).toEqual({
        message: "Stock insuficiente para la tienda seleccionada.",
        error: "INSUFFICIENT_STOCK",
        code: 400,
      });
    });

    it("debe conservar 'status' y 'detalle' del cuerpo para la detección de 429/422", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          status: 429,
          detalle: { code: 429, msg: "email rate limit exceeded" },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );

      const parsed = await readErrorBody(mockResponse);

      expect(parsed?.status).toBe(429);
      expect(parsed?.detalle).toEqual({ code: 429, msg: "email rate limit exceeded" });
    });

    it("debe priorizar el campo 'message' humano sobre el detalle técnico 'error'", () => {
      const contractError: BackendErrorResponse = {
        message: "El nombre del producto ya existe.",
        error: "duplicate key value violates unique constraint",
        code: 409,
      };

      const resolved = pickContractMessage(contractError);
      expect(resolved).toBe("El nombre del producto ya existe.");
    });

    it("no debe usar el campo técnico 'error' como texto para el usuario", () => {
      const contractError: BackendErrorResponse = {
        error: "JWT expired or signature invalid",
        code: 401,
      };

      expect(pickContractMessage(contractError)).toBe("");
    });

    it("debe encapsular respuestas de texto plano bajo el contrato estándar sin romper el parseo", async () => {
      const plainTextResponse = new Response("Bad Gateway from upstream proxy", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });

      const parsed = await readErrorBody(plainTextResponse);

      expect(parsed).toEqual({ error: "Bad Gateway from upstream proxy" });
      // `code` es del proveedor: no se rellena con el HTTP.
      expect(parsed?.code).toBeUndefined();
      // El texto plano es diagnóstico, no se muestra al usuario.
      expect(pickContractMessage(parsed)).toBe("");
    });

    it("debe retornar null cuando el cuerpo de la respuesta está vacío (ej. 401 sin body)", async () => {
      const emptyResponse = new Response("", { status: 401 });
      const parsed = await readErrorBody(emptyResponse);
      expect(parsed).toBeNull();
      expect(pickContractMessage(parsed)).toBe("");
    });
  });

  describe("Instanciación de ApiError con campos de contrato", () => {
    it("debe poblar status, code, technicalError y data de manera tipada", () => {
      const contract: BackendErrorResponse = {
        message: "Acceso denegado a la tienda",
        error: "STORE_ACCESS_DENIED",
        code: 403,
      };

      const error = new ApiError(403, "Acceso denegado a la tienda", contract);

      expect(error.status).toBe(403);
      expect(error.code).toBe(403);
      expect(error.technicalError).toBe("STORE_ACCESS_DENIED");
      expect(error.data).toEqual(contract);
      expect(error.message).toBe("Acceso denegado a la tienda");
    });
  });

  describe("apiFetch con manejo de respuestas y errores", () => {
    it("usa buildUrl y envía el token en Authorization", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ resultado: "ok" }),
      } as Response);

      await apiFetch("actuator/health", {
        fallback: "Error genérico",
        query: { pagina: 0, activa: false },
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      const [requestedUrl, requestInit] = fetchMock.mock.calls[0];
      const baseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
      const url = new URL(String(requestedUrl), baseUrl || "https://api.example.com");
      expect(`${url.origin}${url.pathname}`).toBe(
        `${baseUrl || "https://api.example.com"}/actuator/health`
      );
      expect(url.searchParams.get("pagina")).toBe("0");
      expect(url.searchParams.get("activa")).toBe("false");
      expect(requestInit?.headers).toMatchObject({ Authorization: "Bearer mock-valid-jwt" });
    });

    it("debe resolver exitosamente peticiones con código 200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ resultado: "ok", id: 10 }),
      } as Response);

      const data = await apiFetch<{ resultado: string; id: number }>("/api/test", {
        fallback: "Error genérico",
      });

      expect(data).toEqual({ resultado: "ok", id: 10 });
    });

    it("debe devolver undefined para respuestas con código 204 No Content", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      const data = await apiFetch<void>("/api/test/delete", {
        method: "DELETE",
        fallback: "Error al eliminar",
      });

      expect(data).toBeUndefined();
    });

    it("debe lanzar ApiError con traducción de dominio personalizada cuando coincide un needle", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            message: "Stock insuficiente para cubrir la venta",
            error: "STOCK_ERR",
          }),
      } as Response);

      await expect(
        apiFetch("/api/test/venta", {
          method: "POST",
          fallback: "Error al registrar",
          errors: [["Stock insuficiente", "No hay unidades disponibles en inventario."]],
        })
      ).rejects.toThrow("No hay unidades disponibles en inventario.");
    });

    it("debe aplicar el mensaje de forbidden personalizado ante un error 403", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: "Access Denied" }),
      } as Response);

      await expect(
        apiFetch("/api/tiendas/2/ventas", {
          method: "POST",
          fallback: "Fallo de autorización",
          forbidden: "Solo el encargado de la tienda o un administrador pueden operar.",
        })
      ).rejects.toThrow("Solo el encargado de la tienda o un administrador pueden operar.");
    });

    it("muestra el 'code' del cuerpo cuando no hay message", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ code: 409, error: "duplicate key value violates unique constraint" }),
      } as Response);

      await expect(apiFetch("/api/productos", { method: "POST", fallback: "Error al crear" })).rejects.toThrow(
        "Código de error: 409"
      );
    });

    it("usa el 'status' del cuerpo (formato Spring por defecto) si no hay message ni code", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () =>
          JSON.stringify({
            timestamp: "2026-10-22T10:00:00",
            status: 503,
            error: "Service Unavailable",
            path: "/api/tiendas",
          }),
      } as Response);

      await expect(apiFetch("/api/tiendas", { fallback: "Error al consultar" })).rejects.toThrow(
        "Código de error: 503"
      );
    });

    it("usa el status HTTP cuando no hay message, ni code, ni status en el cuerpo", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      } as Response);

      await expect(apiFetch("/api/tiendas", { fallback: "Error al consultar" })).rejects.toThrow(
        "Código de error: 502"
      );
    });

    it("usa el fallback ante un fallo de red, donde no existe status", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network down"));

      await expect(apiFetch("/api/tiendas", { fallback: "No hay conexión con el servidor" })).rejects.toThrow(
        "No hay conexión con el servidor"
      );
    });
  });
});
