import { useState } from "react";
import type { User, Store, DC } from "../../types";
import { seedUsers, seedStores, seedDCs } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

export default function UsersPanel({ stores, dcs }: { stores: Store[]; dcs: DC[] }) {
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<User | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "store" as User["role"] });
  const [assignForm, setAssignForm] = useState({ locationId: "" });

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
    return <Badge variant={map[r].v}>{map[r].l}</Badge>;
  };

  const handleCreate = () => {
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, email: form.email, role: form.role, locationId: null, status: "active" },
    ]);
    setForm({ name: "", email: "", role: "store" });
    setShowCreate(false);
  };

  const handleAssign = () => {
    if (!showAssign) return;
    const locId = assignForm.locationId ? Number(assignForm.locationId) : null;
    setUsers((prev) => prev.map((u) => (u.id === showAssign.id ? { ...u, locationId: locId } : u)));
    setShowAssign(null);
  };

  const rows = users.map((u) => [
    <span className="font-medium">{u.name}</span>,
    <span className="text-[var(--text-muted)]">{u.email}</span>,
    roleBadge(u.role),
    locationName(u),
    <Badge variant={u.status === "active" ? "success" : "neutral"}>{u.status === "active" ? "Activo" : "Inactivo"}</Badge>,
    <Btn size="sm" variant="ghost" onClick={() => { setShowAssign(u); setAssignForm({ locationId: String(u.locationId ?? "") }); }}>
      Asignar ubicación
    </Btn>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear usuario</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Correo", "Rol", "Ubicación", "Estado", "Acciones"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear usuario" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input placeholder="Ej. Laura Martínez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input type="email" placeholder="correo@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}>
                <option value="admin">Administrador</option>
                <option value="store">Encargado de tienda</option>
                <option value="dc">Encargado de CD</option>
                <option value="planner">Planificador</option>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear usuario</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
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
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
                <optgroup label="Centros de distribución">
                  {dcs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </optgroup>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleAssign}>Guardar asignación</Btn>
              <Btn variant="secondary" onClick={() => setShowAssign(null)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
