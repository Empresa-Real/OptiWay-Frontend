import { useState, useEffect } from "react";
import type { Asignacion, User, Store, DC } from "../../types";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import {
  getUsuarios,
  createUsuario,
  updateRolUsuario,
  deleteUsuario,
} from "../../services/usuarios";
import { cleanErrorMessage } from "../../services/http";
import { getTiendas, asignarEncargadoTienda } from "../../services/tiendas";
import { getCentrosDistribucion, updateEncargadoCentroDistribucion } from "../../services/centrosDistribucion";

export default function UsersPanel({
  stores: initialStores,
  dcs: initialDCs,
  users: initialUsers,
  onUpdateUsers,
}: {
  stores: Store[];
  dcs: DC[];
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [localStores, setLocalStores] = useState<Store[]>(initialStores || []);
  const [localDCs, setLocalDCs] = useState<DC[]>(initialDCs || []);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<User | null>(null);
  const [showEditRole, setShowEditRole] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "store" as User["role"] });
  const [assignForm, setAssignForm] = useState({ targetId: "" });
  const [roleForm, setRoleForm] = useState<User["role"]>("store");

  // Sincronizar si cambian los props (sin condicionar a length > 0: una lista
  // vacía es un estado válido y antes dejaba datos viejos en pantalla)
  useEffect(() => {
    setLocalStores(initialStores ?? []);
  }, [initialStores]);

  useEffect(() => {
    setLocalDCs(initialDCs ?? []);
  }, [initialDCs]);

  // Cerrar el popup de gestión si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const dataUsers = await getUsuarios();

      setUsers(dataUsers);
      onUpdateUsers(dataUsers);
    } catch (err: any) {
      console.error("Error al consultar usuarios:", err?.data || err);
      setGeneralError(err?.message || "No se pudieron consultar los usuarios desde el backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Las listas de tiendas/CD solo hacen falta al abrir el modal de asignación,
  // no para pintar la tabla.
  useEffect(() => {
    if (!showAssign) return;

    if (showAssign.role === "store" && localStores.length === 0) {
      getTiendas()
        .then(setLocalStores)
        .catch((err) => setAssignError(err?.message || "No se pudieron cargar las tiendas."));
    }

    if (showAssign.role === "dc" && localDCs.length === 0) {
      getCentrosDistribucion()
        .then(setLocalDCs)
        .catch((err) => setAssignError(err?.message || "No se pudieron cargar los centros de distribución."));
    }
  }, [showAssign]);

  const renderLocationCell = (u: User) => {
    if (u.role === "admin" || u.role === "planner") {
      return <span className="text-[var(--text-muted)] text-xs">—</span>;
    }

    const asignacion = u.asignacion;
    if (!asignacion) {
      return <span className="text-slate-400 text-xs italic">Sin asignación</span>;
    }

    const nombre = asignacion.nombre ?? `#${asignacion.id}`;

    if (asignacion.tipo === "tienda") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          🏪 <span>{nombre}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
        📦 <span>{nombre}</span>
      </span>
    );
  };

  const roleBadge = (r: User["role"]) => {
    const map: Record<User["role"], { v: "info" | "success" | "warning" | "neutral"; l: string }> = {
      admin: { v: "info", l: "Administrador" },
      store: { v: "success", l: "Enc. tienda" },
      dc: { v: "warning", l: "Enc. CD" },
      planner: { v: "neutral", l: "Planificador" },
    };
    return <Badge variant={map[r]?.v || "neutral"}>{map[r]?.l || r}</Badge>;
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) return;

    setSubmitting(true);
    setCreateError(null);

    try {
      const created = await createUsuario({
        nombre: form.name,
        email: form.email,
        role: form.role,
      });

      const updated = [created, ...users];
      setUsers(updated);
      onUpdateUsers(updated);
      setForm({ name: "", email: "", role: "store" });
      setShowCreate(false);
      setSuccessMessage("Usuario creado e invitado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al crear usuario:", err?.data || err);
      setCreateError(err?.message || "No se pudo registrar el usuario en el backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const nombreUbicacion = (id: number, esTienda: boolean) =>
    esTienda ? localStores.find((s) => s.id === id)?.name : localDCs.find((d) => d.id === id)?.name;

  const handleAssign = async () => {
    if (!showAssign) return;

    const esTienda = showAssign.role === "store";
    const targetId = assignForm.targetId ? Number(assignForm.targetId) : null;
    const anterior = showAssign.asignacion;

    setAssigning(true);
    setAssignError(null);

    try {
      // 1. Asignar la nueva ubicación PRIMERO: si falla, el usuario conserva la anterior.
      if (targetId) {
        if (esTienda) await asignarEncargadoTienda(targetId, showAssign.id);
        else await updateEncargadoCentroDistribucion(targetId, showAssign.id);
      }

      // 2. Recién entonces liberar la anterior, para no dejarlo nunca sin ubicación.
      if (anterior && anterior.id !== targetId) {
        if (anterior.tipo === "tienda") await asignarEncargadoTienda(anterior.id, null);
        else await updateEncargadoCentroDistribucion(anterior.id, "");
      }

      const nuevaAsignacion: Asignacion | null = targetId
        ? { tipo: esTienda ? "tienda" : "cd", id: targetId, nombre: nombreUbicacion(targetId, esTienda) }
        : null;

      // 3. Refrescar las listas locales que usa el modal
      if (esTienda) {
        setLocalStores((prev) =>
          prev.map((s) => {
            if (s.id === targetId) return { ...s, encargadoId: showAssign.id };
            if (s.encargadoId != null && Number(s.encargadoId) === Number(showAssign.id)) return { ...s, encargadoId: null };
            return s;
          })
        );
      } else {
        setLocalDCs((prev) =>
          prev.map((d) => {
            if (d.id === targetId) return { ...d, encargadoId: showAssign.id };
            if (d.encargadoId != null && Number(d.encargadoId) === Number(showAssign.id)) return { ...d, encargadoId: undefined };
            return d;
          })
        );
      }

      // 4. Actualizar usuario en lista local y global
      const newUsers = users.map((u) => (u.id === showAssign.id ? { ...u, asignacion: nuevaAsignacion } : u));
      setUsers(newUsers);
      onUpdateUsers(newUsers);
      setShowAssign(null);
      setSuccessMessage("Asignación guardada en el backend correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al asignar ubicación en el servidor:", err?.data || err);
      setAssignError(err?.message || "No se pudo guardar la asignación en el servidor.");
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    // Protección estricta: un admin no puede ser eliminado
    if (!showDelete || showDelete.role === "admin") return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteUsuario(showDelete.id);
      const newUsers = users.filter((u) => u.id !== showDelete.id);
      setUsers(newUsers);
      onUpdateUsers(newUsers);
      setShowDelete(null);
      setSuccessMessage("Usuario eliminado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err?.data || err);
      setDeleteError(err?.message || "No se pudo eliminar el usuario.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateRoleConfirm = async () => {
    // Protección estricta: no se puede alterar el rol de un admin
    if (!showEditRole || showEditRole.role === "admin") return;

    setUpdatingRole(true);
    setRoleError(null);

    try {
      await updateRolUsuario(showEditRole.id, roleForm);
      const newUsers = users.map((u) =>
        u.id === showEditRole.id ? { ...u, role: roleForm } : u
      );
      setUsers(newUsers);
      onUpdateUsers(newUsers);
      setShowEditRole(null);
      setSuccessMessage("Rol de usuario actualizado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al actualizar rol:", err?.data || err);
      setRoleError(err?.message || "No se pudo actualizar el rol.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const renderErrorBox = (message: string | null) => {
    if (!message) return null;
    const clean = cleanErrorMessage(message);
    return (
      <div className="flex items-start gap-2.5 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3.5 py-2.5 border border-red-200">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <span className="font-medium leading-relaxed">{clean}</span>
      </div>
    );
  };

  const rows = users.map((u) => [
    <span className="font-medium">{u.name}</span>,
    <span className="text-[var(--text-muted)]">{u.email}</span>,
    roleBadge(u.role),
    renderLocationCell(u),
    <Badge variant={u.status === "active" ? "success" : "neutral"}>
      {u.status === "active" ? "Activo" : "Inactivo"}
    </Badge>,
    <div
      className="relative inline-block text-left"
      key={u.id}
      onClick={(e) => e.stopPropagation()}
    >
      <Btn
        size="sm"
        variant="secondary"
        onClick={() => {
          setOpenMenuId(openMenuId === u.id ? null : u.id);
        }}
        className="flex items-center gap-1.5 font-medium whitespace-nowrap"
      >
        <span>Gestionar usuario</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-150 ${openMenuId === u.id ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </Btn>

      {/* Popup desplegable con las opciones permitidas */}
      {openMenuId === u.id && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1.5 w-52 rounded-lg shadow-xl border border-[var(--border)] z-50 py-1 bg-white"
        >
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {u.name}
          </div>

          {/* Regla: Administrador es inmutable, no se puede cambiar rol ni eliminar */}
          {u.role === "admin" ? (
            <div className="px-3.5 py-2.5 text-xs text-amber-700 bg-amber-50/60 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span>Administrador protegido</span>
            </div>
          ) : (
            <>
              {/* Opción 1: Cambiar rol (no disponible para admin) */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setShowEditRole(u);
                  // Si el usuario tenía store, poner store por defecto sin admin
                  setRoleForm(u.role === "admin" ? "store" : u.role);
                  setRoleError(null);
                }}
                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6m3-3h-6" />
                </svg>
                <span>Cambiar rol</span>
              </button>

              {/* Opción 2: Asignar ubicación (estrictamente filtrada por rol: tienda solo tiendas, CD solo CD) */}
              {(u.role === "store" || u.role === "dc") && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null);
                    setShowAssign(u);
                    setAssignForm({ targetId: u.asignacion ? String(u.asignacion.id) : "" });
                    setAssignError(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{u.role === "store" ? "Asignar tienda" : "Asignar centro de dist."}</span>
                </button>
              )}

              <div className="border-t border-gray-100 my-1" />

              {/* Opción 3: Eliminar usuario (nunca permitido para admin) */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setShowDelete(u);
                  setDeleteError(null);
                }}
                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                <span>Eliminar usuario</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>,
  ]);

  return (
    <div>
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 bg-[var(--success-light)] text-[var(--success)] text-sm px-4 py-2.5 rounded-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {successMessage}
        </div>
      )}

      {generalError && (
        <div className="mb-4">
          {renderErrorBox(generalError)}
        </div>
      )}

      <SectionHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="md" onClick={loadData} disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </Btn>
            <Btn size="md" onClick={() => { setShowCreate(true); setCreateError(null); }}>
              + Crear usuario
            </Btn>
          </div>
        }
      />
      <Card>
        {loading && users.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            Cargando usuarios desde el servidor...
          </div>
        ) : (
          <Table headers={["Nombre", "Correo", "Rol", "Ubicación", "Estado", "Acciones"]} rows={rows} />
        )}
      </Card>

      {/* Modal Crear Usuario */}
      {showCreate && (
        <Modal title="Crear usuario" onClose={() => !submitting && setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                placeholder="Ej. Laura Martínez"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="correo@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
                disabled={submitting}
              >
                <option value="admin">Administrador</option>
                <option value="store">Encargado de tienda</option>
                <option value="dc">Encargado de CD</option>
                <option value="planner">Planificador</option>
              </Select>
            </div>

            {renderErrorBox(createError)}

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate} disabled={submitting}>
                {submitting ? "Guardando..." : "Crear usuario"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)} disabled={submitting}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cambiar Rol */}
      {showEditRole && (
        <Modal title={`Cambiar rol — ${showEditRole.name}`} onClose={() => !updatingRole && setShowEditRole(null)}>
          <div className="space-y-4">
            <div>
              <Label>Nuevo rol en el sistema</Label>
              <Select
                value={roleForm}
                onChange={(e) => setRoleForm(e.target.value as User["role"])}
                disabled={updatingRole}
              >
                <option value="store">Encargado de tienda</option>
                <option value="dc">Encargado de CD</option>
                <option value="planner">Planificador</option>
              </Select>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Por seguridad del sistema, no se puede otorgar el rol de Administrador.
              </p>
            </div>

            {renderErrorBox(roleError)}

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleUpdateRoleConfirm} disabled={updatingRole}>
                {updatingRole ? "Actualizando..." : "Guardar rol"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowEditRole(null)} disabled={updatingRole}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Asignar Ubicación */}
      {showAssign && (
        <Modal
          title={
            showAssign.role === "store"
              ? `Asignar tienda — ${showAssign.name}`
              : `Asignar centro de distribución — ${showAssign.name}`
          }
          onClose={() => !assigning && setShowAssign(null)}
        >
          <div className="space-y-4">
            <div>
              <Label>
                {showAssign.role === "store" ? "Tienda asignada" : "Centro de distribución"}
              </Label>
              <Select
                value={assignForm.targetId}
                onChange={(e) => setAssignForm({ targetId: e.target.value })}
                disabled={assigning}
              >
                <option value="">
                  {showAssign.role === "store" ? "Sin tienda asignada" : "Sin centro de distribución"}
                </option>
                {showAssign.role === "store" && (
                  <optgroup label="Tiendas disponibles">
                    {localStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.city}
                      </option>
                    ))}
                  </optgroup>
                )}
                {showAssign.role === "dc" && (
                  <optgroup label="Centros de distribución disponibles">
                    {localDCs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.address}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </div>

            {renderErrorBox(assignError)}

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleAssign} disabled={assigning}>
                {assigning ? "Guardando..." : "Guardar asignación"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowAssign(null)} disabled={assigning}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar Usuario */}
      {showDelete && (
        <Modal title="Eliminar usuario" onClose={() => !deleting && setShowDelete(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              ¿Estás seguro de eliminar permanentemente a <strong className="text-[var(--text)]">{showDelete.name}</strong> ({showDelete.email})?
              Esta acción llamará a <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">DELETE /api/usuarios/{showDelete.id}</code> en el backend.
            </p>

            {renderErrorBox(deleteError)}

            <div className="flex gap-2 pt-1">
              <Btn
                variant="primary"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-[var(--danger)] hover:bg-red-700"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowDelete(null)} disabled={deleting}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}