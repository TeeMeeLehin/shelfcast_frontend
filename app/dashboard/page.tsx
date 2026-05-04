"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "./components/Button";
import { ChartBar, ArrowRight } from "@phosphor-icons/react";
import {
  fetchInventory,
  fetchDemandSignals,
  hasAnyActiveBatch,
  type InventoryItem,
  type DemandAlert,
} from "@/lib/store";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const C = {
  green:  "#17931f",
  red:    "#c0392b",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",
};

type TableRow = {
  sku: string;
  product: string;
  category: string;
  score: number;
  trend: string;
  alert: string;
  stock: number;
  advice: string;
  insight: string;
  unitPrice: number;
};

function deriveAlert(item: InventoryItem, alertedSkus: Set<string>): string {
  if (alertedSkus.has(item.sku)) return "Demand Spike";
  if (item.current_stock < 20) return "Low Stock";
  if (item.current_stock > 120) return "Slow Mover";
  return "Stable";
}

function deriveScore(item: InventoryItem, alertedSkus: Set<string>): number {
  let base = 60;
  if (alertedSkus.has(item.sku)) base = 80 + (item.sku.charCodeAt(9) ?? 0) % 15;
  if (item.current_stock < 20) base = Math.max(base, 70);
  if (item.current_stock > 150) base = Math.min(base, 55);
  return Math.max(30, Math.min(99, base));
}

function deriveTrend(item: InventoryItem, alertedSkus: Set<string>): string {
  if (alertedSkus.has(item.sku)) return `+${15 + (item.sku.charCodeAt(9) ?? 0) % 30}%`;
  if (item.current_stock < 20)   return `+${5  + (item.sku.charCodeAt(8) ?? 0) % 15}%`;
  if (item.current_stock > 150)  return `-${3  + (item.sku.charCodeAt(8) ?? 0) % 10}%`;
  return `+${1 + (item.sku.charCodeAt(8) ?? 0) % 8}%`;
}

function ScoreRing({ score }: { score: number }) {
  const r = 15, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 70 ? C.green : C.red;
  return (
    <svg width={38} height={38} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={19} cy={19} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle cx={19} cy={19} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 19 19)" />
      <text x={19} y={23} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} fontFamily="Gilroy, system-ui, sans-serif">{score}</text>
    </svg>
  );
}

function TrendCell({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: isUp ? C.green : C.red, fontWeight: 700, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{isUp ? "↑" : "↓"}</span>{trend}
    </span>
  );
}

function AlertPill({ label }: { label: string }) {
  const isRed = label === "Demand Spike" || label === "Low Stock";
  const isGray = label === "Stable";
  return (
    <span style={{
      display: "inline-block",
      background: isRed ? "#fbeaea" : isGray ? "#f5f5f5" : C.tint,
      color: isRed ? C.red : isGray ? "#999" : C.green,
      borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      fontFamily: "Gilroy, system-ui, sans-serif",
      border: `1px solid ${isRed ? "#f0cccc" : isGray ? "#e0e0e0" : "#c6e6c8"}`,
    }}>{label}</span>
  );
}

