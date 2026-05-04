import { ReactNode } from "react";

type KpiVariant = "orange" | "green" | "red";

const headerBg: Record<KpiVariant, string> = {
  orange: "#efa119",
  green:  "#17931f",
  red:    "#b50b12",
};

interface KpiCardProps {
  variant: KpiVariant;
  title: string;
  icon: ReactNode;
  value: string;
  label?: string;
  compact?: boolean;
}

export default function KpiCard({ variant, title, icon, value, label, compact }: KpiCardProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ background: headerBg[variant], display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 600 }}>
        <span>{title}</span>
        <span style={{ width: 15, height: 15, display: "flex" }}>{icon}</span>
      </div>
      <div style={{ padding: "14px 18px 20px", display: "flex", justifyContent: compact ? "flex-start" : "space-between", alignItems: "flex-end", minHeight: 90 }}>
        <div style={{ fontSize: compact ? 52 : 64, fontWeight: 800, color: "#000", lineHeight: 0.85, letterSpacing: compact ? -2 : -3 }}>
          {value}
        </div>
        {label && (
          <div style={{ fontSize: 11, fontWeight: 500, color: "#111", marginBottom: 4, textAlign: "right", maxWidth: 120 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
