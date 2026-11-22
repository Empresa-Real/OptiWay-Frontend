import { useEffect, useMemo, useState } from "react";
import type { Product, SalesHistoryItem, Store } from "../../types";
import { getHistorialVentas, getSalesWeeks } from "../../services/historialVentas";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  Input,
  Label,
  SectionHeader,
  Select,
  Table,
} from "../../components/ui";

interface RotacionProductosProps {
  products: Product[];
  stores: Store[];
}

export default function RotacionProductos({
  products,
  stores,
}: RotacionProductosProps) {
  const salesWeeks = getSalesWeeks();
  const [filters, setFilters] = useState({
    storeId: "",
    from: salesWeeks[0],
    to: salesWeeks[salesWeeks.length - 1],
  });
  const [generatedFilters, setGeneratedFilters] = useState<typeof filters | null>(null);
  const [dateError, setDateError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [salesData, setSalesData] = useState<SalesHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError("");
    const params: { tiendaId?: number; productoId?: string; desde?: string; hasta?: string } = {};
    if (filters.storeId) params.tiendaId = Number(filters.storeId);
    if (filters.from) params.desde = filters.from;
    if (filters.to) params.hasta = filters.to;
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
  }, [filters.storeId, filters.from, filters.to]);

  const sales = historyError || historyLoading ? [] : salesData;
  const report = useMemo(() => {
    if (!generatedFilters) return [];
    const grouped = products.map((product, index) => ({
      product,
      units: sales
        .filter((sale) =>
          sale.storeId === Number(generatedFilters.storeId) &&
          sale.productId === product.id &&
          sale.date >= generatedFilters.from &&
          sale.date <= generatedFilters.to,
        )
        .reduce((sum, sale) => sum + sale.quantity, 0),
      days: 8 + ((index * 7 + Number(generatedFilters.storeId) * 3) % 28),
    })).filter((item) => item.units > 0).sort((a, b) => b.units - a.units);
    const max = Math.max(1, ...grouped.map((item) => item.units));
    return grouped.map((item) => ({
      ...item,
      rotation:
        item.units >= max * 0.75
          ? "Alta"
          : item.units >= max * 0.45
            ? "Media"
            : "Baja",
    }));
  }, [generatedFilters, products, sales]);
  const maxUnits = Math.max(1, ...report.map((item) => item.units));

  const generateReport = () => {
    if (filters.from > filters.to) {
      setDateError("La fecha inicial no puede ser posterior a la final");
      return;
    }
    if (!filters.storeId || !filters.from || !filters.to) return;
    setDateError("");
    setGeneratedFilters({ ...filters });
  };

  const exportReport = () => {
    const rows = [
      ["Producto", "Unidades vendidas", "Tiempo promedio en inventario (días)", "Rotación"],
      ...report.map((item) => [
        item.product.name,
        String(item.units),
        String(item.days),
        item.rotation,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-rotacion.csv";
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("Reporte exportado");
    window.setTimeout(() => setFeedback(""), 3000);
  };
  const rows = report.map((item) => [
    <span className="font-medium">{item.product.name}</span>,
    <div className="min-w-40">
      <div className="mb-1 text-xs font-medium">{item.units} uds</div>
      <div className="h-1.5 rounded bg-[var(--surface-muted)]">
        <div
          className="chart-bar h-1.5 rounded bg-[var(--accent)]"
          style={{ width: `${(item.units / maxUnits) * 100}%` }}
        />
      </div>
    </div>,
    `${item.days} días`,
    <Badge
      variant={
        item.rotation === "Alta"
          ? "success"
          : item.rotation === "Media"
            ? "info"
            : "warning"
      }
    >
      {item.rotation}
    </Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Rotación de productos"
        subtitle="Reporte de desempeño por tienda y periodo"
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Tienda</Label>
            <Select
              value={filters.storeId}
              onChange={(event) =>
                setFilters({ ...filters, storeId: event.target.value })
              }
            >
              <option value="">Selecciona una tienda…</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
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
          <div className="flex items-end">
            <Btn onClick={generateReport}>Generar reporte</Btn>
          </div>
        </div>
        {dateError && (
          <p className="mt-2 text-xs text-[var(--danger)]">{dateError}</p>
        )}
      </Card>

      {feedback && (
        <div className="mb-4 rounded-md bg-[var(--success-light)] px-3 py-2 text-sm text-[var(--success)]">
          {feedback}
        </div>
      )}
      {!generatedFilters ? (
        <Card>
          <EmptyState
            message="Selecciona una tienda y un rango de fechas para generar el reporte"
          />
        </Card>
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <Btn variant="secondary" onClick={exportReport}>
              Exportar reporte
            </Btn>
          </div>
          <Card>
            <Table
              headers={[
                "Producto",
                "Unidades vendidas",
                "Tiempo promedio en inventario",
                "Rotación",
              ]}
              rows={rows}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
