"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const links = [
  { label: "Home",       href: "/#home"    },
  { label: "About us",   href: "/#about"   },
  { label: "Contact us", href: "/#contact" },
  { label: "Pricing",    href: "/#pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav style={{ height: 64, background: "#fff", borderBottom: "1px solid #ececec", position: "sticky", top: 0, zIndex: 50 }}
        className="flex items-center px-5 md:px-14 gap-6 md:gap-12">
        <Link href="/" onClick={() => setOpen(false)}>
          <Image src="/logo.jpeg" alt="ShelfCast" width={140} height={32} style={{ height: 32, width: "auto" }} />
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-9 flex-1 ml-6">
          {links.map((l, i) => (
            <Link key={l.label} href={l.href}
              className="text-sm no-underline hover:text-[#176d20] transition-colors"
              style={{ fontFamily: "'Poppins',sans-serif", fontWeight: i === 0 ? 600 : 500, color: "#0a0a0a" }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* desktop auth */}
        <div className="hidden md:flex items-center gap-5 ml-auto">
          <Link href="#" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", textDecoration: "none" }}>
            Log in
          </Link>
          <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#E8A205", color: "#1a1100", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, borderRadius: 0, padding: "10px 22px", textDecoration: "none" }}>
            Book a demo
          </Link>
        </div>

        {/* mobile: book a demo + hamburger */}
        <div className="flex md:hidden items-center gap-3 ml-auto">
          <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", background: "#E8A205", color: "#1a1100", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, padding: "8px 14px", textDecoration: "none" }}>
            Book a demo
          </Link>
          <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Menu">
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* mobile drawer */}
      <div className={`sc-nav-drawer ${open ? "open" : ""}`}>
        {links.map(l => (
          <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
            style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 18, color: "#0a0a0a", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
        <hr style={{ borderColor: "#ececec" }} />
        <Link href="#" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a", textDecoration: "none" }}>
          Log in
        </Link>
      </div>
    </>
  );
}
