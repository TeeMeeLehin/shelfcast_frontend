"use client";
import { ReactNode, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Cube,
  ChartBar,
  Lightbulb,
  SignOut,
  Gear,
} from "@phosphor-icons/react";
import { DEMO_MODE } from "@/lib/config";

function logout() {
  if (!DEMO_MODE) {
    localStorage.removeItem("sc_token");
    localStorage.removeItem("sc_onboarded");
  }
  window.location.href = "/auth";
}

const navItems = [
  { label: "Command Center", href: "/dashboard",              Icon: SquaresFour },
  { label: "Catalogue",      href: "/dashboard/catalogue",    Icon: Cube        },
  { label: "Product Demand", href: "/dashboard/demand",       Icon: ChartBar    },
  { label: "Opportunities",  href: "/dashboard/opportunities", Icon: Lightbulb  },
];

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (DEMO_MODE) return;
    const token = localStorage.getItem("sc_token");
    if (!token) {
      window.location.replace("/auth");
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#f3ebda", ...gilroy }}>
      {/* Header */}
      <header style={{ flexShrink: 0, height: 68, background: "#fff", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px" }}>
        <Link href="/">
          <Image src="/logo.jpeg" alt="ShelfCast" width={140} height={32} style={{ height: 32, width: "auto" }} />
        </Link>

        <nav style={{ display: "flex", height: "100%", gap: 32 }}>
          {navItems.map(({ label, href, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 7, height: "100%",
                  textDecoration: "none", color: "#111", fontSize: 13,
                  fontWeight: active ? 700 : 500, ...gilroy,
                  borderBottom: active ? "4px solid #17931f" : "4px solid transparent",
                  marginBottom: -1,
                }}
              >
                <Icon size={17} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", ...gilroy }}>Makafui Gley</div>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 400, ...gilroy }}>Melcom, Tema Branch</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Makafui Gley"
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
      </header>

      {/* Scrollable content */}
      <main style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ flexShrink: 0, height: 56, background: "#fff", borderTop: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px" }}>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: "#000", fontSize: 13, fontWeight: 600, padding: 0, ...gilroy }}>
          <SignOut size={17} />
          Logout
        </button>
        <a href="/dashboard/settings" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#000", fontSize: 13, fontWeight: 600, ...gilroy }}>
          <Gear size={17} />
          Settings
        </a>
      </footer>
    </div>
  );
}
