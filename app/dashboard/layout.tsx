"use client";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Cube,
  Lightbulb,
  SignOut,
  Gear,
  UploadSimple,
  ChartLine,
  ListBullets,
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
  { label: "Register Data",  href: "/dashboard/register",        Icon: UploadSimple },
  { label: "Command Center", href: "/dashboard",                 Icon: SquaresFour  },
  { label: "Catalogue",      href: "/dashboard/catalogue",       Icon: Cube         },
  { label: "Stock List",     href: "/dashboard/stock-list",      Icon: ListBullets  },
  { label: "Demand Trends",  href: "/dashboard/demand-trends",   Icon: ChartLine    },
  { label: "Opportunities",  href: "/dashboard/opportunities",   Icon: Lightbulb    },
];

const gilroy: React.CSSProperties = { fontFamily: "'Gilroy', system-ui, sans-serif" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userLabel, setUserLabel] = useState<string>("");
  const [storeLabel, setStoreLabel] = useState<string>("");

  useEffect(() => {
    if (DEMO_MODE) return;
    const token = localStorage.getItem("sc_token");
    if (!token) {
      window.location.replace("/auth");
      return;
    }
    // Populate header from stored values (set during onboarding / login)
    const storedEmail = (() => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (payload.email as string) ?? "";
      } catch { return ""; }
    })();
    setUserLabel(storedEmail);
    const storedName = localStorage.getItem("sc_retailer_name") ?? "";
    setStoreLabel(storedName);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#f3ebda", ...gilroy }}>
      {/* Header */}
      <header style={{ flexShrink: 0, height: 68, background: "#fff", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px" }}>
        <Link href="/">
          <Image src="/shelfcast.svg" alt="ShelfCast" width={0} height={32} style={{ height: 32, width: "auto" }} />
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

        {(userLabel || storeLabel) && (
          <div style={{ textAlign: "right" }}>
            {storeLabel && <div style={{ fontSize: 12, fontWeight: 700, color: "#000", ...gilroy }}>{storeLabel}</div>}
            {userLabel && <div style={{ fontSize: 10, color: "#555", fontWeight: 400, ...gilroy }}>{userLabel}</div>}
          </div>
        )}
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
