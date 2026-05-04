"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

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

/* ── Mock catalogue data ───────────────────────────────────────────── */
const ALL_PRODUCTS = Array.from({ length: 248 }, (_, i) => {
  const products = [
    { product: "Sunlight Dish Liquid 750ml", sku: "UNL-SL750",  category: "Cleaning", alert: "Demand Spike", trend: "+34%", score: 88, stock: "10 pcs"  },
    { product: "Omo Auto 1kg",               sku: "UNL-OM1KG",  category: "Cleaning", alert: "Demand Spike", trend: "+18%", score: 76, stock: "42 pcs"  },
    { product: "Indomie Chicken 70g (x10)",  sku: "IND-CK70X",  category: "Food",     alert: "Low Stock",    trend: "+12%", score: 71, stock: "18 pcs"  },
    { product: "Peak Milk Full Cream 400g",  sku: "PKM-FC400",  category: "Dairy",    alert: "Slow Mover",   trend: "-5%",  score: 65, stock: "130 pcs" },
    { product: "Milo Powder 400g",           sku: "MLO-PW400",  category: "Beverage", alert: "Demand Spike", trend: "+9%",  score: 80, stock: "55 pcs"  },
    { product: "Nescafé Classic 100g",       sku: "NSC-CL100",  category: "Beverage", alert: "Slow Mover",   trend: "-3%",  score: 58, stock: "200 pcs" },
    { product: "Ariel Powder 1kg",           sku: "ARL-PW1KG",  category: "Cleaning", alert: "Low Stock",    trend: "+6%",  score: 73, stock: "8 pcs"   },
    { product: "Cowbell Powdered Milk 400g", sku: "CWB-PM400",  category: "Dairy",    alert: "Slow Mover",   trend: "-7%",  score: 52, stock: "160 pcs" },
  ];
  const base = products[i % products.length];
  return {
    id: i + 1,
    product: i < 8 ? base.product : `${base.product} (v${Math.floor(i / 8) + 1})`,
    sku: `SKU: ${base.sku}-${String(i + 1).padStart(3, "0")}`,
    category: base.category,
    alert: base.alert,
    trend: base.trend,
    score: Math.max(30, Math.min(99, base.score + (i % 7) - 3)),
    stock: base.stock,
  };
});

const CATEGORIES = ["All", "Cleaning", "Food", "Dairy", "Beverage"];
const ALERT_TYPES = ["All", "Demand Spike", "Low Stock", "Slow Mover"];
const LOCATIONS   = ["All Branches", "Tema Branch", "Accra Central", "Kumasi Branch", "Takoradi Branch", "Tamale Branch"];
const PAGE_SIZES  = [8, 20, 50, 100, 200];

