import { useState, useEffect } from "react";
import type { DC, Store } from "../../types";
import { getCentrosDistribucion, createCentroDistribucion } from "../../services/centrosDistribucion";
import { Badge, Btn, Input, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

interface DCsPanelProps {
  stores: Store[];
  dcs?: DC[];
  onUpdateDCs?: (dcs: DC[]) => void;
}

export default function DCsPanel({ stores, dcs: propDCs, onUpdateDCs }: DCsPanelProps) {
  const [dcs, setDCs] = useState<DC[]>(propDCs || []);
  const [initialLoading, setInitialLoading] = useState(!propDCs || propDCs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ name: string; address: string; capacity: string; coverage: number[] }>({
    name: "",
    address: "",
    capacity: "",
    coverage: [],
  });

  const loadDCs = async (isInitial = false): Promise<void> => {
    if (!isInitial) setRefreshing(true);
    setError("");
    try {
      const data = await getCentrosDistribucion();
      const loaded = data || [];
      setDCs(loaded);
      onUpdateDCs?.(loaded);
    } catch (err: any) {
      console.warn("Aviso al consultar /api/centros-distribucion:", err?.message || err);
      setError(err?.message || "No se pudieron cargar los centros de distribución.");
    } finally {
      if (isInitial) setInitialLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDCs(true);
  }, []);

  const handleCreate = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError("El nombre del centro de distribución es obligatorio.");
      return;
    }

    const capacity = Number(form.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      setError("La capacidad debe ser mayor que cero.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const newDC = await createCentroDistribucion({
        name: form.name,
        address: form.address,
        capacity,
        coverage: form.coverage,
      });

      const updated = [newDC, ...dcs];
      setDCs(updated);
      onUpdateDCs?.(updated);
      setForm({ name: "", address: "", capacity: "", coverage: [] });
      setShowCreate(false);
      setSuccessMessage("Centro de distribución creado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al crear centro de distribución:", err?.data || err);
      setError(err?.message || "Error al crear el centro de distribución.");
    } finally {
      setSubmitting(false);
    }
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

  if (initialLoading) {
    return <div className="p-4 text-sm text-[var(--text-muted)]">Cargando centros de distribución...</div>;
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <SectionHeader
        title="Centros de distribución"
        subtitle="Almacenes y zonas de cobertura"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="md" onClick={() => loadDCs()} disabled={refreshing}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Btn>
            <Btn size="md" onClick={() => { setShowCreate(true); setError(""); }}>
              + Crear CD
            </Btn>
          </div>
        }
      />

      {!showCreate && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <Card>
        {dcs.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            No hay centros de distribución registrados.
          </div>
        ) : (
          <Table headers={["Nombre", "Dirección", "Capacidad", "Cobertura", "Estado"]} rows={rows} />
        )}
      </Card>

      {showCreate && (
        <Modal title="Crear centro de distribución" onClose={() => !submitting && setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="Ej. CD Sur"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                placeholder="Calle y número"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Capacidad (unidades)</Label>
              <Input
                type="number"
                min="1"
                placeholder="5000"
                value={form.capacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: e.target.value })}
                disabled={submitting}
                required
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
                      disabled={submitting}
                      className="accent-[var(--accent)]"
                    />
                    {s.name} — {s.city}
                  </label>
                ))}
              </div>
            </div>

            <ErrorBanner message={error} />

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate} disabled={submitting}>
                {submitting ? "Guardando..." : "Crear CD"}
              </Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)} disabled={submitting}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
