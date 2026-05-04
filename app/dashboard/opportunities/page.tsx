"use client";
import { useState } from "react";

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

/* ── Data ──────────────────────────────────────────────────────────── */

const STOCK_NOW = [
  {
    product: "Vita Milk Vanilla 250ml",
    category: "Dairy",
    confidence: 94,
    trendPct: "+412%",
    why: "Trending on TikTok Ghana & Nigeria. High search demand in Accra East — not yet widely stocked in this area.",
    signal: "Social Media Trend",
  },
  {
    product: "FanIce Strawberry Tub",
    category: "Dessert",
    confidence: 88,
    trendPct: "+185%",
    why: "Heatwave surge in your region. Competitors are currently out of stock — a clear window to capture demand.",
    signal: "Competitor Gap",
  },
  {
    product: "Bel-Aqua Active 750ml",
    category: "Beverage",
    confidence: 82,
    trendPct: "+210%",
    why: "New gym opened within 2km of your store. Searches for 'sports water' in your area have peaked this week.",
    signal: "Local Search",
  },
];

const MAYBE_STOCK = [
  {
    product: "Lactasoy Soy Milk 250ml",
    category: "Dairy",
    confidence: 68,
    trendPct: "+138%",
    why: "Demand is growing but you already carry Peak Milk Full Cream. Adding Lactasoy may split your dairy shelf without meaningfully growing sales.",
    caution: "Overlaps with current dairy range. Only add if you have shelf space to spare.",
    signal: "Search Trend",
  },
  {
    product: "Tresor Biscuits 100g",
    category: "Snacks",
    confidence: 62,
    trendPct: "+95%",
    why: "Back-to-school demand is rising but you already stock Indomie and other snack SKUs in a similar price bracket.",
    caution: "Could cannibalise your existing snack sales. Monitor for 2 weeks before ordering.",
    signal: "Seasonal Signal",
  },
];

const DO_NOT_STOCK = [
  {
    product: "Ovaltine 400g Jar",
    category: "Beverage",
    yourPrice: "GHS 48.00",
    marketPrice: "GHS 41.00",
    priceDiff: "+17%",
    reason: "price",
    why: "Your price is 17% above what customers can find elsewhere right now. This will sit on shelves.",
    recommendation: "Hold off until the market price rises or you can sell closer to GHS 41.",
  },
  {
    product: "Pepsodent Charcoal 140g",
    category: "Personal Care",
    yourPrice: "GHS 22.50",
    marketPrice: "GHS 19.00",
    priceDiff: "+18%",
    reason: "conflict",
    conflictsWith: "Colgate Optic White 140g",
    why: "You are already stocking Colgate Optic White in the same category and size. Adding Pepsodent splits the shelf and pulls from the same budget.",
    recommendation: "Clear your current Colgate Optic stock first. Also, your price is 18% above market — wait for pricing to align.",
  },
  {
    product: "Geisha Mackerel (Red)",
    category: "Groceries",
    yourPrice: "GHS 14.00",
    marketPrice: "GHS 11.50",
    priceDiff: "+22%",
    reason: "price",
    why: "Priced 22% above what customers can buy it for in your area. You also currently carry Geisha Mackerel (Green) which serves the same buyer.",
    recommendation: "Do not stock at this price. If market price rises above GHS 13.50, revisit.",
  },
];

/* ── Page ──────────────────────────────────────────────────────────── */

