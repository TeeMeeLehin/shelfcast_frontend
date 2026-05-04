"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChartLine, ArrowRight } from "@phosphor-icons/react";
import Button from "../components/Button";
import {
  fetchInventory,
  fetchSalesHistory,
  fetchDemandSignals,
  hasAnyActiveBatch,
  type InventoryItem,
  type SaleRecord,
  type DemandSignals,
} from "@/lib/store";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialSignal = {
  signal_id: string;
  source: string;
  post_date: string;
  content: string;
  affected_categories: string[];
  demand_direction: string;
  estimated_lift: number;
  geo_relevance: string;
  platform_engagement?: { likes: number; retweets?: number };
  sentiment: string;
  demand_intent: string;
};

type BlogSignal = {
  signal_id: string;
  source: string;
  blog_name: string;
  title: string;
  excerpt: string;
  affected_categories: string[];
  estimated_lift?: number;
  demand_direction?: string;
};

type EventSignal = {
  event_id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  expected_demand_impact: string;
  affected_categories: string[];
  days_until_event_from_scrape: number;
};

type DailyPoint = { date: string; qty: number };

type CategoryData = {
  name: string;
  daily: DailyPoint[];
  totalUnits: number;
  signals: SocialSignal[];
  blogs: BlogSignal[];
  events: EventSignal[];
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildCategoryData(
  sales: SaleRecord[],
  inv: InventoryItem[],
  signals: DemandSignals,
): CategoryData[] {
  const skuCat = new Map(inv.map(i => [i.sku, i.category]));
  const dailyByCat = new Map<string, Map<string, number>>();

  for (const row of sales) {
    const cat = skuCat.get(row.sku) ?? "Other";
    if (!dailyByCat.has(cat)) dailyByCat.set(cat, new Map());
    const byDate = dailyByCat.get(cat)!;
    const d = row.timestamp.slice(0, 10);
    byDate.set(d, (byDate.get(d) ?? 0) + row.quantity);
  }

  const soc  = signals.social_signals as SocialSignal[];
  const blogs = signals.blog_signals  as BlogSignal[];
  const evts  = signals.event_calendar as EventSignal[];

  return Array.from(dailyByCat.entries())
    .map(([name, byDate]) => {
      const daily = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, qty]) => ({ date, qty }));
      const totalUnits = daily.reduce((s, d) => s + d.qty, 0);

      const catSignals = soc.filter(s => s.affected_categories.includes(name));
      const catBlogs   = blogs.filter(b => b.affected_categories?.includes(name));
      const catEvents  = evts.filter(e => e.affected_categories?.includes(name));

      return { name, daily, totalUnits, signals: catSignals, blogs: catBlogs, events: catEvents };
    })
    .sort((a, b) => b.totalUnits - a.totalUnits);
}

