import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapBackendRoleToFrontend,
  mapBackendUserToFrontend,
  fetchUsuarioActual,
  login,
  logout,
  type BackendUsuario,
} from "../auth";
import { supabase } from "../supabase";

describe("Servicio de Autenticación (auth.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mapeo de Usuarios y Roles", () => {
    it("debe mapear correctamente los roles institucionales", () => {
      expect(mapBackendRoleToFrontend("ADMINISTRADOR")).toBe("admin");
      expect(mapBackendRoleToFrontend("ENCARGADO_TIENDA")).toBe("store");
      expect(mapBackendRoleToFrontend("ENCARGADO_CD")).toBe("dc");
      expect(mapBackendRoleToFrontend("PLANIFICADOR")).toBe("planner");
      expect(mapBackendRoleToFrontend("DESCONOCIDO")).toBe("store");
    });

    it("debe transformar un BackendUsuario al modelo User de la UI", () => {
      const backendUser: BackendUsuario = {
        id: 7,
        authUserId: "auth-uuid-test",
        nombre: "Admin Principal",
        email: "admin@empresa.com",
        rol: "ADMINISTRADOR",
      };

      const user = mapBackendUserToFrontend(backendUser);

      expect(user).toEqual({
        id: 7,
        name: "Admin Principal",
        email: "admin@empresa.com",
        role: "admin",
        locationId: 1,
        status: "active",
      });
    });
  });

  describe("Consulta de Usuario Autenticado (fetchUsuarioActual)", () => {
    it("debe obtener el usuario actual mediante GET /api/usuarios/me con el token Bearer", async () => {
      const mockBackendUser: BackendUsuario = {
        id: 4,
        authUserId: "user-uuid-4",
        nombre: "Ana Administradora",
        email: "ana@empresa.com",
        rol: "ADMINISTRADOR",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendUser,
      } as Response);

      const result = await fetchUsuarioActual("fake-token-xyz");

      expect(result).toEqual(mockBackendUser);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usuarios/me"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token-xyz",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("debe lanzar un error descriptivo si el usuario no existe en la base de datos (404)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(fetchUsuarioActual("fake-token-xyz")).rejects.toThrow(
        /no está registrado en el sistema/i
      );
    });
  });

  describe("Flujo de Login y Logout", () => {
    it("debe iniciar sesión exitosamente contra Supabase y vincular el perfil del backend", async () => {
      const mockSession = {
        access_token: "mock-jwt-token",
        refresh_token: "mock-refresh",
      };

      vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
        data: {
          user: { id: "user-1", email: "admin@empresa.com" } as any,
          session: mockSession as any,
        },
        error: null,
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          authUserId: "user-1",
          nombre: "Admin Demo",
          email: "admin@empresa.com",
          rol: "ADMINISTRADOR",
        }),
      } as Response);

      const result = await login("admin@empresa.com", "password123");

      expect(result.success).toBe(true);
      expect(result.user?.role).toBe("admin");
      expect(result.user?.email).toBe("admin@empresa.com");
    });

    it("debe retornar error claro si las credenciales son incorrectas", async () => {
      vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      const result = await login("admin@empresa.com", "wrong-password");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/correo o contraseña incorrectos/i);
    });

    it("debe llamar a signOut al cerrar sesión", async () => {
      const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValueOnce({
        error: null,
      });

      await logout();

      expect(signOutSpy).toHaveBeenCalledTimes(1);
    });
  });
});