export default function OpportunitiesPage() {
  const [tab, setTab] = useState<"stock" | "maybe" | "avoid">("stock");

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>Opportunities</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>
            AI-detected signals on what to stock and what to avoid — based on market demand, pricing, and your current inventory.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <StatPill label="Stock Now" value={String(STOCK_NOW.length)} color={C.green} bg={C.tint} border="#c6e6c8" />
          <StatPill label="Maybe Stock" value={String(MAYBE_STOCK.length)} color={C.amber} bg="#fef3c7" border="#fde68a" />
          <StatPill label="Do Not Stock" value={String(DO_NOT_STOCK.length)} color={C.red} bg="#fbeaea" border="#f0cccc" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <TabBtn label={`Stock Now (${STOCK_NOW.length})`} active={tab === "stock"} activeColor={C.green} onClick={() => setTab("stock")} />
        <TabBtn label={`Maybe Stock (${MAYBE_STOCK.length})`} active={tab === "maybe"} activeColor={C.amber} onClick={() => setTab("maybe")} />
        <TabBtn label={`Do Not Stock (${DO_NOT_STOCK.length})`} active={tab === "avoid"} activeColor={C.red} onClick={() => setTab("avoid")} />
      </div>

      {/* ── Stock Now ── */}
      {tab === "stock" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            These items are not in your current inventory but show strong demand in your area. Move quickly — windows like competitor stockouts and trending products close fast.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {STOCK_NOW.map((item) => (
              <div key={item.product} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.green}, #4ade80)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category}</p>
                    </div>
                    <span style={{ background: C.tint, color: C.green, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #c6e6c8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.confidence}% confidence
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.6, flex: 1 }}>{item.why}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Search Trend</p>
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

      {/* ── Maybe Stock ── */}
      {tab === "maybe" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            Demand signals exist but these items overlap with products you already carry. Think carefully before adding them to avoid splitting sales or cluttering your shelf.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {MAYBE_STOCK.map((item) => (
              <div key={item.product} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.amber}, #fbbf24)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category}</p>
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
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Search Trend</p>
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

      {/* ── Do Not Stock ── */}
      {tab === "avoid" && (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            These items conflict with what you already carry or are priced above the current market rate. Stocking them now risks dead stock or losing customers to cheaper alternatives.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {DO_NOT_STOCK.map((item) => (
              <div key={item.product} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.red}, #f87171)` }} />
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category}</p>
                    </div>
                    <span style={{ background: "#fbeaea", color: C.red, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #f0cccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.priceDiff} vs market
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#fbeaea", borderRadius: 6, padding: "10px 12px", border: "1px solid #f0cccc" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Price</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.red, margin: 0 }}>{item.yourPrice}</p>
                    </div>
                    <div style={{ background: C.tint, borderRadius: 6, padding: "10px 12px", border: "1px solid #c6e6c8" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Market Price</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.green, margin: 0 }}>{item.marketPrice}</p>
                    </div>
                  </div>
                  {item.reason === "conflict" && item.conflictsWith && (
                    <div style={{ background: "#f3e8ff", border: "1px solid #e9d5ff", borderRadius: 6, padding: "8px 11px", marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#7e22ce", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Conflicts With Current Stock</p>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: "#7e22ce", margin: 0 }}>{item.conflictsWith}</p>
                    </div>
                  )}
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.6, flex: 1 }}>{item.why}</p>
                  <div style={{ background: "#fef9f0", border: "1px solid #f0e6cc", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommendation</p>
                    <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{item.recommendation}</p>
                  </div>
                  <button style={goldBtn}>Monitor Price</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

/* ── Shared components ─────────────────────────────────────────────── */

const goldBtn: React.CSSProperties = {
  width: "100%",
  padding: "9px 0",
  background: "#D4A017",
  color: "#1a1a1a",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "Gilroy, system-ui, sans-serif",
  cursor: "pointer",
};

function TabBtn({ label, active, activeColor, onClick }: { label: string; active: boolean; activeColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "Gilroy, system-ui, sans-serif",
        border: "none",
        borderBottom: `2px solid ${active ? activeColor : "transparent"}`,
        background: "none",
        color: active ? activeColor : C.sub,
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

function StatPill({ label, value, color, bg, border }: {
  label: string; value: string; color: string; bg: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#6b6560", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Gilroy, system-ui, sans-serif" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>{value}</p>
    </div>
  );
}