// Simple linear regression projection
function project(points: number[], steps: number): number[] {
  const n = points.length;
  if (n === 0) return [];
  const xMean = (n - 1) / 2;
  const yMean = points.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (points[i] - yMean); den += (i - xMean) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: steps }, (_, j) => Math.max(0, Math.round(intercept + slope * (n + j))));
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function TrendChart({ daily, proj }: { daily: DailyPoint[]; proj: number[] }) {
  const W = 620, H = 160;
  const pad = { t: 12, r: 16, b: 38, l: 48 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const allVals = [...daily.map(d => d.qty), ...proj];
  const maxVal  = Math.max(...allVals, 1) * 1.2;

  const toX = (i: number, total: number) => (i / Math.max(total - 1, 1)) * cW;
  const toY = (v: number) => cH - (v / maxVal) * cH;

  const histPts = daily.map((d, i) => `${toX(i, daily.length + proj.length - 1)},${toY(d.qty)}`).join(" ");
  const histArea = `${toX(0, daily.length + proj.length - 1)},${cH} ${histPts} ${toX(daily.length - 1, daily.length + proj.length - 1)},${cH}`;

  const projOffset = daily.length - 1;
  const projAllPts = [daily[daily.length - 1].qty, ...proj];
  const projPts = projAllPts.map((v, i) => `${toX(projOffset + i, daily.length + proj.length - 1)},${toY(v)}`).join(" ");
  const projArea = `${toX(projOffset, daily.length + proj.length - 1)},${cH} ${projPts} ${toX(projOffset + proj.length, daily.length + proj.length - 1)},${cH}`;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), Math.round(maxVal)];

  // Show x labels every ~7 days
  const labelEvery = Math.max(1, Math.floor(daily.length / 5));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <g transform={`translate(${pad.l},${pad.t})`}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={0} y1={toY(v)} x2={cW} y2={toY(v)} stroke={C.border} strokeWidth={1} />
            <text x={-6} y={toY(v) + 4} textAnchor="end" fontSize={9} fill={C.sub} fontFamily="Gilroy,system-ui,sans-serif">{v}</text>
          </g>
        ))}

        <polygon points={histArea} fill="rgba(23,147,31,0.07)" />
        <polyline points={histPts} fill="none" stroke={C.green} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {proj.length > 0 && (
          <>
            <polygon points={projArea} fill="rgba(179,92,9,0.07)" />
            <polyline points={projPts} fill="none" stroke="#b45309" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
            <line
              x1={toX(projOffset, daily.length + proj.length - 1)}
              y1={0}
              x2={toX(projOffset, daily.length + proj.length - 1)}
              y2={cH}
              stroke="#b45309" strokeWidth={1} strokeDasharray="3 3" opacity={0.4}
            />
          </>
        )}

        {daily.map((d, i) => i % labelEvery === 0 && (
          <text key={d.date} x={toX(i, daily.length + proj.length - 1)} y={cH + 14} textAnchor="middle" fontSize={9} fill={C.sub} fontFamily="Gilroy,system-ui,sans-serif">
            {d.date.slice(5)}
          </text>
        ))}
        {proj.map((_, i) => i === proj.length - 1 && (
          <text key={`p${i}`} x={toX(projOffset + i + 1, daily.length + proj.length - 1)} y={cH + 14} textAnchor="middle" fontSize={9} fill="#b45309" fontFamily="Gilroy,system-ui,sans-serif">
            +7d proj
          </text>
        ))}
      </g>
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", fontSize: 13, fontWeight: 600,
      fontFamily: "Gilroy, system-ui, sans-serif", border: "none",
      borderBottom: `2px solid ${active ? C.green : "transparent"}`,
      background: "none", color: active ? C.green : C.sub, cursor: "pointer",
      marginBottom: -1, whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

const INTENT_LABELS: Record<string, string> = {
  purchase_planning:      "Purchase Planning",
  panic_buying_risk:      "Panic Buying Risk",
  event_driven_footfall:  "Event Footfall",
  weather_driven_stocking:"Weather Stocking",
  price_sensitivity:      "Price Sensitivity",
  health_scare_response:  "Health Scare",
  compensatory_purchase:  "Compensatory Purchase",
  promotional_response:   "Promotional Response",
  restocking_awareness:   "Restocking Awareness",
};

function SignalCard({ signal }: { signal: SocialSignal }) {
  const isUp  = signal.demand_direction === "up";
  const lift  = `${isUp ? "+" : "-"}${Math.round(signal.estimated_lift * 100)}%`;
  const intent = INTENT_LABELS[signal.demand_intent] ?? signal.demand_intent;
  return (
    <div style={{ background: "#f9f6f1", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em", ...gilroy }}>{intent}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: isUp ? C.green : C.red, ...gilroy }}>{lift} lift</span>
      </div>
      <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55, margin: "0 0 8px", ...gilroy }}>{signal.content}</p>
      <p style={{ fontSize: 11, color: C.sub, margin: 0, ...gilroy }}>{signal.geo_relevance}</p>
    </div>
  );
}

