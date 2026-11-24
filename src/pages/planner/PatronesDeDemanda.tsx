import { useState, type FormEvent } from "react";
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
  const [productoId, setProductoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tiendaIds, setTiendaIds] = useState<number[]>([]);
  const [resultado, setResultado] = useState<PatronesDemandaResponse | null>(null);
  const [tiendaDetalle, setTiendaDetalle] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

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
            <div className="grid gap-4 md:grid-cols-3">
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

            <fieldset>
              <legend className="mb-2 font-medium">Tiendas</legend>
              <div className="flex flex-wrap gap-4">
                {stores.map((tienda) => (
                  <label key={tienda.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tiendaIds.includes(tienda.id)}
                      onChange={() => cambiarTienda(tienda.id)}
                    />
                    {tienda.name}
                  </label>
                ))}
              </div>
            </fieldset>

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