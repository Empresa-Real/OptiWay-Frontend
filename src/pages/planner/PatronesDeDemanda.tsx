import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Product, Store } from "../../types";
import {
  consultarPatronesDemanda,
  type PatronesDemandaResponse,
} from "../../services/patronesDemanda";
import {
  Badge,
  Btn,
  Card,
  Input,
  Label,
  ListSkeleton,
  SectionHeader,
  Select,
  Skeleton,
} from "../../components/ui";

interface PatronesDeDemandaProps {
  products: Product[];
  stores: Store[];
}

export default function PatronesDeDemanda({
  products,
  stores,
}: PatronesDeDemandaProps) {
  const [productoId, setProductoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tiendaIds, setTiendaIds] = useState<number[]>([]);
  const [resultado, setResultado] = useState<PatronesDemandaResponse | null>(null);
  const [tiendaDetalle, setTiendaDetalle] = useState<number | null>(null);
  const [tiendasOpen, setTiendasOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const tiendasDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tiendasOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tiendasDropdownRef.current &&
        !tiendasDropdownRef.current.contains(event.target as Node)
      ) {
        setTiendasOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTiendasOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tiendasOpen]);

  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();
  const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
  const dia = String(fechaActual.getDate()).padStart(2, "0");
  const hoy = `${anio}-${mes}-${dia}`;

  function cambiarTienda(id: number) {
    setTiendaIds((actuales) =>
      actuales.includes(id)
        ? actuales.filter((actual) => actual !== id)
        : [...actuales, id],
    );
  }

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cargando) return;

    setError("");
    setResultado(null);

    if (!productoId || !desde || !hasta || tiendaIds.length === 0) {
      setError("Selecciona un producto, al menos una tienda y ambas fechas.");
      return;
    }

    const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

    if (!formatoFecha.test(desde) || !formatoFecha.test(hasta)) {
      setError("Ingresa ambas fechas con un año de cuatro cifras.");
      return;
    }

    if (desde > hoy || hasta > hoy) {
      setError("Las fechas del histórico no pueden ser posteriores a hoy.");
      return;
    }

    if (hasta < desde) {
      setError("La fecha final debe ser igual o posterior a la inicial.");
      return;
    }

    setCargando(true);

    try {
      const datos = await consultarPatronesDemanda({
        productoId: Number(productoId),
        tiendaIds,
        desde,
        hasta,
      });

      setResultado(datos);
      setTiendaDetalle(datos.tiendas[0]?.tiendaId ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo consultar la demanda.",
      );
    } finally {
      setCargando(false);
    }
  }

  function nombreTienda(id: number) {
    return stores.find((tienda) => tienda.id === id)?.name ?? `Tienda ${id}`;
  }

  const detalle = resultado?.tiendas.find(
    (tienda) => tienda.tiendaId === tiendaDetalle,
  );

  const maximoDiario =
    detalle?.evolucion.reduce(
      (maximo, dia) => Math.max(maximo, dia.unidadesVendidas),
      1,
    ) ?? 1;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Patrones de demanda"
        subtitle="Histórico de ventas por producto y tienda"
      />

      <Card className="p-5">
        <form onSubmit={consultar}>
          <fieldset disabled={cargando} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Producto</Label>
                <Select
                  aria-label="Producto"
                  value={productoId}
                  onChange={(event) => setProductoId(event.target.value)}
                >
                  <option value="">Selecciona un producto…</option>
                  {products
                    .filter((p) => p.status === "active")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Select>
              </div>

              <div ref={tiendasDropdownRef} className="relative">
                <Label>Tiendas</Label>
                <button
                  type="button"
                  aria-label="Tiendas"
                  aria-expanded={tiendasOpen}
                  onClick={() => setTiendasOpen((open) => !open)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-between gap-2 focus:outline-none focus:border-[var(--accent)] cursor-pointer text-left"
                >
                  <span className={`truncate ${tiendaIds.length === 0 ? "text-[var(--text-muted)]" : ""}`}>
                    {tiendaIds.length === 0
                      ? "Selecciona tiendas…"
                      : tiendaIds.length === 1
                        ? nombreTienda(tiendaIds[0])
                        : `${tiendaIds.length} tiendas seleccionadas`}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-[var(--text-muted)] transition-transform ${tiendasOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {tiendasOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] text-xs">
                      <button
                        type="button"
                        onClick={() => setTiendaIds(stores.map((s) => s.id))}
                        className="text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Seleccionar todas
                      </button>
                      {tiendaIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTiendaIds([])}
                          className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {stores.map((tienda) => {
                        const selected = tiendaIds.includes(tienda.id);
                        return (
                          <button
                            key={tienda.id}
                            type="button"
                            onClick={() => cambiarTienda(tienda.id)}
                            className={`w-full px-3 py-2 text-sm flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                              selected
                                ? "bg-[var(--surface-subtle)] font-medium text-[var(--text)]"
                                : "text-[var(--text)] hover:bg-[var(--surface-subtle)]"
                            }`}
                          >
                            <span className="truncate">{tienda.name}</span>
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                selected
                                  ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                                  : "border-[var(--border)] bg-[var(--surface)]"
                              }`}
                            >
                              {selected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Desde</Label>
                <Input
                  aria-label="Desde"
                  type="date"
                  value={desde}
                  max={hoy}
                  onChange={(event) => setDesde(event.target.value)}
                />
              </div>

              <div>
                <Label>Hasta</Label>
                <Input
                  aria-label="Hasta"
                  type="date"
                  value={hasta}
                  min={desde || undefined}
                  max={hoy}
                  onChange={(event) => setHasta(event.target.value)}
                />
              </div>
            </div>

            <Btn type="submit">
              {cargando ? "Consultando…" : "Consultar"}
            </Btn>
          </fieldset>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-red-700">
            {error}
          </p>
        )}
      </Card>

      {cargando && (
        <Card className="space-y-4 p-5">
          <Skeleton className="h-5 w-40" />
          <ListSkeleton rows={4} />
        </Card>
      )}

      {resultado && (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Ventas por tienda</h2>

          <p className="text-sm">
            {products.find((p) => p.id === String(resultado.productoId))?.name
              ?? `Producto ${resultado.productoId}`}
            {" · "}
            {resultado.desde} al {resultado.hasta}
          </p>

          {resultado.tiendas.map((tienda) => {
            const comparar = resultado.tiendas.length > 1;
            const mayor = resultado.tiendasMayorRotacion.includes(tienda.tiendaId);
            const menor = resultado.tiendasMenorRotacion.includes(tienda.tiendaId);

            return (
              <div
                key={tienda.tiendaId}
                className="flex flex-wrap items-center gap-3"
              >
                <span>{nombreTienda(tienda.tiendaId)}</span>
                <strong>{tienda.unidadesVendidas} uds</strong>

                {comparar && mayor && menor && (
                  <Badge variant="neutral">Igual rotación</Badge>
                )}
                {comparar && mayor && !menor && (
                  <Badge variant="success">Mayor rotación</Badge>
                )}
                {comparar && menor && !mayor && (
                  <Badge variant="warning">Menor rotación</Badge>
                )}
              </div>
            );
          })}

          {detalle && (
            <div className="space-y-3">
              <h2 className="font-semibold">Evolución diaria</h2>

              <Select
                aria-label="Tienda para ver su evolución diaria"
                value={String(detalle.tiendaId)}
                onChange={(event) => setTiendaDetalle(Number(event.target.value))}
              >
                {resultado.tiendas.map((tienda) => (
                  <option key={tienda.tiendaId} value={tienda.tiendaId}>
                    {nombreTienda(tienda.tiendaId)}
                  </option>
                ))}
              </Select>

              {detalle.evolucion.map((dia) => (
                <div key={dia.fecha} className="flex items-center gap-3 text-sm">
                  <span>{dia.fecha}</span>
                  <progress
                    aria-label={`Ventas del ${dia.fecha}`}
                    className="flex-1"
                    max={maximoDiario}
                    value={dia.unidadesVendidas}
                  />
                  <span>{dia.unidadesVendidas} uds</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}