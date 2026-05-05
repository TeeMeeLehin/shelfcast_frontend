import Navbar from "../components/Navbar";

export default function AboutPage() {
  return (
    <div style={{ background: "#fff" }}>
      <Navbar />
      <section style={{ position: "relative", backgroundImage: "url(/hero-bg.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0d3a10", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <div style={{ display: "inline-flex", padding: "8px 16px", borderRadius: 6, background: "rgba(8,30,8,0.55)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12.5, marginBottom: 32, fontFamily: "'Gilroy',sans-serif" }}>
            Our story
          </div>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", color: "#fff", margin: 0, marginBottom: 20, fontSize: "clamp(36px,6vw,72px)" }}>
            Built for the <span style={{ color: "#E8A205" }}>shelf</span>,<br />not the spreadsheet
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.88)", margin: "0 auto", maxWidth: 560, fontFamily: "'Gilroy',sans-serif" }}>
            ShelfCast was founded by retail operators who got tired of guessing. We build the tools we wished we had.
          </p>
        </div>
      </section>
    </div>
  );
}
