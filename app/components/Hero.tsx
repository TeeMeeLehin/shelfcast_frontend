"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const features = ["Secure your margins", "Stop losing customers", "Stock up right", "Know the market", "Reduce stockouts"];

export default function Hero() {
  const [active, setActive] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % features.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="sc-hero-section" style={{ position: "relative", backgroundImage: "url(/hero-bg.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0d3a10" }}>
      <div className="sc-hero-grid">
        {/* left */}
        <div>
          <div style={{ display: "inline-flex", padding: "8px 16px", borderRadius: 6, background: "rgba(8,30,8,0.55)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12.5, marginBottom: 32, fontFamily: "'Gilroy',sans-serif" }}>
            Ranked #1 AI analytics platform in Ghana
          </div>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", color: "#fff", margin: 0, marginBottom: 20 }}
            className="text-4xl lg:text-6xl">
            Stock the <span style={{ color: "#E8A205" }}>right</span> products<br />Leave the rest behind
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.88)", margin: 0, marginBottom: 28, maxWidth: 520, fontFamily: "'Gilroy',sans-serif" }}>
            We tell retailers what to stock, where, and when so they never lose a sale to an empty shelf or a dollar to dead inventory.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth" style={{ background: "#E8A205", color: "#0D1F0D", fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 15, borderRadius: 10, padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.2s ease" }}>
              Get started
            </Link>
            <button style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "12px 22px", fontFamily: "'Gilroy',sans-serif", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 3l16 9-16 9z" fill="#fff"/></svg>
              Watch demo
            </button>
          </div>
          <p style={{ marginTop: 36, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", fontFamily: "'Gilroy',sans-serif" }}>
            Trusted by retailers, manufacturers, &amp; importers
          </p>
        </div>

        {/* right feature list — hidden on tablet/mobile via CSS */}
        <div className="sc-hero-features" style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>
          {features.map((f, i) => {
            const a = i === active;
            return (
              <button key={f} onClick={() => setActive(i)} style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 14, fontFamily: "'ESKlarheit',sans-serif", fontWeight: 600, fontSize: a ? 26 : 24, letterSpacing: "-0.02em", color: a ? "#fff" : "rgba(255,255,255,0.18)", transition: "all 200ms", textAlign: "left" }}>
                {a && <svg width="18" height="20" viewBox="0 0 20 22" fill="none"><path d="M2 2L18 11L2 20Z" fill="#E8A205"/></svg>}
                {f}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
