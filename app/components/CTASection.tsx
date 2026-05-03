import Link from "next/link";

export default function CTASection() {
  return (
    <section className="sc-section" style={{ background: "#fff", paddingBottom: 60 }}>
      <div style={{ background: "#0d3a10", borderRadius: 20, padding: "80px 80px", color: "#fff", position: "relative", overflow: "hidden" }}
        className="!p-8 md:!p-16 lg:!p-20">
        <div style={{ position: "absolute", top: -100, right: -100, width: 380, height: 380, background: "radial-gradient(circle,rgba(232,162,5,0.2),transparent 70%)", pointerEvents: "none" }} />
        <div className="sc-cta-inner" style={{ position: "relative" }}>
          <div>
            <h2 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.1, letterSpacing: "-0.025em", margin: 0, marginBottom: 18 }}>
              Stop guessing.<br className="block md:hidden" /> Start stocking.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.78)", margin: 0, maxWidth: 540, fontFamily: "'Poppins',sans-serif" }}>
              Connect your data today. Get your first AI stocking plan by Friday.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth" style={{ background: "#E8A205", color: "#1a1100", fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 15, borderRadius: 10, padding: "14px 28px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Get started
            </Link>
            <button style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "14px 22px", fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
