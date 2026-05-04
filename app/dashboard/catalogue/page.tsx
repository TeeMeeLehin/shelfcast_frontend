"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "@phosphor-icons/react";
import Button from "../components/Button";
import { fetchInventory, fetchDemandSignals, hasAnyActiveBatch, type InventoryItem } from "@/lib/store";

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

const PAGE_SIZES = [10, 25, 50, 100];

type EnrichedProduct = InventoryItem & {
  alertType: string;
  score: number;
  trend: string;
  advice: string;
};

function deriveAlert(item: InventoryItem, alertedSkus: Set<string>): string {
  if (alertedSkus.has(item.sku)) return "Demand Spike";
  if (item.current_stock < 20) return "Low Stock";
  if (item.current_stock > 120) return "Slow Mover";
  return "Stable";
}

function deriveScore(item: InventoryItem, alertedSkus: Set<string>): number {
  let base = 60;
  if (alertedSkus.has(item.sku)) base = 80 + Math.floor((item.sku.charCodeAt(9) ?? 0) % 15);
  if (item.current_stock < 20) base = Math.max(base, 70);
  if (item.current_stock > 150) base = Math.min(base, 55);
  return Math.max(30, Math.min(99, base));
}

function deriveTrend(item: InventoryItem, alertedSkus: Set<string>): string {
  if (alertedSkus.has(item.sku)) {
    const pct = 15 + (item.sku.charCodeAt(9) ?? 0) % 30;
    return `+${pct}%`;
  }
  if (item.current_stock < 20) return `+${5 + (item.sku.charCodeAt(8) ?? 0) % 15}%`;
  if (item.current_stock > 150) return `-${3 + (item.sku.charCodeAt(8) ?? 0) % 10}%`;
  return `+${1 + (item.sku.charCodeAt(8) ?? 0) % 8}%`;
}

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? C.green : C.red;
  return (
    <svg width={34} height={34} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={17} cy={17} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle cx={17} cy={17} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 17 17)" />
      <text x={17} y={21} textAnchor="middle" fontSize={9} fontWeight={700} fill={color} fontFamily="Gilroy, system-ui, sans-serif">{score}</text>
    </svg>
  );
}

function TrendCell({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: isUp ? C.green : C.red, fontWeight: 700, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{isUp ? "↑" : "↓"}</span>{trend}
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

function PagBtn({ label, onClick, active, disabled }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 34, height: 34, padding: "0 10px", fontSize: 13,
      fontWeight: active ? 700 : 500, fontFamily: "Gilroy, system-ui, sans-serif",
      border: `1px solid ${active ? C.green : C.border}`, borderRadius: 6,
      background: active ? C.tint : C.white,
      color: active ? C.green : disabled ? "#ccc" : C.ink,
      cursor: disabled ? "default" : "pointer", transition: "all 0.1s",
    }}>{label}</button>
  );
}

