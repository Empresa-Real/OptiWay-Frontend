import { useState, useMemo } from "react";
import type { Product, ProductEdit } from "../../types";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";
import { getProductos, createProducto, updateProducto, cambiarEstadoProducto } from "../../services/productos";
import { cleanErrorMessage } from "../../services/http";

export default function ProductsPanel({
  products: initialProducts,
  onUpdateProducts,
  currentUserName,
}: {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  currentUserName: string;
}) {
  // La fuente de verdad es App (que ya carga el catálogo en loadAuxData).
  // Antes había una copia local + un useEffect que repetía GET /api/productos.
  const products = initialProducts;
  const [productEdits, setProductEdits] = useState<Record<string, ProductEdit[]>>({});
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ id: "", identificador: "", name: "", category: "", price: "", unit: "unidad" });
  const [priceError, setPriceError] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadProductos = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await getProductos();
      onUpdateProducts(data || []);
    } catch (err: any) {
      console.warn("Aviso al consultar /api/productos:", err?.message || err);
      setError(cleanErrorMessage(err?.message || "Error al cargar productos", err?.status, err?.data));
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.identificador.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({ id: "", identificador: "", name: "", category: "", price: "", unit: "unidad" });
    setPriceError(false);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      id: product.id,
      identificador: product.identificador,
      name: product.name,
      category: product.category,
      price: String(product.price),
      unit: product.unit,
    });
    setPriceError(false);
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) return;
    const price = Number(form.price);
    if (price <= 0) {
      setPriceError(true);
      return;
    }
    setPriceError(false);
    setSubmitting(true);
    setError("");

    try {
      if (editingProduct) {
        // Track changes for edit history
        const changes: string[] = [];
        if (editingProduct.name !== form.name) changes.push(`Nombre: ${editingProduct.name} → ${form.name}`);
        if (editingProduct.category !== form.category) changes.push(`Categoría: ${editingProduct.category} → ${form.category}`);
        if (editingProduct.price !== price) changes.push(`Precio: ${editingProduct.price} → ${price}`);
        if (editingProduct.unit !== form.unit) changes.push(`Unidad: ${editingProduct.unit} → ${form.unit}`);

        if (changes.length > 0) {
          const newEdit: ProductEdit = {
            date: new Date().toISOString().slice(0, 10),
            user: currentUserName,
            change: changes.join("; "),
          };
          setProductEdits((prev) => ({
            ...prev,
            [editingProduct.id]: [newEdit, ...(prev[editingProduct.id] || [])].slice(0, 10),
          }));
        }

        const updated = await updateProducto(editingProduct.id, {
          nombre: form.name.trim(),
          categoria: form.category.trim(),
          price,
          unit: form.unit.trim(),
        });

        const newProducts = products.map((p) =>
          p.id === editingProduct.id ? { ...updated, identificador: updated.identificador ?? editingProduct.identificador } : p
        );
        onUpdateProducts(newProducts);
        setSuccessMessage("Producto actualizado");
      } else {
        if (!form.identificador) {
          setError("El identificador es obligatorio");
          setSubmitting(false);
          return;
        }

        const created = await createProducto({
          identificador: form.identificador.trim(),
          nombre: form.name.trim(),
          categoria: form.category.trim(),
          price,
          unit: form.unit.trim(),
        });

        const newProducts = [created, ...products];
        onUpdateProducts(newProducts);
        setSuccessMessage("Producto creado");
      }

      setForm({ id: "", identificador: "", name: "", category: "", price: "", unit: "unidad" });
      setShowModal(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error al guardar producto:", err?.data || err);
      setError(cleanErrorMessage(err?.message || "Error al guardar el producto", err?.status, err?.data));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = (product: Product) => {
    setShowDeactivate(product);
  };

  const handleReactivate = async (product: Product) => {
    setSubmitting(true);
    setError("");
    try {
      const updated = await cambiarEstadoProducto(product.id, true);
      const newProducts = products.map((p) =>
        p.id === product.id ? { ...updated, identificador: updated.identificador ?? product.identificador } : p
      );
      onUpdateProducts(newProducts);
      setSuccessMessage("Producto reactivado");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(cleanErrorMessage(err?.message || "Error al reactivar el producto", err?.status, err?.data));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!showDeactivate) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await cambiarEstadoProducto(showDeactivate.id, false);
      const newProducts = products.map((p) =>
        p.id === showDeactivate.id ? { ...updated, identificador: updated.identificador ?? showDeactivate.identificador } : p
      );
      onUpdateProducts(newProducts);
      setShowDeactivate(null);
      setSuccessMessage("Producto desactivado");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(cleanErrorMessage(err?.message || "Error al desactivar el producto", err?.status, err?.data));
    } finally {
      setSubmitting(false);
    }
  };

  const getEditHistory = (productId: string) => {
    return productEdits[productId]?.slice(0, 3) || [];
  };

  const rows = filtered.map((p) => [
    <span className="font-mono text-xs text-[var(--text-muted)]">{p.identificador}</span>,
    <span className="font-medium">{p.name}</span>,
    p.category,
    `$${p.price.toFixed(2)}`,
    p.unit,
    <Badge variant={p.status === "active" ? "success" : "neutral"}>
      {p.status === "active" ? "Activo" : "Inactivo"}
    </Badge>,
    <div className="flex items-center gap-2">
      <Btn size="sm" variant="ghost" onClick={() => handleOpenEdit(p)}>
        Editar
      </Btn>
      {p.status === "active" ? (
        <Btn size="sm" variant="ghost" onClick={() => handleDeactivate(p)} className="text-[var(--danger)]">
          Desactivar
        </Btn>
      ) : (
        <Btn size="sm" variant="ghost" onClick={() => handleReactivate(p)} className="text-[var(--success)]">
          Reactivar
        </Btn>
      )}
    </div>,
  ]);

  const modalTitle = editingProduct ? "Editar producto" : "Crear producto";
  const submitLabel = editingProduct ? "Guardar cambios" : "Guardar producto";

  return (
    <div>
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
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {successMessage}
        </div>
      )}
      <SectionHeader
        title="Catálogo de productos"
        subtitle="Todos los artículos registrados en el sistema"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="md" onClick={loadProductos} disabled={refreshing}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Btn>
            <Btn onClick={handleOpenCreate}>+ Crear producto</Btn>
          </div>
        }
      />
      <div className="mb-4">
        <Input placeholder="Buscar por nombre o categoría…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <Table headers={["ID", "Nombre", "Categoría", "Precio", "Unidad", "Estado", "Acciones"]} rows={rows} />
      </Card>

      {showModal && (
        <Modal title={modalTitle} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Identificador</Label>
                <Input
                  placeholder="P009"
                  value={form.identificador}
                  onChange={(e) => setForm({ ...form, identificador: e.target.value })}
                  disabled={!!editingProduct}
                />
                {editingProduct && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">El identificador no se puede modificar una vez creado</p>
                )}
              </div>
              <div>
                <Label>Precio (MXN)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={priceError ? "border-[var(--danger)]" : ""}
                />
                {priceError && <p className="text-xs text-[var(--danger)] mt-1">El precio debe ser mayor a cero</p>}
              </div>
            </div>
            <div>
              <Label>Nombre del producto</Label>
              <Input
                placeholder="Ej. Camisa de lino"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Input
                placeholder="Ej. Camisas"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Unidad de medida</Label>
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="unidad">Unidad</option>
                <option value="par">Par</option>
                <option value="caja">Caja</option>
                <option value="kg">Kilogramo</option>
              </Select>
            </div>

            {editingProduct && getEditHistory(editingProduct.id).length > 0 && (
              <div className="border-t border-[var(--border)] pt-4 mt-2">
                <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  Historial de ediciones (últimas 3)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-2 py-1.5 text-[var(--text-muted)]">Fecha</th>
                        <th className="text-left px-2 py-1.5 text-[var(--text-muted)]">Usuario</th>
                        <th className="text-left px-2 py-1.5 text-[var(--text-muted)]">Cambios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getEditHistory(editingProduct.id).map((edit, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0">
                          <td className="px-2 py-1.5 text-[var(--text)]">{edit.date}</td>
                          <td className="px-2 py-1.5 text-[var(--text)]">{edit.user}</td>
                          <td className="px-2 py-1.5 text-[var(--text)]">{edit.change}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleSave}>{submitLabel}</Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {showDeactivate && (
        <Modal title="Confirmar desactivación" onClose={() => setShowDeactivate(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text)]">
              ¿Estás seguro de desactivar <strong>{showDeactivate.name}</strong>? El producto no estará disponible para
              ventas ni recepciones.
            </p>
            <div className="flex gap-2 pt-1 justify-end">
              <Btn onClick={confirmDeactivate} variant="primary" className="bg-[var(--danger)] border-[var(--danger)]">
                Desactivar
              </Btn>
              <Btn variant="secondary" onClick={() => setShowDeactivate(null)}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
}