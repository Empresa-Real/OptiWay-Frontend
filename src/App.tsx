import { useState, useEffect } from "react";
import type { User, Role, Product, Store, DC, InventoryItem } from "./types";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import UsersPanel from "./pages/admin/UsersPanel";
import ProductsPanel from "./pages/admin/ProductsPanel";
import StoresPanel from "./pages/admin/StoresPanel";
import DCsPanel from "./pages/admin/DCsPanel";
import RegisterSale from "./pages/store/RegisterSale";
import RegisterReceipt from "./pages/dc/RegisterReceipt";
import InventoryView from "./pages/shared/InventoryView";
import SetPassword from "./pages/SetPassword";
import { getCurrentUser, logout } from "./services/auth";
import { supabase } from "./services/supabase";
import { getTiendas } from "./services/tiendas";
import { getCentrosDistribucion } from "./services/centrosDistribucion";
import { getInventarioTienda, getInventarioCD } from "./services/inventario";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dcs, setDCs] = useState<DC[]>([]);
  const [inventoryStore, setInventoryStore] = useState<InventoryItem[]>([]);
  const [inventoryCD, setInventoryCD] = useState<InventoryItem[]>([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSettingPassword, setIsSettingPassword] = useState<boolean>(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    return (
      hash.includes("type=invite") ||
      hash.includes("type=recovery") ||
      hash.includes("error_code=otp_expired") ||
      hash.includes("error_description=") ||
      path.includes("set-password")
    );
  });

  const defaultScreen = (role: Role) => {
    if (role === "admin") return "users";
    if (role === "store") return "sale";
    return "dc-inventory";
  };

  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const user = await getCurrentUser();
        if (isMounted && user && user.role !== "planner") {
          setCurrentUser(user);
          setScreen(defaultScreen(user.role as Role));
        }
      } catch (err) {
        console.error("Error al restaurar sesión previa:", err);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }
    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsSettingPassword(true);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    async function loadAuxData() {
      try {
        const [storesData, dcsData] = await Promise.all([
          getTiendas().catch(() => []),
          getCentrosDistribucion().catch(() => []),
        ]);
        setStores(storesData || []);
        setDCs(dcsData || []);

        const role = currentUser.role as Role;
        const locationId = currentUser.locationId;

        if (role === "store" && locationId) {
          const inv = await getInventarioTienda({ tiendaId: locationId }).catch(() => []);
          setInventoryStore(inv || []);
        }
        if (role === "dc" && locationId) {
          const inv = await getInventarioCD({ centroDistribucionId: locationId }).catch(() => []);
          setInventoryCD(inv || []);
        }
      } catch (err) {
        console.warn("Aviso al cargar sucursales:", err);
      }
    }
    loadAuxData();
  }, [currentUser]);

  const handlePasswordSet = async () => {
    window.history.replaceState(null, "", window.location.pathname);
    setIsSettingPassword(false);
    try {
      const user = await getCurrentUser();
      if (user && user.role !== "planner") {
        setCurrentUser(user);
        setScreen(defaultScreen(user.role as Role));
      }
    } catch (err) {
      console.error("Error al obtener usuario tras configurar contraseña:", err);
    }
  };

  const handleLogin = (user: User) => {
    if (user.role === "planner") return;
    setCurrentUser(user);
    setScreen(defaultScreen(user.role as Role));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    setCurrentUser(null);
    setScreen("");
    setStores([]);
    setDCs([]);
    setUsers([]);
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
        <div className="flex items-center gap-2 text-sm">
          <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (isSettingPassword) {
    return (
      <SetPassword
        onSuccess={handlePasswordSet}
        onCancel={() => {
          window.history.replaceState(null, "", window.location.pathname);
          setIsSettingPassword(false);
        }}
      />
    );
  }

  if (!currentUser || currentUser.role === "planner") {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const role = currentUser.role as Role;

  const locationName = () => {
    if (role === "admin") return "";
    if (role === "store") {
      const s = stores.find((x) => x.id === currentUser.locationId);
      return s ? s.name : "";
    }
    const d = dcs.find((x) => x.id === currentUser.locationId);
    return d ? d.name : "";
  };

  const storeId = currentUser.locationId ?? 1;
  const dcId = currentUser.locationId ?? 1;

  const renderScreen = () => {
    switch (screen) {
      case "users":
        return <UsersPanel stores={stores} dcs={dcs} users={users} onUpdateUsers={handleUpdateUsers} />;
      case "products":
        return <ProductsPanel products={products} onUpdateProducts={handleUpdateProducts} currentUserName={currentUser.name} />;
      case "stores":
        return <StoresPanel />;
      case "dcs":
        return <DCsPanel stores={stores} />;
      case "sale":
        return <RegisterSale storeId={storeId} products={products} />;
      case "inventory":
        return (
          <InventoryView
            items={inventoryStore}
            title="Inventario de mi tienda"
            subtitle={`${stores.find((s) => s.id === storeId)?.name ?? "Tienda"} · Solo consulta`}
          />
        );
      case "dc-inventory":
        return (
          <InventoryView
            items={inventoryCD}
            title="Inventario de mi centro de distribución"
            subtitle={`${dcs.find((d) => d.id === dcId)?.name ?? "CD"} · Solo consulta`}
          />
        );
      case "dc-receipt":
        return <RegisterReceipt dcId={dcId} />;
      default:
        return null;
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