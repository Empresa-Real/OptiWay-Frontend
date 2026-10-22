import { useState, useEffect } from "react";
import type { DC, Store } from "../../types";
import {
  getCentrosDistribucion,
  createCentroDistribucion,
  updateEncargadoCentroDistribucion,
} from "../../services/centrosDistribucion";
import { Badge, Btn, Input, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

export default function DCsPanel({ stores }: { stores: Store[] }) {
  const [dcs, setDCs] = useState<DC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [form, setForm] = useState<{ name: string; address: string; capacity: string; coverage: number[] }>({
    name: "",
    address: "",
    capacity: "",
    coverage: [],
  });

  useEffect(() => {
    loadDCs();
  }, []);

  const loadDCs = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getCentrosDistribucion();
      setDCs(data);
    } catch (error) {
      console.warn("No se pudieron cargar los centros de distribución:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!form.name) return;

    const newDC = await createCentroDistribucion({
      name: form.name,
      address: form.address,
      capacity: Number(form.capacity),
      coverage: form.coverage,
    });

    setDCs((prev: DC[]) => [...prev, newDC]);
    setForm({ name: "", address: "", capacity: "", coverage: [] });
    setShowCreate(false);
  };

  const handleAssignEncargado = async (dcId: number, encargadoId: number): Promise<void> => {
    const updatedDC = await updateEncargadoCentroDistribucion(dcId, encargadoId);
    setDCs((prev: DC[]) => prev.map((d: DC) => (d.id === dcId ? updatedDC : d)));
  };

  const toggleCoverage = (id: number): void => {
    setForm((f) => ({
      ...f,
      coverage: f.coverage.includes(id) ? f.coverage.filter((x: number) => x !== id) : [...f.coverage, id],
    }));
  };

  const coverageNames = (ids: number[]): string =>
    ids.map((id: number) => stores.find((s: Store) => s.id === id)?.name ?? "—").join(", ") || "—";

  const rows = dcs.map((d: DC) => [
    <span key={`name-${d.id}`} className="font-medium">{d.name}</span>,
    d.address,
    <span key={`cap-${d.id}`}>{d.capacity.toLocaleString()} pzas</span>,
    <span key={`cov-${d.id}`} className="text-sm text-[var(--text-muted)]">{coverageNames(d.coverage)}</span>,
    <Badge key={`badge-${d.id}`} variant={d.status === "active" ? "success" : "neutral"}>
      {d.status === "active" ? "Activo" : "Inactivo"}
    </Badge>,
  ]);

  if (loading) {
    return <div className="p-4 text-sm text-[var(--text-muted)]">Cargando centros de distribución...</div>;
  }

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
              <Input
                placeholder="Ej. CD Sur"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                placeholder="Calle y número"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Capacidad (unidades)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={form.capacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label>Zona de cobertura (tiendas)</Label>
              <div className="space-y-2 mt-1">
                {stores.map((s: Store) => (
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