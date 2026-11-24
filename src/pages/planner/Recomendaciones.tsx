import { useEffect, useState } from "react";
import type {
  Product,
  Store,
  DC,
  Recommendation,
  ReplenishmentRequest,
} from "../../types";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  Input,
  Label,
  Modal,
  SectionHeader,
  Select,
} from "../../components/ui";
import {
  getRecomendaciones,
  crearRecomendacion,
  aprobarRecomendacion,
  rechazarRecomendacion,
} from "../../services/recomendaciones";
import { getSolicitudesReposicion } from "../../services/solicitudesReposicion";
import { getCurrentAuthUserId } from "../../services/auth";
import { ApiError } from "../../services/http";

interface RecomendacionesProps {
  products: Product[];
  stores: Store[];
  dcs: DC[];
  currentUserName: string;
}

const emptyCreateForm = {
  productId: "",
  quantity: "",
  originDcId: "",
  destStoreId: "",
};

export default function Recomendaciones({
  products,
  stores,
  dcs,
  currentUserName,
}: RecomendacionesProps) {
  const activeProducts = products.filter((p) => p.status === "active");
  const activeStores = stores.filter((s) => s.status === "active");
  const activeDCs = dcs.filter((d) => d.status === "active");

  const [solicitudes, setSolicitudes] = useState<ReplenishmentRequest[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Recommendation[]>([]);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const authUserId = await getCurrentAuthUserId().catch(() => null);
        if (cancelled) return;
        setCurrentAuthUserId(authUserId);

        const [reqs, recs] = await Promise.all([
          getSolicitudesReposicion(),
          getRecomendaciones({ authUserId, name: currentUserName }),
        ]);
        if (!cancelled) {
          setSolicitudes(reqs);
          setRecomendaciones(recs);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "No se pudieron cargar los datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserName]);

  const [openCreate, setOpenCreate] = useState(false);
  const [sourceRequestId, setSourceRequestId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState("");
  const [coverageWarning, setCoverageWarning] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [openReview, setOpenReview] = useState<Recommendation | null>(null);
  const [reviewMode, setReviewMode] = useState<"detalle" | "rechazo" | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [reviewForm, setReviewForm] = useState<{
    quantity: string;
    originDcId: string;
  } | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewCoverageWarning, setReviewCoverageWarning] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const pendingSolicitudes = solicitudes.filter((s) => s.status === "Pendiente");

  const refreshRecomendaciones = async () => {
    const recs = await getRecomendaciones({
      authUserId: currentAuthUserId,
      name: currentUserName,
    });
    setRecomendaciones(recs);
  };

  const handleOpenCreate = (requestId: number | null) => {
    const request = requestId ? solicitudes.find((s) => s.id === requestId) : null;
    setSourceRequestId(requestId);
    setCreateForm({
      productId: request ? request.productId : "",
      quantity: request ? String(request.quantity) : "",
      originDcId: "",
      destStoreId: request ? String(request.storeId) : "",
    });
    setCreateError("");
    setCoverageWarning(null);
    setOpenCreate(true);
  };

  const closeCreate = () => {
    setOpenCreate(false);
    setSourceRequestId(null);
    setCreateForm(emptyCreateForm);
    setCreateError("");
    setCoverageWarning(null);
  };

  const handleChangeCreateDc = (value: string) => {
    setCreateForm((prev) => ({ ...prev, originDcId: value }));
    setCoverageWarning(null);
    setCreateError("");
  };

  const handleCreate = async (confirmarFueraDeCobertura = false) => {
    setCreateError("");
    if (!createForm.productId || !createForm.quantity || !createForm.originDcId || !createForm.destStoreId) {
      setCreateError("Completa producto, cantidad, CD de origen y tienda destino");
      return;
    }
    const quantity = Number(createForm.quantity);
    if (!quantity || quantity <= 0) {
      setCreateError("Indica una cantidad válida");
      return;
    }

    setCreating(true);
    try {
      const rec = await crearRecomendacion(
        {
          productId: createForm.productId,
          quantity,
          originDcId: Number(createForm.originDcId),
          destStoreId: Number(createForm.destStoreId),
          confirmarFueraDeCobertura,
        },
        { authUserId: currentAuthUserId, name: currentUserName },
      );
      setRecomendaciones((prev) => [rec, ...prev]);
      closeCreate();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409 && /cobertura/i.test(err.message)) {
        setCoverageWarning(err.message);
      } else {
        setCreateError(err?.message || "No se pudo crear la recomendación");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReview = (rec: Recommendation) => {
    setOpenReview(rec);
    setReviewForm({
      quantity: String(rec.quantity),
      originDcId: String(rec.originDcId),
    });
    setReviewMode("detalle");
    setRejectMotivo("");
    setReviewError("");
    setReviewCoverageWarning(null);
  };

  const closeReview = () => {
    setOpenReview(null);
    setReviewMode(null);
    setReviewForm(null);
    setRejectMotivo("");
    setReviewError("");
    setReviewCoverageWarning(null);
  };

  const handleChangeReviewQuantity = (value: string) => {
    if (!reviewForm) return;
    setReviewForm({ ...reviewForm, quantity: value });
    setReviewError("");
  };

  const handleChangeReviewDc = (value: string) => {
    if (!reviewForm) return;
    setReviewForm({ ...reviewForm, originDcId: value });
    setReviewCoverageWarning(null);
    setReviewError("");
  };

  const handleAprobar = async (confirmarFueraDeCobertura = false) => {
    if (!openReview || !reviewForm) return;
    const quantity = Number(reviewForm.quantity);
    const originDcId = Number(reviewForm.originDcId);
    if (!quantity || quantity <= 0) {
      setReviewError("Indica una cantidad válida");
      return;
    }
    if (!originDcId) {
      setReviewError("Selecciona un CD de origen");
      return;
    }

    setReviewing(true);
    setReviewError("");
    try {
      await aprobarRecomendacion(openReview.id, {
        cantidad: quantity,
        centroDistribucionOrigenId: originDcId,
        confirmarFueraDeCobertura,
      });
      closeReview();
      try {
        await refreshRecomendaciones();
      } catch (refreshErr: any) {
        setError(
          refreshErr?.message ||
            "La recomendación se aprobó, pero no se pudo actualizar la lista.",
        );
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409 && /cobertura/i.test(err.message)) {
        setReviewCoverageWarning(err.message);
      } else {
        setReviewError(err?.message || "No se pudo aprobar la recomendación");
      }
    } finally {
      setReviewing(false);
    }
  };

  const handleRechazar = async () => {
    if (!openReview || !rejectMotivo.trim()) return;
    setReviewing(true);
    setReviewError("");
    try {
      await rechazarRecomendacion(
        openReview.id,
        rejectMotivo.trim(),
        { authUserId: currentAuthUserId, name: currentUserName },
      );
      closeReview();
      try {
        await refreshRecomendaciones();
      } catch (refreshErr: any) {
        setError(
          refreshErr?.message ||
            "La recomendación se rechazó, pero no se pudo actualizar la lista.",
        );
      }
    } catch (err: any) {
      setReviewError(err?.message || "No se pudo rechazar la recomendación");
    } finally {
      setReviewing(false);
    }
  };

  const nombreProducto = (id: string, fallback?: string) =>
    fallback ?? products.find((p) => p.id === id)?.name ?? id;
  const nombreTienda = (id: number) =>
    stores.find((s) => s.id === id)?.name ?? String(id);
  const nombreCD = (id: number) => dcs.find((d) => d.id === id)?.name ?? String(id);

  const ordenesAprobadas = recomendaciones.filter((r) => r.status === "Aprobada");

  return (
    <div>
      <SectionHeader
        title="Recomendaciones"
        action={<Btn onClick={() => handleOpenCreate(null)}>+ Crear recomendación</Btn>}
      />
      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Solicitudes de tiendas
            </h3>
            {pendingSolicitudes.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {pendingSolicitudes.length} {pendingSolicitudes.length === 1 ? "pendiente" : "pendientes"}
              </span>
            )}
          </div>
          {loading ? (
            <p className="text-xs text-[var(--text-muted)]">Cargando…</p>
          ) : pendingSolicitudes.length === 0 ? (
            <EmptyState message="Sin solicitudes pendientes" />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingSolicitudes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] leading-snug">
                      {nombreProducto(s.productId, s.nombreProducto)}
                    </p>
                    <p className="text-xs font-medium text-[var(--text)] mt-0.5">
                      {s.quantity} uds
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {nombreTienda(s.storeId)}
                    </p>
                  </div>
                  <span className="shrink-0" title="Crear recomendación">
                    <Btn
                      size="sm"
                      onClick={() => handleOpenCreate(s.id)}
                      className="!px-2.5"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Crear recomendación">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </Btn>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Órdenes de reposición
            </h3>
            {ordenesAprobadas.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {ordenesAprobadas.length} {ordenesAprobadas.length === 1 ? "aprobada" : "aprobadas"}
              </span>
            )}
          </div>
          {ordenesAprobadas.length === 0 ? (
            <EmptyState message="Sin órdenes de reposición" />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {ordenesAprobadas.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] leading-snug">
                      {nombreProducto(o.productId, o.nombreProducto)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {nombreTienda(o.destStoreId)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[var(--text)]">
                    {o.quantity} uds
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Recomendaciones
          </h3>
          {recomendaciones.length > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {recomendaciones.length} {recomendaciones.length === 1 ? "registro" : "registros"}
            </span>
          )}
        </div>
        {recomendaciones.length === 0 ? (
          <EmptyState message="Sin recomendaciones" />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recomendaciones.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      {nombreProducto(r.productId, r.nombreProducto)}
                    </span>
                    <span className="text-xs font-medium text-[var(--text)]">
                      {r.quantity} uds
                    </span>
                    {r.fueraDeCobertura && (
                      <Badge variant="warning">Fuera de cobertura</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {nombreTienda(r.destStoreId)} · CD {nombreCD(r.originDcId)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.status === "Aprobada" ? "success" : r.status === "Rechazada" ? "danger" : "warning"}>
                    {r.status}
                  </Badge>
                  <Btn size="sm" onClick={() => handleOpenReview(r)}>
                    Revisar
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {openCreate && (
        <Modal title="Crear recomendación" onClose={closeCreate}>
          <div className="space-y-4">
            {createError && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{createError}</span>
              </div>
            )}
            <div>
              <Label>Producto</Label>
              <Select
                value={createForm.productId}
                onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
                required
                disabled={sourceRequestId !== null}
              >
                <option value="">Selecciona un producto…</option>
                {sourceRequestId !== null &&
                  createForm.productId &&
                  !activeProducts.some((p) => p.id === createForm.productId) && (
                    <option value={createForm.productId}>
                      {products.find((p) => p.id === createForm.productId)?.name ?? createForm.productId} (inactivo)
                    </option>
                  )}
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>CD de origen</Label>
              <Select value={createForm.originDcId} onChange={(e) => handleChangeCreateDc(e.target.value)} required>
                <option value="">Selecciona un CD…</option>
                {activeDCs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Tienda destino</Label>
              <Select
                value={createForm.destStoreId}
                onChange={(e) => setCreateForm({ ...createForm, destStoreId: e.target.value })}
                required
                disabled={sourceRequestId !== null}
              >
                <option value="">Selecciona una tienda…</option>
                {sourceRequestId !== null &&
                  createForm.destStoreId &&
                  !activeStores.some((s) => String(s.id) === createForm.destStoreId) && (
                    <option value={createForm.destStoreId}>
                      {stores.find((s) => String(s.id) === createForm.destStoreId)?.name ?? createForm.destStoreId} (inactiva)
                    </option>
                  )}
                {activeStores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            {coverageWarning && (
              <div className="rounded-md border border-[var(--warning)] bg-[var(--warning-light)] p-4 text-sm text-[var(--text)]">
                <p>{coverageWarning}</p>
                <p className="mt-3 font-medium">¿Deseas cambiar el origen?</p>
                <div className="mt-2 flex gap-2">
                  <Btn
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCreateForm((prev) => ({ ...prev, originDcId: "" }));
                      setCoverageWarning(null);
                    }}
                  >
                    Cambiar origen
                  </Btn>
                  <Btn size="sm" onClick={() => handleCreate(true)} disabled={creating}>
                    Confirmar de todas formas
                  </Btn>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Btn variant="secondary" onClick={closeCreate} disabled={creating}>Cancelar</Btn>
              <Btn onClick={() => handleCreate(false)} disabled={creating}>
                {creating ? "Creando..." : "Crear recomendación"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {openReview && (
        <Modal title="Revisar recomendación" onClose={closeReview}>
          <div className="space-y-4">
            <div>
              <Label>Producto</Label>
              <p className="text-sm text-[var(--text)]">
                {nombreProducto(openReview.productId, openReview.nombreProducto)}
              </p>
            </div>
            <div>
              <Label>Cantidad</Label>
              {openReview.status === "Propuesta" ? (
                <Input
                  type="number"
                  min="1"
                  value={reviewForm?.quantity ?? ""}
                  onChange={(e) => handleChangeReviewQuantity(e.target.value)}
                />
              ) : (
                <p className="text-sm text-[var(--text)]">{openReview.quantity} uds</p>
              )}
            </div>
            <div>
              <Label>CD de origen</Label>
              {openReview.status === "Propuesta" ? (
                <Select
                  value={reviewForm?.originDcId ?? ""}
                  onChange={(e) => handleChangeReviewDc(e.target.value)}
                >
                  <option value="">Selecciona un CD…</option>
                  {activeDCs.map((dc) => (
                    <option key={dc.id} value={dc.id}>
                      {dc.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-sm text-[var(--text)]">{nombreCD(openReview.originDcId)}</p>
              )}
            </div>
            <div>
              <Label>Tienda destino</Label>
              <p className="text-sm text-[var(--text)]">{nombreTienda(openReview.destStoreId)}</p>
            </div>
            {reviewError && (
              <p className="text-xs text-[var(--danger)]">{reviewError}</p>
            )}
            {reviewCoverageWarning && (
              <div className="rounded-md border border-[var(--warning)] bg-[var(--warning-light)] p-4 text-sm text-[var(--text)]">
                <p>{reviewCoverageWarning}</p>
                <p className="mt-3 font-medium">¿Deseas cambiar el origen?</p>
                <div className="mt-2 flex gap-2">
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setReviewForm((prev) => (prev ? { ...prev, originDcId: "" } : prev));
                      setReviewCoverageWarning(null);
                    }}
                  >
                    Cambiar origen
                  </Btn>
                  <Btn size="sm" onClick={() => handleAprobar(true)} disabled={reviewing}>
                    Confirmar de todas formas
                  </Btn>
                </div>
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Historial de decisiones</h3>
              <div className="overflow-x-auto rounded-md border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Fecha y hora</th>
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Usuario responsable</th>
                      <th className="px-2 py-2 text-left font-medium text-[var(--text-muted)]">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openReview.history.map((entry, index) => (
                      <tr key={`${entry.date}-${index}`} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-2 text-[var(--text-muted)]">{entry.date}</td>
                        <td className="px-2 py-2">{entry.user}</td>
                        <td className="px-2 py-2">{entry.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {openReview.status === "Propuesta" && reviewMode === "rechazo" && (
              <div>
                <Label>Motivo del rechazo</Label>
                <Input
                  value={rejectMotivo}
                  onChange={(e) => {
                    setRejectMotivo(e.target.value);
                    setReviewError("");
                  }}
                  placeholder="Indica el motivo del rechazo"
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {openReview.status !== "Propuesta" ? (
                <Btn variant="secondary" onClick={closeReview}>Cerrar</Btn>
              ) : reviewMode === "rechazo" ? (
                <>
                  <Btn variant="secondary" onClick={() => setReviewMode("detalle")} disabled={reviewing}>
                    Cancelar
                  </Btn>
                  <Btn onClick={handleRechazar} disabled={reviewing || !rejectMotivo.trim()}>
                    {reviewing ? "Rechazando..." : "Confirmar rechazo"}
                  </Btn>
                </>
              ) : (
                <>
                  <Btn variant="secondary" onClick={() => setReviewMode("rechazo")} disabled={reviewing}>
                    Rechazar
                  </Btn>
                  <Btn onClick={() => handleAprobar(false)} disabled={reviewing}>
                    {reviewing ? "Aprobando..." : "Aprobar"}
                  </Btn>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
