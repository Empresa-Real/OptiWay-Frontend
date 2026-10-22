import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Configuración de la suite unitaria (rápida y sin red).
 *
 * Los tests de integración real (`liveBackend.test.ts`) pegan al backend
 * desplegado en Render: si el servicio está dormido tardan ~50 s y fallan por
 * timeout, así que no pueden vivir en `npm test`. Se corren a demanda con
 * `npm run test:live` (ver `vitest.live.config.ts`).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/liveBackend.test.ts"],
  },
});
