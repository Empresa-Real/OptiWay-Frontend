import type { Product, Store, DC, User, InventoryItem, SaleRecord, ReceiptRecord } from "../types";

export const seedProducts: Product[] = [
  { id: "P001", name: "Camisa Oxford", category: "Camisas", price: 39.99, unit: "unidad", status: "active" },
  { id: "P002", name: "Pantalón Chino", category: "Pantalones", price: 49.99, unit: "unidad", status: "active" },
  { id: "P003", name: "Vestido Midi", category: "Vestidos", price: 59.99, unit: "unidad", status: "active" },
  { id: "P004", name: "Blazer Slim", category: "Abrigos", price: 89.99, unit: "unidad", status: "active" },
  { id: "P005", name: "Jeans Skinny", category: "Pantalones", price: 45.99, unit: "unidad", status: "active" },
  { id: "P006", name: "Camiseta Básica", category: "Camisas", price: 19.99, unit: "unidad", status: "inactive" },
  { id: "P007", name: "Falda Plisada", category: "Faldas", price: 34.99, unit: "unidad", status: "active" },
  { id: "P008", name: "Jersey Lana", category: "Sweaters", price: 54.99, unit: "unidad", status: "active" },
];

export const seedStores: Store[] = [
  { id: 1, name: "Tienda Centro", address: "Av. Reforma 145", city: "Ciudad de México", status: "active" },
  { id: 2, name: "Tienda Polanco", address: "Presidente Masaryk 72", city: "Ciudad de México", status: "active" },
  { id: 3, name: "Tienda Monterrey", address: "Av. Garza Sada 302", city: "Monterrey", status: "active" },
];

export const seedDCs: DC[] = [
  { id: 1, name: "CD Norte", address: "Carretera Federal 57, km 12", capacity: 5000, coverage: [1, 2], status: "active" },
  { id: 2, name: "CD Bajío", address: "Blvd. Aeropuerto 880", capacity: 3500, coverage: [3], status: "active" },
];

export const seedUsers: User[] = [
  { id: 1, name: "Ana González", email: "ana@empresa.com", role: "admin", locationId: null, status: "active" },
  { id: 2, name: "Carlos Reyes", email: "carlos@empresa.com", role: "store", locationId: 1, status: "active" },
  { id: 3, name: "María López", email: "maria@empresa.com", role: "store", locationId: 2, status: "active" },
  { id: 4, name: "Roberto Silva", email: "roberto@empresa.com", role: "dc", locationId: 1, status: "active" },
  { id: 5, name: "Luisa Ramírez", email: "luisa@empresa.com", role: "dc", locationId: 2, status: "inactive" },
];

export const seedStoreInventory: Record<number, InventoryItem[]> = {
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

export const seedDCInventory: Record<number, InventoryItem[]> = {
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
export const credentials: Record<string, { password: string; userId: number }> = {
  "ana@empresa.com": { password: "admin123", userId: 1 },
  "carlos@empresa.com": { password: "tienda123", userId: 2 },
  "maria@empresa.com": { password: "tienda456", userId: 3 },
  "roberto@empresa.com": { password: "cd123", userId: 4 },
  "luisa@empresa.com": { password: "cd456", userId: 5 },
};
