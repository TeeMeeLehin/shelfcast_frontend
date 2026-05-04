"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const links = [
  { label: "Home",       href: "/"          },
  { label: "About us",   href: "/about"     },
  { label: "Contact us", href: "/contact"   },
  { label: "Pricing",    href: "/pricing"   },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("sc_token"));
  }, []);

  function handleLogout() {
    localStorage.removeItem("sc_token");
    setLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <>
      <nav style={{ height: 64, background: "#fff", borderBottom: "1px solid #ececec", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "0 96px", gap: 48 }}>
        <Link href="/" onClick={() => setOpen(false)}>
          <Image src="/shelfcast.svg" alt="ShelfCast" width={0} height={32} style={{ height: 32, width: "auto" }} />
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-9 flex-1 ml-6">
          {links.map((l, i) => (
            <Link key={l.label} href={l.href}
              className="text-sm no-underline hover:text-[#176d20] transition-colors"
              style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, color: "#0a0a0a" }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* desktop auth */}
        <div className="hidden md:flex items-center gap-5 ml-auto">
          {loggedIn ? (
            <button onClick={handleLogout} style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 14, color: "#0a0a0a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Log out
            </button>
          ) : (
            <>
              <Link href="/auth?mode=login" style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 14, color: "#0a0a0a", textDecoration: "none" }}>
                Log in
              </Link>
              <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#E8A205", color: "#0D1F0D", fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 14, borderRadius: 10, padding: "10px 22px", textDecoration: "none", transition: "background 0.2s ease" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#C88A00")}
                onMouseLeave={e => (e.currentTarget.style.background = "#E8A205")}>
                Book a demo
              </Link>
            </>
          )}
        </div>

        {/* mobile: book a demo + hamburger */}
        <div className="flex md:hidden items-center gap-3 ml-auto">
          {!loggedIn && (
            <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#E8A205", color: "#0D1F0D", fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 13, borderRadius: 10, padding: "8px 14px", textDecoration: "none", transition: "background 0.2s ease" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#C88A00")}
              onMouseLeave={e => (e.currentTarget.style.background = "#E8A205")}>
              Book a demo
            </Link>
          )}
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
            style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 18, color: "#0a0a0a", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
        <hr style={{ borderColor: "#ececec" }} />
        {loggedIn ? (
          <button onClick={handleLogout} style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 16, color: "#0a0a0a", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
            Log out
          </button>
        ) : (
          <Link href="/auth?mode=login" onClick={() => setOpen(false)} style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 16, color: "#0a0a0a", textDecoration: "none" }}>
            Log in
          </Link>
        )}
      </div>
    </>
  );
}
