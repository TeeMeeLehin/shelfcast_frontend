const items = [
  { tag: "Forecasting", title: "Stock up right", body: "AI-driven SKU recommendations across every shelf, every store, every week.", stat: "+34%", statLabel: "sell-through on recommended SKUs" },
  { tag: "Margin", title: "Secure your margins", body: "Catch dead inventory and overstocks before they eat your gross margin.", stat: "–22%", statLabel: "inventory carrying cost" },
  { tag: "Demand", title: "Know the market", body: "Live demand signals from across the network, broken down by region and product.", stat: "14d", statLabel: "forward demand visibility" },
  { tag: "Availability", title: "Reduce stockouts", body: "Auto-replenish thresholds tuned to each store's real velocity, not gut feel.", stat: "–61%", statLabel: "out-of-stock incidents" },
];

export default function Features() {
  return (
    <section className="sc-section" style={{ background: "#fff" }}>
      <div className="sc-features-header">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#178A00", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Poppins',sans-serif" }}>
            What ShelfCast does
          </div>
          <h2 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "#0a0a0a", margin: 0 }}>
            Every shelf earns<br />its place. Or it goes.
          </h2>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#3a3a3a", margin: 0, fontFamily: "'Poppins',sans-serif" }}>
          ShelfCast turns six months of sales, supplier prices, and competitor moves into one weekly stocking plan you can actually run with.
        </p>
      </div>
      <div className="sc-features-grid">
        {items.map((it, idx) => (
          <div key={it.title} style={{ border: "1px solid #CDCDCD", borderRadius: 14, padding: 36, background: idx === 0 ? "#0d3a10" : "#fff", color: idx === 0 ? "#fff" : "#0a0a0a", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
            <div>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: idx === 0 ? "#E8A205" : "#178A00", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Poppins',sans-serif" }}>{it.tag}</div>
              <h3 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: 0, marginBottom: 12 }}>{it.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: idx === 0 ? "rgba(255,255,255,0.85)" : "#3a3a3a", fontFamily: "'Poppins',sans-serif" }}>{it.body}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: 38, color: "#E8A205", letterSpacing: "-0.03em", lineHeight: 1 }}>{it.stat}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: idx === 0 ? "rgba(255,255,255,0.6)" : "#7a7a7a", maxWidth: 130, marginTop: 8, lineHeight: 1.4, fontFamily: "'Poppins',sans-serif" }}>{it.statLabel}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
