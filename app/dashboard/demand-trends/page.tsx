"use client";
import { useMemo, useState } from "react";
import salesRaw from "@/public/sales_history.json";
import demandRaw from "@/public/demand_signals.json";
import inventoryRaw from "@/public/inventory.json";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const C = {
  green:  "#17931f",
  red:    "#c0392b",
  amber:  "#d97706",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  bg:     "#f3ebda",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",
  chartLine: "#17931f",
  chartArea: "rgba(23,147,31,0.08)",
  projLine:  "#d97706",
  projArea:  "rgba(217,119,6,0.06)",
};

// ─── Data Processing ────────────────────────────────────────────────────────

type SaleRow = { transaction_id: string; timestamp: string; sku: string; quantity: number; unit_price: number; total_price: number };
type Signal  = { signal_id: string; source: string; post_date: string; content: string; affected_categories: string[]; demand_direction: string; estimated_lift: number; geo_relevance: string; platform_engagement?: { likes: number; retweets?: number }; sentiment: string; demand_intent: string };
type InvItem = { sku: string; product_name: string; category: string; unit_price_ghs: number; current_stock: number };

const sales     = salesRaw as SaleRow[];
const signals   = (demandRaw as { social_signals: Signal[] }).social_signals;
const inventory = inventoryRaw as InvItem[];

function buildDailyTotals() {
  const map: Record<string, { qty: number; revenue: number }> = {};
  for (const row of sales) {
    const d = row.timestamp.slice(0, 10);
    if (!map[d]) map[d] = { qty: 0, revenue: 0 };
    map[d].qty += row.quantity;
    map[d].revenue += row.total_price;
  }
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
}

function buildWeeklyTotals(daily: ReturnType<typeof buildDailyTotals>) {
  const weeks: { label: string; qty: number; revenue: number }[] = [];
  let i = 0;
  while (i < daily.length) {
    const chunk = daily.slice(i, i + 7);
    const label = `${chunk[0].date.slice(5)} – ${chunk[chunk.length - 1].date.slice(5)}`;
    weeks.push({ label, qty: chunk.reduce((s, d) => s + d.qty, 0), revenue: chunk.reduce((s, d) => s + d.revenue, 0) });
    i += 7;
  }
  return weeks;
}

function buildCategoryRevenue() {
  const skuCat: Record<string, string> = {};
  for (const inv of inventory) skuCat[inv.sku] = inv.category;
  const map: Record<string, number> = {};
  for (const row of sales) {
    const cat = skuCat[row.sku] ?? "Other";
    map[cat] = (map[cat] ?? 0) + row.total_price;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// Simple linear regression for projection
function linearProject(points: number[], steps: number): number[] {
  const n = points.length;
  const xMean = (n - 1) / 2;
  const yMean = points.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (points[i] - yMean); den += (i - xMean) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: steps }, (_, j) => Math.max(0, intercept + slope * (n + j)));
}

// ─── Chart Components ────────────────────────────────────────────────────────

