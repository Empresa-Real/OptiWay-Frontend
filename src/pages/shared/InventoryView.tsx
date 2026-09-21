import { useState, useMemo } from "react";
import type { InventoryItem } from "../../types";
import { seedProducts } from "../../data/seed";
import { Badge, Input, Label, Card, SectionHeader, Table } from "../../components/ui";

export default function InventoryView({ items, title, subtitle }: { items: InventoryItem[]; title: string; subtitle?: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    items.filter((item) => {
      const p = seedProducts.find((x) => x.id === item.productId);
      if (!p) return false;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        item.productId.toLowerCase().includes(search.toLowerCase())
      );
    }), [items, search]);

  const rows = filtered.map((item) => {
    const p = seedProducts.find((x) => x.id === item.productId);
    const low = item.quantity < item.minStock;
    return [
      <span className="font-medium">{p?.name ?? item.productId}</span>,
      p?.category ?? "—",
      <span className={`font-semibold ${low ? "text-[var(--warning)]" : "text-[var(--text)]"}`}>
        {item.quantity} {p?.unit ?? "uds"}
        {low && (
          <span className="ml-2">
            <Badge variant="warning">Stock bajo</Badge>
          </span>
        )}
      </span>,
    ];
  });

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="mb-4">
        <Input placeholder="Buscar por producto, categoría o ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <Table headers={["Producto", "Categoría", "Cantidad disponible"]} rows={rows} />
      </Card>
      <p className="mt-3 text-xs text-[var(--text-muted)]">Vista de solo consulta — las cantidades se actualizan con las ventas e ingresos registrados.</p>
    </div>
  );
}
