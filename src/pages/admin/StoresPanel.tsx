import { useState } from "react";
import type { Store } from "../../types";
import { seedStores } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

export default function StoresPanel() {
  const [stores, setStores] = useState<Store[]>(seedStores);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "" });

  const handleCreate = () => {
    if (!form.name || !form.city) return;
    setStores((prev) => [...prev, { id: Date.now(), ...form, status: "active" }]);
    setForm({ name: "", address: "", city: "" });
    setShowCreate(false);
  };

  const rows = stores.map((s) => [
    <span className="font-medium">{s.name}</span>,
    s.address,
    s.city,
    <Badge variant={s.status === "active" ? "success" : "neutral"}>{s.status === "active" ? "Activa" : "Inactiva"}</Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Gestión de tiendas"
        subtitle="Sucursales registradas en la red"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear tienda</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Dirección", "Ciudad", "Estado"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear tienda" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la tienda</Label>
              <Input placeholder="Ej. Tienda Guadalajara" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input placeholder="Av. Principal 100" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input placeholder="Ej. Guadalajara" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear tienda</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
