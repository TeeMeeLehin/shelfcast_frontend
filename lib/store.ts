// Batch-based data store persisted to localStorage.
// In DEMO_MODE every upload snapshot references the 3 public JSON files.

export type InventoryItem = {
  sku: string;
  product_name: string;
  category: string;
  unit_price_ghs: number;
  current_stock: number;
};

export type SaleRecord = {
  transaction_id: string;
  timestamp: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type DemandAlert = {
  alert_id: string;
  generated_at: string;
  alert_type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  affected_skus: string[];
  combined_estimated_lift: number;
  recommended_action: string;
};

export type DemandSignals = {
  composite_demand_alerts: DemandAlert[];
  social_signals: unknown[];
  blog_signals: unknown[];
  event_calendar: unknown[];
};

export type Batch = {
  id: string;
  label: string;
  uploadedAt: string; // ISO string
  files: string[];
};

const STORAGE_KEY = "sc_batches";
const ACTIVE_KEY  = "sc_active_batches";

export function getBatches(): Batch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

export function saveBatch(batch: Batch): void {
  const batches = getBatches();
  batches.unshift(batch); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
}

export function getActiveBatchIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_KEY) ?? "[]");
  } catch { return []; }
}

export function setActiveBatchIds(ids: string[]): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(ids));
}

export function toggleBatch(id: string, active: boolean): void {
  const current = getActiveBatchIds();
  if (active) {
    if (!current.includes(id)) setActiveBatchIds([...current, id]);
  } else {
    setActiveBatchIds(current.filter(x => x !== id));
  }
}

export function hasAnyActiveBatch(): boolean {
  return getActiveBatchIds().length > 0;
}

// Fetch the real JSON data files (always the same in DEMO_MODE)
export async function fetchInventory(): Promise<InventoryItem[]> {
  const res = await fetch("/inventory.json");
  return res.json();
}

export async function fetchSalesHistory(): Promise<SaleRecord[]> {
  const res = await fetch("/sales_history.json");
  return res.json();
}

export async function fetchDemandSignals(): Promise<DemandSignals> {
  const res = await fetch("/demand_signals.json");
  return res.json();
}
