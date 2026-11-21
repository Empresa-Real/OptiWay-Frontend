import { useState } from "react";
import type { Product, ReplenishmentRequest } from "../../types";
import { Badge, Btn, EmptyState, Input, Label, Card, SectionHeader, Select } from "../../components/ui";
import { crearSolicitudReposicion } from "../../services/solicitudesReposicion";

interface SolicitarReposicionProps {
  storeId: number;
  products: Product[];
}

export default function SolicitarReposicion({
  storeId,
  products: initialProducts,
}: SolicitarReposicionProps) {
  const products = initialProducts;
  const activeProducts = products.filter((p) => p.status === "active");
  const [form, setForm] = useState({ productId: "", quantity: "" });
  const [quantityError, setQuantityError] = useState("");
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuantityError("");
    setError("");
    setSuccess(false);

    if (!form.productId) return;
    if (!form.quantity || Number(form.quantity) <= 0) {
      setQuantityError("Indica la cantidad deseada");
      return;
    }

    setSubmitting(true);
    try {
      const created = await crearSolicitudReposicion({
        tiendaId: storeId,
        productoId: form.productId,
        quantity: Number(form.quantity),
      });
      setRequests((prev) => [created, ...prev]);
      setForm({ productId: "", quantity: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const productName = (request: ReplenishmentRequest) =>
    request.nombreProducto ?? products.find((p) => p.id === request.productId)?.name ?? request.productId;

  return (
    <div>
      <SectionHeader
        title="Solicitar reposición"
        subtitle="Envía una solicitud de producto al equipo de planificación"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Producto</Label>
              <Select
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                required
                disabled={submitting}
              >
                <option value="">Selecciona un producto…</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                required
                disabled={submitting}
              />
              {quantityError && (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {quantityError}
                </p>
              )}
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Solicitud creada correctamente
              </div>
            )}
            <Btn type="submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Solicitar reposición"}
            </Btn>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
            Solicitudes creadas en esta sesión
          </h3>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            El Planificador verá estas solicitudes como pendientes.
          </p>
          {requests.length === 0 ? (
            <EmptyState message="Aún no has creado solicitudes en esta sesión" />
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm"
                >
                  <span className="font-medium">
                    {productName(r)} — {r.quantity} uds
                  </span>
                  <Badge
                    variant={
                      r.status === "Pendiente" ? "warning" : "neutral"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