/* ── Sub-components ─────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? C.green : C.red;
  return (
    <svg width={34} height={34} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={17} cy={17} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle
        cx={17} cy={17} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 17 17)"
      />
      <text x={17} y={21} textAnchor="middle" fontSize={9} fontWeight={700} fill={color} fontFamily="Gilroy, system-ui, sans-serif">
        {score}
      </text>
    </svg>
  );
}

function TrendCell({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: isUp ? C.green : C.red, fontWeight: 700, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{isUp ? "↑" : "↓"}</span>
      {trend}
    </span>
  );
}

function AlertPill({ label }: { label: string }) {
  const isRisk = label === "Demand Spike" || label === "Low Stock";
  return (
    <span style={{
      display: "inline-block",
      background: isRisk ? "#fbeaea" : C.tint,
      color: isRisk ? C.red : C.green,
      borderRadius: 999,
      padding: "2px 10px",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
      fontFamily: "Gilroy, system-ui, sans-serif",
      border: `1px solid ${isRisk ? "#f0cccc" : "#c6e6c8"}`,
    }}>
      {label}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function CataloguePage() {
  const [search, setSearch]             = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAlert, setFilterAlert]   = useState("All");
  const [filterLocation, setFilterLocation] = useState("All Branches");
  const [pageSize, setPageSize]         = useState(8);
  const [page, setPage]                 = useState(1);

  void filterLocation;

  const filtered = useMemo(() => {
    return ALL_PRODUCTS.filter(row => {
      const q = search.toLowerCase();
      const matchSearch = row.product.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q);
      const matchCat    = filterCategory === "All" || row.category === filterCategory;
      const matchAlert  = filterAlert === "All" || row.alert === filterAlert;
      return matchSearch && matchCat && matchAlert;
    });
  }, [search, filterCategory, filterAlert]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function changePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function changeFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "Gilroy, system-ui, sans-serif",
    fontWeight: 500,
    color: C.ink,
    background: C.white,
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    paddingRight: 32,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6560'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 11px center",
  };

  /* Page number buttons to show */
  const pageButtons = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box", ...gilroy }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.2 }}>Product Catalogue</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0", fontWeight: 400 }}>
            {filtered.length.toLocaleString()} products
            {(filterCategory !== "All" || filterAlert !== "All" || search) ? " (filtered)" : ""}
          </p>
        </div>
        <Link
          href="/dashboard"
          style={{ fontSize: 13, fontWeight: 600, color: C.ink, textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", background: C.white, display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          ← Command Center
        </Link>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <input
            type="text"
            placeholder="Search product or SKU…"
            value={search}
            onChange={e => changeFilter(() => setSearch(e.target.value))}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "8px 12px 8px 32px",
              fontSize: 13,
              fontFamily: "Gilroy, system-ui, sans-serif",
              color: C.ink,
              background: C.white,
              outline: "none",
              width: "100%",
              boxSizing: "border-box" as const,
            }}
          />
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.sub, fontSize: 17, lineHeight: 1, pointerEvents: "none" }}>⌕</span>
        </div>

        <select value={filterCategory} onChange={e => changeFilter(() => setFilterCategory(e.target.value))} style={selectStyle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={filterAlert} onChange={e => changeFilter(() => setFilterAlert(e.target.value))} style={selectStyle}>
          {ALERT_TYPES.map(a => <option key={a}>{a}</option>)}
        </select>

        <select value={filterLocation} onChange={e => changeFilter(() => setFilterLocation(e.target.value))} style={selectStyle}>
          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Page size */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Show</span>
          <div style={{ display: "flex", gap: 4 }}>
            {PAGE_SIZES.map(size => (
              <button
                key={size}
                onClick={() => changePageSize(size)}
                style={{
                  padding: "7px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Gilroy, system-ui, sans-serif",
                  border: `1px solid ${pageSize === size ? C.green : C.border}`,
                  borderRadius: 6,
                  background: pageSize === size ? C.tint : C.white,
                  color: pageSize === size ? C.green : C.ink,
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: C.white, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>
          <thead>
            <tr>
              {["Product", "Category", "Score", "Trend", "Alert", "Current Stock", "Recommended Advice", ""].map((h, i) => (
                <th key={i} style={{
                  background: C.tint,
                  borderBottom: `1px solid ${C.border}`,
                  borderRight: `1px solid ${C.border}`,
                  padding: "10px 12px",
                  textAlign: i === 2 || i === 3 ? "center" : "left",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.sub,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  fontFamily: "Gilroy, system-ui, sans-serif",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: C.sub, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  No products match your filters.
                </td>
              </tr>
            ) : pageRows.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? C.white : "#faf7f2" }}>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  {row.product}
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
                  <AlertPill label={row.alert} />
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                  {row.stock}
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12.5, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5 }}>
                  {row.score >= 70 ? "Increase current stock to meet demand" : "Items have lost traction — take action to quickly remove them"}
                </td>
                <td style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 12px", textAlign: "center" }}>
                  <a href="#" style={{ fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", textDecoration: "underline" }}>
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length.toLocaleString()} products
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <PagBtn label="←" onClick={() => changePage(safePage - 1)} disabled={safePage === 1} />
          {pageButtons.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} style={{ padding: "0 6px", color: C.sub, fontSize: 13 }}>…</span>
            ) : (
              <PagBtn
                key={p}
                label={String(p)}
                onClick={() => changePage(p as number)}
                active={p === safePage}
              />
            )
          )}
          <PagBtn label="→" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages} />
        </div>
      </div>
    </div>
  );
}

function PagBtn({ label, onClick, active, disabled }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 34,
        height: 34,
        padding: "0 10px",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        fontFamily: "Gilroy, system-ui, sans-serif",
        border: `1px solid ${active ? C.green : C.border}`,
        borderRadius: 6,
        background: active ? C.tint : C.white,
        color: active ? C.green : disabled ? "#ccc" : C.ink,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.1s",
      }}
    >
      {label}
    </button>
  );
}
