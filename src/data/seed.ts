import type { Product, Store, DC, User, InventoryItem, ProductEdit } from "../types";

export const seedProducts: Product[] = [];
export const seedStores: Store[] = [];
export const seedDCs: DC[] = [];
export const seedUsers: User[] = [];
export const seedStoreInventory: Record<number, InventoryItem[]> = {};
export const seedDCInventory: Record<number, InventoryItem[]> = {};
export const credentials: Record<string, { password: string; userId: number }> = {};
export const seedProductEdits: Record<string, ProductEdit[]> = {};
