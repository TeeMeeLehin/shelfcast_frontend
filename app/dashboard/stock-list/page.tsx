"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash, Export, ListBullets, X, MagnifyingGlass } from "@phosphor-icons/react";
import { fetchInventory, hasAnyActiveBatch, type InventoryItem } from "@/lib/store";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const C = {
  green:  "#17931f",
  red:    "#c0392b",
  yellow: "#f5c842",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",
  bg:     "#f3ebda",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type StockListItem = {
  sku: string;
  product_name: string;
  category: string;
  qty: number;
  unit_price: number;
};

type StockList = {
  id: string;
  name: string;
  createdAt: string;
  items: StockListItem[];
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "sc_stock_lists";

function loadLists(): StockList[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLists(lists: StockList[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function totalValue(items: StockListItem[]) {
  return items.reduce((s, r) => s + r.qty * r.unit_price, 0);
}

function exportToCSV(list: StockList) {
  const headers = ["SKU", "Product", "Category", "Qty", "Unit Price (GHS)", "Total (GHS)"];
  const lines = [
    headers.join(","),
    ...list.items.map(r => [
      r.sku,
      `"${r.product_name.replace(/"/g, '""')}"`,
      r.category,
      r.qty,
      r.unit_price.toFixed(2),
      (r.qty * r.unit_price).toFixed(2),
    ].join(",")),
    "",
    `"Total",,,,"",${totalValue(list.items).toFixed(2)}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${list.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GhsFormat(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InlineInput({
  value, onChange, type = "text", min, style,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      onChange={e => onChange(e.target.value)}
      style={{
        border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 8px",
        fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink,
        background: C.white, outline: "none", width: "100%", boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

// Product picker modal
function AddProductModal({
  inventory,
  existingSkus,
  onAdd,
  onClose,
}: {
  inventory: InventoryItem[];
  existingSkus: Set<string>;
  onAdd: (item: InventoryItem) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = useMemo(() => {
    const cats = [...new Set(inventory.map(i => i.category))].sort();
    return ["All", ...cats];
  }, [inventory]);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return inventory.filter(i =>
      (i.product_name.toLowerCase().includes(lq) || i.sku.toLowerCase().includes(lq)) &&
      (cat === "All" || i.category === cat)
    );
  }, [inventory, q, cat]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 12, width: 560, maxHeight: "75vh",
        display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, ...gilroy }}>Add product to list</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, display: "flex", padding: 0 }}><X size={18} /></button>
        </div>

        {/* Filters */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MagnifyingGlass size={15} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.sub, pointerEvents: "none" }} />
            <input
              type="text" placeholder="Search product or SKU…" value={q}
              onChange={e => setQ(e.target.value)} autoFocus
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px 8px 30px", fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink, background: C.white, outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{
            border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 28px 8px 10px", fontSize: 13,
            fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink, background: C.white,
            outline: "none", cursor: "pointer", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b6560'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
          }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.sub, fontSize: 13, ...gilroy }}>No products found.</div>
          ) : filtered.map(item => {
            const already = existingSkus.has(item.sku);
            return (
              <div key={item.sku} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 20px", borderBottom: `1px solid ${C.border}`,
                background: already ? "#faf7f2" : C.white,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: already ? C.sub : C.ink, ...gilroy }}>{item.product_name}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 1, ...gilroy }}>{item.sku} · {item.category} · GHS {item.unit_price_ghs.toFixed(2)}</div>
                </div>
                <button
                  disabled={already}
                  onClick={() => { onAdd(item); }}
                  style={{
                    border: `1px solid ${already ? C.border : C.green}`,
                    borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                    fontFamily: "Gilroy, system-ui, sans-serif",
                    background: already ? C.bg : C.tint,
                    color: already ? C.sub : C.green,
                    cursor: already ? "default" : "pointer",
                  }}
                >
                  {already ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StockListPage() {
  const [lists, setLists]           = useState<StockList[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [inventory, setInventory]   = useState<InventoryItem[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating]     = useState(false);

  // Load lists from localStorage
  useEffect(() => {
    setLists(loadLists());
  }, []);

  // Load inventory for the picker
  useEffect(() => {
    if (!hasAnyActiveBatch()) { setLoadingInv(false); return; }
    fetchInventory().then(inv => { setInventory(inv); setLoadingInv(false); });
  }, []);

  const persist = useCallback((updated: StockList[]) => {
    setLists(updated);
    saveLists(updated);
  }, []);

  const activeList = lists.find(l => l.id === activeId) ?? null;

  function createList() {
    const name = newListName.trim();
    if (!name) return;
    const next: StockList = { id: uid(), name, createdAt: new Date().toISOString(), items: [] };
    const updated = [next, ...lists];
    persist(updated);
    setActiveId(next.id);
    setNewListName("");
    setCreating(false);
  }

  function deleteList(id: string) {
    const updated = lists.filter(l => l.id !== id);
    persist(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  }

  function addProduct(item: InventoryItem) {
    if (!activeList) return;
    const newItem: StockListItem = {
      sku: item.sku,
      product_name: item.product_name,
      category: item.category,
      qty: 1,
      unit_price: item.unit_price_ghs,
    };
    updateList({ ...activeList, items: [...activeList.items, newItem] });
  }

  function updateItem(sku: string, field: "qty" | "unit_price", raw: string) {
    if (!activeList) return;
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    const items = activeList.items.map(r =>
      r.sku === sku ? { ...r, [field]: field === "qty" ? Math.round(val) : val } : r
    );
    updateList({ ...activeList, items });
  }

  function removeItem(sku: string) {
    if (!activeList) return;
    updateList({ ...activeList, items: activeList.items.filter(r => r.sku !== sku) });
  }

  function updateList(updated: StockList) {
    persist(lists.map(l => l.id === updated.id ? updated : l));
  }

  const existingSkus = useMemo(
    () => new Set(activeList?.items.map(i => i.sku) ?? []),
    [activeList]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", ...gilroy }}>

      {/* Sidebar — list of stock lists */}
      <aside style={{
        width: 240, flexShrink: 0, borderRight: `1px solid ${C.border}`,
        background: C.white, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>My Stock Lists</div>
          <button
            onClick={() => setCreating(true)}
            style={{ background: C.ink, color: C.white, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...gilroy }}
          >
            <Plus size={13} weight="bold" /> New
          </button>
        </div>

        {/* New list input */}
        {creating && (
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: C.tint }}>
            <input
              autoFocus
              type="text"
              placeholder="List name…"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createList(); if (e.key === "Escape") { setCreating(false); setNewListName(""); } }}
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif", color: C.ink, background: C.white, outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 6 }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={createList} style={{ flex: 1, background: C.green, color: C.white, border: "none", borderRadius: 6, padding: "6px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", ...gilroy }}>Create</button>
              <button onClick={() => { setCreating(false); setNewListName(""); }} style={{ flex: 1, background: C.white, color: C.sub, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", ...gilroy }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Lists */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {lists.length === 0 && !creating ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: C.sub, fontSize: 12, lineHeight: 1.6 }}>
              No stock lists yet.<br />Create one to get started.
            </div>
          ) : lists.map(list => (
            <div
              key={list.id}
              onClick={() => setActiveId(list.id)}
              style={{
                padding: "11px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                background: list.id === activeId ? C.tint : C.white,
                borderLeft: list.id === activeId ? `3px solid ${C.green}` : "3px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: list.id === activeId ? C.green : C.ink }}>{list.name}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                  {list.items.length} item{list.items.length !== 1 ? "s" : ""} · {new Date(list.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteList(list.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 2, display: "flex" }}
                title="Delete list"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {!activeList ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <ListBullets size={52} color="#c8bfaf" weight="thin" />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>No list selected</div>
            <div style={{ fontSize: 13, color: C.sub, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
              Create a new stock list in the sidebar, then add products you want to restock.
            </div>
            <button
              onClick={() => setCreating(true)}
              style={{ background: C.ink, color: C.white, border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", ...gilroy }}
            >
              + Create a stock list
            </button>
          </div>
        ) : (
          <div style={{ padding: "24px 32px", width: "100%", boxSizing: "border-box" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>{activeList.name}</h1>
                <div style={{ fontSize: 13, color: C.sub }}>
                  Created {new Date(activeList.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })} · {activeList.items.length} product{activeList.items.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ink, color: C.white, border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", ...gilroy }}
                >
                  <Plus size={14} weight="bold" /> Add Product
                </button>
                {activeList.items.length > 0 && (
                  <button
                    onClick={() => exportToCSV(activeList)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 600, fontFamily: "Gilroy, system-ui, sans-serif", background: C.white, color: C.ink, cursor: "pointer" }}
                  >
                    <Export size={14} /> Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Summary bar */}
            {activeList.items.length > 0 && (
              <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
                {[
                  { label: "Products", value: String(activeList.items.length) },
                  { label: "Total Units", value: activeList.items.reduce((s, r) => s + r.qty, 0).toLocaleString() },
                  { label: "Total Cost", value: GhsFormat(totalValue(activeList.items)) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 18px", minWidth: 140 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            {activeList.items.length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "48px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>This list is empty</div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Add products you want to restock to this list.</div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ background: C.ink, color: C.white, border: "none", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", ...gilroy }}
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "5%" }} />
                </colgroup>
                <thead>
                  <tr>
                    {["Product", "Category", "Qty to Order", "Unit Price (GHS)", "Total (GHS)", ""].map((h, i) => (
                      <th key={h + i} style={{
                        background: C.tint, borderBottom: `1px solid ${C.border}`, borderRight: i < 5 ? `1px solid ${C.border}` : "none",
                        padding: "10px 14px", textAlign: i >= 2 && i <= 4 ? "right" : "left",
                        fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase",
                        letterSpacing: "0.05em", fontFamily: "Gilroy, system-ui, sans-serif",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeList.items.map((row, i) => {
                    const lineTotal = row.qty * row.unit_price;
                    return (
                      <tr key={row.sku} style={{ background: i % 2 === 0 ? C.white : "#faf7f2" }}>
                        <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                          {row.product_name}
                          <span style={{ display: "block", fontSize: 11, color: C.sub, marginTop: 1, fontWeight: 500 }}>{row.sku}</span>
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 14px", fontSize: 13, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                          {row.category}
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "8px 14px" }}>
                          <InlineInput
                            type="number" min={1} value={row.qty}
                            onChange={v => updateItem(row.sku, "qty", v)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "8px 14px" }}>
                          <InlineInput
                            type="number" min={0} value={row.unit_price}
                            onChange={v => updateItem(row.sku, "unit_price", v)}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 14px", fontSize: 13, fontWeight: 700, textAlign: "right", color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                          {lineTotal.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 14px", textAlign: "center" }}>
                          <button
                            onClick={() => removeItem(row.sku)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", margin: "0 auto" }}
                            title="Remove"
                          >
                            <Trash size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr style={{ background: C.tint }}>
                    <td colSpan={4} style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", borderTop: `2px solid ${C.border}` }}>
                      Total
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, textAlign: "right", color: C.green, fontFamily: "Gilroy, system-ui, sans-serif", borderTop: `2px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }}>
                      {GhsFormat(totalValue(activeList.items))}
                    </td>
                    <td style={{ borderTop: `2px solid ${C.border}` }} />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add product modal */}
      {showModal && (
        <AddProductModal
          inventory={inventory}
          existingSkus={existingSkus}
          onAdd={item => addProduct(item)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
