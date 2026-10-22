import { useState, useEffect } from "react";
import type { InventoryItem } from "../../types";
import { getInventarioTienda, getInventarioCD } from "../../services/inventario";
import { Badge, Input, Card, SectionHeader, Table } from "../../components/ui";

/**
 * El filtro lo aplica el backend (`GET /api/inventario?nombre=...`), no la vista.
 * Cargar todo y filtrar en memoria funcionaba solo mientras el inventario era chico
 * y dejaba la pantalla desactualizada tras una venta.
 */
export default function InventoryView({
  source,
  title,
  subtitle,
}: {
  source: { tipo: "tienda" | "cd"; id: number };
  title: string;
  subtitle?: string;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { tipo, id } = source;

  useEffect(() => {
    let cancelled = false;
    const term = search.trim();

    // Debounce: no disparamos una petición por cada tecla.
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");

      const request =
        tipo === "tienda"
          ? getInventarioTienda({ tiendaId: id, nombre: term || undefined })
          : getInventarioCD({ centroDistribucionId: id, nombre: term || undefined });

      request
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((err: any) => {
          if (!cancelled) {
            setError(err?.message || "No se pudo cargar el inventario");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, term ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tipo, id, search]);

  const rows = items.map((item) => {
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
        <Input
          placeholder="Buscar por nombre de producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
          </svg>
          {error}
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="p-4 text-sm text-[var(--text-muted)]">Cargando inventario...</div>
      ) : (
        <Card>
          {loading && <p className="mb-2 px-1 text-xs text-[var(--text-muted)]">Buscando...</p>}
          <Table headers={["Producto", "Categoría", "Cantidad disponible"]} rows={rows} />
        </Card>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">Vista de solo consulta — las cantidades se actualizan con las ventas e ingresos registrados.</p>
    </div>
  );
}
