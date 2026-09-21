import { useState } from "react";
import type { SaleRecord } from "../../types";
import { seedProducts } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, EmptyState } from "../../components/ui";

export default function RegisterSale({ storeId }: { storeId: number }) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "", date: new Date().toISOString().slice(0, 16) });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;
    setSales((prev) => [...prev, { id: Date.now(), productId: form.productId, quantity: Number(form.quantity), date: form.date, storeId }]);
    setForm({ productId: "", quantity: "", date: new Date().toISOString().slice(0, 16) });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const productName = (id: string) => seedProducts.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <SectionHeader title="Registrar venta" subtitle="Ingresa los datos de la venta en tienda" />
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
              <Input type="number" min="1" placeholder="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Fecha y hora</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Venta registrada correctamente
              </div>
            )}
            <Btn type="submit">Registrar venta</Btn>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Ventas recientes</h3>
          {sales.length === 0 ? (
            <EmptyState message="No hay ventas registradas aún" />
          ) : (
            <div className="space-y-2">
              {[...sales].reverse().slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
                  <span className="font-medium">{productName(s.productId)}</span>
                  <span className="text-[var(--text-muted)]">{s.quantity} uds · {new Date(s.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
