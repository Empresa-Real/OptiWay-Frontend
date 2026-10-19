import { useState, useEffect } from "react";
import type { User, Store, DC } from "../../types";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import {
  getUsuarios,
  createUsuario,
  updateRolUsuario,
  deleteUsuario,
  ApiError,
} from "../../services/usuarios";

interface ErrorDetails {
  message: string;
  data?: Record<string, any> | null;
}

export default function UsersPanel({
  stores,
  dcs,
  users: initialUsers,
  onUpdateUsers,
}: {
  stores: Store[];
  dcs: DC[];
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [createError, setCreateError] = useState<ErrorDetails | null>(null);
  const [deleteError, setDeleteError] = useState<ErrorDetails | null>(null);
  const [roleError, setRoleError] = useState<ErrorDetails | null>(null);
  const [generalError, setGeneralError] = useState<ErrorDetails | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<User | null>(null);
  const [showEditRole, setShowEditRole] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "store" as User["role"] });
  const [assignForm, setAssignForm] = useState({ locationId: "" });
  const [roleForm, setRoleForm] = useState<User["role"]>("store");

  const loadUsers = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const data = await getUsuarios();
      if (data && data.length > 0) {
        setUsers(data);
        onUpdateUsers(data);
      }
    } catch (err: any) {
      console.error("Error al consultar /api/usuarios:", err?.data || err);
      setGeneralError({
        message: err?.message || "No se pudieron consultar los usuarios desde el backend.",
        data: err?.data || null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const locationName = (u: User) => {
    if (!u.locationId) return "—";
    const s = stores.find((x) => x.id === u.locationId);
    if (s) return s.name;
    const d = dcs.find((x) => x.id === u.locationId);
    return d ? d.name : "—";
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
      console.error("Error al crear usuario (JSON devuelto por el servidor):", err?.data || err);
      setCreateError({
        message: err?.message || "No se pudo registrar el usuario en el backend.",
        data: err?.data || (err instanceof ApiError ? err.data : null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = () => {
    if (!showAssign) return;
    const locId = assignForm.locationId ? Number(assignForm.locationId) : null;
    const newUsers = users.map((u) => (u.id === showAssign.id ? { ...u, locationId: locId } : u));
    setUsers(newUsers);
    onUpdateUsers(newUsers);
    setShowAssign(null);
  };

  const handleDeleteConfirm = async () => {
    if (!showDelete) return;

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
      console.error("Error al eliminar usuario (JSON devuelto por el servidor):", err?.data || err);
      setDeleteError({
        message: err?.message || "No se pudo eliminar el usuario.",
        data: err?.data || null,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateRoleConfirm = async () => {
    if (!showEditRole) return;

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
      console.error("Error al actualizar rol (JSON devuelto por el servidor):", err?.data || err);
      setRoleError({
        message: err?.message || "No se pudo actualizar el rol.",
        data: err?.data || null,
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const renderErrorBox = (err: ErrorDetails | null) => {
    if (!err) return null;
    return (
      <div className="space-y-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md p-3 border border-red-200">
        <div className="flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="font-medium">{err.message}</span>
        </div>
        {err.data && (
          <div className="mt-2 pt-2 border-t border-red-200/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-800 block mb-1">
              Respuesta del servidor (JSON):
            </span>
            <pre className="bg-white/90 p-2.5 rounded text-xs overflow-x-auto text-slate-800 font-mono border border-red-200 leading-snug">
              {JSON.stringify(err.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const rows = users.map((u) => [
    <span className="font-medium">{u.name}</span>,
    <span className="text-[var(--text-muted)]">{u.email}</span>,
    roleBadge(u.role),
    locationName(u),
    <Badge variant={u.status === "active" ? "success" : "neutral"}>
      {u.status === "active" ? "Activo" : "Inactivo"}
    </Badge>,
    <div className="flex items-center gap-1.5 flex-wrap">
      <Btn
        size="sm"
        variant="ghost"
        onClick={() => {
          setShowEditRole(u);
          setRoleForm(u.role);
          setRoleError(null);
        }}
      >
        Cambiar rol
      </Btn>
      <Btn
        size="sm"
        variant="ghost"
        onClick={() => {
          setShowAssign(u);
          setAssignForm({ locationId: String(u.locationId ?? "") });
        }}
      >
        Ubicación
      </Btn>
      <Btn
        size="sm"
        variant="ghost"
        onClick={() => {
          setShowDelete(u);
          setDeleteError(null);
        }}
        className="text-[var(--danger)] hover:bg-[var(--danger-light)]"
      >
        Eliminar
      </Btn>
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
            <Btn variant="secondary" size="md" onClick={loadUsers} disabled={loading}>
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
                <option value="admin">Administrador</option>
                <option value="store">Encargado de tienda</option>
                <option value="dc">Encargado de CD</option>
                <option value="planner">Planificador</option>
              </Select>
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
        <Modal title={`Asignar ubicación — ${showAssign.name}`} onClose={() => setShowAssign(null)}>
          <div className="space-y-4">
            <div>
              <Label>Ubicación</Label>
              <Select value={assignForm.locationId} onChange={(e) => setAssignForm({ locationId: e.target.value })}>
                <option value="">Sin ubicación asignada</option>
                <optgroup label="Tiendas">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.city}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Centros de distribución">
                  {dcs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.address}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleAssign}>Guardar asignación</Btn>
              <Btn variant="secondary" onClick={() => setShowAssign(null)}>
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