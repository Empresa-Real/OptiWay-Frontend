import { useState, useEffect } from "react";
import type { InventoryItem } from "../../types";
import { getInventarioTienda, getInventarioCD, ajustarInventario } from "../../services/inventario";
import { Badge, Btn, Input, Label, Card, SectionHeader, Modal, Table, TableSkeleton } from "../../components/ui";

function parseProductIdSearch(term: string): number | null {
  if (!/^\d+$/.test(term)) return null;
  const productId = Number(term);
  return Number.isSafeInteger(productId) ? productId : null;
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function InventoryView({
  source,
  title,
  subtitle,
  currentUserName,
}: {
  source: { tipo: "tienda" | "cd"; id: number };
  title: string;
  subtitle?: string;
  currentUserName?: string;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [idResults, setIdResults] = useState<InventoryItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchingById, setSearchingById] = useState(false);
  const [error, setError] = useState("");
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<Record<string, { date: string; user: string; change: string }[]>>({});

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

  const openAdjustment = (item: InventoryItem) => {
    setAdjustingItem(item);
    setNewQuantity(String(item.quantity));
    setQuantityError("");
  };

  const closeAdjustment = () => {
    setAdjustingItem(null);
    setNewQuantity("");
    setQuantityError("");
  };

  const reloadInventory = async () => {
    const data =
      tipo === "tienda"
        ? await getInventarioTienda({ tiendaId: id })
        : await getInventarioCD({ centroDistribucionId: id });
    setItems(data);

    if (productId !== null) {
      const filtered =
        tipo === "tienda"
          ? await getInventarioTienda({ tiendaId: id, productoId: productId })
          : await getInventarioCD({ centroDistribucionId: id, productoId: productId });
      setIdResults(filtered);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustingItem) return;
    const item = adjustingItem;
    const quantity = Number(newQuantity);
    if (newQuantity === "" || Number.isNaN(quantity) || quantity < 0) {
      setQuantityError("La cantidad no puede ser negativa");
      return;
    }

    setError("");
    try {
      const result = await ajustarInventario(tipo, id, item.productId, quantity);

      setAdjustmentHistory((prev) => ({
        ...prev,
        [item.productId]: [
          {
            date: formatFecha(result.fechaAjuste),
            user: currentUserName || `Usuario #${result.usuarioId}`,
            change: `Cantidad: ${result.cantidadAnterior} → ${result.cantidadNueva}`,
          },
          ...(prev[item.productId] ?? []),
        ],
      }));

      closeAdjustment();
      setFeedback("Inventario ajustado");
      setTimeout(() => setFeedback(null), 3000);

      try {
        await reloadInventory();
      } catch (reloadErr: any) {
        setError(
          reloadErr?.message ||
            "El ajuste se guardó, pero no se pudo recargar el inventario.",
        );
      }
    } catch (err: any) {
      setQuantityError(err?.message || "No se pudo ajustar el inventario.");
    }
  };

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
      <Btn size="sm" variant="ghost" onClick={() => openAdjustment(item)}>
        Ajustar
      </Btn>,
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
        <Card>
          <TableSkeleton rows={6} columns={4} />
        </Card>
      ) : (
        <Card>
          {waitingForResults && <p className="mb-2 px-1 text-xs text-[var(--text-muted)]">Buscando...</p>}
          <Table headers={["Producto", "Categoría", "Cantidad disponible", "Acciones"]} rows={rows} />
        </Card>
      )}

      {feedback && (
        <div className="mb-4 rounded-md bg-[var(--success-light)] px-3 py-2 text-sm text-[var(--success)]">
          {feedback}
        </div>
      )}

      {adjustingItem && (
        <Modal title="Ajustar inventario" onClose={closeAdjustment}>
          <div className="space-y-4">
            <div>
              <Label>Producto</Label>
              <Input value={adjustingItem.nombreProducto ?? adjustingItem.productId} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad actual</Label>
                <Input value={adjustingItem.quantity} disabled />
              </div>
              <div>
                <Label>Nueva cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(event) => {
                    setNewQuantity(event.target.value);
                    setQuantityError("");
                  }}
                />
                {quantityError && (
                  <p className="mt-1 text-xs text-[var(--danger)]">{quantityError}</p>
                )}
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Ajustes de esta sesión</h3>
              <div className="overflow-x-auto rounded-md border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Fecha y hora</th>
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Usuario responsable</th>
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Ajuste realizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adjustmentHistory[adjustingItem.productId] ?? []).map((entry, index) => (
                      <tr key={`${entry.date}-${index}`} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-2 text-[var(--text-muted)]">{entry.date}</td>
                        <td className="px-2 py-2">{entry.user}</td>
                        <td className="px-2 py-2">{entry.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn variant="secondary" onClick={closeAdjustment}>Cancelar</Btn>
              <Btn onClick={handleAdjustment}>Guardar ajuste</Btn>
            </div>
          </div>
        </Modal>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Las cantidades se actualizan con las ventas, los ingresos y los ajustes registrados.
      </p>
    </div>
  );
}
