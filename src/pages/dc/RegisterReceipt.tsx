import { useState } from "react";
import type { ReceiptRecord } from "../../types";
import { seedProducts } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, EmptyState } from "../../components/ui";

export default function RegisterReceipt({ dcId }: { dcId: number }) {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "", origin: "Proveedor" });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;
    setReceipts((prev) => [...prev, { id: Date.now(), productId: form.productId, quantity: Number(form.quantity), origin: form.origin, date: new Date().toISOString(), dcId }]);
    setForm({ productId: "", quantity: "", origin: "Proveedor" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const productName = (id: string) => seedProducts.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <SectionHeader title="Registrar ingreso de mercancía" subtitle="Documenta la entrada de productos al centro de distribución" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Producto</Label>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">Selecciona un producto…</option>
                {seedProducts.filter((p) => p.status === "active").map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" min="1" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Origen</Label>
              <Select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
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
            <Btn type="submit">Registrar ingreso</Btn>
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
