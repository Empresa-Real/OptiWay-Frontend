import { useState } from "react";
import type { DC, Store } from "../../types";
import { seedDCs, seedStores } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

export default function DCsPanel({ stores }: { stores: Store[] }) {
  const [dcs, setDCs] = useState<DC[]>(seedDCs);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", capacity: "", coverage: [] as number[] });

  const handleCreate = () => {
    if (!form.name) return;
    setDCs((prev) => [...prev, { id: Date.now(), name: form.name, address: form.address, capacity: Number(form.capacity), coverage: form.coverage, status: "active" }]);
    setForm({ name: "", address: "", capacity: "", coverage: [] });
    setShowCreate(false);
  };

  const toggleCoverage = (id: number) => {
    setForm((f) => ({
      ...f,
      coverage: f.coverage.includes(id) ? f.coverage.filter((x) => x !== id) : [...f.coverage, id],
    }));
  };

  const coverageNames = (ids: number[]) =>
    ids.map((id) => stores.find((s) => s.id === id)?.name ?? "—").join(", ") || "—";

  const rows = dcs.map((d) => [
    <span className="font-medium">{d.name}</span>,
    d.address,
    <span>{d.capacity.toLocaleString()} pzas</span>,
    <span className="text-sm text-[var(--text-muted)]">{coverageNames(d.coverage)}</span>,
    <Badge variant={d.status === "active" ? "success" : "neutral"}>{d.status === "active" ? "Activo" : "Inactivo"}</Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Centros de distribución"
        subtitle="Almacenes y zonas de cobertura"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear CD</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Dirección", "Capacidad", "Cobertura", "Estado"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear centro de distribución" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input placeholder="Ej. CD Sur" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input placeholder="Calle y número" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Capacidad (unidades)</Label>
              <Input type="number" placeholder="5000" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div>
              <Label>Zona de cobertura (tiendas)</Label>
              <div className="space-y-2 mt-1">
                {stores.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.coverage.includes(s.id)}
                      onChange={() => toggleCoverage(s.id)}
                      className="accent-[var(--accent)]"
                    />
                    {s.name} — {s.city}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear CD</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
