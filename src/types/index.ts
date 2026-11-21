export type Role = "admin" | "store" | "dc";
export type UserRole = Role | "planner";

export type AsignacionTipo = "tienda" | "cd";

/**
 * Ubicación a la que está asignado un usuario con rol de encargado.
 * El `tipo` es obligatorio: un id suelto no alcanza para saber si es
 * una tienda o un centro de distribución.
 */
export interface Asignacion {
  tipo: AsignacionTipo;
  id: number;
  nombre?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  asignacion: Asignacion | null;
  status: "active" | "inactive";
}

export interface Product {
  id: string;
  identificador: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  status: "active" | "inactive";
}

export interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  status: "active" | "inactive";
  encargadoId?: number | null;
}

export interface DC {
  id: number;
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
  status: "active" | "inactive";
  encargadoId?: number | string;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  minStock: number;
  nombreProducto?: string;
  categoriaProducto?: string;
  stockBajo?: boolean;
}

export interface SaleRecord {
  id: number;
  productId: string;
  quantity: number;
  date: string;
  storeId: number;
}

export interface ReceiptRecord {
  id: number;
  productId: string;
  quantity: number;
  origin: string;
  date: string;
  dcId: number;
}

export interface ProductEdit {
  date: string;
  user: string;
  change: string;
}

export interface Order {
  id: number;
  productId: string;
  quantity: number;
  originDcId: number;
  destStoreId: number;
  status: string;
  date?: string;
  recommendationId?: number;
  nombreProducto?: string;
}

export interface InventoryAdjustment {
  date: string;
  user: string;
  change: string;
}

export interface SalesHistoryItem {
  id: number;
  storeId: number;
  productId: string;
  quantity: number;
  date: string;
}

export interface ReplenishmentRequest {
  id: number;
  storeId: number;
  productId: string;
  quantity: number;
  date: string;
  status: "Pendiente" | "Atendida";
  nombreProducto?: string;
}

export interface RecommendationDecision {
  date: string;
  user: string;
  action: string;
}

export interface Recommendation {
  id: number;
  productId: string;
  quantity: number;
  originDcId: number;
  destStoreId: number;
  status: "Propuesta" | "Aprobada" | "Rechazada";
  history: RecommendationDecision[];
  nombreProducto?: string;
  fueraDeCobertura?: boolean;
}
