import { useState, useMemo } from "react";
import type { Product } from "../../types";
import { seedProducts } from "../../data/seed";
import { Badge, Btn, Input, Select, Label, Card, SectionHeader, Modal, Table } from "../../components/ui";

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", category: "", price: "", unit: "unidad" });

  const filtered = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

  const handleCreate = () => {
    if (!form.id || !form.name || !form.category) return;
    setProducts((prev) => [...prev, { ...form, price: Number(form.price), status: "active" }]);
    setForm({ id: "", name: "", category: "", price: "", unit: "unidad" });
    setShowCreate(false);
  };

  const rows = filtered.map((p) => [
    <span className="font-mono text-xs text-[var(--text-muted)]">{p.id}</span>,
    <span className="font-medium">{p.name}</span>,
    p.category,
    `$${p.price.toFixed(2)}`,
    p.unit,
    <Badge variant={p.status === "active" ? "success" : "neutral"}>{p.status === "active" ? "Activo" : "Inactivo"}</Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Catálogo de productos"
        subtitle="Todos los artículos registrados en el sistema"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear producto</Btn>}
      />
      <div className="mb-4">
        <Input placeholder="Buscar por nombre o categoría…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <Table headers={["ID", "Nombre", "Categoría", "Precio", "Unidad", "Estado"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear producto" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Identificador</Label>
                <Input placeholder="P009" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              </div>
              <div>
                <Label>Precio (MXN)</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Nombre del producto</Label>
              <Input placeholder="Ej. Camisa de lino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Input placeholder="Ej. Camisas" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Guardar producto</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
