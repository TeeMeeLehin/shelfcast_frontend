const metrics = [
  { k: "420+", v: "Retail partners" },
  { k: "1.2M",  v: "SKUs analyzed weekly" },
  { k: "$1.4B", v: "Revenue uplift in 2025" },
  { k: "92%",   v: "Forecast accuracy" },
];

export default function MetricsBand() {
  return (
    <section style={{ background: "#fff", padding: "70px 100px", borderBottom: "1px solid #ececec", borderTop: "1px solid #ececec" }}
      className="!px-5 md:!px-16 lg:!px-24">
      <div className="sc-metrics-grid">
        {metrics.map((x, i) => (
          <div key={x.v} style={{ paddingLeft: i === 0 ? 0 : 24, borderLeft: i === 0 ? "none" : "1px solid #ececec" }}>
            <div style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,44px)", letterSpacing: "-0.03em", color: "#0f3d10", lineHeight: 1, marginBottom: 10 }}>
              {x.k}
            </div>
            <div style={{ fontSize: 13, color: "#4a4a4a", fontWeight: 500, fontFamily: "'Poppins',sans-serif" }}>{x.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
