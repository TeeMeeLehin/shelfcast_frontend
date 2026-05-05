"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CloudArrowUp,
  CheckCircle,
  SpinnerGap,
  X,
  File as FileIcon,
  Database,
  ClockCounterClockwise,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from "@phosphor-icons/react";
import Button from "../components/Button";
import {
  getBatches,
  saveBatch,
  getActiveBatchIds,
  toggleBatch,
  setActiveBatchIds,
  uploadCsv,
  pollIngestStatus,
  type Batch,
} from "@/lib/store";
import { DEMO_MODE } from "@/lib/config";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };
const ALLOWED = [".csv", ".xlsx", ".xls"];

type Phase = "idle" | "analysing" | "done";

const ANALYSIS_STEPS = [
  "Parsing uploaded files…",
  "Cleaning & deduplicating records…",
  "Matching SKUs to product catalogue…",
  "Watching demand signals…",
  "Generating ShelfCast scores…",
  "Analysis complete",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RegisterDataPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchIds, setLocalActive] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBatches(getBatches());
    setLocalActive(getActiveBatchIds());
  }, []);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(f =>
      ALLOWED.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  }, []);

  const removeFile = (name: string) =>
    setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = useCallback(async () => {
    if (!files.length) return;
    setPhase("analysing");
    setStepIndex(0);

    if (DEMO_MODE) {
      // Demo: simulate analysis steps
      for (let i = 1; i < ANALYSIS_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, i === ANALYSIS_STEPS.length - 1 ? 1200 : 900));
        setStepIndex(i);
      }
    } else {
      // Live: upload each file to the backend and poll for completion
      try {
        for (let fi = 0; fi < files.length; fi++) {
          setStepIndex(fi === 0 ? 1 : 2);
          const { job_id } = await uploadCsv(files[fi]);

          // Poll until done or error
          let attempts = 0;
          while (attempts < 120) {
            await new Promise(r => setTimeout(r, 2000));
            const status = await pollIngestStatus(job_id);
            const stepMap: Record<string, number> = {
              queued: 1, processing: 2, done: 4, error: 4,
            };
            setStepIndex(stepMap[status.status] ?? 2);
            if (status.status === "done") break;
            if (status.status === "error") throw new Error(status.message ?? "Ingestion failed");
            attempts++;
          }
        }
        setStepIndex(ANALYSIS_STEPS.length - 1);
        await new Promise(r => setTimeout(r, 800));
      } catch {
        setPhase("idle");
        return;
      }
    }

    // Save batch record locally
    const existing = getBatches();
    const batch: Batch = {
      id: `batch-${Date.now()}`,
      label: `Batch #${existing.length + 1} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      uploadedAt: new Date().toISOString(),
      files: files.map(f => f.name),
    };
    saveBatch(batch);

    const newActive = [...getActiveBatchIds(), batch.id];
    setActiveBatchIds(newActive);

    setPhase("done");
    setBatches(getBatches());
    setLocalActive(newActive);

    await new Promise(r => setTimeout(r, 1200));
    router.push("/dashboard");
  }, [files, router]);

  const handleToggle = (id: string, currentlyActive: boolean) => {
    toggleBatch(id, !currentlyActive);
    setLocalActive(getActiveBatchIds());
  };

  const handleLoadAll = () => {
    const allIds = batches.map(b => b.id);
    setActiveBatchIds(allIds);
    setLocalActive(allIds);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  // ── Analysis screen ────────────────────────────────────────────────
  if (phase === "analysing" || phase === "done") {
    const complete = phase === "done";
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, background: "#f3ebda" }}>
        <div style={{ width: 520, background: "#fff", borderRadius: 12, padding: "48px 44px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", ...gilroy }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <Database size={28} color="#17931f" weight="duotone" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0D1F0D" }}>Processing your data</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>ShelfCast is analysing your upload</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < stepIndex || complete;
              const active = i === stepIndex && !complete;
              const pending = i > stepIndex && !complete;
              const isLast = i === ANALYSIS_STEPS.length - 1;
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: done ? "#e7ffe2" : active ? "#fff8e6" : "#f5f5f5", border: `1.5px solid ${done ? "#17931f" : active ? "#E8A205" : "#ddd"}`, transition: "all 0.3s" }}>
                    {done
                      ? <CheckCircle size={16} color="#17931f" weight="fill" />
                      : active
                        ? <SpinnerGap size={16} color="#E8A205" style={{ animation: "spin 0.8s linear infinite" }} />
                        : <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ddd", display: "block" }} />
                    }
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: (done || active) ? 600 : 400,
                    color: done ? "#17931f" : active ? "#E8A205" : "#999",
                    transition: "color 0.3s",
                  }}>
                    {isLast && done ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {step} <CheckCircle size={15} color="#17931f" weight="fill" />
                      </span>
                    ) : step}
                  </span>
                </div>
              );
            })}
          </div>

          {complete && (
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#666" }}>Redirecting to Command Center…</div>
            </div>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Upload screen ──────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "48px 60px", width: "100%", maxWidth: 860, ...gilroy }}>

        {/* Upload zone */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: "#000", margin: 0 }}>
            Upload the latest batch of reports from your<br />POS &amp; Inventory Management System
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

        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #30A444",
            background: "#EBF1EA",
            borderRadius: 4,
            height: files.length ? 100 : 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 10,
            transition: "height 0.2s ease",
          }}
        >
          <CloudArrowUp size={34} color="#1A9E32" weight="regular" />
          <div style={{ color: "#1A9E32", fontSize: 13, fontWeight: 500, textAlign: "center", lineHeight: 1.5 }}>
            {files.length ? "Add more files" : "drag & drop or click to upload"}
            <br />
            <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>CSV or Excel (.xlsx) supported</span>
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map(f => (
              <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #d4dec4", borderRadius: 6, padding: "10px 14px" }}>
                <FileIcon size={20} color="#1A9E32" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}</div>
                </div>
                <button onClick={() => removeFile(f.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex" }}>
                  <X size={16} />
                </button>
              </div>
            ))}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <Button variant="yellow" onClick={handleSubmit} style={{ minWidth: 200 }}>
                Upload {files.length} file{files.length !== 1 ? "s" : ""} <ArrowRight size={16} weight="bold" style={{ marginLeft: 6 }} />
              </Button>
            </div>
          </div>
        )}

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "32px 0", fontSize: 18, fontWeight: 700, color: "#000" }}>
          <div style={{ flex: 1, borderBottom: "1px solid #ccc" }} />
          <span style={{ padding: "0 20px" }}>or</span>
          <div style={{ flex: 1, borderBottom: "1px solid #ccc" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <p style={{ fontSize: 14, color: "#444", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            Connect directly to your existing POS or ERP system — coming soon.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="outline-green" style={{ width: 130, fontSize: 12 }}>lightspeed</Button>
            <Button variant="outline-green" style={{ width: 130, fontSize: 12 }}>quickbooks</Button>
          </div>
        </div>

        {/* Upload history */}
        {batches.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCounterClockwise size={18} color="#17931f" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0D1F0D" }}>Upload history</span>
              </div>
              <button
                onClick={handleLoadAll}
                style={{ fontSize: 12, fontWeight: 600, color: "#17931f", background: "none", border: "1px solid #17931f", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}
              >
                Load all
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {batches.map(batch => {
                const isActive = activeBatchIds.includes(batch.id);
                return (
                  <div
                    key={batch.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: isActive ? "#f0faf0" : "#fff",
                      border: `1.5px solid ${isActive ? "#17931f" : "#e8e0d0"}`,
                      borderRadius: 8,
                      padding: "12px 16px",
                      transition: "all 0.2s",
                    }}
                  >
                    <Database size={20} color={isActive ? "#17931f" : "#aaa"} weight={isActive ? "fill" : "regular"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1F0D" }}>{batch.label}</div>
                      <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                        {formatDate(batch.uploadedAt)} · {batch.files.length} file{batch.files.length !== 1 ? "s" : ""}
                        {batch.files.length > 0 && (
                          <span style={{ color: "#aaa" }}> ({batch.files.slice(0, 2).join(", ")}{batch.files.length > 2 ? ` +${batch.files.length - 2} more` : ""})</span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#17931f", background: "#e7ffe2", border: "1px solid #b2e5b4", borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => handleToggle(batch.id, isActive)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: isActive ? "#17931f" : "#aaa" }}
                      title={isActive ? "Unload this batch" : "Load this batch"}
                    >
                      {isActive
                        ? <ToggleRight size={28} weight="fill" />
                        : <ToggleLeft size={28} />
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
