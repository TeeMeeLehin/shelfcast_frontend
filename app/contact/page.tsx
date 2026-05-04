import Navbar from "../components/Navbar";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div style={{ background: "#fff" }}>
      <Navbar />
      <section style={{ position: "relative", backgroundImage: "url(/hero-bg.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0d3a10", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <div style={{ display: "inline-flex", padding: "8px 16px", borderRadius: 6, background: "rgba(8,30,8,0.55)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12.5, marginBottom: 32, fontFamily: "'Gilroy',sans-serif" }}>
            Get in touch
          </div>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.025em", color: "#fff", margin: 0, marginBottom: 20, fontSize: "clamp(36px,6vw,72px)" }}>
            Let&apos;s talk <span style={{ color: "#E8A205" }}>shelves</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.88)", margin: "0 auto 32px", maxWidth: 520, fontFamily: "'Gilroy',sans-serif" }}>
            Have a question or want a walkthrough? Our team typically replies within one business day.
          </p>
          <Link href="/auth" style={{ background: "#E8A205", color: "#0D1F0D", fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 15, borderRadius: 10, padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.2s ease" }}>
            Book a demo
          </Link>
        </div>
      </section>
    </div>
  );
}
