import { useState, useEffect } from "react";
import type { Store } from "../../types";
import { Badge, Btn, Input, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import { getTiendas, createTienda } from "../../services/tiendas";
import { cleanErrorMessage } from "../../services/usuarios";

export default function StoresPanel() {
  const [stores, setStores] = useState<Store[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "" });

  const loadStores = async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const data = await getTiendas();
      setStores(data || []);
    } catch (err: any) {
      console.warn("Aviso al consultar /api/tiendas:", err?.message || err);
      // No usar datos quemados
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadStores(true);
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.city.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const newStore = await createTienda(form);
      setStores((prev) => [newStore, ...prev]);
      setForm({ name: "", address: "", city: "" });
      setShowCreate(false);
    } catch (err: any) {
      console.error("Error al crear tienda:", err?.data || err);
      setError(cleanErrorMessage(err?.message || "Error al crear la tienda en el servidor.", err?.status, err?.data));
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return null;
  }

  const rows = stores.map((s) => [
    <span className="font-medium">{s.name}</span>,
    s.address || "—",
    s.city,
    <Badge variant={s.status === "active" ? "success" : "neutral"}>
      {s.status === "active" ? "Activa" : "Inactiva"}
    </Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Gestión de tiendas"
        subtitle="Sucursales registradas en la red"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="md" onClick={() => loadStores(false)} disabled={refreshing}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Btn>
            <Btn size="md" onClick={() => { setShowCreate(true); setError(""); }}>
              + Crear tienda
            </Btn>
          </div>
        }
      />

      <Card>
        {stores.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            No hay tiendas registradas.
          </div>
        ) : (
          <Table headers={["Nombre", "Dirección", "Ciudad", "Estado"]} rows={rows} />
        )}
      </Card>

      {showCreate && (
        <Modal title="Crear tienda" onClose={() => !submitting && setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la tienda</Label>
              <Input
                placeholder="Ej. Tienda Guadalajara"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                placeholder="Av. Principal 100"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                placeholder="Ej. Guadalajara"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={submitting}
                required
              />
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
                {submitting ? "Guardando..." : "Crear tienda"}
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
