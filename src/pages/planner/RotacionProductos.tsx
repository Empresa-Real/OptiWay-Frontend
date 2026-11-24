import { useMemo, useState } from "react";
import type { Product, Store } from "../../types";
import {
  consultarReporteRotacion,
  exportarReporteRotacionCsv,
  type ClasificacionRotacion,
  type ReporteRotacionResponse,
} from "../../services/reporteRotacion";
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

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    from: formatDateInput(thirtyDaysAgo),
    to: formatDateInput(today),
  };
}

function getRotationBadge(clasificacion: ClasificacionRotacion): {
  label: string;
  variant: "success" | "warning" | "neutral";
} {
  switch (clasificacion) {
    case "RAPIDA":
      return { label: "Rápida", variant: "success" };
    case "BAJA":
      return { label: "Baja", variant: "warning" };
    case "SIN_VENTAS":
      return { label: "Sin ventas", variant: "neutral" };
    default:
      return { label: clasificacion, variant: "neutral" };
  }
}

export default function RotacionProductos({
  stores,
}: RotacionProductosProps) {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [filters, setFilters] = useState({
    storeId: "",
    from: defaultRange.from,
    to: defaultRange.to,
  });
  const [report, setReport] = useState<ReporteRotacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateError, setDateError] = useState("");
  const [apiError, setApiError] = useState("");
  const [feedback, setFeedback] = useState("");

  const maxUnits = useMemo(
    () =>
      Math.max(
        1,
        ...(report?.productos.map((item) => item.unidadesVendidas) ?? [0]),
      ),
    [report],
  );

  const generateReport = async () => {
    if (!filters.storeId) {
      setDateError("Selecciona una tienda");
      return;
    }
    if (!filters.from || !filters.to) {
      setDateError("Selecciona un rango de fechas completo");
      return;
    }
    if (filters.from > filters.to) {
      setDateError("La fecha inicial no puede ser posterior a la final");
      return;
    }

    setDateError("");
    setApiError("");
    setLoading(true);
    try {
      const data = await consultarReporteRotacion({
        tiendaId: Number(filters.storeId),
        desde: filters.from,
        hasta: filters.to,
      });
      setReport(data);
    } catch (err: any) {
      setReport(null);
      setApiError(err?.message || "No se pudo consultar el reporte de rotación");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!report) return;
    setApiError("");
    setExporting(true);
    try {
      const { blob, filename } = await exportarReporteRotacionCsv({
        tiendaId: report.tiendaId,
        desde: report.desde,
        hasta: report.hasta,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback("Reporte exportado");
      window.setTimeout(() => setFeedback(""), 3000);
    } catch (err: any) {
      setApiError(err?.message || "No se pudo exportar el reporte de rotación");
    } finally {
      setExporting(false);
    }
  };

  const rows = (report?.productos ?? []).map((item) => {
    const badge = getRotationBadge(item.clasificacionRotacion);
    return [
      <div>
        <div className="font-medium">{item.nombreProducto}</div>
        {item.categoriaProducto && (
          <div className="text-xs text-[var(--text-muted)]">
            {item.categoriaProducto}
          </div>
        )}
      </div>,
      `${item.stockActual} uds`,
      <div className="min-w-40">
        <div className="mb-1 text-xs font-medium">{item.unidadesVendidas} uds</div>
        <div className="h-1.5 rounded bg-[var(--surface-muted)]">
          <div
            className="chart-bar h-1.5 rounded bg-[var(--accent)]"
            style={{ width: `${(item.unidadesVendidas / maxUnits) * 100}%` }}
          />
        </div>
      </div>,
      item.tiempoPromedioEstimadoEnInventarioDias !== null
        ? `${item.tiempoPromedioEstimadoEnInventarioDias} días`
        : "Sin ventas",
      <Badge variant={badge.variant}>{badge.label}</Badge>,
    ];
  });

  return (
    <div>
      <SectionHeader
        title="Rotación de productos"
        subtitle="Reporte de desempeño por tienda y periodo"
      />
      {apiError && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Tienda</Label>
            <Select
              value={filters.storeId}
              onChange={(event) => {
                setFilters({ ...filters, storeId: event.target.value });
                setDateError("");
              }}
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
              onChange={(event) => {
                setFilters({ ...filters, from: event.target.value });
                setDateError("");
              }}
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => {
                setFilters({ ...filters, to: event.target.value });
                setDateError("");
              }}
            />
          </div>
          <div className="flex items-end">
            <Btn onClick={generateReport} disabled={loading}>
              {loading ? "Generando…" : "Generar reporte"}
            </Btn>
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
      {!report ? (
        <Card>
          <EmptyState
            message={
              loading
                ? "Consultando reporte de rotación…"
                : "Selecciona una tienda y un rango de fechas para generar el reporte"
            }
          />
        </Card>
      ) : report.productos.length === 0 ? (
        <Card>
          <EmptyState message="No se encontraron productos para esta tienda y periodo" />
        </Card>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            {report.metodoCalculo && (
              <p className="text-xs text-[var(--text-muted)]">
                {report.metodoCalculo}
              </p>
            )}
            <Btn
              variant="secondary"
              onClick={exportReport}
              disabled={exporting}
            >
              {exporting ? "Exportando…" : "Exportar reporte"}
            </Btn>
          </div>
          <Card>
            <Table
              headers={[
                "Producto",
                "Stock actual",
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
