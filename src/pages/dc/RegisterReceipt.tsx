import { useState } from "react";
import type { ReceiptRecord, Product } from "../../types";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, EmptyState } from "../../components/ui";
import { registrarIngreso } from "../../services/ingresoMercancia";
import { cleanErrorMessage } from "../../services/usuarios";

export default function RegisterReceipt({
  dcId,
  products,
}: {
  dcId: number;
  products: Product[];
}) {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "", origin: "Proveedor" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;
    setSubmitting(true);
    setError("");

    try {
      const created = await registrarIngreso({
        centroDistribucionId: dcId,
        productoId: form.productId,
        quantity: Number(form.quantity),
        origin: form.origin,
      });

      setReceipts((prev) => [...prev, {
        id: created.id,
        productId: created.productId,
        quantity: created.quantity,
        origin: created.origin,
        date: created.date,
        dcId: created.dcId,
      }]);
      setForm({ productId: "", quantity: "", origin: "Proveedor" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(cleanErrorMessage(err?.message || "Error al registrar el ingreso", err?.status, err?.data));
    } finally {
      setSubmitting(false);
    }
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <SectionHeader title="Registrar ingreso de mercancía" subtitle="Documenta la entrada de productos al centro de distribución" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Producto</Label>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required disabled={submitting}>
                <option value="">Selecciona un producto…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" min="1" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required disabled={submitting} />
            </div>
            <div>
              <Label>Origen</Label>
              <Select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} disabled={submitting}>
                <option value="Proveedor">Proveedor</option>
                <option value="Otro centro de distribución">Otro centro de distribución</option>
              </Select>
            </div>
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Ingreso registrado correctamente
              </div>
            )}
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
            <Btn type="submit" disabled={submitting}>{submitting ? "Registrando..." : "Registrar ingreso"}</Btn>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Ingresos recientes</h3>
          {receipts.length === 0 ? (
            <EmptyState message="No hay ingresos registrados aún" />
          ) : (
            <div className="space-y-2">
              {[...receipts].reverse().slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
                  <div>
                    <span className="font-medium">{productName(r.productId)}</span>
                    <span className="ml-2 text-xs text-[var(--text-muted)]">{r.origin}</span>
                  </div>
                  <span className="text-[var(--text-muted)]">{r.quantity} uds</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
