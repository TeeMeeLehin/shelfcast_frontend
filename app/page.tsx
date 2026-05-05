"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem("sc_token");
      if (!token) { setChecking(false); return; }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem("sc_token");
          localStorage.removeItem("sc_onboarded");
          setChecking(false);
          return;
        }
        const data = await res.json();
        if (data.onboarding_step >= 3 && data.trial_started_at) {
          router.replace("/dashboard");
        } else {
          router.replace("/auth");
        }
      } catch {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d3a10" }}>
        <p style={{ fontFamily: "'Gilroy',sans-serif", color: "rgba(255,255,255,0.6)", fontSize: 15 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff" }}>
      <Navbar />
      <Hero />
    </div>
  );
}
