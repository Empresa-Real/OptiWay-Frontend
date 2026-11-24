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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrdenesCD(dcId)
      .then((data) => {
        if (!cancelled) setOrdenes(data.filter((o) => o.status === "Aprobada"));
      })
      .catch(() => {
        // Si el endpoint aún no responde, se deja el espacio limpio sin error visible
        if (!cancelled) setOrdenes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dcId]);

  const nombreProducto = (id: string, fallbackName?: string) =>
    fallbackName ?? products.find((p) => p.id === id)?.name ?? id;
  const nombreTienda = (id: number) =>
    stores.find((s) => s.id === id)?.name ?? String(id);

  return (
    <div>
      <SectionHeader
        title="Órdenes entrantes"
        subtitle="Órdenes aprobadas que debe preparar este centro"
      />
      <Card>
        {loading ? (
          <EmptyState message="Cargando órdenes entrantes…" />
        ) : ordenes.length === 0 ? (
          <EmptyState message="Sin órdenes entrantes" />
        ) : (
          <Table
            headers={["Orden", "Producto", "Cantidad", "Tienda destino", "Estado"]}
            rows={ordenes.map((o) => [
              `#${o.id}`,
              nombreProducto(o.productId, o.nombreProducto),
              `${o.quantity} uds`,
              nombreTienda(o.destStoreId),
              <Badge variant="success">Aprobada</Badge>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}