function SparkChart({ data, projData, width = 680, height = 180, yLabel = "Revenue (GHS)" }: {
  data: { label: string; value: number }[];
  projData?: number[];
  width?: number;
  height?: number;
  yLabel?: string;
}) {
  const pad = { t: 16, r: 20, b: 48, l: 70 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const allVals = [...data.map(d => d.value), ...(projData ?? [])];
  const maxVal = Math.max(...allVals) * 1.15;
  const minVal = 0;

  const xStep = W / Math.max(data.length - 1, 1);
  const toY = (v: number) => H - ((v - minVal) / (maxVal - minVal)) * H;
  const toX = (i: number) => i * xStep;

  const histPoints = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
  const histArea   = `${toX(0)},${H} ${histPoints} ${toX(data.length - 1)},${H}`;

  const projOffset = data.length - 1;
  const projPoints = projData ? [data[data.length - 1].value, ...projData].map((v, i) => `${toX(projOffset + i)},${toY(v)}`).join(" ") : "";
  const projArea   = projData ? `${toX(projOffset)},${H} ${projPoints} ${toX(projOffset + projData.length)},${H}` : "";

  const yTicks = 4;
  const tickStep = maxVal / yTicks;

  // Show every other label on x axis if crowded
  const showEvery = data.length > 6 ? 2 : 1;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <g transform={`translate(${pad.l},${pad.t})`}>
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = tickStep * i;
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y} stroke={C.border} strokeWidth={1} />
              <text x={-8} y={y + 4} textAnchor="end" fontSize={10} fill={C.sub} fontFamily="Gilroy, system-ui, sans-serif">
                {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text x={-52} y={H / 2} textAnchor="middle" fontSize={10} fill={C.sub} fontFamily="Gilroy, system-ui, sans-serif" transform={`rotate(-90,-52,${H / 2})`}>
          {yLabel}
        </text>

        {/* Historical area + line */}
        <polygon points={histArea} fill={C.chartArea} />
        <polyline points={histPoints} fill="none" stroke={C.chartLine} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Projection area + line */}
        {projData && projData.length > 0 && (
          <>
            <polygon points={projArea} fill={C.projArea} />
            <polyline points={projPoints} fill="none" stroke={C.projLine} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r={3} fill={C.chartLine} />
        ))}

        {/* Divider between actual and projection */}
        {projData && projData.length > 0 && (
          <line x1={toX(projOffset)} y1={0} x2={toX(projOffset)} y2={H} stroke={C.projLine} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        )}

        {/* X axis labels */}
        {data.map((d, i) => (
          i % showEvery === 0 && (
            <text key={i} x={toX(i)} y={H + 16} textAnchor="middle" fontSize={9.5} fill={C.sub} fontFamily="Gilroy, system-ui, sans-serif">
              {d.label}
            </text>
          )
        ))}
        {projData && projData.map((_, i) => {
          const idx = projOffset + i + 1;
          return i % showEvery === 0 && (
            <text key={`p${i}`} x={toX(idx)} y={H + 16} textAnchor="middle" fontSize={9.5} fill={C.projLine} fontFamily="Gilroy, system-ui, sans-serif">
              proj
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function CategoryBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, ...gilroy }}>{label}</span>
        <span style={{ fontSize: 12, color: C.sub, ...gilroy }}>GHS {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 999 }}>
        <div style={{ height: 6, width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const isUp = signal.demand_direction === "up";
  const lift = `${isUp ? "+" : "-"}${Math.round(signal.estimated_lift * 100)}%`;
  const intentLabels: Record<string, string> = {
    purchase_planning: "Purchase Planning",
    panic_buying_risk: "Panic Buying Risk",
    event_driven_footfall: "Event Footfall",
    weather_driven_stocking: "Weather Stocking",
    price_sensitivity: "Price Sensitivity",
    health_trend: "Health Trend",
    brand_buzz: "Brand Buzz",
    trade_disruption: "Trade Disruption",
    product_recommendation: "Product Rec",
    regulatory_impact: "Regulatory Impact",
  };
  const intent = intentLabels[signal.demand_intent] ?? signal.demand_intent;

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, ...gilroy, textTransform: "uppercase", letterSpacing: "0.04em" }}>{intent}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: isUp ? C.green : C.red, ...gilroy }}>{lift} lift</span>
      </div>
      <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55, margin: 0, ...gilroy }}>{signal.content}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {signal.affected_categories.map(c => (
          <span key={c} style={{ fontSize: 10.5, background: C.tint, color: C.green, border: `1px solid #c6e6c8`, borderRadius: 999, padding: "1px 8px", fontWeight: 600, ...gilroy }}>{c}</span>
        ))}
        <span style={{ fontSize: 10.5, color: C.sub, marginLeft: "auto", ...gilroy }}>{signal.geo_relevance}</span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DemandTrendsPage() {
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [metric, setMetric] = useState<"revenue" | "qty">("revenue");

  const daily   = useMemo(() => buildDailyTotals(), []);
  const weekly  = useMemo(() => buildWeeklyTotals(daily), [daily]);
  const catRev  = useMemo(() => buildCategoryRevenue(), []);

  const chartData = view === "daily"
    ? daily.map(d => ({ label: d.date.slice(5), value: metric === "revenue" ? d.revenue : d.qty }))
    : weekly.map(d => ({ label: d.label, value: metric === "revenue" ? d.revenue : d.qty }));

  const histValues  = chartData.map(d => d.value);
  const projValues  = linearProject(histValues.slice(-10), 7);

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalQty     = daily.reduce((s, d) => s + d.qty, 0);
  const avgDaily     = totalRevenue / daily.length;
  const lastWeekRev  = daily.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prevWeekRev  = daily.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const weekChange   = prevWeekRev === 0 ? 0 : ((lastWeekRev - prevWeekRev) / prevWeekRev) * 100;
  const projNext7    = projValues.reduce((s, v) => s + v, 0);

  const catMax = catRev[0]?.[1] ?? 1;
  const catColors = [C.green, "#2563eb", "#d97706", "#7c3aed", "#db2777", "#0891b2"];

  // Market signals — sort by lift desc, take top 6
  const topSignals = [...signals].sort((a, b) => b.estimated_lift - a.estimated_lift).slice(0, 6);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? C.green : C.border}`,
    background: active ? C.tint : C.white,
    color: active ? C.green : C.sub,
    borderRadius: 6,
    padding: "5px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    ...gilroy,
  });

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0, ...gilroy }}>Demand Trends</h1>
        <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0", ...gilroy }}>
          April 4 – May 4, 2026 · Melcom, Tema Branch · Sales history + market signal projections
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <KpiTile label="30-Day Revenue" value={`GHS ${(totalRevenue / 1000).toFixed(1)}k`} sub="Total sales this period" accent={C.green} />
        <KpiTile label="Units Sold" value={totalQty.toLocaleString()} sub="Across all SKUs" accent={C.ink} />
        <KpiTile label="Avg Daily Revenue" value={`GHS ${Math.round(avgDaily).toLocaleString()}`} sub="Daily average" accent={C.ink} />
        <KpiTile
          label="Week-on-Week"
          value={`${weekChange >= 0 ? "+" : ""}${weekChange.toFixed(1)}%`}
          sub="vs prior 7 days"
          accent={weekChange >= 0 ? C.green : C.red}
        />
      </div>

      {/* Main chart + signals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 20 }}>

        {/* Chart card */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, ...gilroy }}>Sales Trend &amp; 7-Day Projection</h2>
              <p style={{ fontSize: 11.5, color: C.sub, margin: "3px 0 0", ...gilroy }}>
                Dashed line shows linear forecast based on last 10 data points
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={btnStyle(view === "daily")}   onClick={() => setView("daily")}>Daily</button>
              <button style={btnStyle(view === "weekly")}  onClick={() => setView("weekly")}>Weekly</button>
              <div style={{ width: 1, background: C.border, margin: "0 4px" }} />
              <button style={btnStyle(metric === "revenue")} onClick={() => setMetric("revenue")}>Revenue</button>
              <button style={btnStyle(metric === "qty")}    onClick={() => setMetric("qty")}>Units</button>
            </div>
          </div>

          <SparkChart
            data={chartData}
            projData={projValues}
            yLabel={metric === "revenue" ? "Revenue (GHS)" : "Units Sold"}
            width={680}
            height={210}
          />

          {/* Legend */}
          <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 2, background: C.chartLine, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: C.sub, ...gilroy }}>Actual</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 2, background: C.projLine, borderRadius: 1, borderTop: "2px dashed " + C.projLine }} />
              <span style={{ fontSize: 11, color: C.sub, ...gilroy }}>Projection (7 days)</span>
            </div>
          </div>

          {/* Projection callout */}
          <div style={{ marginTop: 12, background: "#fffbeb", border: `1px solid #fde68a`, borderRadius: 6, padding: "8px 12px" }}>
            <span style={{ fontSize: 12, color: C.amber, fontWeight: 700, ...gilroy }}>
              Projected next 7 days: GHS {Math.round(projNext7).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: C.sub, ...gilroy }}>
              {" "}— based on current trajectory. Market signals may shift this.
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "0 0 14px", ...gilroy }}>Revenue by Category</h2>
          {catRev.map(([cat, rev], i) => (
            <CategoryBar key={cat} label={cat} value={rev} max={catMax} color={catColors[i % catColors.length]} />
          ))}
          <p style={{ fontSize: 11, color: C.sub, marginTop: 14, lineHeight: 1.5, ...gilroy }}>
            Top category accounts for {Math.round((catRev[0]?.[1] ?? 0) / totalRevenue * 100)}% of total revenue this period.
          </p>
        </div>
      </div>

      {/* Market signals section */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, ...gilroy }}>Market Signals Driving Demand</h2>
          <p style={{ fontSize: 11.5, color: C.sub, margin: "3px 0 0", ...gilroy }}>
            Social media, news, and event data sourced from Ghana market intelligence — ranked by demand impact
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {topSignals.map(s => <SignalCard key={s.signal_id} signal={s} />)}
        </div>

        {/* Interpretation panel */}
        <div style={{ marginTop: 16, padding: "14px 16px", background: C.tint, borderRadius: 8, border: `1px solid #c6e6c8` }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: C.green, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em", ...gilroy }}>
            What this means for your inventory
          </h3>
          <p style={{ fontSize: 12.5, color: C.ink, margin: 0, lineHeight: 1.65, ...gilroy }}>
            Sallah season, heavy rains (May 3–7), and a major football event at Tema Stadium are converging this week —
            driving elevated demand across <strong>Food, Beverages, and Household</strong> categories.
            Panic-buying signals around tomato paste and price-sensitive SKUs suggest front-loading reorders.
            Your projected revenue of <strong>GHS {Math.round(projNext7).toLocaleString()}</strong> over the next 7 days assumes current stock levels hold;
            stockouts in high-lift SKUs would reduce that figure.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ borderBottom: `2px solid ${accent}`, padding: "8px 14px 7px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.04em", ...gilroy }}>{label}</span>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: accent === C.ink ? C.ink : accent, lineHeight: 1, letterSpacing: -0.5, ...gilroy }}>{value}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 4, ...gilroy }}>{sub}</div>
      </div>
    </div>
  );
}
