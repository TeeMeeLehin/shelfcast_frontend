// ─── Types ────────────────────────────────────────────────────────────────────

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
  uploadedAt: string;
  files: string[];
};

// ─── API response types ───────────────────────────────────────────────────────

export type DashboardSummary = {
  active_alerts: number;
  high_signal_products: number;
  products_tracked: number;
  capital_at_risk_ghs: number;
};

export type DashboardAlertRow = {
  sku: string;
  product_name: string;
  category: string;
  score: number;
  trend_pct: number;
  alert_type: string;
  intelligence_snapshot: string;
};

export type DashboardIntelligence = {
  composite_demand_alerts: DemandAlert[];
  social_signals: unknown[];
  blog_signals: unknown[];
  event_calendar: unknown[];
};

export type OpportunityItem = {
  sku: string;
  product_name: string;
  category: string;
  action: "buy" | "offload";
  confidence: number;
  trend_pct: number;
  reason: string;
  recommended_qty?: number;
};

export type VelocityItem = {
  sku: string;
  product_name: string;
  category: string;
  daily_velocity: number;
  days_of_stock: number;
  current_stock: number;
  unit_price_ghs: number;
};

export type CatalogueProduct = {
  sku_id: string;
  sku: string;
  product_name: string;
  brand: string;
  category: string;
  unit_price_ghs: number;
  current_stock: number;
  score?: number;
  trend_pct?: number;
  alert_type?: string;
};

export type CatalogueStats = {
  total_products: number;
  total_categories: number;
  avg_score: number;
  low_stock_count: number;
};

export type RootCause = {
  sku: string;
  product_name: string;
  score: number;
  trend_pct: number;
  alert_type: string;
  contributing_signals: { source: string; impact: string; description: string }[];
  recommended_action: string;
};

export type IngestJobStatus = {
  id: string;
  status: string;
  pipeline_stage: string;
  stage_label: string;
  progress: number;
  is_complete: boolean;
  is_failed: boolean;
};

export type IntelligenceJobStatus = {
  job_id: string;
  status: "queued" | "processing" | "done" | "error";
  logs: string[];
};

// ─── Local batch store (used in both modes) ───────────────────────────────────

const STORAGE_KEY = "sc_batches";
const ACTIVE_KEY  = "sc_active_batches";

export function getBatches(): Batch[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveBatch(batch: Batch): void {
  const batches = getBatches();
  batches.unshift(batch);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
}

export function getActiveBatchIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) ?? "[]"); }
  catch { return []; }
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

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sc_token") ?? "";
}

import { API_BASE, DEMO_MODE } from "@/lib/config";

// All API calls are routed through the Next.js proxy (/api/proxy/...)
// to avoid browser CORS issues when the upstream server returns 5xx errors
// without CORS headers. The proxy forwards requests server-side.
function proxyPath(path: string): string {
  if (typeof window === "undefined") {
    // Server-side: call backend directly
    return `${API_BASE}${path}`;
  }
  // Client-side: route through the local proxy
  return `/api/proxy${path}`;
}

function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(proxyPath(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

async function authJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Demo JSON fallbacks ──────────────────────────────────────────────────────

export async function fetchInventory(): Promise<InventoryItem[]> {
  if (!DEMO_MODE) return authJson<InventoryItem[]>("/api/v1/catalogue/?limit=1000").then(
    (r: unknown) => {
      const data = r as { items?: InventoryItem[] };
      return data.items ?? (r as InventoryItem[]);
    }
  );
  const res = await fetch("/inventory.json");
  return res.json();
}

export async function fetchSalesHistory(): Promise<SaleRecord[]> {
  // No direct equivalent in the live API — used in demo mode only
  const res = await fetch("/sales_history.json");
  return res.json();
}

export async function fetchDemandSignals(): Promise<DemandSignals> {
  if (!DEMO_MODE) return authJson<DemandSignals>("/api/v1/dashboard/intelligence");
  const res = await fetch("/demand_signals.json");
  return res.json();
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return authJson<DashboardSummary>("/api/v1/dashboard/summary");
}

export async function fetchDashboardAlerts(): Promise<DashboardAlertRow[]> {
  return authJson<DashboardAlertRow[]>("/api/v1/dashboard/alerts");
}

export async function fetchDashboardIntelligence(): Promise<DashboardIntelligence> {
  return authJson<DashboardIntelligence>("/api/v1/dashboard/intelligence");
}

export async function fetchDashboardOpportunities(): Promise<OpportunityItem[]> {
  return authJson<OpportunityItem[]>("/api/v1/dashboard/opportunities");
}

export async function fetchDashboardVelocity(): Promise<VelocityItem[]> {
  return authJson<VelocityItem[]>("/api/v1/dashboard/velocity");
}

export async function fetchRootCause(skuId: string): Promise<RootCause> {
  return authJson<RootCause>(`/api/v1/dashboard/skus/${encodeURIComponent(skuId)}/root-cause`);
}

// ─── Catalogue API ────────────────────────────────────────────────────────────

export type CatalogueParams = {
  search?: string;
  brand?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export async function fetchCatalogueApi(params: CatalogueParams = {}): Promise<{ items: CatalogueProduct[]; total: number }> {
  const q = new URLSearchParams();
  if (params.search)   q.set("search", params.search);
  if (params.brand)    q.set("brand", params.brand);
  if (params.category) q.set("category", params.category);
  if (params.page)     q.set("page", String(params.page));
  if (params.limit)    q.set("limit", String(params.limit));
  const qs = q.toString() ? `?${q.toString()}` : "";
  return authJson<{ items: CatalogueProduct[]; total: number }>(`/api/v1/catalogue/${qs}`);
}

export async function fetchProductApi(skuId: string): Promise<CatalogueProduct> {
  return authJson<CatalogueProduct>(`/api/v1/catalogue/${encodeURIComponent(skuId)}`);
}

export async function fetchCatalogueStats(): Promise<CatalogueStats> {
  return authJson<CatalogueStats>("/api/v1/catalogue/stats");
}

// ─── Ingest API ───────────────────────────────────────────────────────────────

export async function uploadCsv(file: File): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const res = await fetch(proxyPath("/api/v1/ingest/csv"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Upload error ${res.status}`);
  }
  return res.json();
}

export async function pollIngestStatus(jobId: string): Promise<IngestJobStatus> {
  return authJson<IngestJobStatus>(`/api/v1/ingest/status/${encodeURIComponent(jobId)}`);
}

// ─── Intelligence API ─────────────────────────────────────────────────────────

export async function triggerIntelligence(): Promise<{ job_id: string }> {
  return authJson<{ job_id: string }>("/api/v1/intelligence/run-full", { method: "POST" });
}

export async function pollIntelligenceStatus(jobId: string): Promise<IntelligenceJobStatus> {
  return authJson<IntelligenceJobStatus>(`/api/v1/intelligence/run/${encodeURIComponent(jobId)}/status`);
}
