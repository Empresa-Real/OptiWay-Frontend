import { describe, it, expect, vi } from "vitest";
import { apiFetch, ApiError } from "../http";

/**
 * Suite de pruebas de integración directa contra el Backend Real de OptiWay desplegado en Render.
 * Esta suite NO mockea fetch; realiza peticiones HTTP reales por la red para validar:
 * 1. Disponibilidad y alcance del backend en vivo.
 * 2. Disponibilidad del esquema OpenAPI 3.0 (/v3/api-docs) y sus rutas críticas.
 * 3. Aplicación real de los filtros de seguridad Spring Security (401 Unauthorized sin token).
 * 4. Integración de extremo a extremo con el cliente apiFetch y el manejo de ApiError.
 *
 * Solo se ejecuta con `npm run test:live`. Está excluida de `npm test` porque depende
 * de la red y de que Render esté despierto (cold start ~50 s).
 */
describe("Integración con Backend Real (Live Endpoints)", () => {
  const BACKEND_URL =
    (import.meta.env.VITE_API_URL || process.env.VITE_API_URL || "https://optiway-backend.onrender.com").replace(
      /\/+$/,
      ""
    );

  it(
    "debe conectar con el backend real y obtener la especificación OpenAPI 3.0 en /v3/api-docs",
    async () => {
      // Usar fetch nativo sin ningún mock
      vi.restoreAllMocks();

      const response = await fetch(`${BACKEND_URL}/v3/api-docs`);
      expect(response.status).toBe(200);

      const contentType = response.headers.get("content-type") || "";
      expect(contentType).toContain("application/json");

      const spec = (await response.json()) as {
        openapi?: string;
        info?: { title?: string };
        paths?: Record<string, unknown>;
      };

      expect(spec.openapi).toMatch(/^3\./);
      expect(spec.info?.title).toContain("OptiWay Backend API");

      // Validar que las rutas del backend coincidan con las que el frontend consume
      expect(spec.paths).toBeDefined();
      expect(spec.paths).toHaveProperty("/api/tiendas");
      expect(spec.paths).toHaveProperty("/api/centros-distribucion");
      expect(spec.paths).toHaveProperty("/api/usuarios/me");
      expect(spec.paths).toHaveProperty("/api/tiendas/{id}/ventas");
    },
    25000
  );

  it(
    "debe rechazar solicitudes no autenticadas con 401 Unauthorized desde el filtro Spring Security real",
    async () => {
      vi.restoreAllMocks();

      const response = await fetch(`${BACKEND_URL}/api/tiendas`);
      // El filtro puede responder 401 (sin credenciales) o 403 (si cambia el entry
      // point de Spring Security); lo que importa es que no devuelva datos.
      expect([401, 403]).toContain(response.status);
    },
    25000
  );

  it(
    "debe capturar el 401 real y lanzar ApiError tipado cuando apiFetch recibe un token inválido",
    async () => {
      vi.restoreAllMocks();

      let caughtError: unknown = null;
      try {
        await apiFetch("/api/tiendas", {
          fallback: "Fallo de conexión",
          token: "token-invalido-de-prueba-real",
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ApiError);
      const apiErr = caughtError as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.name).toBe("ApiError");
    },
    25000
  );
});
