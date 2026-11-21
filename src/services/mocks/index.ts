import type { Store, DC, Product, Order, InventoryAdjustment, SalesHistoryItem, RecommendationDecision, ReplenishmentRequest, Recommendation } from "../../types";

let initialized = false;
let stores: Store[] = [];
let dcs: DC[] = [];
let orders: Order[] = [];
let inventoryQty = new Map<string, number>(); // key: `${tipo}:${locationId}:${productId}`
let adjustments = new Map<string, InventoryAdjustment[]>(); // key: productId
let salesHistory: SalesHistoryItem[] = [];
let solicitudesReposicion: ReplenishmentRequest[] = [];
let recomendaciones: Recommendation[] = [];
const salesWeeks: string[] = [
  "2025-04-07",
  "2025-04-14",
  "2025-04-21",
  "2025-04-28",
  "2025-05-05",
  "2025-05-12",
  "2025-05-19",
  "2025-05-26",
];

export function isMocksEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCKS === "true";
}

/**
 * Inicializa el store único en memoria a partir de las listas reales ya cargadas
 * (tiendas, CDs, productos). Genera 2 ó 3 órdenes pendientes de ejemplo hacia
 * tiendas reales. No se copian ids de seeds de Figma.
 */
export function initMockStore(
  initialStores: Store[],
  initialDCs: DC[],
  initialProducts: Product[],
): void {
  stores = initialStores.map((s) => ({
    ...s,
    status: s.status === "inactive" ? "inactive" : "active",
  }));
  dcs = initialDCs.map((d) => ({
    ...d,
    status: d.status === "inactive" ? "inactive" : "active",
  }));

  const activeStores = stores.filter((s) => s.status === "active");
  const activeDCs = dcs.filter((d) => d.status === "active");
  const sampleProducts = initialProducts.filter((p) => p.status === "active");

  orders = [];
  let orderId = 1;
  if (activeDCs.length > 0 && activeStores.length > 0 && sampleProducts.length > 0) {
    const count = Math.min(3, activeStores.length);
    for (let i = 0; i < count; i++) {
      const dc = activeDCs[i % activeDCs.length];
      const store = activeStores[i];
      const product = sampleProducts[i % sampleProducts.length];
      orders.push({
        id: orderId++,
        productId: product.id,
        quantity: 10,
        originDcId: dc.id,
        destStoreId: store.id,
        status: "Pendiente",
        date: new Date().toLocaleString("es-MX", {
          dateStyle: "short",
          timeStyle: "short",
        }),
      });
    }
  }

  // Historial de ventas determinista: 8 semanas, todas las tiendas activas
  // y todos los productos activos. No se copian ids de Figma.
  salesHistory = [];
  let saleId = 1;
  for (let weekIndex = 0; weekIndex < salesWeeks.length; weekIndex++) {
    for (const store of activeStores) {
      for (const product of sampleProducts) {
        const quantity =
          8 + ((weekIndex * 3 + store.id * 5 + product.id.length * 7) % 24);
        salesHistory.push({
          id: saleId++,
          storeId: store.id,
          productId: product.id,
          quantity,
          date: salesWeeks[weekIndex],
        });
      }
    }
  }

  // Solicitudes de reposición determinista: al menos 2 solicitudes (una Pendiente)
  // generadas a partir de tiendas y productos reales. No se copian ids de Figma.
  solicitudesReposicion = [];
  let requestId = 1;
  const activeStoresWithProduct = activeStores.filter(
    (s) => sampleProducts.length > 0,
  );
  if (activeStoresWithProduct.length > 0 && sampleProducts.length > 0) {
    const store1 = activeStoresWithProduct[0];
    const product1 = sampleProducts[0];
    solicitudesReposicion.push({
      id: requestId++,
      storeId: store1.id,
      productId: product1.id,
      quantity: 12,
      date: new Date().toISOString().slice(0, 10),
      status: "Pendiente",
    });
    if (activeStoresWithProduct.length > 1 && sampleProducts.length > 1) {
      const store2 = activeStoresWithProduct[1];
      const product2 = sampleProducts[1];
      solicitudesReposicion.push({
        id: requestId++,
        storeId: store2.id,
        productId: product2.id,
        quantity: 8,
        date: new Date().toISOString().slice(0, 10),
        status: "Atendida",
      });
    }
  }

  // Recomendaciones determinista: 1 en cada estado (Propuesta, Aprobada, Rechazada)
  // con sus decisiones en el historial. Generadas a partir de tiendas, CDs y
  // productos reales.
  recomendaciones = [];
  let recommendationId = 1;
  const now = new Date().toISOString().slice(0, 16);
  if (activeDCs.length > 0 && activeStores.length > 0 && sampleProducts.length > 0) {
    const dc = activeDCs[0];
    const store = activeStores[0];
    const product = sampleProducts[0];

    // Propuesta
    recomendaciones.push({
      id: recommendationId++,
      productId: product.id,
      quantity: 10,
      originDcId: dc.id,
      destStoreId: store.id,
      status: "Propuesta",
      history: [
        {
          date: now,
          user: "Sistema",
          action: "Creada como propuesta",
        },
      ],
    });

    // Aprobada
    recomendaciones.push({
      id: recommendationId++,
      productId: sampleProducts[Math.min(1, sampleProducts.length - 1)]?.id ?? product.id,
      quantity: 15,
      originDcId: dc.id,
      destStoreId: activeStores[Math.min(1, activeStores.length - 1)]?.id ?? store.id,
      status: "Aprobada",
      history: [
        {
          date: now,
          user: "Sistema",
          action: "Creada como propuesta",
        },
        {
          date: now,
          user: "Planificador",
          action: "Aprobada",
        },
      ],
    });

    // Rechazada
    recomendaciones.push({
      id: recommendationId++,
      productId: sampleProducts[Math.min(2, sampleProducts.length - 1)]?.id ?? product.id,
      quantity: 20,
      originDcId: dc.id,
      destStoreId: activeStores[Math.min(2, activeStores.length - 1)]?.id ?? store.id,
      status: "Rechazada",
      history: [
        {
          date: now,
          user: "Sistema",
          action: "Creada como propuesta",
        },
        {
          date: now,
          user: "Planificador",
          action: "Rechazada: stock insuficiente en CD de origen",
        },
      ],
    });
  }

  initialized = true;
}

