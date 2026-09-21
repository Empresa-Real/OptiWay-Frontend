import type { Role } from "../types";

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

export default Sidebar;