function BlogCard({ blog }: { blog: BlogSignal }) {
  return (
    <div style={{ background: "#f9f6f1", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 5px", ...gilroy }}>{blog.blog_name}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, margin: "0 0 6px", lineHeight: 1.4, ...gilroy }}>{blog.title}</p>
      <p style={{ fontSize: 12, color: C.sub, margin: 0, lineHeight: 1.5, ...gilroy }}>{blog.excerpt?.slice(0, 120)}{blog.excerpt?.length > 120 ? "…" : ""}</p>
    </div>
  );
}

function EventCard({ event }: { event: EventSignal }) {
  const impactColor = event.expected_demand_impact === "high" ? C.red : event.expected_demand_impact === "medium" ? C.amber : C.green;
  const upcoming = event.days_until_event_from_scrape > 0;
  return (
    <div style={{ background: "#f9f6f1", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, ...gilroy }}>{event.event_name}</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: impactColor, background: impactColor + "18", border: `1px solid ${impactColor}40`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap", marginLeft: 8, ...gilroy }}>
          {event.expected_demand_impact} impact
        </span>
      </div>
      <p style={{ fontSize: 12, color: C.sub, margin: "0 0 4px", ...gilroy }}>
        {event.start_date} · {upcoming ? `In ${event.days_until_event_from_scrape} days` : "Completed"}
      </p>
      <p style={{ fontSize: 11, color: C.sub, margin: 0, ...gilroy }}>{event.event_type.replace(/_/g, " ")}</p>
    </div>
  );
}

function KpiTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ borderBottom: `2px solid ${accent}`, padding: "8px 14px 7px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.04em", ...gilroy }}>{label}</span>
      </div>
      <div style={{ padding: "11px 14px 13px" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, lineHeight: 1, letterSpacing: -0.5, ...gilroy }}>{value}</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 4, ...gilroy }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DemandTrendsPage() {
  const [categories,    setCategories]    = useState<CategoryData[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [noBatch,       setNoBatch]       = useState(false);
  const [selectedCat,   setSelectedCat]   = useState<string>("");
  const [signalTab,     setSignalTab]     = useState<"social" | "blogs" | "events">("social");

  useEffect(() => {
    if (!hasAnyActiveBatch()) { setNoBatch(true); setLoading(false); return; }
    Promise.all([fetchInventory(), fetchSalesHistory(), fetchDemandSignals()])
      .then(([inv, sales, signals]) => {
        const cats = buildCategoryData(sales, inv, signals);
        setCategories(cats);
        if (cats.length > 0) setSelectedCat(cats[0].name);
        setLoading(false);
      });
  }, []);

  const selected = useMemo(() => categories.find(c => c.name === selectedCat), [categories, selectedCat]);

  const proj = useMemo(() => {
    if (!selected) return [];
    return project(selected.daily.slice(-10).map(d => d.qty), 7);
  }, [selected]);

  const totalUnits  = useMemo(() => categories.reduce((s, c) => s + c.totalUnits, 0), [categories]);
  const topCategory = categories[0];
  const topLift     = useMemo(() => {
    if (!topCategory) return 0;
    return Math.round(Math.max(...(topCategory.signals.map(s => s.estimated_lift)), 0) * 100);
  }, [topCategory]);

  const weekOnWeek = useMemo(() => {
    if (!selected || selected.daily.length < 14) return null;
    const last7  = selected.daily.slice(-7).reduce((s, d) => s + d.qty, 0);
    const prev7  = selected.daily.slice(-14, -7).reduce((s, d) => s + d.qty, 0);
    if (prev7 === 0) return null;
    return Math.round(((last7 - prev7) / prev7) * 100);
  }, [selected]);

  const projTotal = proj.reduce((s, v) => s + v, 0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.sub, fontSize: 14, ...gilroy }}>
      Loading demand trends…
    </div>
  );

  if (noBatch) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, ...gilroy }}>
      <ChartLine size={52} color="#c8bfaf" weight="thin" />
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>No demand data yet</div>
      <div style={{ fontSize: 14, color: C.sub, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
        Upload your inventory and sales history to see demand trends and market signals.
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

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>Demand Trends</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>
            30-day unit sales history per category — with market signals and 7-day projections.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", ...gilroy }}>Total Units</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.ink, margin: 0, ...gilroy }}>{totalUnits.toLocaleString()}</p>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", ...gilroy }}>Top Category</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: 0, ...gilroy }}>{topCategory?.name ?? "—"}</p>
          </div>
          {topLift > 0 && (
            <div style={{ background: C.tint, border: `1px solid #c6e6c8`, borderRadius: 8, padding: "10px 18px", textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.sub, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", ...gilroy }}>Peak Signal Lift</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: 0, ...gilroy }}>+{topLift}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: "auto" }}>
        {categories.map(cat => (
          <TabBtn
            key={cat.name}
            label={`${cat.name} (${cat.totalUnits})`}
            active={selectedCat === cat.name}
            onClick={() => setSelectedCat(cat.name)}
          />
        ))}
      </div>

      {selected && (
        <>
          {/* KPIs for selected category */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            <KpiTile
              label="Units Sold (30d)"
              value={selected.totalUnits.toLocaleString()}
              sub="Total this period"
              accent={C.green}
            />
            <KpiTile
              label="Week-on-Week"
              value={weekOnWeek !== null ? `${weekOnWeek >= 0 ? "+" : ""}${weekOnWeek}%` : "—"}
              sub="vs prior 7 days"
              accent={weekOnWeek !== null && weekOnWeek >= 0 ? C.green : C.red}
            />
            <KpiTile
              label="Active Signals"
              value={String(selected.signals.length + selected.blogs.length + selected.events.length)}
              sub="Social, blog & event signals"
              accent={C.amber}
            />
            <KpiTile
              label="7-Day Projection"
              value={`~${projTotal} units`}
              sub="Linear forecast"
              accent={C.ink}
            />
          </div>

          {/* Chart */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{selected.name} — Daily Units Sold</h2>
                <p style={{ fontSize: 12, color: C.sub, margin: "3px 0 0" }}>April 4 – May 4, 2026 · Dashed = 7-day linear projection</p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 2, background: C.green, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: C.sub, ...gilroy }}>Actual</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 0, borderTop: `2px dashed ${C.amber}` }} />
                  <span style={{ fontSize: 11, color: C.sub, ...gilroy }}>Projected</span>
                </div>
              </div>
            </div>
            <TrendChart daily={selected.daily} proj={proj} />
            {projTotal > 0 && (
              <div style={{ marginTop: 12, background: "#fffbeb", border: `1px solid #fde68a`, borderRadius: 6, padding: "8px 12px" }}>
                <span style={{ fontSize: 12.5, color: C.amber, fontWeight: 700, ...gilroy }}>
                  Projected next 7 days: ~{projTotal} units
                </span>
                <span style={{ fontSize: 12.5, color: C.sub, ...gilroy }}>
                  {" "}— based on the last 10 days of sales velocity. Market signals below may shift this.
                </span>
              </div>
            )}
          </div>

          {/* Market signals */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>Why is {selected.name} trending like this?</h2>
              <p style={{ fontSize: 12, color: C.sub, margin: "3px 0 0" }}>Market signals — social media, blogs, and events — driving demand in this category</p>
            </div>

            {/* Signal type tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
              <TabBtn
                label={`Social (${selected.signals.length})`}
                active={signalTab === "social"}
                onClick={() => setSignalTab("social")}
              />
              <TabBtn
                label={`Blogs (${selected.blogs.length})`}
                active={signalTab === "blogs"}
                onClick={() => setSignalTab("blogs")}
              />
              <TabBtn
                label={`Events (${selected.events.length})`}
                active={signalTab === "events"}
                onClick={() => setSignalTab("events")}
              />
            </div>

            {signalTab === "social" && (
              selected.signals.length === 0 ? (
                <p style={{ fontSize: 13, color: C.sub, margin: 0, ...gilroy }}>No social signals detected for {selected.name} in this period.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {selected.signals.map(s => <SignalCard key={s.signal_id} signal={s} />)}
                </div>
              )
            )}

            {signalTab === "blogs" && (
              selected.blogs.length === 0 ? (
                <p style={{ fontSize: 13, color: C.sub, margin: 0, ...gilroy }}>No blog signals detected for {selected.name} in this period.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {selected.blogs.map(b => <BlogCard key={b.signal_id} blog={b} />)}
                </div>
              )
            )}

            {signalTab === "events" && (
              selected.events.length === 0 ? (
                <p style={{ fontSize: 13, color: C.sub, margin: 0, ...gilroy }}>No events affecting {selected.name} in this period.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {selected.events.map(e => <EventCard key={e.event_id} event={e} />)}
                </div>
              )
            )}

          </div>
        </>
      )}
    </div>
  );
}
