export type Role = "admin" | "store" | "dc";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role | "planner";
  locationId: number | null;
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
}

export interface DC {
  id: number;
  name: string;
  address: string;
  capacity: number;
  coverage: number[];
  status: "active" | "inactive";
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  minStock: number;
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
