import { useState, useEffect } from "react";
import type { Store } from "../../types";
import { Badge, Btn, Input, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import { getTiendas, createTienda, cambiarEstadoTienda } from "../../services/tiendas";
import { ApiError } from "../../services/http";

interface StoresPanelProps {
  stores?: Store[];
  onUpdateStores?: (stores: Store[]) => void;
}

export default function StoresPanel({ stores: propStores, onUpdateStores }: StoresPanelProps = {}) {
  const [stores, setStores] = useState<Store[]>(propStores || []);
  const [initialLoading, setInitialLoading] = useState(!propStores || propStores.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "" });
  const [showDeactivate, setShowDeactivate] = useState<Store | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const loadStores = async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const data = await getTiendas();
      const loaded = data || [];
      setStores(loaded);
      onUpdateStores?.(loaded);
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
      const updated = [newStore, ...stores];
      setStores(updated);
      onUpdateStores?.(updated);
      setForm({ name: "", address: "", city: "" });
      setShowCreate(false);
      setSuccessMessage("Tienda creada correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al crear tienda:", err?.data || err);
      setError(err?.message || "Error al crear la tienda en el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestStatusChange = (store: Store) => {
    setShowDeactivate(store);
    setDeactivateError("");
    setNeedsConfirmation(false);
  };

  const handleStatusChange = async () => {
    if (!showDeactivate) return;
    const target = showDeactivate;
    const activo = target.status === "inactive";

    setDeactivating(true);
    setDeactivateError("");
    setError("");
    try {
      await cambiarEstadoTienda(target.id, activo, needsConfirmation || undefined);
      const updatedStores = stores.map((s) =>
        s.id === target.id ? { ...s, status: activo ? ("active" as const) : ("inactive" as const) } : s,
      );
      setStores(updatedStores);
      onUpdateStores?.(updatedStores);
      setSuccessMessage(activo ? "Tienda reactivada" : "Tienda desactivada");
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowDeactivate(null);
      setNeedsConfirmation(false);
    } catch (err: any) {
      if (
        !activo &&
        err instanceof ApiError &&
        err.status === 409 &&
        /confirmaci[oó]n/i.test(err.message)
      ) {
        setNeedsConfirmation(true);
        return;
      }
      setDeactivateError(err?.message || "No se pudo actualizar el estado de la tienda.");
    } finally {
      setDeactivating(false);
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
    <Btn size="sm" variant="ghost" onClick={() => requestStatusChange(s)}>
      {s.status === "active" ? "Desactivar" : "Reactivar"}
    </Btn>,
  ]);

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
          <Table headers={["Nombre", "Dirección", "Ciudad", "Estado", "Acciones"]} rows={rows} />
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

      {deactivateError && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{deactivateError}</span>
        </div>
      )}

      {showDeactivate && (
        <Modal
          title={
            showDeactivate.status === "inactive"
              ? "Reactivar tienda"
              : "Desactivar tienda"
          }
          onClose={() => !deactivating && setShowDeactivate(null)}
        >
          <div className="space-y-5">
            {showDeactivate.status === "inactive" ? (
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {showDeactivate.name} volverá a recibir asignaciones de usuarios e inventario.
              </p>
            ) : needsConfirmation ? (
              <div className="rounded-md border border-[var(--warning)] bg-[var(--warning-light)] p-4 text-sm text-[var(--text)]">
                <p>La tienda tiene órdenes de reposición en tránsito o enviadas.</p>
                <p className="mt-3 font-medium">¿Deseas desactivarla de todas formas?</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {showDeactivate.name} dejará de recibir nuevas asignaciones de usuarios e inventario. Su historial se conserva.
              </p>
            )}
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={() => setShowDeactivate(null)} disabled={deactivating}>
                Cancelar
              </Btn>
              <Btn onClick={handleStatusChange} disabled={deactivating}>
                {deactivating
                  ? "Guardando..."
                  : showDeactivate.status === "inactive"
                    ? "Reactivar"
                    : needsConfirmation
                      ? "Confirmar desactivación"
                      : "Desactivar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
