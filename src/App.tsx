import { useState } from "react";
import type { User, Role } from "./types";
import { seedUsers, seedStores, seedDCs, seedStoreInventory, seedDCInventory } from "./data/seed";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import UsersPanel from "./pages/admin/UsersPanel";
import ProductsPanel from "./pages/admin/ProductsPanel";
import StoresPanel from "./pages/admin/StoresPanel";
import DCsPanel from "./pages/admin/DCsPanel";
import RegisterSale from "./pages/store/RegisterSale";
import RegisterReceipt from "./pages/dc/RegisterReceipt";
import InventoryView from "./pages/shared/InventoryView";

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
