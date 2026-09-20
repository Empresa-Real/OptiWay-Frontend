import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "admin" | "store" | "dc";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role | "planner";
  locationId: number | null;
  status: "active" | "inactive";
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  status: "active" | "inactive";
}

interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  status: "active" | "inactive";
}

interface DC {
  id: number;
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
  status: "active" | "inactive";
}

interface InventoryItem {
  productId: string;
  quantity: number;
  minStock: number;
}

interface SaleRecord {
  id: number;
  productId: string;
  quantity: number;
  date: string;
  storeId: number;
}

interface ReceiptRecord {
  id: number;
  productId: string;
  quantity: number;
  origin: string;
  date: string;
  dcId: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const seedProducts: Product[] = [
  { id: "P001", name: "Camisa Oxford", category: "Camisas", price: 39.99, unit: "unidad", status: "active" },
  { id: "P002", name: "Pantalón Chino", category: "Pantalones", price: 49.99, unit: "unidad", status: "active" },
  { id: "P003", name: "Vestido Midi", category: "Vestidos", price: 59.99, unit: "unidad", status: "active" },
  { id: "P004", name: "Blazer Slim", category: "Abrigos", price: 89.99, unit: "unidad", status: "active" },
  { id: "P005", name: "Jeans Skinny", category: "Pantalones", price: 45.99, unit: "unidad", status: "active" },
  { id: "P006", name: "Camiseta Básica", category: "Camisas", price: 19.99, unit: "unidad", status: "inactive" },
  { id: "P007", name: "Falda Plisada", category: "Faldas", price: 34.99, unit: "unidad", status: "active" },
  { id: "P008", name: "Jersey Lana", category: "Sweaters", price: 54.99, unit: "unidad", status: "active" },
];

const seedStores: Store[] = [
  { id: 1, name: "Tienda Centro", address: "Av. Reforma 145", city: "Ciudad de México", status: "active" },
  { id: 2, name: "Tienda Polanco", address: "Presidente Masaryk 72", city: "Ciudad de México", status: "active" },
  { id: 3, name: "Tienda Monterrey", address: "Av. Garza Sada 302", city: "Monterrey", status: "active" },
];

const seedDCs: DC[] = [
  { id: 1, name: "CD Norte", address: "Carretera Federal 57, km 12", capacity: 5000, coverage: [1, 2], status: "active" },
  { id: 2, name: "CD Bajío", address: "Blvd. Aeropuerto 880", capacity: 3500, coverage: [3], status: "active" },
];

const seedUsers: User[] = [
  { id: 1, name: "Ana González", email: "ana@empresa.com", role: "admin", locationId: null, status: "active" },
  { id: 2, name: "Carlos Reyes", email: "carlos@empresa.com", role: "store", locationId: 1, status: "active" },
  { id: 3, name: "María López", email: "maria@empresa.com", role: "store", locationId: 2, status: "active" },
  { id: 4, name: "Roberto Silva", email: "roberto@empresa.com", role: "dc", locationId: 1, status: "active" },
  { id: 5, name: "Luisa Ramírez", email: "luisa@empresa.com", role: "dc", locationId: 2, status: "inactive" },
];

const seedStoreInventory: Record<number, InventoryItem[]> = {
  1: [
    { productId: "P001", quantity: 24, minStock: 10 },
    { productId: "P002", quantity: 6, minStock: 10 },
    { productId: "P003", quantity: 18, minStock: 8 },
    { productId: "P005", quantity: 3, minStock: 10 },
    { productId: "P007", quantity: 11, minStock: 8 },
    { productId: "P008", quantity: 9, minStock: 10 },
  ],
  2: [
    { productId: "P001", quantity: 15, minStock: 10 },
    { productId: "P002", quantity: 12, minStock: 10 },
    { productId: "P004", quantity: 5, minStock: 8 },
  ],
  3: [
    { productId: "P003", quantity: 20, minStock: 8 },
    { productId: "P005", quantity: 7, minStock: 10 },
    { productId: "P008", quantity: 4, minStock: 10 },
  ],
};

const seedDCInventory: Record<number, InventoryItem[]> = {
  1: [
    { productId: "P001", quantity: 120, minStock: 50 },
    { productId: "P002", quantity: 45, minStock: 50 },
    { productId: "P003", quantity: 88, minStock: 40 },
    { productId: "P004", quantity: 30, minStock: 40 },
    { productId: "P005", quantity: 62, minStock: 50 },
    { productId: "P007", quantity: 15, minStock: 40 },
  ],
  2: [
    { productId: "P003", quantity: 74, minStock: 40 },
    { productId: "P005", quantity: 38, minStock: 50 },
    { productId: "P008", quantity: 12, minStock: 40 },
  ],
};

// Login credentials map: email → { password, userId }
const credentials: Record<string, { password: string; userId: number }> = {
  "ana@empresa.com": { password: "admin123", userId: 1 },
  "carlos@empresa.com": { password: "tienda123", userId: 2 },
  "maria@empresa.com": { password: "tienda456", userId: 3 },
  "roberto@empresa.com": { password: "cd123", userId: 4 },
  "luisa@empresa.com": { password: "cd456", userId: 5 },
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const Badge = ({ variant, children }: { variant: "success" | "warning" | "danger" | "neutral" | "info"; children: React.ReactNode }) => {
  const styles = {
    success: "bg-[var(--success-light)] text-[var(--success)]",
    warning: "bg-[var(--warning-light)] text-[var(--warning)]",
    danger: "bg-[var(--danger-light)] text-[var(--danger)]",
    neutral: "bg-gray-100 text-gray-600",
    info: "bg-[var(--accent-light)] text-[var(--accent)]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
}) => {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary: "bg-white border border-[var(--border)] text-[var(--text)] hover:bg-gray-50",
    ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-gray-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-white text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition ${props.className ?? ""}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition ${props.className ?? ""}`}
  />
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">{children}</label>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg ${className}`}>{children}</div>
);

const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h1>
      {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

// Modal wrapper
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-base font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Table component ──────────────────────────────────────────────────────────

const Table = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-[var(--border)]">
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length}>
              <EmptyState message="Sin registros" />
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[var(--text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ADMIN = [
  { id: "users", label: "Usuarios", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" },
  { id: "products", label: "Productos", icon: "M4 7h16M4 12h16M4 17h16" },
  { id: "stores", label: "Tiendas", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dcs", label: "Centros de distribución", icon: "M21 10H3M21 6H3M21 14H3M21 18H3" },
];

const NAV_STORE = [
  { id: "sale", label: "Registrar venta", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" },
  { id: "inventory", label: "Inventario", icon: "M4 7h16M4 12h16M4 17h16" },
];

const NAV_DC = [
  { id: "dc-inventory", label: "Inventario", icon: "M4 7h16M4 12h16M4 17h16" },
  { id: "dc-receipt", label: "Registrar ingreso", icon: "M12 5v14M5 12l7-7 7 7" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Sidebar({
  role,
  screen,
  setScreen,
  userName,
  locationName,
  onLogout,
}: {
  role: Role;
  screen: string;
  setScreen: (s: string) => void;
  userName: string;
  locationName: string;
  onLogout: () => void;
}) {
  const navItems = role === "admin" ? NAV_ADMIN : role === "store" ? NAV_STORE : NAV_DC;
  const roleLabel = role === "admin" ? "Administrador" : role === "store" ? "Encargado de tienda" : "Encargado de CD";

  return (
    <aside
      style={{ width: "var(--sidebar-w)", minWidth: "var(--sidebar-w)", background: "#1A1D23" }}
      className="flex flex-col h-full"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            SupplyCore
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer text-left ${
              screen === item.id
                ? "bg-[var(--accent)] text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <NavIcon d={item.icon} />
            <span className="leading-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-0.5 text-xs text-white/40 uppercase tracking-wide">{roleLabel}</div>
        <div className="text-sm text-white/80 font-medium truncate">{userName}</div>
        {locationName && <div className="text-xs text-white/40 truncate mt-0.5">{locationName}</div>}
        <button
          onClick={onLogout}
          className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ─── Admin: Users ─────────────────────────────────────────────────────────────

function UsersPanel({ stores, dcs }: { stores: Store[]; dcs: DC[] }) {
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<User | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "store" as User["role"] });
  const [assignForm, setAssignForm] = useState({ locationId: "" });

  const locationName = (u: User) => {
    if (!u.locationId) return "—";
    const s = stores.find((x) => x.id === u.locationId);
    if (s) return s.name;
    const d = dcs.find((x) => x.id === u.locationId);
    return d ? d.name : "—";
  };

  const roleBadge = (r: User["role"]) => {
    const map: Record<User["role"], { v: "info" | "success" | "warning" | "neutral"; l: string }> = {
      admin: { v: "info", l: "Administrador" },
      store: { v: "success", l: "Enc. tienda" },
      dc: { v: "warning", l: "Enc. CD" },
      planner: { v: "neutral", l: "Planificador" },
    };
    return <Badge variant={map[r].v}>{map[r].l}</Badge>;
  };

  const handleCreate = () => {
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, email: form.email, role: form.role, locationId: null, status: "active" },
    ]);
    setForm({ name: "", email: "", role: "store" });
    setShowCreate(false);
  };

  const handleAssign = () => {
    if (!showAssign) return;
    const locId = assignForm.locationId ? Number(assignForm.locationId) : null;
    setUsers((prev) => prev.map((u) => (u.id === showAssign.id ? { ...u, locationId: locId } : u)));
    setShowAssign(null);
  };

  const rows = users.map((u) => [
    <span className="font-medium">{u.name}</span>,
    <span className="text-[var(--text-muted)]">{u.email}</span>,
    roleBadge(u.role),
    locationName(u),
    <Badge variant={u.status === "active" ? "success" : "neutral"}>{u.status === "active" ? "Activo" : "Inactivo"}</Badge>,
    <Btn size="sm" variant="ghost" onClick={() => { setShowAssign(u); setAssignForm({ locationId: String(u.locationId ?? "") }); }}>
      Asignar ubicación
    </Btn>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Usuarios"
        subtitle="Gestión de cuentas y roles del sistema"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear usuario</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Correo", "Rol", "Ubicación", "Estado", "Acciones"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear usuario" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input placeholder="Ej. Laura Martínez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input type="email" placeholder="correo@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}>
                <option value="admin">Administrador</option>
                <option value="store">Encargado de tienda</option>
                <option value="dc">Encargado de CD</option>
                <option value="planner">Planificador</option>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear usuario</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAssign && (
        <Modal title={`Asignar ubicación — ${showAssign.name}`} onClose={() => setShowAssign(null)}>
          <div className="space-y-4">
            <div>
              <Label>Ubicación</Label>
              <Select value={assignForm.locationId} onChange={(e) => setAssignForm({ locationId: e.target.value })}>
                <option value="">Sin ubicación asignada</option>
                <optgroup label="Tiendas">
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
                <optgroup label="Centros de distribución">
                  {dcs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </optgroup>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleAssign}>Guardar asignación</Btn>
              <Btn variant="secondary" onClick={() => setShowAssign(null)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Admin: Products ──────────────────────────────────────────────────────────

function ProductsPanel() {
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

// ─── Admin: Stores ────────────────────────────────────────────────────────────

function StoresPanel() {
  const [stores, setStores] = useState<Store[]>(seedStores);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "" });

  const handleCreate = () => {
    if (!form.name || !form.city) return;
    setStores((prev) => [...prev, { id: Date.now(), ...form, status: "active" }]);
    setForm({ name: "", address: "", city: "" });
    setShowCreate(false);
  };

  const rows = stores.map((s) => [
    <span className="font-medium">{s.name}</span>,
    s.address,
    s.city,
    <Badge variant={s.status === "active" ? "success" : "neutral"}>{s.status === "active" ? "Activa" : "Inactiva"}</Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Gestión de tiendas"
        subtitle="Sucursales registradas en la red"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear tienda</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Dirección", "Ciudad", "Estado"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear tienda" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la tienda</Label>
              <Input placeholder="Ej. Tienda Guadalajara" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input placeholder="Av. Principal 100" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input placeholder="Ej. Guadalajara" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear tienda</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Admin: Distribution Centers ──────────────────────────────────────────────

function DCsPanel({ stores }: { stores: Store[] }) {
  const [dcs, setDCs] = useState<DC[]>(seedDCs);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", capacity: "", coverage: [] as number[] });

  const handleCreate = () => {
    if (!form.name) return;
    setDCs((prev) => [...prev, { id: Date.now(), name: form.name, address: form.address, capacity: Number(form.capacity), coverage: form.coverage, status: "active" }]);
    setForm({ name: "", address: "", capacity: "", coverage: [] });
    setShowCreate(false);
  };

  const toggleCoverage = (id: number) => {
    setForm((f) => ({
      ...f,
      coverage: f.coverage.includes(id) ? f.coverage.filter((x) => x !== id) : [...f.coverage, id],
    }));
  };

  const coverageNames = (ids: number[]) =>
    ids.map((id) => stores.find((s) => s.id === id)?.name ?? "—").join(", ") || "—";

  const rows = dcs.map((d) => [
    <span className="font-medium">{d.name}</span>,
    d.address,
    <span>{d.capacity.toLocaleString()} pzas</span>,
    <span className="text-sm text-[var(--text-muted)]">{coverageNames(d.coverage)}</span>,
    <Badge variant={d.status === "active" ? "success" : "neutral"}>{d.status === "active" ? "Activo" : "Inactivo"}</Badge>,
  ]);

  return (
    <div>
      <SectionHeader
        title="Centros de distribución"
        subtitle="Almacenes y zonas de cobertura"
        action={<Btn onClick={() => setShowCreate(true)}>+ Crear CD</Btn>}
      />
      <Card>
        <Table headers={["Nombre", "Dirección", "Capacidad", "Cobertura", "Estado"]} rows={rows} />
      </Card>

      {showCreate && (
        <Modal title="Crear centro de distribución" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input placeholder="Ej. CD Sur" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input placeholder="Calle y número" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Capacidad (unidades)</Label>
              <Input type="number" placeholder="5000" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div>
              <Label>Zona de cobertura (tiendas)</Label>
              <div className="space-y-2 mt-1">
                {stores.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.coverage.includes(s.id)}
                      onChange={() => toggleCoverage(s.id)}
                      className="accent-[var(--accent)]"
                    />
                    {s.name} — {s.city}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn onClick={handleCreate}>Crear CD</Btn>
              <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Store: Register Sale ─────────────────────────────────────────────────────

function RegisterSale({ storeId }: { storeId: number }) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "", date: new Date().toISOString().slice(0, 16) });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;
    setSales((prev) => [...prev, { id: Date.now(), productId: form.productId, quantity: Number(form.quantity), date: form.date, storeId }]);
    setForm({ productId: "", quantity: "", date: new Date().toISOString().slice(0, 16) });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const productName = (id: string) => seedProducts.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <SectionHeader title="Registrar venta" subtitle="Ingresa los datos de la venta en tienda" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Producto</Label>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">Selecciona un producto…</option>
                {seedProducts.filter((p) => p.status === "active").map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" min="1" placeholder="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Fecha y hora</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Venta registrada correctamente
              </div>
            )}
            <Btn type="submit">Registrar venta</Btn>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Ventas recientes</h3>
          {sales.length === 0 ? (
            <EmptyState message="No hay ventas registradas aún" />
          ) : (
            <div className="space-y-2">
              {[...sales].reverse().slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
                  <span className="font-medium">{productName(s.productId)}</span>
                  <span className="text-[var(--text-muted)]">{s.quantity} uds · {new Date(s.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Inventory (shared for store & DC) ───────────────────────────────────────

function InventoryView({ items, title, subtitle }: { items: InventoryItem[]; title: string; subtitle?: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    items.filter((item) => {
      const p = seedProducts.find((x) => x.id === item.productId);
      if (!p) return false;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        item.productId.toLowerCase().includes(search.toLowerCase())
      );
    }), [items, search]);

  const rows = filtered.map((item) => {
    const p = seedProducts.find((x) => x.id === item.productId);
    const low = item.quantity < item.minStock;
    return [
      <span className="font-medium">{p?.name ?? item.productId}</span>,
      p?.category ?? "—",
      <span className={`font-semibold ${low ? "text-[var(--warning)]" : "text-[var(--text)]"}`}>
        {item.quantity} {p?.unit ?? "uds"}
        {low && (
          <span className="ml-2">
            <Badge variant="warning">Stock bajo</Badge>
          </span>
        )}
      </span>,
    ];
  });

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="mb-4">
        <Input placeholder="Buscar por producto, categoría o ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <Table headers={["Producto", "Categoría", "Cantidad disponible"]} rows={rows} />
      </Card>
      <p className="mt-3 text-xs text-[var(--text-muted)]">Vista de solo consulta — las cantidades se actualizan con las ventas e ingresos registrados.</p>
    </div>
  );
}

// ─── DC: Register Receipt ─────────────────────────────────────────────────────

function RegisterReceipt({ dcId }: { dcId: number }) {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "", origin: "Proveedor" });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;
    setReceipts((prev) => [...prev, { id: Date.now(), productId: form.productId, quantity: Number(form.quantity), origin: form.origin, date: new Date().toISOString(), dcId }]);
    setForm({ productId: "", quantity: "", origin: "Proveedor" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const productName = (id: string) => seedProducts.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <SectionHeader title="Registrar ingreso de mercancía" subtitle="Documenta la entrada de productos al centro de distribución" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Producto</Label>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">Selecciona un producto…</option>
                {seedProducts.filter((p) => p.status === "active").map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" min="1" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Origen</Label>
              <Select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
                <option value="Proveedor">Proveedor</option>
                <option value="Otro centro de distribución">Otro centro de distribución</option>
              </Select>
            </div>
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success-light)] rounded-md px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                Ingreso registrado correctamente
              </div>
            )}
            <Btn type="submit">Registrar ingreso</Btn>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Ingresos recientes</h3>
          {receipts.length === 0 ? (
            <EmptyState message="No hay ingresos registrados aún" />
          ) : (
            <div className="space-y-2">
              {[...receipts].reverse().slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
                  <div>
                    <span className="font-medium">{productName(r.productId)}</span>
                    <span className="ml-2 text-xs text-[var(--text-muted)]">{r.origin}</span>
                  </div>
                  <span className="text-[var(--text-muted)]">{r.quantity} uds</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cred = credentials[email.trim().toLowerCase()];
    if (!cred || cred.password !== password) {
      setError("Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.");
      return;
    }
    const user = seedUsers.find((u) => u.id === cred.userId);
    if (user) onLogin(user);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 p-10" style={{ background: "#1A1D23" }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
              </svg>
            </div>
            <span className="text-white font-semibold text-base tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>SupplyCore</span>
          </div>
          <h2 className="text-white text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Sistema de gestión de cadena de suministro
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Administra tu catálogo, operación y personal desde un solo lugar.
          </p>
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/30 text-xs">Sprint 1 · Versión 1.0</p>
          <p className="text-white/20 text-xs mt-0.5">Proyecto académico</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--text)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Iniciar sesión</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Accede con tu cuenta institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-md px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}
            <Btn type="submit" size="md">Iniciar sesión</Btn>
          </form>

          <div className="mt-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Cuentas de prueba</p>
            <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
              <div className="flex justify-between"><span>ana@empresa.com</span><span className="font-mono">admin123</span></div>
              <div className="flex justify-between"><span>carlos@empresa.com</span><span className="font-mono">tienda123</span></div>
              <div className="flex justify-between"><span>roberto@empresa.com</span><span className="font-mono">cd123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<string>("");

  const defaultScreen = (role: Role) => {
    if (role === "admin") return "users";
    if (role === "store") return "sale";
    return "dc-inventory";
  };

  const handleLogin = (user: User) => {
    if (user.role === "planner") return;
    setCurrentUser(user);
    setScreen(defaultScreen(user.role as Role));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("");
  };

  if (!currentUser || currentUser.role === "planner") {
    return <Login onLogin={handleLogin} />;
  }

  const role = currentUser.role as Role;

  const locationName = () => {
    if (role === "admin") return "";
    if (role === "store") {
      const s = seedStores.find((x) => x.id === currentUser.locationId);
      return s ? s.name : "";
    }
    const d = seedDCs.find((x) => x.id === currentUser.locationId);
    return d ? d.name : "";
  };

  const storeId = currentUser.locationId ?? 1;
  const dcId = currentUser.locationId ?? 1;

  const renderScreen = () => {
    switch (screen) {
      case "users": return <UsersPanel stores={seedStores} dcs={seedDCs} />;
      case "products": return <ProductsPanel />;
      case "stores": return <StoresPanel />;
      case "dcs": return <DCsPanel stores={seedStores} />;
      case "sale": return <RegisterSale storeId={storeId} />;
      case "inventory": return (
        <InventoryView
          items={seedStoreInventory[storeId] ?? []}
          title="Inventario de mi tienda"
          subtitle={`${seedStores.find((s) => s.id === storeId)?.name ?? ""} · Solo consulta`}
        />
      );
      case "dc-inventory": return (
        <InventoryView
          items={seedDCInventory[dcId] ?? []}
          title="Inventario de mi centro de distribución"
          subtitle={`${seedDCs.find((d) => d.id === dcId)?.name ?? ""} · Solo consulta`}
        />
      );
      case "dc-receipt": return <RegisterReceipt dcId={dcId} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Sidebar
        role={role}
        screen={screen}
        setScreen={setScreen}
        userName={currentUser.name}
        locationName={locationName()}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
}