/** Tiendas con el overlay de estados aplicado. */
export function getMockStores(): Store[] {
  return [...stores];
}

/** Marca una tienda como activa/inactiva en el overlay. */
export function setStoreStatus(
  id: number,
  status: "active" | "inactive",
): void {
  const idx = stores.findIndex((s) => s.id === id);
  if (idx >= 0) {
    stores[idx] = { ...stores[idx], status };
  }
}

/** CDs con el overlay de estados aplicado. */
export function getMockDCs(): DC[] {
  return [...dcs];
}

/** Marca un CD como activo/inactivo en el overlay. */
export function setDCStatus(id: number, status: "active" | "inactive"): void {
  const idx = dcs.findIndex((d) => d.id === id);
  if (idx >= 0) {
    dcs[idx] = { ...dcs[idx], status };
  }
}

/** Órdenes pendientes en memoria. */
export function getMockOrders(): Order[] {
  return [...orders];
}

/** Cantidad de inventario sobrelayada (overlay) para una ubicación/producto. */
export function getInventoryQty(key: string): number | undefined {
  return inventoryQty.get(key);
}

/** Sobrelaya la cantidad de inventario para una ubicación/producto. */
export function setInventoryQty(key: string, qty: number): void {
  inventoryQty.set(key, qty);
}

/** Historial de ajustes de un producto. */
export function getAdjustments(productId: string): InventoryAdjustment[] {
  return [...(adjustments.get(productId) || [])];
}

/** Agrega un entrada al historial de ajustes de un producto. */
export function addAdjustment(
  productId: string,
  entry: InventoryAdjustment,
): void {
  const arr = adjustments.get(productId) || [];
  arr.unshift(entry);
  adjustments.set(productId, arr);
}

/** Semanas de historial de ventas. */
export function getMockSalesWeeks(): string[] {
  return [...salesWeeks];
}

/** Historial de ventas en memoria. */
export function getMockSalesHistory(): SalesHistoryItem[] {
  return [...salesHistory];
}

/** Solicitudes de reposición en memoria. */
export function getMockSolicitudesReposicion(): ReplenishmentRequest[] {
  return [...solicitudesReposicion];
}

/** Agrega una solicitud de reposición en memoria. */
export function addMockSolicitudReposicion(
  request: ReplenishmentRequest,
): void {
  solicitudesReposicion.push(request);
}

/** Marca una solicitud de reposición como atendida en memoria. */
export function setSolicitudReposicionStatus(
  id: number,
  status: "Pendiente" | "Atendida",
): void {
  const idx = solicitudesReposicion.findIndex((r) => r.id === id);
  if (idx >= 0) {
    solicitudesReposicion[idx] = { ...solicitudesReposicion[idx], status };
  }
}

/** Recomendaciones en memoria. */
export function getMockRecomendaciones(): Recommendation[] {
  return [...recomendaciones];
}

/** Agrega una recomendación en memoria. */
export function addMockRecomendacion(recommendation: Recommendation): void {
  recomendaciones.push(recommendation);
}

/** Actualiza el estado de una recomendación y agrega una entrada al historial. */
export function updateRecomendacionStatus(
  id: number,
  status: Recommendation["status"],
  action: string,
  user: string,
): void {
  const idx = recomendaciones.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const now = new Date().toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
    recomendaciones[idx] = {
      ...recomendaciones[idx],
      status,
      history: [
        ...recomendaciones[idx].history,
        { date: now, user, action },
      ],
    };
  }
}



/** Actualiza cantidad y CD de origen de una recomendación (conserva estado e historial). */
export function updateRecomendacionFields(
  id: number,
  fields: Partial<Pick<Recommendation, "quantity" | "originDcId">>,
): void {
  const idx = recomendaciones.findIndex((r) => r.id === id);
  if (idx >= 0) {
    recomendaciones[idx] = { ...recomendaciones[idx], ...fields };
  }
}



/** Obtiene el historial de decisiones de una recomendación. */
export function getMockRecomendacionHistorial(
  id: number,
): RecommendationDecision[] {
  const rec = recomendaciones.find((r) => r.id === id);
  return rec ? [...rec.history] : [];
}

/** Órdenes de un CD (origen). */
export function getMockOrdenesCD(centroDistribucionId: number): Order[] {
  return orders.filter((o) => o.originDcId === centroDistribucionId);
}

/** Agrega una orden en memoria (usada al aprobar una recomendación). */
export function addMockOrden(order: Order): void {
  orders.push(order);
}

export { initialized };