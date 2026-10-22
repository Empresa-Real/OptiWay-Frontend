import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapBackendRoleToFrontend,
  mapBackendUserToFrontend,
  mapBackendAsignacion,
  fetchUsuarioActual,
  login,
  logout,
  updatePassword,
  extractAuthTokens,
  type BackendUsuario,
} from "../auth";
import { supabase } from "../supabase";

describe("Servicio de Autenticación (auth.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).window = {
      location: {
        hash: "",
        search: "",
        pathname: "/",
      },
      history: {
        replaceState: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).window;
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
        asignacion: null,
        status: "active",
      });
    });

    it("debe mapear la asignación a tienda que envía el backend", () => {
      const backendUser: BackendUsuario = {
        id: 12,
        authUserId: "uuid-12",
        nombre: "Ana Torres",
        email: "ana@empresa.com",
        rol: "ENCARGADO_TIENDA",
        asignacion: { tipo: "TIENDA", id: 3, nombre: "Sucursal Centro" },
      };

      expect(mapBackendUserToFrontend(backendUser)).toEqual({
        id: 12,
        name: "Ana Torres",
        email: "ana@empresa.com",
        role: "store",
        asignacion: { tipo: "tienda", id: 3, nombre: "Sucursal Centro" },
        status: "active",
      });
    });

    it("debe mapear la asignación a centro de distribución", () => {
      const backendUser: BackendUsuario = {
        id: 20,
        authUserId: "uuid-20",
        nombre: "Luis Prado",
        email: "luis@empresa.com",
        rol: "ENCARGADO_CD",
        asignacion: { tipo: "CD", id: 8, nombre: "CD Norte" },
      };

      expect(mapBackendUserToFrontend(backendUser).asignacion).toEqual({
        tipo: "cd",
        id: 8,
        nombre: "CD Norte",
      });
    });

    it("debe devolver asignación null si el backend no envía el campo o el tipo es desconocido", () => {
      const sinCampo: BackendUsuario = {
        id: 30,
        authUserId: "uuid-30",
        nombre: "Sin Asignar",
        email: "sin@empresa.com",
        rol: "ENCARGADO_TIENDA",
      };
      const tipoRaro: BackendUsuario = {
        ...sinCampo,
        asignacion: { tipo: "BODEGA", id: 1 },
      };

      expect(mapBackendAsignacion(sinCampo.asignacion)).toBeNull();
      expect(mapBackendAsignacion(tipoRaro.asignacion)).toBeNull();
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

  describe("Flujo de Configuración de Contraseña (updatePassword & extractAuthTokens)", () => {
    it("debe extraer tokens del hash correctamente", () => {
      window.location.hash = "#access_token=jwt-token-123&refresh_token=refresh-456&type=invite";

      const tokens = extractAuthTokens();

      expect(tokens.accessToken).toBe("jwt-token-123");
      expect(tokens.refreshToken).toBe("refresh-456");
      expect(tokens.type).toBe("invite");
      expect(tokens.errorCode).toBeNull();
    });

    it("debe extraer código y descripción de error del hash si el token expiró", () => {
      window.location.hash = "#error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

      const tokens = extractAuthTokens();

      expect(tokens.errorCode).toBe("otp_expired");
      expect(tokens.errorDescription).toBe("Email link is invalid or has expired");
    });

    it("debe abortar updatePassword si el enlace ya llegó con error o expirado", async () => {
      window.location.hash = "#error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

      const result = await updatePassword("NuevaPass123*");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Email link is invalid or has expired/i);
    });

    it("debe llamar a setSession primero si los tokens están en el hash y luego a updateUser", async () => {
      window.location.hash = "#access_token=token-hash&refresh_token=refresh-hash&type=invite";

      const setSessionSpy = vi.spyOn(supabase.auth, "setSession").mockResolvedValueOnce({
        data: { session: { access_token: "token-hash" } as any, user: null },
        error: null,
      });

      vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({
        data: { session: { access_token: "token-hash" } as any },
        error: null,
      });

      const updateUserSpy = vi.spyOn(supabase.auth, "updateUser").mockResolvedValueOnce({
        data: { user: { id: "user-test-id" } as any },
        error: null,
      });

      const result = await updatePassword("NuevaPasswordSegura123*");

      expect(result.success).toBe(true);
      expect(setSessionSpy).toHaveBeenCalledWith({
        access_token: "token-hash",
        refresh_token: "refresh-hash",
      });
      expect(updateUserSpy).toHaveBeenCalledWith({ password: "NuevaPasswordSegura123*" });
      expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/");
    });

    it("debe retornar error si no existe una sesión activa ni tokens en la URL", async () => {
      window.location.hash = "";

      vi.spyOn(supabase.auth, "getSession").mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await updatePassword("Password123*");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/el enlace no es válido o ya ha expirado/i);
    });
  });
});
