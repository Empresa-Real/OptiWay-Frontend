import { useState, useEffect } from "react";
import type { User, Store, DC } from "../../types";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import { getUsuarios, createUsuario } from "../../services/usuarios";

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
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<User | null>(null);
  const [showDeactivate, setShowDeactivate] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "store" as User["role"] });
  const [assignForm, setAssignForm] = useState({ locationId: "" });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      if (data && data.length > 0) {
        setUsers(data);
        onUpdateUsers(data);
      }
    } catch (err: any) {
      console.warn("Aviso al consultar /api/usuarios:", err?.message || err);
      // Mantiene los datos en memoria si la red falla
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
    setError("");

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
      setError(err?.message || "No se pudo registrar el usuario en el backend.");
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

  const handleDeactivateConfirm = () => {
    if (!showDeactivate) return;
    const newUsers = users.map((u) =>
      u.id === showDeactivate.id ? { ...u, status: "inactive" as const } : u
    );
    setUsers(newUsers);
    onUpdateUsers(newUsers);
    setShowDeactivate(null);
    setSuccessMessage("Usuario desactivado");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const rows = users.map((u) => [
    <span className="font-medium">{u.name}</span>,
    <span className="text-[var(--text-muted)]">{u.email}</span>,
    roleBadge(u.role),
    locationName(u),
    <Badge variant={u.status === "active" ? "success" : "neutral"}>
      {u.status === "active" ? "Activo" : "Inactivo"}
    </Badge>,
    <div className="flex items-center gap-2">
      <Btn
        size="sm"
        variant="ghost"
        onClick={() => {
          setShowAssign(u);
          setAssignForm({ locationId: String(u.locationId ?? "") });
        }}
      >
        Asignar ubicación
      </Btn>
      {u.status === "active" ? (
        <Btn
          size="sm"
          variant="ghost"
          onClick={() => setShowDeactivate(u)}
          className="text-[var(--danger)] hover:bg-[var(--danger-light)]"
        >
          Desactivar
        </Btn>
      ) : (
        <span className="text-xs text-[var(--text-muted)] px-3 py-1.5">Inactivo</span>
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
      <SectionHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="md" onClick={loadUsers} disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </Btn>
            <Btn size="md" onClick={() => { setShowCreate(true); setError(""); }}>
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

            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

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

      {showDeactivate && (
        <Modal title="Desactivar usuario" onClose={() => setShowDeactivate(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              ¿Estás seguro de desactivar a <strong className="text-[var(--text)]">{showDeactivate.name}</strong>? El usuario perderá acceso al sistema inmediatamente.
            </p>
            <div className="flex gap-2 pt-1">
              <Btn variant="primary" onClick={handleDeactivateConfirm} className="bg-[var(--danger)] hover:bg-red-700">
                Sí, desactivar
              </Btn>
              <Btn variant="secondary" onClick={() => setShowDeactivate(null)}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}