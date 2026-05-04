"use client";
import { useState } from "react";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const C = {
  green:  "#17931f",
  red:    "#c0392b",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  bg:     "#f3ebda",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",
};

const GAP_OPPORTUNITIES = [
  {
    product: "Vita Milk Vanilla 250ml",
    category: "Dairy",
    match: 94,
    trendPct: "+412%",
    estRev: "GHS 22,400/mo",
    signal: "Trending on TikTok NG/GH. High demand in Accra East.",
    source: "TikTok + Local Search",
  },
  {
    product: "FanIce Strawberry Tub",
    category: "Dessert",
    match: 88,
    trendPct: "+185%",
    estRev: "GHS 15,000/mo",
    signal: "Seasonal heatwave surge. Competitors currently out of stock.",
    source: "Competitor Stockout",
  },
  {
    product: "Bel-Aqua Active 750ml",
    category: "Beverage",
    match: 82,
    trendPct: "+210%",
    estRev: "GHS 8,000/mo",
    signal: "New gym opened within 2km. 'Sports water' search query peaked.",
    source: "Local Search Trend",
  },
  {
    product: "Lactasoy Soy Milk 250ml",
    category: "Dairy",
    match: 79,
    trendPct: "+138%",
    estRev: "GHS 6,200/mo",
    signal: "Health-conscious segment growing in Kumasi. Search for 'dairy-free' up sharply.",
    source: "Health Trend",
  },
  {
    product: "Tresor Biscuits 100g",
    category: "Snacks",
    match: 76,
    trendPct: "+95%",
    estRev: "GHS 4,800/mo",
    signal: "School reopening season driving snack demand. Low local competition.",
    source: "Seasonal Signal",
  },
  {
    product: "Voltic Natural Water 1.5L",
    category: "Beverage",
    match: 73,
    trendPct: "+72%",
    estRev: "GHS 3,900/mo",
    signal: "Dry season starting. Household water purchases trending up in Tema.",
    source: "Seasonal + Local Search",
  },
];

const GAP_BLOCKED = [
  {
    product: "Ovaltine 400g Jar",
    category: "Beverage",
    issue: "Price Sensitivity",
    detail: "Market price is 15% lower than your wholesale cost. Customers will defect to cheaper alternatives.",
    action: "Renegotiate wholesale or find alternative supplier.",
    issueColor: "#b45309",
    issueBg: "#fef3c7",
    issueBorder: "#fde68a",
  },
  {
    product: "Pepsodent Charcoal 140g",
    category: "Personal Care",
    issue: "Inventory Conflict",
    detail: "You are overstocked on Colgate Optic White. Adding Pepsodent cannibalises sales.",
    action: "Run a promo on Colgate Optic first to clear stock.",
    issueColor: "#9333ea",
    issueBg: "#f3e8ff",
    issueBorder: "#e9d5ff",
  },
  {
    product: "Geisha Mackerel (Red)",
    category: "Groceries",
    issue: "Supplier Reliability",
    detail: "Current supplier has a 40% delivery fail rate in your region.",
    action: "Source a new vendor before stocking this item.",
    issueColor: "#b45309",
    issueBg: "#fef3c7",
    issueBorder: "#fde68a",
  },
];

export default function OpportunitiesPage() {
  const [tab, setTab] = useState<"stock" | "blocked">("stock");

  const totalEstRev = "GHS 61,300/mo";

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.2 }}>AI Market Gaps</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0", fontWeight: 400 }}>
            Detected from local search trends, social media signals &amp; inventory velocity
          </p>
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: C.tint, border: `1px solid #c6e6c8`, borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Opportunities</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: 0 }}>{GAP_OPPORTUNITIES.length}</p>
          </div>
          <div style={{ background: "#fbeaea", border: `1px solid #f0cccc`, borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Blocked</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.red, margin: 0 }}>{GAP_BLOCKED.length}</p>
          </div>
          <div style={{ background: "#fffbea", border: `1px solid #fde68a`, borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Rev if Stocked</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#92400e", margin: 0 }}>{totalEstRev}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <TabBtn label={`Stock Opportunities (${GAP_OPPORTUNITIES.length})`} active={tab === "stock"} onClick={() => setTab("stock")} />
        <TabBtn label={`Blocked — Do Not Stock (${GAP_BLOCKED.length})`} active={tab === "blocked"} onClick={() => setTab("blocked")} />
      </div>

      {tab === "stock" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
              {GAP_OPPORTUNITIES.length} items identified — stock these now to capture demand before competitors do.
            </p>
            <button style={{
              padding: "9px 20px",
              background: "#D4A017",
              color: "#1a1a1a",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "Gilroy, system-ui, sans-serif",
              cursor: "pointer",
            }}>
              Auto-Order All
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {GAP_OPPORTUNITIES.map((item) => (
              <div key={item.product} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.green}, #4ade80)` }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category}</p>
                    </div>
                    <span style={{
                      background: C.tint,
                      color: C.green,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                      border: `1px solid #c6e6c8`,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {item.match}% match
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.55 }}>{item.signal}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Search Trend</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: C.green, margin: 0 }}>{item.trendPct}</p>
                    </div>
                    <div style={{ background: "#f9f6f1", borderRadius: 6, padding: "9px 11px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Rev Added</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0 }}>{item.estRev}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{
                      flex: 1,
                      padding: "9px 0",
                      background: "#D4A017",
                      color: "#1a1a1a",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "Gilroy, system-ui, sans-serif",
                      cursor: "pointer",
                    }}>
                      Source Item
                    </button>
                    <button style={{
                      padding: "9px 14px",
                      background: "none",
                      color: C.ink,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "Gilroy, system-ui, sans-serif",
                      cursor: "pointer",
                    }}>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: C.sub, margin: "0 0 14px" }}>
            {GAP_BLOCKED.length} items flagged — review the AI action before ordering these.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {GAP_BLOCKED.map((item) => (
              <div key={item.product} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${C.red}, #f87171)` }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{item.product}</p>
                      <p style={{ fontSize: 11, color: C.sub, margin: "2px 0 0" }}>{item.category}</p>
                    </div>
                    <span style={{
                      background: item.issueBg,
                      color: item.issueColor,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                      border: `1px solid ${item.issueBorder}`,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {item.issue}
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 12px", lineHeight: 1.55 }}>{item.detail}</p>

                  <div style={{ background: "#fef9f0", border: "1px solid #f0e6cc", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Action</p>
                    <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{item.action}</p>
                  </div>

                  <button style={{
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
                  }}>
                    Take Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "Gilroy, system-ui, sans-serif",
        border: "none",
        borderBottom: `2px solid ${active ? C.green : "transparent"}`,
        background: "none",
        color: active ? C.green : C.sub,
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}