function KpiCard({ title, value, label, accent, compact }: { title: string; value: string; label?: string; accent: string; compact?: boolean }) {
  return (
    <div style={{ background: C.white, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ borderBottom: `2px solid ${accent}`, padding: "10px 14px 9px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{title}</span>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", justifyContent: compact ? "flex-start" : "space-between", alignItems: "flex-end", minHeight: 60 }}>
        <div style={{ fontSize: compact ? 22 : 34, fontWeight: 800, color: C.ink, lineHeight: 0.95, letterSpacing: compact ? -0.5 : -1, fontFamily: "Gilroy, system-ui, sans-serif" }}>{value}</div>
        {label && <div style={{ fontSize: 10.5, fontWeight: 500, color: C.sub, marginBottom: 2, textAlign: "right", maxWidth: 110, fontFamily: "Gilroy, system-ui, sans-serif" }}>{label}</div>}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const router = useRouter();
  const [rows, setRows]         = useState<TableRow[]>([]);
  const [alerts, setAlerts]     = useState<DemandAlert[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [noBatch, setNoBatch]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAlert, setFilterAlert]       = useState("All");

  useEffect(() => {
    if (!hasAnyActiveBatch()) {
      setNoBatch(true);
      setLoading(false);
      return;
    }
    Promise.all([fetchInventory(), fetchDemandSignals()]).then(([inv, signals]) => {
      const alertedSkus = new Set<string>(signals.composite_demand_alerts.flatMap(a => a.affected_skus));
      const allRows: TableRow[] = inv.map(item => ({
        sku: item.sku,
        product: item.product_name,
        category: item.category,
        score: deriveScore(item, alertedSkus),
        trend: deriveTrend(item, alertedSkus),
        alert: deriveAlert(item, alertedSkus),
        stock: item.current_stock,
        unitPrice: item.unit_price_ghs,
        advice: deriveScore(item, alertedSkus) >= 70
          ? "Increase current stock to meet demand"
          : item.current_stock > 120
            ? "Items have lost traction — take action to move them (promotions, etc)"
            : "Monitor stock levels closely",
        insight: signals.composite_demand_alerts.find(a => a.affected_skus.includes(item.sku))?.description ?? "",
      }));
      allRows.sort((a, b) => {
        const priority = (r: TableRow) => r.alert === "Demand Spike" ? 0 : r.alert === "Low Stock" ? 1 : 2;
        return priority(a) - priority(b) || b.score - a.score;
      });
      setRows(allRows);
      setAlerts(signals.composite_demand_alerts.filter(a => a.priority === "high").slice(0, 2));
      setInventory(inv);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => ["All", ...new Set(rows.map(r => r.category))], [rows]);
  const alertTypes = ["All", "Demand Spike", "Low Stock", "Slow Mover", "Stable"];

  const filtered = useMemo(() => rows.filter(row => {
    const q = search.toLowerCase();
    return (row.product.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q))
      && (filterCategory === "All" || row.category === filterCategory)
      && (filterAlert === "All" || row.alert === filterAlert);
  }), [rows, search, filterCategory, filterAlert]);

  const alertCount    = rows.filter(r => r.alert === "Demand Spike" || r.alert === "Low Stock").length;
  const highSignal    = rows.filter(r => r.score >= 70).length;
  const capitalAtRisk = inventory
    .filter(i => rows.find(r => r.sku === i.sku && (r.alert === "Demand Spike" || r.alert === "Low Stock")))
    .reduce((s, i) => s + i.unit_price_ghs * i.current_stock, 0);

  const revenueChange = 20500;

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px",
    fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", fontWeight: 500,
    color: C.ink, background: C.white, outline: "none", cursor: "pointer",
    appearance: "none" as const, paddingRight: 32,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6560'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.sub, fontSize: 14, ...gilroy }}>
        Loading…
      </div>
    );
  }

  if (noBatch) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, ...gilroy }}>
        <ChartBar size={52} color="#c8bfaf" weight="thin" />
        <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>No data uploaded yet</div>
        <div style={{ fontSize: 14, color: C.sub, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
          Upload your POS and inventory files to see your Command Center come to life.
        </div>
        <Link href="/dashboard/register">
          <Button variant="yellow" style={{ gap: 8 }}>
            Upload your first batch <ArrowRight size={15} weight="bold" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", width: "100%", ...gilroy }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <KpiCard title="Active Alerts"        value={String(alertCount)}            label={`${rows.filter(r=>r.alert==="Demand Spike").length} demand spikes`} accent={C.red} />
        <KpiCard title="High Signal Products" value={String(highSignal)}            label="Score above 70"            accent={C.green} />
        <KpiCard title="Revenue Change"       value={`GHS ${revenueChange.toLocaleString("en-GH")}`} label="vs. previous period" accent={C.green} compact />
        <KpiCard title="Capital at Risk"      value={`GHS ${capitalAtRisk.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} label="Current inventory exposure" accent={C.red} compact />
      </div>

      {/* Alert banners */}
      {alerts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: alerts.length > 1 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 22 }}>
          {alerts.map(alert => (
            <div key={alert.alert_id} style={{ background: C.white, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 6, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}` }}>
              <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6, fontWeight: 400, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                <strong style={{ fontWeight: 700 }}>{alert.title}</strong><br />
                {alert.recommended_action}
              </p>
              <Link href="/dashboard/opportunities" style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", marginLeft: 16, fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", flexShrink: 0 }}>
                View <span style={{ fontSize: 13 }}>→</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Table header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>Urgent Attention</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="Search product or SKU…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px 8px 32px", fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink, background: C.white, outline: "none", width: 220, boxSizing: "border-box" as const }}
            />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.sub, fontSize: 17, lineHeight: 1, pointerEvents: "none" }}>⌕</span>
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterAlert} onChange={e => setFilterAlert(e.target.value)} style={selectStyle}>
            {alertTypes.map(a => <option key={a}>{a}</option>)}
          </select>
          <Button variant="yellow" onClick={() => router.push("/dashboard/catalogue")} style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" as const }}>View All</Button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: C.white, borderRadius: 6, border: `1px solid ${C.border}`, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            {["Product", "Category", "Score", "Trend", "Alert", "Stock", "Recommended Advice", "Market Insight", ""].map((h, i) => (
              <th key={h + i} style={{
                background: C.tint, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                padding: "9px 12px", textAlign: i === 2 || i === 3 ? "center" : "left",
                fontSize: 12, fontWeight: 700, color: C.sub, textTransform: "uppercase" as const,
                letterSpacing: "0.04em", fontFamily: "Gilroy, system-ui, sans-serif",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 10).length === 0 ? (
            <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: C.sub, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>No products match your filters.</td></tr>
          ) : filtered.slice(0, 10).map((row, i) => (
            <tr key={row.sku} style={{ background: i % 2 === 0 ? C.white : "#faf7f2" }}>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                {row.product}<span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1, fontWeight: 500 }}>{row.sku}</span>
              </td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif" }}>{row.category}</td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "6px 12px", textAlign: "center" }}><ScoreRing score={row.score} /></td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", textAlign: "center" }}><TrendCell trend={row.trend} /></td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px" }}><AlertPill label={row.alert} /></td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: row.stock < 20 ? C.red : C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>{row.stock} pcs</td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12.5, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5, wordBreak: "break-word" as const }}>{row.advice}</td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12.5, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5, wordBreak: "break-word" as const }}>{row.insight || "—"}</td>
              <td style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 12px", textAlign: "center" }}>
                <button
                  onClick={() => router.push(`/dashboard/product/${encodeURIComponent(row.sku)}`)}
                  style={{
                    background: C.white, color: C.ink, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "Gilroy, system-ui, sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  View →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
