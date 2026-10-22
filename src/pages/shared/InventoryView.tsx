import { useState, useEffect } from "react";
import type { InventoryItem } from "../../types";
import { getInventarioTienda, getInventarioCD } from "../../services/inventario";
import { Badge, Input, Card, SectionHeader, Table } from "../../components/ui";

function parseProductIdSearch(term: string): number | null {
  if (!/^\d+$/.test(term)) return null;
  const productId = Number(term);
  return Number.isSafeInteger(productId) ? productId : null;
}

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
  const [idResults, setIdResults] = useState<InventoryItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchingById, setSearchingById] = useState(false);
  const [error, setError] = useState("");

  const { tipo, id } = source;
  const term = search.trim();
  const productId = parseProductIdSearch(term);

  // Carga el inventario una vez al entrar; la búsqueda por texto es local.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const request =
      tipo === "tienda"
        ? getInventarioTienda({ tiendaId: id })
        : getInventarioCD({ centroDistribucionId: id });

    request
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "No se pudo cargar el inventario");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tipo, id]);

  // Los IDs se consultan por igualdad exacta en el endpoint del backend.
  useEffect(() => {
    if (productId === null) {
      setIdResults(null);
      setSearchingById(false);
      return;
    }

    let cancelled = false;
    setIdResults(null);
    setSearchingById(true);
    const timer = setTimeout(() => {
      setError("");

      const request =
        tipo === "tienda"
          ? getInventarioTienda({ tiendaId: id, productoId: productId })
          : getInventarioCD({ centroDistribucionId: id, productoId: productId });

      request
        .then((data) => {
          if (!cancelled) setIdResults(data);
        })
        .catch((err: any) => {
          if (!cancelled) {
            setIdResults([]);
            setError(err?.message || "No se pudo buscar el producto");
          }
        })
        .finally(() => {
          if (!cancelled) setSearchingById(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tipo, id, productId]);

  const visibleItems =
    productId !== null
      ? idResults ?? []
      : items.filter((item) => {
          const normalizedTerm = term.toLowerCase();
          return (
            item.nombreProducto?.toLowerCase().includes(normalizedTerm) ||
            item.categoriaProducto?.toLowerCase().includes(normalizedTerm) ||
            item.productId.includes(term)
          );
        });

  const rows = visibleItems.map((item) => {
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

  const waitingForResults = loading || searchingById;
  const hasNoResultsYet = productId !== null ? idResults === null : items.length === 0;

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="mb-4">
        <Input
          placeholder="Buscar por producto, categoría o ID…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
      {waitingForResults && hasNoResultsYet ? (
        <div className="p-4 text-sm text-[var(--text-muted)]">Cargando inventario...</div>
      ) : (
        <Card>
          {waitingForResults && <p className="mb-2 px-1 text-xs text-[var(--text-muted)]">Buscando...</p>}
          <Table headers={["Producto", "Categoría", "Cantidad disponible"]} rows={rows} />
        </Card>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Vista de solo consulta — las cantidades se actualizan con las ventas e ingresos registrados.
      </p>
    </div>
  );
}
