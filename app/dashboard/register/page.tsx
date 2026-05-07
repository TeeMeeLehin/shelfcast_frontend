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
  WarningCircle,
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
  type IngestJobStatus,
} from "@/lib/store";
import { DEMO_MODE } from "@/lib/config";

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };
const ALLOWED = [".csv", ".xlsx", ".xls"];

type Phase = "idle" | "analysing" | "done" | "error";

const DEMO_STEPS = [
  { pipeline_stage: "pending", stage_label: "Uploading data...", progress: 5 },
  { pipeline_stage: "processing", stage_label: "Cleaning & validating data...", progress: 20 },
  { pipeline_stage: "classifying", stage_label: "Classifying products...", progress: 40 },
  { pipeline_stage: "tagging_signals", stage_label: "Extracting market signals...", progress: 55 },
  { pipeline_stage: "scoring_skus", stage_label: "Scoring your catalogue...", progress: 70 },
  { pipeline_stage: "generating_insights", stage_label: "Generating AI insights...", progress: 85 },
  { pipeline_stage: "complete", stage_label: "Intelligence ready!", progress: 100 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RegisterDataPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pollData, setPollData] = useState<IngestJobStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchIds, setLocalActive] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBatches(getBatches());
    setLocalActive(getActiveBatchIds());
  }, []);

  const handleFileSelect = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).find(f =>
      ALLOWED.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (valid) {
      setFile(valid);
    }
  }, []);

  const removeFile = () => setFile(null);

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setPhase("analysing");
    setErrorMsg(null);
    setPollData({
      id: "init",
      status: "pending",
      pipeline_stage: "pending",
      stage_label: "Preparing upload...",
      progress: 0,
      is_complete: false,
      is_failed: false,
    });

    if (DEMO_MODE) {
      // Demo: simulate analysis steps
      for (let i = 0; i < DEMO_STEPS.length; i++) {
        const step = DEMO_STEPS[i];
        setPollData({
          id: "demo-uuid",
          status: "processing",
          pipeline_stage: step.pipeline_stage,
          stage_label: step.stage_label,
          progress: step.progress,
          is_complete: step.pipeline_stage === "complete",
          is_failed: false,
        });
        if (step.pipeline_stage === "complete") break;
        await new Promise(r => setTimeout(r, 2000));
      }
    } else {
      // Live: upload the file and poll for completion
      try {
        setPollData(prev => prev ? { ...prev, progress: 5, stage_label: "Uploading data..." } : null);
        const { job_id } = await uploadCsv(file);

        // Poll until done or error
        let attempts = 0;
        let isDone = false;
        
        while (attempts < 120 && !isDone) {
          await new Promise(r => setTimeout(r, 2500)); // Poll every 2.5 seconds
          const status = await pollIngestStatus(job_id);
          
          setPollData(status);

          if (status.is_complete) {
            isDone = true;
          } else if (status.is_failed) {
            throw new Error("Processing failed. Please try again.");
          }
          attempts++;
        }
        
        if (!isDone) {
          throw new Error("Processing timed out. Please try again.");
        }
      } catch (err) {
        setPhase("error");
        setErrorMsg((err as Error).message || "An unexpected error occurred.");
        return;
      }
    }

    // Save batch record locally
    const existing = getBatches();
    const batch: Batch = {
      id: `batch-${Date.now()}`,
      label: `Batch #${existing.length + 1} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      uploadedAt: new Date().toISOString(),
      files: [file.name],
    };
    saveBatch(batch);

    const newActive = [...getActiveBatchIds(), batch.id];
    setActiveBatchIds(newActive);

    setPhase("done");
    setBatches(getBatches());
    setLocalActive(newActive);

    await new Promise(r => setTimeout(r, 1500));
    router.push("/dashboard");
  }, [file, router]);

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
    if (e.target.files) handleFileSelect(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
  };

  // ── Analysis screen ────────────────────────────────────────────────
  if (phase === "analysing" || phase === "done" || phase === "error") {
    const complete = phase === "done";
    const failed = phase === "error";
    const progress = pollData?.progress ?? 0;
    
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, background: "#f3ebda" }}>
        <div style={{ width: 520, background: "#fff", borderRadius: 12, padding: "48px 44px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", ...gilroy }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <Database size={28} color={failed ? "#e74c3c" : "#17931f"} weight="duotone" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0D1F0D" }}>
                {failed ? "Processing failed" : "Processing your data"}
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                {failed ? "There was an issue processing your upload" : "ShelfCast is analysing your upload"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Progress Bar Container */}
            <div style={{ background: "#f0f0f0", borderRadius: 8, height: 12, width: "100%", overflow: "hidden" }}>
              <div style={{
                background: failed ? "#e74c3c" : complete ? "#17931f" : "#E8A205",
                width: `${progress}%`,
                height: "100%",
                transition: "width 0.5s ease-in-out, background-color 0.3s",
              }} />
            </div>

            {/* Status Information */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, 
                  background: failed ? "#fff0f0" : complete ? "#e7ffe2" : "#fff8e6", 
                  border: `1.5px solid ${failed ? "#e74c3c" : complete ? "#17931f" : "#E8A205"}` 
                }}>
                  {failed 
                    ? <WarningCircle size={16} color="#e74c3c" weight="bold" />
                    : complete
                      ? <CheckCircle size={16} color="#17931f" weight="fill" />
                      : <SpinnerGap size={16} color="#E8A205" style={{ animation: "spin 0.8s linear infinite" }} />
                  }
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: failed ? "#e74c3c" : complete ? "#17931f" : "#0D1F0D" }}>
                    {failed ? (errorMsg || "Error processing file") : pollData?.stage_label || "Preparing..."}
                  </span>
                  {(!complete && !failed) && (
                    <span style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                      Processing...
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: failed ? "#e74c3c" : complete ? "#17931f" : "#E8A205" }}>
                {progress}%
              </span>
            </div>
          </div>

          {complete && (
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#666" }}>Redirecting to Command Center…</div>
            </div>
          )}

          {failed && (
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
              <Button variant="yellow" onClick={() => setPhase("idle")}>
                Retry Upload
              </Button>
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
            height: file ? 100 : 220,
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
            {file ? "Change file" : "drag & drop or click to upload"}
            <br />
            <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>CSV or Excel (.xlsx) supported</span>
          </div>
        </div>

        {file && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #d4dec4", borderRadius: 6, padding: "10px 14px" }}>
              <FileIcon size={20} color="#1A9E32" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <Button variant="yellow" onClick={handleSubmit} style={{ minWidth: 200 }}>
                Upload file <ArrowRight size={16} weight="bold" style={{ marginLeft: 6 }} />
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
