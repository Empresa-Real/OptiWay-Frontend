import { useEffect, useState } from "react";
import type { Product, SalesHistoryItem, Store } from "../../types";
import { getHistorialVentas, getSalesWeeks } from "../../services/historialVentas";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  Label,
  SectionHeader,
  Select,
} from "../../components/ui";

interface PatronesDeDemandaProps {
  products: Product[];
  stores: Store[];
}

export default function PatronesDeDemanda({
  products,
  stores,
}: PatronesDeDemandaProps) {
  const salesWeeks = getSalesWeeks();
  const [filters, setFilters] = useState({
    productId: "",
    from: salesWeeks[0],
    to: salesWeeks[salesWeeks.length - 1],
  });
  const [storeId, setStoreId] = useState(String(stores[0]?.id ?? ""));
  const [comparisonStores, setComparisonStores] = useState<number[]>(
    stores.slice(0, 2).map((store) => store.id),
  );
  const [salesData, setSalesData] = useState<SalesHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError("");
    const params: { tiendaId?: number; productoId?: string; desde?: string; hasta?: string } = {};
    if (filters.productId) params.productoId = filters.productId;
    if (filters.from) params.desde = filters.from;
    if (filters.to) params.hasta = filters.to;
    if (storeId) params.tiendaId = Number(storeId);
    getHistorialVentas(params)
      .then((data) => {
        if (!cancelled) setSalesData(data);
      })
      .catch((err: any) => {
        if (!cancelled) setHistoryError(err?.message || "No se pudo cargar el historial de ventas");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.productId, filters.from, filters.to, storeId]);

  const dateError =
    filters.from && filters.to && filters.from > filters.to;
  const activeProducts = products.filter((p) => p.status === "active");
  const sales = historyError || historyLoading ? [] : salesData;
  const filteredSales = !dateError && filters.productId
    ? sales.filter(
        (sale) =>
          sale.productId === filters.productId &&
          (!filters.from || sale.date >= filters.from) &&
          (!filters.to || sale.date <= filters.to),
      )
    : [];
  const evolution = salesWeeks
    .filter(
      (week) =>
        (!filters.from || week >= filters.from) &&
        (!filters.to || week <= filters.to),
    )
    .map((week) => ({
      week,
      quantity: filteredSales
        .filter(
          (sale) =>
            sale.storeId === Number(storeId) && sale.date === week,
        )
        .reduce((sum, sale) => sum + sale.quantity, 0),
    }));
  const maxEvolution = Math.max(1, ...evolution.map((item) => item.quantity));
  const comparison = comparisonStores
    .map((selectedStoreId) => ({
      store: stores.find((store) => store.id === selectedStoreId),
      quantity: filteredSales
        .filter((sale) => sale.storeId === selectedStoreId)
        .reduce((sum, sale) => sum + sale.quantity, 0),
    }))
    .filter((item): item is { store: Store; quantity: number } => Boolean(item.store))
    .sort((a, b) => b.quantity - a.quantity);
  const maxComparison = Math.max(1, ...comparison.map((item) => item.quantity));

  const toggleComparisonStore = (selectedStoreId: number) => {
    setComparisonStores((prev) =>
      prev.includes(selectedStoreId)
        ? prev.filter((id) => id !== selectedStoreId)
        : [...prev, selectedStoreId],
    );
  };
  return (
    <div>
      <SectionHeader
        title="Patrones de demanda"
        subtitle="Histórico de ventas por producto y tienda"
      />
      {historyError && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{historyError}</span>
        </div>
      )}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Producto</Label>
            <Select
              value={filters.productId}
              onChange={(event) =>
                setFilters({ ...filters, productId: event.target.value })
              }
            >
              <option value="">Selecciona un producto…</option>
              {activeProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Desde</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters({ ...filters, from: event.target.value })
              }
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters({ ...filters, to: event.target.value })
              }
            />
          </div>
        </div>
        {dateError && (
          <p className="mt-2 text-xs text-[var(--danger)]">
            La fecha inicial no puede ser posterior a la final
          </p>
        )}
      </Card>

      {!filters.productId ? (
        <Card>
          <EmptyState message="Selecciona un producto para ver su demanda" />
        </Card>
      ) : filteredSales.length === 0 || dateError ? (
        <Card>
          <EmptyState message="Sin ventas en el rango seleccionado" />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-3 flex w-56 items-end gap-3 border-b border-[var(--border)] px-2">
              <div className="flex-1">
                <Label>Tienda</Label>
                <Select
                  value={storeId}
                  onChange={(event) => setStoreId(event.target.value)}
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <h2 className="text-base font-semibold text-[var(--text)]">
              Evolución de ventas
            </h2>
            <div className="flex h-56 items-end gap-3 border-b border-[var(--border)] px-2">
              {evolution.map((item) => (
                <div
                  key={item.week}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <span className="mb-1 text-xs font-medium text-[var(--text)]">
                    {item.quantity}
                  </span>
                  <div
                    className="chart-bar w-full max-w-12 rounded-t bg-[var(--accent)]"
                    style={{
                      height: `${Math.max(
                        4,
                        (item.quantity / maxEvolution) * 75,
                      )}%`,
                    }}
                  />
                  <span className="mt-2 pb-2 text-center text-xs text-[var(--text-muted)]">
                    {new Date(`${item.week}T12:00:00`).toLocaleDateString(
                      "es-MX",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-[var(--text)]">
              Comparar tiendas
            </h2>
            <div className="my-4 flex flex-wrap gap-4">
              {stores.map((store) => (
                <label
                  key={store.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={comparisonStores.includes(store.id)}
                    onChange={() => toggleComparisonStore(store.id)}
                    className="accent-[var(--accent)]"
                  />
                  {store.name}
                </label>
              ))}
            </div>
            {comparisonStores.length < 2 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Selecciona al menos dos tiendas para comparar.
              </p>
            ) : (
              <div className="space-y-4">
                {comparison.map((item, index) => (
                  <div key={item.store.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{item.store.name}</span>
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge variant="success">Mayor rotación</Badge>
                        )}
                        {index === comparison.length - 1 &&
                          comparison.length > 1 && (
                            <Badge variant="warning">
                              Menor rotación
                            </Badge>
                          )}
                        <span className="text-[var(--text-muted)]">
                          {item.quantity} uds
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded bg-[var(--surface-muted)]">
                      <div
                        className="chart-bar h-2 rounded bg-[var(--accent)]"
                        style={{ width: `${(item.quantity / maxComparison) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
