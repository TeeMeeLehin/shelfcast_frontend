"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CloudArrowUp,
  CheckCircle,
  XCircle,
  SpinnerGap,
  X,
  File,
} from "@phosphor-icons/react";
import Button from "./components/Button";
import { DEMO_MODE, API_BASE } from "@/lib/config";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

const ALLOWED = [".csv", ".xlsx", ".xls"];

type FileStatus =
  | { phase: "staged" }
  | { phase: "uploading" }
  | { phase: "processing"; jobId: string }
  | { phase: "done"; clean: number; rejected: number }
  | { phase: "error"; message: string };

type StagedFile = {
  id: string;
  file: File;
  status: FileStatus;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CommandCenterUpload() {
  const [view, setView] = useState<"upload" | "dashboard">(DEMO_MODE ? "dashboard" : "upload");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid: StagedFile[] = [];
    Array.from(incoming).forEach(file => {
      if (ALLOWED.some(ext => file.name.toLowerCase().endsWith(ext))) {
        valid.push({ id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, file, status: { phase: "staged" } });
      }
    });
    setStagedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.file.name));
      return [...prev, ...valid.filter(f => !existingNames.has(f.file.name))];
    });
  }, []);

  const removeFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileStatus = (id: string, status: FileStatus) => {
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const pollJobStatus = useCallback((id: string, jobId: string, onDone: () => void) => {
    if (DEMO_MODE) { onDone(); return; }
    const token = localStorage.getItem("sc_token");
    function tick() {
      fetch(`${API_BASE}/api/v1/ingest/status/${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => {
          if (data.status === "complete" || data.status === "partial") {
            updateFileStatus(id, { phase: "done", clean: data.clean_rows ?? 0, rejected: data.rejected_rows ?? 0 });
            onDone();
          } else if (data.status === "failed") {
            const reason = data.error_summary?.[0]?.reason ?? "Processing failed.";
            updateFileStatus(id, { phase: "error", message: reason });
            onDone();
          } else {
            setTimeout(tick, 2000);
          }
        })
        .catch(() => setTimeout(tick, 3000));
    }
    tick();
  }, []);

  const uploadFile = useCallback(async (staged: StagedFile): Promise<void> => {
    if (DEMO_MODE) {
      updateFileStatus(staged.id, { phase: "uploading" });
      await new Promise(r => setTimeout(r, 600));
      updateFileStatus(staged.id, { phase: "done", clean: Math.floor(Math.random() * 800) + 200, rejected: 0 });
      return;
    }
    const token = localStorage.getItem("sc_token");
    updateFileStatus(staged.id, { phase: "uploading" });
    const form = new FormData();
    form.append("file", staged.file);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/ingest/csv?data_type=sales`,
        { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        updateFileStatus(staged.id, { phase: "error", message: err.detail ?? "Upload failed." });
        return;
      }
      const { job_id } = await res.json();
      updateFileStatus(staged.id, { phase: "processing", jobId: job_id });
      await new Promise<void>(resolve => pollJobStatus(staged.id, job_id, resolve));
    } catch {
      updateFileStatus(staged.id, { phase: "error", message: "Could not reach the server." });
    }
  }, [pollJobStatus]);

  const handleSubmit = useCallback(async () => {
    const pending = stagedFiles.filter(f => f.status.phase === "staged");
    if (!pending.length) return;
    setSubmitting(true);
    for (const f of pending) {
      await uploadFile(f);
    }
    setSubmitting(false);
    setTimeout(() => setView("dashboard"), 1500);
  }, [stagedFiles, uploadFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  if (view === "dashboard") return <DashboardView />;

  return (
    <UploadView
      stagedFiles={stagedFiles}
      submitting={submitting}
      fileInputRef={fileInputRef}
      onFileInput={onFileInput}
      onDrop={onDrop}
      onRemoveFile={removeFile}
      onSubmit={handleSubmit}
    />
  );
}

function UploadView({
  stagedFiles,
  submitting,
  fileInputRef,
  onFileInput,
  onDrop,
  onRemoveFile,
  onSubmit,
}: {
  stagedFiles: StagedFile[];
  submitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveFile: (id: string) => void;
  onSubmit: () => void;
}) {
  const hasStagedFiles = stagedFiles.length > 0;
  const hasUnsubmitted = stagedFiles.some(f => f.status.phase === "staged");

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
    <div style={{ padding: "48px 60px", width: "100%", maxWidth: 860, ...gilroy }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: "#000", margin: 0 }}>
          To begin please upload the latest batch of reports from your<br />POS &amp; Inventory Management System
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        multiple
        style={{ display: "none" }}
        onChange={onFileInput}
      />

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !submitting && fileInputRef.current?.click()}
        style={{
          border: "2px dashed #30A444",
          background: "#EBF1EA",
          borderRadius: 4,
          height: hasStagedFiles ? 120 : 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: submitting ? "default" : "pointer",
          gap: 10,
          transition: "height 0.2s ease",
        }}
      >
        <CloudArrowUp size={36} color="#1A9E32" weight="regular" />
        <div style={{ color: "#1A9E32", fontSize: 13, fontWeight: 500, textAlign: "center", lineHeight: 1.5, ...gilroy }}>
          {hasStagedFiles ? "Add more files" : "drag & drop or click to upload"}
          <br />
          <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>CSV or Excel (.xlsx) supported</span>
        </div>
      </div>

      {/* File list */}
      {hasStagedFiles && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {stagedFiles.map(f => (
            <FileRow key={f.id} staged={f} onRemove={() => onRemoveFile(f.id)} />
          ))}
        </div>
      )}

      {/* Submit */}
      {hasStagedFiles && (
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <Button
            variant="yellow"
            onClick={onSubmit}
            style={{ opacity: (!hasUnsubmitted || submitting) ? 0.6 : 1, cursor: (!hasUnsubmitted || submitting) ? "not-allowed" : "pointer", minWidth: 160 }}
          >
            {submitting ? "Uploading…" : `Upload ${stagedFiles.filter(f => f.status.phase === "staged").length} file${stagedFiles.filter(f => f.status.phase === "staged").length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", margin: "32px 0", fontSize: 20, fontWeight: 700, color: "#000" }}>
        <div style={{ flex: 1, borderBottom: "1px solid #000" }} />
        <span style={{ padding: "0 22px" }}>or</span>
        <div style={{ flex: 1, borderBottom: "1px solid #000" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: "#000", textAlign: "center", margin: 0 }}>
          Coming soon with the feature for you to connect to existing<br />POS or ERP Solutions you are already signed up on to.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="outline-green" style={{ width: 130, fontSize: 12 }}>lightspeed</Button>
          <Button variant="outline-green" style={{ width: 130, fontSize: 12 }}>quickbooks</Button>
        </div>
      </div>
    </div>
    </div>
  );
}

function FileRow({ staged, onRemove }: { staged: StagedFile; onRemove: () => void }) {
  const { file, status } = staged;
  const removable = status.phase === "staged";

  const statusEl = (() => {
    if (status.phase === "uploading") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#1A9E32", fontSize: 12, ...gilroy }}>
        <SpinnerGap size={14} color="#1A9E32" style={{ animation: "spin 0.9s linear infinite" }} /> Uploading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </span>
    );
    if (status.phase === "processing") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#1A9E32", fontSize: 12, ...gilroy }}>
        <SpinnerGap size={14} color="#1A9E32" style={{ animation: "spin 0.9s linear infinite" }} /> Processing…
      </span>
    );
    if (status.phase === "done") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#17931f", fontSize: 12, fontWeight: 600, ...gilroy }}>
        <CheckCircle size={14} weight="fill" /> {status.clean} rows imported{status.rejected > 0 ? `, ${status.rejected} rejected` : ""}
      </span>
    );
    if (status.phase === "error") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#c0392b", fontSize: 12, ...gilroy }}>
        <XCircle size={14} weight="fill" /> {status.message}
      </span>
    );
    return <span style={{ fontSize: 12, color: "#666", ...gilroy }}>{formatBytes(file.size)}</span>;
  })();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #d4dec4", borderRadius: 6, padding: "10px 14px" }}>
      <File size={20} color="#1A9E32" weight="regular" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#000", ...gilroy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <div style={{ marginTop: 2 }}>{statusEl}</div>
      </div>
      {removable && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex", borderRadius: 4 }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/* ── Dashboard view (shown after successful upload) ─────────────── */

const C = {
  green:  "#17931f",
  red:    "#c0392b",
  ink:    "#1a1a1a",
  sub:    "#6b6560",
  bg:     "#f3ebda",
  white:  "#ffffff",
  border: "#e8e0d0",
  tint:   "#eef6ee",   // very light green tint for thead
};

const tableRows = [
  { product: "Sunlight Dish Liquid 750ml", sku: "SKU: UNL-SL750", category: "Cleaning", score: 88, trend: "+34%", alert: "Demand Spike", stock: "10 pcs",  advice: "Increase current stock to meet demand",                                                          insight: "1.2M TikTok views in 48h driving demand surge in Accra & Tema" },
  { product: "Omo Auto 1kg",               sku: "SKU: UNL-OM1KG", category: "Cleaning", score: 76, trend: "+18%", alert: "Demand Spike", stock: "42 pcs",  advice: "Increase current stock to meet demand",                                                          insight: "Seasonal laundry spike; competitor stockout reported nearby" },
  { product: "Indomie Chicken 70g (x10)",  sku: "SKU: IND-CK70X", category: "Food",     score: 71, trend: "+12%", alert: "Low Stock",    stock: "18 pcs",  advice: "Increase current stock to meet demand",                                                          insight: "Back-to-school period lifting instant noodle category broadly" },
  { product: "Peak Milk Full Cream 400g",  sku: "SKU: PKM-FC400", category: "Dairy",    score: 65, trend: "-5%",  alert: "Slow Mover",   stock: "130 pcs", advice: "Items have lost traction — take action to quickly remove them (market, sales, etc)",          insight: "Category softness; consumers trading down to smaller SKUs" },
];

function ScoreRing({ score }: { score: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? C.green : C.red;
  return (
    <svg width={38} height={38} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={19} cy={19} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle
        cx={19} cy={19} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 19 19)"
      />
      <text x={19} y={23} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} fontFamily="Gilroy, system-ui, sans-serif">
        {score}
      </text>
    </svg>
  );
}

function TrendCell({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+");
  const color = isUp ? C.green : C.red;
  const arrow = isUp ? "↑" : "↓";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color, fontWeight: 700, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{arrow}</span>
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

function DashboardView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAlert, setFilterAlert] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");

  const categories = ["All", "Cleaning", "Food", "Dairy"];
  const alertTypes  = ["All", "Demand Spike", "Low Stock", "Slow Mover"];
  const locations   = ["All Branches", "Tema Branch", "Accra Central", "Kumasi Branch", "Takoradi Branch", "Tamale Branch"];

  const filtered = tableRows.filter(row => {
    const matchSearch = row.product.toLowerCase().includes(search.toLowerCase()) || row.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCategory === "All" || row.category === filterCategory;
    const matchAlert  = filterAlert === "All" || row.alert === filterAlert;
    return matchSearch && matchCat && matchAlert;
  });
  void filterLocation;

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

  return (
    <div style={{ padding: "24px 32px", width: "100%", ...gilroy }}>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <KpiCard title="Active Alerts"        value="4"        label="2 need action today" accent={C.red} />
        <KpiCard title="High Signal Products" value="14"       label="Score above 70"       accent={C.green} />
        <KpiCard title="Products Tracked"     value="1,247"    label="Across 12 categories" accent={C.ink} />
        <KpiCard title="Capital at Risk"      value="GHS 43,000.00"  accent={C.red} compact />
      </div>

      {/* Alert Banners — 2 per row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
        <div style={{ background: C.white, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 6, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}` }}>
          <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6, fontWeight: 400, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>
            <strong style={{ fontWeight: 700 }}>Unilever Sunlight 750ml</strong> is trending on TikTok Ghana<br />
            With Stock levels at 10 pcs you&apos;ll hit stockout in 3 days
          </p>
          <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", marginLeft: 16, fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", flexShrink: 0 }}>
            View Product <span style={{ fontSize: 13 }}>→</span>
          </a>
        </div>
        <div style={{ background: C.white, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 6, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}` }}>
          <p style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6, fontWeight: 400, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>
            <strong style={{ fontWeight: 700 }}>Omo Auto 1kg</strong> is trending with a seasonal demand spike<br />
            With Stock levels at 42 pcs you&apos;ll hit stockout in 6 days
          </p>
          <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", marginLeft: 16, fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: "Gilroy, system-ui, sans-serif", textDecoration: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", flexShrink: 0 }}>
            View Product <span style={{ fontSize: 13 }}>→</span>
          </a>
        </div>
      </div>

      {/* Table header row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: "Gilroy, system-ui, sans-serif" }}>Urgent Attention</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search product or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
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

          {/* Category filter */}
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Alert filter */}
          <select value={filterAlert} onChange={e => setFilterAlert(e.target.value)} style={selectStyle}>
            {alertTypes.map(a => <option key={a}>{a}</option>)}
          </select>

          {/* Location filter */}
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={selectStyle}>
            {locations.map(l => <option key={l}>{l}</option>)}
          </select>

          <Button variant="yellow" onClick={() => router.push("/dashboard/catalogue")} style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>View All</Button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: C.white, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "22%" }} /> {/* Product */}
          <col style={{ width: "8%" }} />  {/* Category */}
          <col style={{ width: "6%" }} />  {/* Score */}
          <col style={{ width: "7%" }} />  {/* Trend */}
          <col style={{ width: "11%" }} /> {/* Alert */}
          <col style={{ width: "12%" }} /> {/* Current Stock */}
          <col style={{ width: "18%" }} /> {/* Recommended Advice */}
          <col style={{ width: "16%" }} /> {/* Market Insights */}
          <col style={{ width: "6%" }} />  {/* Action */}
        </colgroup>
        <thead>
          <tr>
            {["Product", "Category", "Score", "Trend", "Alert", "Current Stock", "Recommended Advice", "Market Insights", ""].map((h, i) => (
              <th key={h} style={{
                background: C.tint,
                borderBottom: `1px solid ${C.border}`,
                borderRight: `1px solid ${C.border}`,
                padding: "9px 12px",
                textAlign: i === 2 || i === 3 ? "center" : "left",
                fontSize: 12,
                fontWeight: 700,
                color: C.sub,
                textTransform: "uppercase" as const,
                letterSpacing: "0.04em",
                fontFamily: "Gilroy, system-ui, sans-serif",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: "24px", textAlign: "center", color: C.sub, fontSize: 13, fontFamily: "Gilroy, system-ui, sans-serif" }}>
                No products match your filters.
              </td>
            </tr>
          ) : filtered.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#faf7f2" }}>
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
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12.5, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5, wordBreak: "break-word" as const }}>
                {row.advice}
              </td>
              <td style={{ borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 12.5, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", lineHeight: 1.5, wordBreak: "break-word" as const }}>
                {row.insight}
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
  );
}

function KpiCard({ title, value, label, accent, compact }: { title: string; value: string; label?: string; accent: string; compact?: boolean }) {
  return (
    <div style={{ background: C.white, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ borderBottom: `2px solid ${accent}`, padding: "10px 14px 9px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, fontFamily: "Gilroy, system-ui, sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{title}</span>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", justifyContent: compact ? "flex-start" : "space-between", alignItems: "flex-end", minHeight: 60 }}>
        <div style={{ fontSize: compact ? 22 : 34, fontWeight: 800, color: C.ink, lineHeight: 0.95, letterSpacing: compact ? -0.5 : -1, fontFamily: "Gilroy, system-ui, sans-serif" }}>
          {value}
        </div>
        {label && <div style={{ fontSize: 10.5, fontWeight: 500, color: C.sub, marginBottom: 2, textAlign: "right", maxWidth: 110, fontFamily: "Gilroy, system-ui, sans-serif" }}>{label}</div>}
      </div>
    </div>
  );
}
