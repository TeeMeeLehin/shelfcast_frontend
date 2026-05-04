"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import {
  fetchInventory,
  fetchDemandSignals,
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
  bg:     "#f3ebda",
};

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

function deriveAlert(item: InventoryItem, alertedSkus: Set<string>): string {
  if (alertedSkus.has(item.sku)) return "Demand Spike";
  if (item.current_stock < 20) return "Low Stock";
  if (item.current_stock > 120) return "Slow Mover";
  return "Stable";
}

function ScoreRing({ score }: { score: number }) {
  const r = 38, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 70 ? C.green : C.red;
  return (
    <svg width={100} height={100} style={{ display: "block" }}>
      <circle cx={50} cy={50} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
      <text x={50} y={56} textAnchor="middle" fontSize={24} fontWeight={800} fill={color} fontFamily="Gilroy, system-ui, sans-serif">{score}</text>
    </svg>
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
      borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 700,
      fontFamily: "Gilroy, system-ui, sans-serif",
      border: `1px solid ${isRed ? "#f0cccc" : isGray ? "#e0e0e0" : "#c6e6c8"}`,
    }}>{label}</span>
  );
}

function SignalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 13, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", width: 130, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: "#ede8e0", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", width: 32, textAlign: "right" }}>{value}</div>
    </div>
  );
}

type ProductData = {
  item: InventoryItem;
  alert: DemandAlert | null;
  score: number;
  trend: string;
  alertLabel: string;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const sku = decodeURIComponent(params.sku as string);
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInventory(), fetchDemandSignals()]).then(([inv, signals]) => {
      const item = inv.find(i => i.sku === sku);
      if (!item) { setLoading(false); return; }
      const alertedSkus = new Set<string>(signals.composite_demand_alerts.flatMap(a => a.affected_skus));
      const alert = signals.composite_demand_alerts.find(a => a.affected_skus.includes(sku)) ?? null;
      setData({
        item,
        alert,
        score: deriveScore(item, alertedSkus),
        trend: deriveTrend(item, alertedSkus),
        alertLabel: deriveAlert(item, alertedSkus),
      });
      setLoading(false);
    });
  }, [sku]);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.sub, fontSize: 14, ...gilroy }}>Loading…</div>;
  }

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, ...gilroy }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Product not found</div>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.green, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>← Back</button>
      </div>
    );
  }

  const { item, alert, score, trend, alertLabel } = data;
  const isSpike = alertLabel === "Demand Spike";
  const trendUp = trend.startsWith("+");
  const trendColor = trendUp ? C.green : C.red;
  const dailyVelocity = Math.round(item.current_stock / 9) || 33;
  const daysCover = Math.round(item.current_stock / dailyVelocity);
  const reorderRec = item.current_stock;

  const signals = [
    { label: "Social (25%)",     value: Math.min(99, score + 6),  color: C.green },
    { label: "Search (20%)",     value: Math.min(99, score - 6),  color: C.green },
    { label: "Internal (30%)",   value: Math.min(99, score - 17), color: "#e8a020" },
    { label: "Competitor (15%)", value: Math.min(99, score - 33), color: "#e8a020" },
    { label: "News (10%)",       value: Math.min(99, score - 48), color: C.red },
  ];

  const stockItems = [
    { label: "Units in stock",  value: String(item.current_stock) },
    { label: "Daily velocity",  value: `~${dailyVelocity} units` },
    { label: "Days cover",      value: `${daysCover} days` },
    { label: "Next delivery",   value: "12 May" },
    { label: "Lead time",       value: "4 days" },
    { label: "Reorder rec.",    value: `${reorderRec} units` },
  ];

  return (
    <div style={{ padding: "28px 40px", width: "100%", maxWidth: 820, margin: "0 auto", ...gilroy }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 13, fontWeight: 600, fontFamily: "Gilroy, system-ui, sans-serif", marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={15} weight="bold" /> Back to Command Center
      </button>

      {/* Product header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.ink, margin: 0 }}>{item.product_name}</h1>
          <AlertPill label={alertLabel} />
        </div>
        <div style={{ fontSize: 13, color: C.sub }}>
          SKU: {item.sku} · {item.category} · intelligence from today 6:04 am
        </div>
      </div>

      {/* Score + narrative */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <ScoreRing score={score} />
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6, textAlign: "center" }}>signal score</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: trendColor, marginTop: 4 }}>
            {trendUp ? "↑" : "↓"} {trend} vs last week
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.8, margin: "0 0 16px" }}>
            {alert?.description ?? `${item.product_name} is showing ${isSpike ? "elevated demand signals" : "normal activity"}. At current sales velocity of approximately ${dailyVelocity} units per day, your remaining stock of ${item.current_stock} units covers roughly ${daysCover} days.`}
          </p>
          {isSpike && (
            <div style={{ background: "#fff8e8", border: "1px solid #f5d76e", borderRadius: 8, padding: "12px 16px", fontSize: 13.5, color: "#7a5000", lineHeight: 1.6 }}>
              <strong>Suggested action:</strong> Place an emergency reorder of {reorderRec} units with your supplier by end of day today.
            </div>
          )}
        </div>
      </div>

      {/* Signal breakdown */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Signal breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {signals.map(s => <SignalBar key={s.label} label={s.label} value={s.value} color={s.color} />)}
        </div>
      </div>

      {/* Active alert */}
      {isSpike && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}`, borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Active alert</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 4 }}>
            Demand spike — High confidence
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10 }}>Detected today 6:04 am</div>
          <div style={{ display: "inline-block", background: "#fbeaea", color: C.red, borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 700, border: "1px solid #f0cccc", marginBottom: 14 }}>
            High
          </div>
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, margin: "0 0 18px" }}>
            TikTok trend + rising search. {daysCover} days cover remaining at current velocity.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: C.ink, color: C.white, border: "none", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Gilroy, system-ui, sans-serif" }}>
              Mark actioned
            </button>
            <button style={{ background: C.white, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Gilroy, system-ui, sans-serif" }}>
              Snooze 48h
            </button>
          </div>
        </div>
      )}

      {/* Stock snapshot */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: C.tint, padding: "12px 24px", fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Stock snapshot
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {stockItems.map((s, i) => (
            <div key={s.label} style={{
              padding: "16px 24px",
              borderTop: `1px solid ${C.border}`,
              borderRight: i % 3 !== 2 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
