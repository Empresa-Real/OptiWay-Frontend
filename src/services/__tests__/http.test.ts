import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiFetch,
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

    it("debe utilizar 'error' como alternativa cuando el backend no envía 'message'", () => {
      const contractError: BackendErrorResponse = {
        error: "JWT expired or signature invalid",
        code: 401,
      };

      const resolved = pickContractMessage(contractError);
      expect(resolved).toBe("JWT expired or signature invalid");
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
      expect(pickContractMessage(parsed)).toBe("Bad Gateway from upstream proxy");
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
  });
});
