"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Lightbulb, ArrowRight } from "@phosphor-icons/react";
import Button from "../components/Button";
import {
  fetchInventory,
  fetchDemandSignals,
  fetchDashboardOpportunities,
  hasAnyActiveBatch,
  type InventoryItem,
  type DemandAlert,
  type DemandSignals,
} from "@/lib/store";
import { DEMO_MODE } from "@/lib/config";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const C = {
  green:  "#17931f",
  amber:  "#b45309",
  red:    "#c0392b",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",
};

const goldBtn: React.CSSProperties = {
  width: "100%", padding: "9px 0", background: "#E2A10A", color: "#000",
  border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600,
  fontFamily: "Gilroy, system-ui, sans-serif", cursor: "pointer",
};

type StockNowItem = {
  product: string;
  category: string;
  sku: string;
  confidence: number;
  trendPct: string;
  why: string;
  signal: string;
};

type MaybeItem = {
  product: string;
  category: string;
  sku: string;
  confidence: number;
  trendPct: string;
  why: string;
  caution: string;
  signal: string;
};

type AvoidItem = {
  product: string;
  category: string;
  sku: string;
  stock: number;
  why: string;
  recommendation: string;
};

function buildOpportunities(inv: InventoryItem[], signals: DemandSignals) {
  const alertedSkus = new Set<string>(signals.composite_demand_alerts.flatMap(a => a.affected_skus));
  const skuToAlert = new Map<string, DemandAlert>();
  for (const a of signals.composite_demand_alerts) {
    for (const sku of a.affected_skus) skuToAlert.set(sku, a);
  }
  const invMap = new Map(inv.map(i => [i.sku, i]));

  // Stock Now: alerted SKUs with low-to-medium stock
  const stockNow: StockNowItem[] = [];
  for (const alert of signals.composite_demand_alerts) {
    for (const sku of alert.affected_skus.slice(0, 3)) {
      const item = invMap.get(sku);
      if (!item) continue;
      const lift = Math.round((alert.combined_estimated_lift ?? 0.2) * 100);
      stockNow.push({
        sku, product: item.product_name, category: item.category,
        confidence: Math.min(97, 70 + lift),
        trendPct: `+${lift + 10}%`,
        why: alert.description,
        signal: alert.alert_type === "convergence_spike" ? "Multi-signal convergence" : "Demand signal",
      });
    }
  }

  // Maybe Stock: social signals with moderate lift
  const maybe: MaybeItem[] = [];
  const socialSigs = signals.social_signals as Array<{ affected_skus?: string[]; estimated_lift?: number; content?: string; demand_intent?: string }>;
  for (const sig of socialSigs.slice(0, 3)) {
    if (!sig.affected_skus?.length) continue;
    const sku = sig.affected_skus[0];
    const item = invMap.get(sku);
    if (!item) continue;
    const lift = Math.round((sig.estimated_lift ?? 0.1) * 100);
    maybe.push({
      sku, product: item.product_name, category: item.category,
      confidence: Math.min(80, 50 + lift),
      trendPct: `+${lift + 5}%`,
      why: sig.content as string ?? "Social signal detected for this SKU.",
      caution: item.current_stock > 80 ? "You already have good stock on hand. Monitor before ordering more." : "Growing signal — watch for 1–2 weeks before committing to a large order.",
      signal: sig.demand_intent as string ?? "Social signal",
    });
  }

  // Do Not Stock: high-stock items with no demand signal (slow movers)
  const avoid: AvoidItem[] = inv
    .filter(i => i.current_stock > 130 && !alertedSkus.has(i.sku))
    .slice(0, 3)
    .map(i => ({
      sku: i.sku, product: i.product_name, category: i.category, stock: i.current_stock,
      why: `You have ${i.current_stock} units on hand with no current demand signal. Ordering more risks increasing dead stock.`,
      recommendation: `Hold off on reordering. Run a promotion to clear existing stock of ${i.product_name} first.`,
    }));

  return { stockNow, maybe, avoid };
}

function TabBtn({ label, active, activeColor, onClick }: { label: string; active: boolean; activeColor: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 18px", fontSize: 13, fontWeight: 600,
      fontFamily: "Gilroy, system-ui, sans-serif", border: "none",
      borderBottom: `2px solid ${active ? activeColor : "transparent"}`,
      background: "none", color: active ? activeColor : C.sub, cursor: "pointer",
      transition: "color 0.15s", marginBottom: -1,
    }}>{label}</button>
  );
}

function StatPill({ label, value, color, bg, border }: { label: string; value: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#6b6560", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Gilroy, system-ui, sans-serif" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>{value}</p>
    </div>
  );
}

