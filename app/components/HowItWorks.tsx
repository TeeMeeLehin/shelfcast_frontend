const steps = [
  { n: "01", t: "Connect your data", d: "Plug in your POS, ERP, or spreadsheet. We handle the messy parts." },
  { n: "02", t: "We analyze", d: "Six months of sales meets supplier pricing, weather, and regional demand." },
  { n: "03", t: "You restock", d: "Receive a weekly stocking plan, store by store, SKU by SKU." },
];

export default function HowItWorks() {
  return (
    <section className="sc-section-dark" style={{ background: "#0d3a10", color: "#fff" }}>
      <div className="sc-hiw-header">
        <h2 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(30px,4vw,48px)", lineHeight: 1.1, letterSpacing: "-0.025em", margin: 0 }}>
          Three steps from<br />chaos to clarity
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", margin: 0, fontFamily: "'Poppins',sans-serif" }}>
          No 90-day implementation. No army of consultants. Most retailers see their first stocking plan within a week of connecting data.
        </p>
      </div>
      <div className="sc-hiw-steps">
        {steps.map(s => (
          <div key={s.n} style={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: 36, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: 14, color: "#E8A205", letterSpacing: "0.05em", marginBottom: 32 }}>{s.n}</div>
            <h3 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", margin: 0, marginBottom: 12 }}>{s.t}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.72)", margin: 0, fontFamily: "'Poppins',sans-serif" }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
