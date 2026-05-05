const tiers = [
  { name: "Starter", price: "$499", sub: "/month", desc: "For single-store retailers ready to stop guessing.", features: ["1 store", "Up to 2,000 SKUs", "Weekly stocking plan", "Email support"], featured: false },
  { name: "Growth",  price: "$1,499", sub: "/month", desc: "For chains that need region-by-region intelligence.", features: ["Up to 10 stores", "Unlimited SKUs", "Daily replenishment alerts", "Supplier benchmarks", "Dedicated success manager"], featured: true },
  { name: "Enterprise", price: "Custom", sub: "", desc: "For manufacturers and importers operating at scale.", features: ["Unlimited stores", "Custom data pipelines", "API access", "SLA + 24/7 support"], featured: false },
];

export default function Pricing() {
  return (
    <section className="sc-section" style={{ background: "#fafaf7" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#178A00", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Gilroy',sans-serif" }}>Pricing</div>
        <h2 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "#0a0a0a", margin: 0, marginBottom: 16 }}>
          Pick a plan. Pay for what you sell.
        </h2>
        <p style={{ fontSize: 16, color: "#4a4a4a", margin: 0, fontFamily: "'Gilroy',sans-serif" }}>14-day free trial. No credit card.</p>
      </div>

      <div className="sc-pricing-grid">
        {tiers.map(t => (
          <div key={t.name} style={{ border: t.featured ? "2px solid #178A00" : "1px solid #CDCDCD", background: "#fff", borderRadius: 14, padding: 36, position: "relative", boxShadow: t.featured ? "0 24px 48px -24px rgba(23,138,0,0.25)" : "none" }}>
            {t.featured && (
              <div style={{ position: "absolute", top: -12, left: 32, background: "#178A00", color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 6, fontFamily: "'Gilroy',sans-serif" }}>
                Most popular
              </div>
            )}
            <div style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 700, fontSize: 18, color: "#0f3d10", marginBottom: 8 }}>{t.name}</div>
            <p style={{ fontSize: 13, color: "#4a4a4a", margin: 0, marginBottom: 24, lineHeight: 1.5, minHeight: 38, fontFamily: "'Gilroy',sans-serif" }}>{t.desc}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
              <span style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: "#0a0a0a" }}>{t.price}</span>
              <span style={{ fontSize: 14, color: "#7a7a7a", fontFamily: "'Gilroy',sans-serif" }}>{t.sub}</span>
            </div>
            <button style={{ background: t.featured ? "#E8A205" : "#fff", color: t.featured ? "#1a1100" : "#0a0a0a", border: t.featured ? "0" : "1.5px solid #CDCDCD", borderRadius: 10, padding: "14px 0", width: "100%", fontFamily: "'Gilroy',sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 24 }}>
              {t.name === "Enterprise" ? "Talk to sales" : "Start free trial"}
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {t.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#0a0a0a", fontFamily: "'Gilroy',sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="#E7FFE2"/>
                    <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#178A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
