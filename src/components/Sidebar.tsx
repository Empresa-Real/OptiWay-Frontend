import { useState } from "react";
import type { UserRole } from "../types";
import { ContrastToggle } from "./ContrastToggle";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  integrated: boolean;
}

const NAV_ADMIN: NavItem[] = [
  { id: "users", label: "Usuarios", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", integrated: true },
  { id: "products", label: "Productos", icon: "M4 7h16M4 12h16M4 17h16", integrated: true },
  { id: "stores", label: "Tiendas", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", integrated: true },
  { id: "dcs", label: "Centros de distribución", icon: "M21 10H3M21 6H3M21 14H3M21 18H3", integrated: true },
];

const NAV_STORE: NavItem[] = [
  { id: "sale", label: "Registrar venta", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", integrated: true },
  { id: "inventory", label: "Inventario", icon: "M4 7h16M4 12h16M4 17h16", integrated: true },
  { id: "solicitud-reposicion", label: "Solicitar reposición", icon: "M12 5v14M5 12h14", integrated: true },
];

const NAV_DC: NavItem[] = [
  { id: "dc-inventory", label: "Inventario", icon: "M4 7h16M4 12h16M4 17h16", integrated: true },
  { id: "dc-receipt", label: "Registrar ingreso", icon: "M12 5v14M5 12l7-7 7 7", integrated: true },
  { id: "incoming-orders", label: "Órdenes entrantes", icon: "M4 7h16M4 12h16M4 17h16", integrated: true },
];

const NAV_PLANNER: NavItem[] = [
  { id: "demand-patterns", label: "Patrones de demanda", icon: "M4 19V9M10 19V5M16 19v-7M22 19V3", integrated: true },
  { id: "product-rotation", label: "Rotación de productos", icon: "M4 7h16M4 12h16M4 17h16", integrated: true },
  { id: "recommendations", label: "Recomendaciones", icon: "M12 3v18M3 12h18", integrated: true },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: NAV_ADMIN,
  store: NAV_STORE,
  dc: NAV_DC,
  planner: NAV_PLANNER,
};

const LABEL_BY_ROLE: Record<UserRole, string> = {
  admin: "Administrador",
  store: "Encargado de tienda",
  dc: "Encargado de CD",
  planner: "Analista/Planificador",
};

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

function PadlockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-auto shrink-0 opacity-50"
    >
      <title>Módulo no integrado aún</title>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
  role: UserRole;
  screen: string;
  setScreen: (s: string) => void;
  userName: string;
  locationName: string;
  onLogout: () => void;
}) {
  // Sin fallback: un rol no mapeado no hereda el menú de otro.
  const navItems = NAV_BY_ROLE[role] ?? [];
  const roleLabel = LABEL_BY_ROLE[role] ?? "";
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("optiway-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("optiway-sidebar-collapsed", String(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return next;
    });
  };

  const sidebarWidth = collapsed ? "68px" : "var(--sidebar-w)";

  return (
    <aside
      style={{ width: sidebarWidth, minWidth: sidebarWidth, background: "var(--sidebar-bg)" }}
      className="flex flex-col h-full transition-all duration-200 overflow-hidden shrink-0"
    >
      {/* Logo + collapse toggle */}
      <div className={`pt-5 pb-4 border-b border-[var(--sidebar-border)] ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-[var(--sidebar-text)] font-semibold text-sm tracking-tight block leading-tight truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Opti-Way
                </span>
                <span className="text-[var(--sidebar-text-40)] text-[10px] uppercase tracking-wider block truncate">
                  SupplyCore
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir barra lateral" : "Comprimir barra lateral"}
            aria-label={collapsed ? "Expandir barra lateral" : "Comprimir barra lateral"}
            aria-expanded={!collapsed}
            className="p-1.5 rounded-md text-[var(--sidebar-text-60)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] transition-colors cursor-pointer shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} py-2.5 rounded-md text-sm transition-colors cursor-pointer text-left ${
              screen === item.id
                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                : "text-[var(--sidebar-text-60)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]"
            }`}
          >
            <NavIcon d={item.icon} />
            {!collapsed && <span className="leading-tight truncate">{item.label}</span>}
            {!collapsed && !item.integrated && <PadlockIcon />}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className={`py-4 border-t border-[var(--sidebar-border)] ${collapsed ? "px-2 flex flex-col items-center gap-3" : "px-4"}`}>
        {collapsed ? (
          <>
            <div
              title={`${userName} · ${roleLabel}${locationName ? ` · ${locationName}` : ""}`}
              className="w-8 h-8 rounded-full bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] text-xs font-semibold flex items-center justify-center uppercase"
            >
              {userName.trim().charAt(0) || "U"}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-1.5 rounded-md text-[var(--sidebar-text-40)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="mb-0.5 text-xs text-[var(--sidebar-text-40)] uppercase tracking-wide">{roleLabel}</div>
            <div className="text-sm text-[var(--sidebar-text-80)] font-medium truncate">{userName}</div>
            {locationName && <div className="text-xs text-[var(--sidebar-text-40)] truncate mt-0.5">{locationName}</div>}
            <div className="mt-2">
              <ContrastToggle />
            </div>
            <button
              onClick={onLogout}
              className="mt-3 text-xs text-[var(--sidebar-text-40)] hover:text-[var(--sidebar-text-70)] transition-colors cursor-pointer"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
