"use client";
import Image from "next/image";

const cols = [
  { h: "Product",   items: ["Forecasting", "Replenishment", "Margin guardrails", "Market signals", "Integrations"] },
  { h: "Company",   items: ["About us", "Careers", "Press", "Contact"] },
  { h: "Resources", items: ["Documentation", "Case studies", "Blog", "Help center"] },
  { h: "Legal",     items: ["Privacy", "Terms", "Security", "DPA"] },
];

const socials = [
  { label: "LinkedIn", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
  { label: "X",        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { label: "Instagram", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
  { label: "YouTube",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0a2a0a", color: "#fff", marginTop: 0, borderTop: "8px solid #0a2a0a", padding: "80px 96px 60px" }}>
      <div className="sc-footer-grid">
        <div>
          <Image src="/shelfcast.svg" alt="ShelfCast" width={0} height={32} style={{ height: 32, width: "auto", display: "block" }} />
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.62)", margin: 0, marginTop: 20, maxWidth: 280, fontFamily: "'Gilroy',sans-serif" }}>
            AI-driven stocking intelligence for retailers, manufacturers, and importers across West Africa.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {socials.map(s => (
              <button key={s.label} aria-label={s.label}
                style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>
        {cols.map(c => (
          <div key={c.h}>
            <div style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 700, fontSize: 13, color: "#E8A205", letterSpacing: "0.05em", marginBottom: 20, textTransform: "uppercase" }}>{c.h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {c.items.map(i => (
                <li key={i} style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", cursor: "pointer", fontFamily: "'Gilroy',sans-serif" }}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 28, fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Gilroy',sans-serif" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>© 2026 ShelfCast Technologies Ltd. Accra, Ghana.</div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Status","Changelog","Sitemap"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
      </div>
    </footer>
  );
}
