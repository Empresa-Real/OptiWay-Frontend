import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapFrontendRoleToBackend,
  cleanErrorMessage,
  createUsuario,
  getUsuarios,
  getUsuarioById,
  updateRolUsuario,
  deleteUsuario,
  ApiError,
} from "../usuarios";
import { mapBackendRoleToFrontend } from "../auth";
import { supabase } from "../supabase";

describe("Servicio de Usuarios (usuarios.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Simular sesión activa de Supabase por defecto
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: {
        session: {
          access_token: "mock-jwt-token-12345",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: { id: "user-uuid-1", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" },
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Mapeo de Roles", () => {
    it("debe mapear correctamente roles de frontend a backend", () => {
      expect(mapFrontendRoleToBackend("admin")).toBe("ADMINISTRADOR");
      expect(mapFrontendRoleToBackend("store")).toBe("ENCARGADO_TIENDA");
      expect(mapFrontendRoleToBackend("dc")).toBe("ENCARGADO_CD");
      expect(mapFrontendRoleToBackend("planner")).toBe("PLANIFICADOR");
    });

    it("debe mapear correctamente roles de backend a frontend", () => {
      expect(mapBackendRoleToFrontend("ADMINISTRADOR")).toBe("admin");
      expect(mapBackendRoleToFrontend("ENCARGADO_TIENDA")).toBe("store");
      expect(mapBackendRoleToFrontend("ENCARGADO_CD")).toBe("dc");
      expect(mapBackendRoleToFrontend("PLANIFICADOR")).toBe("planner");
    });
  });

  describe("Sanitización y Limpieza de Errores (cleanErrorMessage)", () => {
    it("debe traducir el error de límite de correos (429) de Supabase Auth a un mensaje amigable", () => {
      const rawError =
        'Error de Supabase Auth (429 TOO_MANY_REQUESTS): {"code":429,"error_code":"over_email_send_rate_limit","msg":"email rate limit exceeded"}';

      const cleaned = cleanErrorMessage(rawError);

      expect(cleaned).toContain("límite de correos de invitación");
      expect(cleaned).not.toContain("{");
      expect(cleaned).not.toContain("}");
      expect(cleaned).not.toContain("429 TOO_MANY_REQUESTS");
    });

    it("debe extraer mensajes legibles cuando el backend devuelve JSON incrustado", () => {
      const jsonError = 'Error del servidor: {"error": "El correo ya está registrado en el sistema"}';
      const cleaned = cleanErrorMessage(jsonError);

      expect(cleaned).toBe("El correo electrónico ya se encuentra registrado en el sistema.");
      expect(cleaned).not.toContain("{");
      expect(cleaned).not.toContain("}");
    });

    it("debe retornar mensaje amigable para 409 (Conflicto / Duplicado)", () => {
      const cleaned = cleanErrorMessage("", 409);
      expect(cleaned).toBe("El correo electrónico ya se encuentra registrado en el sistema.");
    });

    it("debe retornar mensaje amigable para 403 (Acceso Denegado)", () => {
      const cleaned = cleanErrorMessage("", 403);
      expect(cleaned).toBe("No tienes permisos de administrador para realizar esta operación.");
    });

    it("debe procesar el nuevo formato estructurado del backend con 'detalle' y 'status'", () => {
      const backendError = {
        error: "Error de respuesta en Supabase Auth",
        status: 429,
        detalle: {
          code: 429,
          error_code: "over_email_send_rate_limit",
          msg: "email rate limit exceeded",
        },
      };

      const cleaned = cleanErrorMessage(backendError.error, 502, backendError);

      expect(cleaned).toBe(
        "Se ha superado el límite de correos de invitación por hora de Supabase Auth. Por favor espera unos minutos antes de registrar otro usuario."
      );
      expect(cleaned).not.toContain("{");
      expect(cleaned).not.toContain("}");
    });

    it("debe traducir validaciones de campos del backend (nombre, email, rol)", () => {
      expect(cleanErrorMessage("El nombre del usuario no puede estar vacio")).toBe(
        "El nombre del usuario no puede estar vacío."
      );
      expect(cleanErrorMessage("El email del usuario no puede estar vacio")).toBe(
        "El correo electrónico del usuario no puede estar vacío."
      );
      expect(cleanErrorMessage("El rol no es valido")).toBe("El rol seleccionado no es válido.");
      expect(cleanErrorMessage("El correo ya esta registrado")).toBe(
        "El correo electrónico ya se encuentra registrado en el sistema."
      );
    });
  });

  describe("Creación de Usuario (createUsuario)", () => {
    it("debe crear un usuario exitosamente cuando el backend responde 201 Created", async () => {
      const mockBackendResponse = {
        id: 10,
        authUserId: "auth-uuid-test",
        nombre: "Carlos Gómez",
        email: "carlos@empresa.com",
        rol: "ENCARGADO_TIENDA",
        creadoPor: "admin-uuid",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockBackendResponse,
      } as Response);

      const result = await createUsuario({
        nombre: "Carlos Gómez",
        email: "carlos@empresa.com",
        role: "store",
      });

      expect(result).toEqual({
        id: 10,
        name: "Carlos Gómez",
        email: "carlos@empresa.com",
        role: "store",
        locationId: null,
        status: "active",
      });

      // Verificar que fetch se llamó con el payload correcto
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usuarios"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token-12345",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            nombre: "Carlos Gómez",
            email: "carlos@empresa.com",
            rol: "ENCARGADO_TIENDA",
          }),
        })
      );
    });

    it("debe lanzar ApiError con mensaje limpio si el backend responde con error de límite de Supabase (429)", async () => {
      const errorJson = {
        error:
          'Error de Supabase Auth (429 TOO_MANY_REQUESTS): {"code":429,"error_code":"over_email_send_rate_limit","msg":"email rate limit exceeded"}',
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        text: async () => JSON.stringify(errorJson),
      } as Response);

      await expect(
        createUsuario({
          nombre: "Nuevo Usuario",
          email: "nuevo@empresa.com",
          role: "dc",
        })
      ).rejects.toThrow(/límite de correos de invitación/i);
    });

    it("debe lanzar ApiError amigable si el correo ya existe (409)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        text: async () => JSON.stringify({ error: "El correo ya existe" }),
      } as Response);

      await expect(
        createUsuario({
          nombre: "Duplicado",
          email: "admin@empresa.com",
          role: "admin",
        })
      ).rejects.toThrow(/correo electrónico ya se encuentra registrado/i);
    });
  });

  describe("Consulta de Usuarios (getUsuarios y getUsuarioById)", () => {
    it("debe listar los usuarios correctamente", async () => {
      const mockList = [
        { id: 1, authUserId: "uuid-1", nombre: "Admin", email: "admin@empresa.com", rol: "ADMINISTRADOR" },
        { id: 2, authUserId: "uuid-2", nombre: "Tienda 1", email: "tienda1@empresa.com", rol: "ENCARGADO_TIENDA" },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockList,
      } as Response);

      const usuarios = await getUsuarios();

      expect(usuarios).toHaveLength(2);
      expect(usuarios[0].role).toBe("admin");
      expect(usuarios[1].role).toBe("store");
    });

    it("debe consultar un usuario por su ID", async () => {
      const mockUsuario = {
        id: 5,
        authUserId: "uuid-5",
        nombre: "Laura CD",
        email: "laura@empresa.com",
        rol: "ENCARGADO_CD",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUsuario,
      } as Response);

      const usuario = await getUsuarioById(5);

      expect(usuario.id).toBe(5);
      expect(usuario.nombre).toBe("Laura CD");
      expect(usuario.rol).toBe("ENCARGADO_CD");
    });
  });

  describe("Actualización de Rol (updateRolUsuario)", () => {
    it("debe llamar a PATCH /api/usuarios/:id/rol y actualizar el rol", async () => {
      const mockUpdated = {
        id: 2,
        authUserId: "uuid-2",
        nombre: "Carlos",
        email: "carlos@empresa.com",
        rol: "PLANIFICADOR",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUpdated,
      } as Response);

      const res = await updateRolUsuario(2, "planner");

      expect(res.rol).toBe("PLANIFICADOR");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usuarios/2/rol"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ rol: "PLANIFICADOR" }),
        })
      );
    });
  });

  describe("Eliminación de Usuario (deleteUsuario)", () => {
    it("debe llamar a DELETE /api/usuarios/:id con el token de autorización", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      await expect(deleteUsuario(3)).resolves.not.toThrow();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usuarios/3"),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token-12345",
          }),
        })
      );
    });
  });
});