export default function CataloguePage() {
  const [products, setProducts]         = useState<EnrichedProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [noBatch, setNoBatch]           = useState(false);
  const [search, setSearch]             = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAlert, setFilterAlert]   = useState("All");
  const [pageSize, setPageSize]         = useState(25);
  const [page, setPage]                 = useState(1);

  useEffect(() => {
    if (!hasAnyActiveBatch()) {
      setNoBatch(true);
      setLoading(false);
      return;
    }
    Promise.all([fetchInventory(), fetchDemandSignals()]).then(([inv, signals]) => {
      const alertedSkus = new Set<string>(
        signals.composite_demand_alerts.flatMap(a => a.affected_skus)
      );
      const enriched: EnrichedProduct[] = inv.map(item => {
        const alertType = deriveAlert(item, alertedSkus);
        const score = deriveScore(item, alertedSkus);
        const trend = deriveTrend(item, alertedSkus);
        const advice = score >= 70
          ? "Increase current stock to meet demand"
          : alertType === "Slow Mover"
            ? "Items have lost traction — take action to move them (promotions, etc)"
            : "Monitor stock levels closely";
        return { ...item, alertType, score, trend, advice };
      });
      setProducts(enriched);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))].sort();
    return ["All", ...cats];
  }, [products]);

  const alertTypes = ["All", "Demand Spike", "Low Stock", "Slow Mover", "Stable"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(row => {
      const matchSearch = row.product_name.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q);
      const matchCat    = filterCategory === "All" || row.category === filterCategory;
      const matchAlert  = filterAlert === "All" || row.alertType === filterAlert;
      return matchSearch && matchCat && matchAlert;
    });
  }, [products, search, filterCategory, filterAlert]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeFilter = (fn: () => void) => { fn(); setPage(1); };

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px",
    fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", fontWeight: 500,
    color: C.ink, background: C.white, outline: "none", cursor: "pointer",
    appearance: "none" as const, paddingRight: 32,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6560'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center",
  };

  const pageButtons = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (safePage <= 4) pages.push(1, 2, 3, 4, 5, "...", totalPages);
    else if (safePage >= totalPages - 3) pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    else pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    return pages;
  }, [totalPages, safePage]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.sub, fontSize: 14, ...gilroy }}>
        Loading catalogue…
      </div>
    );
  }

  if (noBatch) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, ...gilroy }}>
        <Package size={52} color="#c8bfaf" weight="thin" />
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>No data loaded</div>
        <div style={{ fontSize: 14, color: C.sub }}>Upload and activate a batch to view your catalogue.</div>
        <Link href="/dashboard/register" style={{ textDecoration: "none" }}>
          <Button variant="yellow" style={{ gap: 8 }}>
            Go to Register Data <ArrowRight size={15} weight="bold" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>Product Catalogue</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0", fontWeight: 400 }}>
            {filtered.length.toLocaleString()} of {products.length} products
            {(filterCategory !== "All" || filterAlert !== "All" || search) ? " (filtered)" : ""}
          </p>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: C.ink, textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", background: C.white }}>
          ← Command Center
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <input type="text" placeholder="Search product or SKU…" value={search}
            onChange={e => changeFilter(() => setSearch(e.target.value))}
            style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px 8px 32px", fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink, background: C.white, outline: "none", width: "100%", boxSizing: "border-box" as const }}
          />
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.sub, fontSize: 17, lineHeight: 1, pointerEvents: "none" }}>⌕</span>
        </div>
        <select value={filterCategory} onChange={e => changeFilter(() => setFilterCategory(e.target.value))} style={selectStyle}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterAlert} onChange={e => changeFilter(() => setFilterAlert(e.target.value))} style={selectStyle}>
          {alertTypes.map(a => <option key={a}>{a}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Show</span>
          <div style={{ display: "flex", gap: 4 }}>
            {PAGE_SIZES.map(size => (
              <button key={size} onClick={() => { setPageSize(size); setPage(1); }} style={{
                padding: "7px 12px", fontSize: 13, fontWeight: 600, fontFamily: "Gilroy, system-ui, sans-serif",
                border: `1px solid ${pageSize === size ? C.green : C.border}`, borderRadius: 6,
                background: pageSize === size ? C.tint : C.white,
                color: pageSize === size ? C.green : C.ink, cursor: "pointer",
              }}>{size}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: C.white, borderRadius: 6, border: `1px solid ${C.border}`, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              {["Product", "Category", "Score", "Trend", "Alert", "Price (GHS)", "Stock", "Advice"].map((h, i) => (
                <th key={h} style={{
                  background: C.tint, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
                  padding: "10px 12px", textAlign: i === 2 || i === 3 ? "center" : "left",
                  fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" as const,
                  letterSpacing: "0.05em", fontFamily: "Gilroy, system-ui, sans-serif",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.sub, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>No products match your filters.</td></tr>
            ) : pageRows.map((row, i) => (
              <tr key={row.sku} style={{ background: i % 2 === 0 ? C.white : "#faf7f2" }}>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  {row.product_name}
                  <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1, fontWeight: 500 }}>{row.sku}</span>
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif" }}>{row.category}</td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "6px 12px", textAlign: "center" }}>
                  <ScoreRing score={row.score} />
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", textAlign: "center" }}>
                  <TrendCell trend={row.trend} />
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px" }}>
                  <AlertPill label={row.alertType} />
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  {row.unit_price_ghs.toFixed(2)}
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: row.current_stock < 20 ? C.red : C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  {row.current_stock} pcs
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5 }}>
                  {row.advice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length.toLocaleString()}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <PagBtn label="←" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} />
          {pageButtons.map((p, i) =>
            p === "..." ? (
              <span key={`d${i}`} style={{ padding: "0 6px", color: C.sub, fontSize: 13 }}>…</span>
            ) : (
              <PagBtn key={p} label={String(p)} onClick={() => setPage(p as number)} active={p === safePage} />
            )
          )}
          <PagBtn label="→" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
        </div>
      </div>
    </div>
  );
}
