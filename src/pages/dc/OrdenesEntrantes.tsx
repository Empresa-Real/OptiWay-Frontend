import { useEffect, useState } from "react";
import type { Order, Product, Store } from "../../types";
import { Badge, Card, EmptyState, SectionHeader, Table } from "../../components/ui";
import { getOrdenesCD } from "../../services/ordenes";

interface OrdenesEntrantesProps {
  dcId: number;
  products: Product[];
  stores: Store[];
}

export default function OrdenesEntrantes({
  dcId,
  products,
  stores,
}: OrdenesEntrantesProps) {
  const [ordenes, setOrdenes] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getOrdenesCD(dcId)
      .then((data) => {
        if (!cancelled) setOrdenes(data.filter((o) => o.status === "Aprobada"));
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "No se pudieron cargar las órdenes entrantes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dcId]);

  const nombreProducto = (id: string) =>
    products.find((p) => p.id === id)?.name ?? id;
  const nombreTienda = (id: number) =>
    stores.find((s) => s.id === id)?.name ?? String(id);

  return (
    <div>
      <SectionHeader
        title="Órdenes entrantes"
        subtitle="Órdenes aprobadas que debe preparar este centro"
      />
      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      <Card>{ordenes.length === 0 ? (
        <EmptyState message="Sin órdenes entrantes" />
      ) : (
        <Table
          headers={["Orden", "Producto", "Cantidad", "Tienda destino", "Estado"]}
          rows={ordenes.map((o) => [
            `#${o.id}`,
            nombreProducto(o.productId),
            `${o.quantity} uds`,
            nombreTienda(o.destStoreId),
            <Badge variant="success">Aprobada</Badge>,
          ])}
        />
      )}</Card>
    </div>
  );
}