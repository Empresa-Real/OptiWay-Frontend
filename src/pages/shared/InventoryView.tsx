import { useState, useMemo } from "react";
import type { InventoryItem } from "../../types";
import { Badge, Input, Card, SectionHeader, Table } from "../../components/ui";

export default function InventoryView({ items, title, subtitle }: { items: InventoryItem[]; title: string; subtitle?: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    items.filter((item) => {
      return (
        item.nombreProducto?.toLowerCase().includes(search.toLowerCase()) ||
        item.categoriaProducto?.toLowerCase().includes(search.toLowerCase()) ||
        item.productId.toLowerCase().includes(search.toLowerCase())
      );
    }), [items, search]);

  const rows = filtered.map((item) => {
    const low = item.stockBajo ?? item.quantity < item.minStock;
    return [
      <span className="font-medium">{item.nombreProducto ?? item.productId}</span>,
      item.categoriaProducto ?? "—",
      <span className={`font-semibold ${low ? "text-[var(--warning)]" : "text-[var(--text)]"}`}>
        {item.quantity} uds
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
