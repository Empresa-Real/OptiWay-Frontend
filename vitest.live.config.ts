import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Suite de integración contra el backend real.
 * Se ejecuta solo a demanda: `npm run test:live`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["src/services/__tests__/liveBackend.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
