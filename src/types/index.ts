export type Role = "admin" | "store" | "dc";

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
  role: Role | "planner";
  asignacion: Asignacion | null;
  status: "active" | "inactive";
}

export interface Product {
  id: string;
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