export default function OpportunitiesPage() {
  const [tab, setTab] = useState<"stock" | "maybe" | "avoid">("stock");
  const [stockNow, setStockNow] = useState<StockNowItem[]>([]);
  const [maybe, setMaybe]     = useState<MaybeItem[]>([]);
  const [avoid, setAvoid]     = useState<AvoidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBatch, setNoBatch] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      if (!hasAnyActiveBatch()) { setNoBatch(true); setLoading(false); return; }
      Promise.all([fetchInventory(), fetchDemandSignals()]).then(([inv, signals]) => {
        const { stockNow, maybe, avoid } = buildOpportunities(inv, signals);
        setStockNow(stockNow);
        setMaybe(maybe);
        setAvoid(avoid);
        setLoading(false);
      });
    } else {
      fetchDashboardOpportunities()
        .then(items => {
          const sn: StockNowItem[] = [];
          const mb: MaybeItem[] = [];
          const av: AvoidItem[] = [];
          for (const item of items) {
            const trendPct = `${item.trend_pct >= 0 ? "+" : ""}${Math.round(item.trend_pct)}%`;
            if (item.action === "buy") {
              if (item.confidence >= 75) {
                sn.push({
                  sku: item.sku, product: item.product_name, category: item.category,
                  confidence: Math.round(item.confidence), trendPct,
                  why: item.reason, signal: "AI signal",
                });
              } else {
                mb.push({
                  sku: item.sku, product: item.product_name, category: item.category,
                  confidence: Math.round(item.confidence), trendPct, why: item.reason,
                  caution: "Monitor before committing to a large order.",
                  signal: "AI signal",
                });
              }
            } else {
              av.push({
                sku: item.sku, product: item.product_name, category: item.category,
                stock: 0, why: item.reason,
                recommendation: item.reason,
              });
            }
          }
          if (sn.length === 0 && mb.length === 0 && av.length === 0) {
            setNoBatch(true);
          } else {
            setStockNow(sn);
            setMaybe(mb);
            setAvoid(av);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.sub, fontSize: 14, ...gilroy }}>
      Loading…
    </div>
  );

  if (noBatch) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, ...gilroy }}>
      <Lightbulb size={52} color="#c8bfaf" weight="thin" />
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>No opportunities yet</div>
      <div style={{ fontSize: 14, color: C.sub, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
        Upload your inventory and sales data to unlock AI-powered stocking recommendations.
      </div>
      <Link href="/dashboard/register" style={{ textDecoration: "none" }}>
        <Button variant="yellow" style={{ gap: 8 }}>
          Upload your first batch <ArrowRight size={15} weight="bold" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>Opportunities</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>
            AI-detected signals on what to stock and what to avoid — based on market demand and your current inventory.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <StatPill label="Stock Now"     value={String(stockNow.length)} color={C.green} bg={C.tint}     border="#c6e6c8" />
          <StatPill label="Maybe Stock"   value={String(maybe.length)}    color={C.amber} bg="#fef3c7"    border="#fde68a" />
          <StatPill label="Do Not Stock"  value={String(avoid.length)}    color={C.red}   bg="#fbeaea"    border="#f0cccc" />
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <TabBtn label={`Stock Now (${stockNow.length})`}    active={tab === "stock"} activeColor={C.green} onClick={() => setTab("stock")} />
        <TabBtn label={`Maybe Stock (${maybe.length})`}     active={tab === "maybe"} activeColor={C.amber} onClick={() => setTab("maybe")} />
        <TabBtn label={`Do Not Stock (${avoid.length})`}    active={tab === "avoid"} activeColor={C.red}   onClick={() => setTab("avoid")} />
      </div>

      {tab === "stock" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            These SKUs have strong demand signals converging right now. Move quickly — these windows close fast.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {stockNow.map(item => (
              <div key={item.sku} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.green}, #4ade80)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category} · {item.sku}</p>
                    </div>
                    <span style={{ background: C.tint, color: C.green, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #c6e6c8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.confidence}% confidence
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.6, flex: 1 }}>{item.why}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Lift</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.green, margin: 0 }}>{item.trendPct}</p>
                    </div>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signal</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.ink, margin: 0 }}>{item.signal}</p>
                    </div>
                  </div>
                  <button style={goldBtn}>Add to Stock List</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "maybe" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            Demand signals exist but proceed cautiously. Monitor before committing to a large order.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {maybe.map(item => (
              <div key={item.sku} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.amber}, #fbbf24)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category} · {item.sku}</p>
                    </div>
                    <span style={{ background: "#fef3c7", color: C.amber, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #fde68a", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.confidence}% confidence
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 10px", lineHeight: 1.6, flex: 1 }}>{item.why}</p>
                  <div style={{ background: "#fffbea", border: "1px solid #fde68a", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.amber, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Caution</p>
                    <p style={{ fontSize: 12.5, color: C.amber, margin: 0, lineHeight: 1.5 }}>{item.caution}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Lift</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.amber, margin: 0 }}>{item.trendPct}</p>
                    </div>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signal</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.ink, margin: 0 }}>{item.signal}</p>
                    </div>
                  </div>
                  <button style={goldBtn}>Add to Watch List</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "avoid" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            These items have high stock on hand and no active demand signal. Ordering more risks increasing dead stock.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {avoid.map(item => (
              <div key={item.sku} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.red}, #f87171)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category} · {item.sku}</p>
                    </div>
                    <span style={{ background: "#fbeaea", color: C.red, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #f0cccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.stock} pcs on hand
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.6, flex: 1 }}>{item.why}</p>
                  <div style={{ background: "#fef9f0", border: "1px solid #f0e6cc", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommendation</p>
                    <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{item.recommendation}</p>
                  </div>
                  <button style={goldBtn}>Mark for Promotion</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
