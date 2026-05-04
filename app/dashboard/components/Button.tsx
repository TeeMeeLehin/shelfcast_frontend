import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "yellow" | "outline-green";
  children: ReactNode;
}

export default function Button({ variant = "yellow", children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
    borderRadius: 4, border: "none", transition: "opacity 0.15s",
    fontFamily: "inherit",
  };

  const variants: Record<string, React.CSSProperties> = {
    "yellow": { background: "#E2A10A", color: "#000", padding: "11px 24px" },
    "outline-green": { background: "transparent", border: "1px solid #1A9E32", color: "#000", padding: "7px 14px", borderRadius: 2 },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
