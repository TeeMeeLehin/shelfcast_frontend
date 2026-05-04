"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

/* ── shared layout ───────────────────────────────────────────────── */
const BG: React.CSSProperties = {
  position: "relative",
  minHeight: "calc(100vh - 64px)",
  backgroundImage: "url(/hero-bg.png)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "#0d3a10",
  display: "flex",
  alignItems: "center",
};

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: "40px 36px",
  width: 400,
  boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
  flexShrink: 0,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #CDCDCD",
  borderRadius: 8,
  padding: "13px 14px",
  fontFamily: "'Poppins',sans-serif",
  fontSize: 14,
  color: "#0a0a0a",
  outline: "none",
  background: "#fff",
};

const BTN: React.CSSProperties = {
  width: "100%",
  background: "#E8A205",
  color: "#1a1100",
  border: "none",
  borderRadius: 8,
  padding: "15px 20px",
  fontFamily: "'Poppins',sans-serif",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const LABEL: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontSize: 13,
  fontWeight: 500,
  color: "#0a0a0a",
  marginBottom: 8,
  display: "block",
};

const steps = ["Create your account", "Set your preferences", "Make payment"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 40 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: 13,
            fontWeight: i === current ? 600 : 400,
            color: i === current ? "#fff" : "rgba(255,255,255,0.35)",
            whiteSpace: "nowrap",
          }}>{s}</span>
          {i < steps.length - 1 && (
            <svg width="32" height="16" viewBox="0 0 32 16" fill="none" style={{ margin: "0 6px" }}>
              <path d="M0 8h28M22 2l8 6-8 6" stroke={i < current ? "#E8A205" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── STEP 1: email / magic link ──────────────────────────────────── */
function Step1({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  return (
    <div style={BG}>
      <div className="sc-auth-layout">
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Sign up in a simple<br />3 step process
          </h1>
          <StepIndicator current={0} />
        </div>
        {/* card */}
        <div style={CARD}>
          <h2 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: 24, color: "#0a0a0a", margin: 0, marginBottom: 6 }}>
            Lets get you Started
          </h2>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "#666", margin: 0, marginBottom: 28 }}>
            Securely create your account in seconds
          </p>

          <label style={LABEL}>Email :</label>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              type="email"
              placeholder="youarewelcome@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT, paddingRight: 44 }}
            />
            <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#CDCDCD" strokeWidth="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="#178A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <button style={BTN} onClick={onNext}>
            <span>Send magic link</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Disclosure */}
          <div style={{ background: "#E7FFE2", border: "1.5px dashed #178A00", borderRadius: 8, padding: "14px 16px", marginTop: 18 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: "#178A00", margin: 0, marginBottom: 6 }}>
              User Disclosure :
            </p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12.5, color: "#0a0a0a", margin: 0, lineHeight: 1.55 }}>
              For security purposes please ensure to use an official work email, this will help us know that whoever is uploading data on the website genuinely has access to the said data.
            </p>
          </div>

          {/* Let's Encrypt */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" fill="#E8A205"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#1a1100" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#178A00", fontWeight: 500 }}>
              Let&apos;s Encrypt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── STEP 2: preferences ─────────────────────────────────────────── */
const LOCATIONS = ["Makola market", "Lapaz", "Kasoa", "Accra Mall", "Tema", "Kumasi"];
const PLATFORMS = ["Quickbooks", "Lightspeed ERP", "SAP", "Microsoft Dynamics", "Other"];

function Step2({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("");
  const [locDropdown, setLocDropdown] = useState("Makola market");
  const [added, setAdded] = useState<string[]>(["Lapaz", "Kasoa"]);
  const [platform, setPlatform] = useState("Quickbooks");

  const addLocation = (loc: string) => {
    if (!added.includes(loc)) setAdded(p => [...p, loc]);
  };
  const removeLocation = (loc: string) => setAdded(p => p.filter(l => l !== loc));

  return (
    <div style={BG}>
      <div className="sc-auth-layout">
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Welcome,<br />Lets get to know you
          </h1>
          <StepIndicator current={1} />
        </div>
        {/* card */}
        <div style={CARD}>
          <label style={LABEL}>Employee Name :</label>
          <input
            type="text"
            placeholder="Makafui"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...INPUT, marginBottom: 20 }}
          />

          <label style={LABEL}>Add locations :</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <select
              value={locDropdown}
              onChange={e => { setLocDropdown(e.target.value); addLocation(e.target.value); }}
              style={{ ...INPUT, appearance: "none", paddingRight: 40, cursor: "pointer" }}
            >
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
            <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* tags */}
          {added.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>Your added locations:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {added.map(l => (
                  <div key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid #CDCDCD", borderRadius: 999, padding: "4px 10px 4px 12px", fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#0a0a0a" }}>
                    {l}
                    <button onClick={() => removeLocation(l)} style={{ background: "#e74c3c", border: "none", borderRadius: "50%", width: 16, height: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2l6 6M8 2l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={LABEL}>Select your existing platform(s)</label>
          <div style={{ position: "relative", marginBottom: 28 }}>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              style={{ ...INPUT, appearance: "none", paddingRight: 40, cursor: "pointer" }}
            >
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <button style={BTN} onClick={onNext}>
            <span>Save &amp; Continue</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── STEP 3: payment ─────────────────────────────────────────────── */
function Step3({ onBack }: { onBack: () => void }) {
  const features = [
    "Total of 5 checks in a month?",
    "Covers data from 5 branches",
    "Covers connection to quickbooks & lightspeed ERP",
  ];

  return (
    <div style={BG}>
      {/* Go Back */}
      <button
        onClick={onBack}
        style={{ position: "absolute", top: 28, right: 80, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 500 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Go Back
      </button>

      <div className="sc-auth-layout">
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Your Pricing Optimised<br />Specifically for you
          </h1>
          <StepIndicator current={2} />
        </div>
        {/* card */}
        <div style={{ ...CARD, width: 380, padding: "28px 28px" }}>
          {/* Price */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "'Unbounded',system-ui,sans-serif", fontWeight: 800, fontSize: 40, color: "#178A00", letterSpacing: "-0.03em" }}>$500</span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "#178A00", fontWeight: 500 }}>.00 / mo</span>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <svg width="12" height="14" viewBox="0 0 14 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M1 1l12 7-12 7V1z" fill="#178A00"/>
                </svg>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#0a0a0a", lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#666", margin: 0, marginBottom: 12 }}>
            No need to add a card for now
          </p>

          {/* Warning */}
          <div style={{ background: "#E7FFE2", border: "1.5px dashed #178A00", borderRadius: 8, padding: "12px 14px", marginBottom: 18 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12.5, color: "#178A00", margin: 0, marginBottom: 5 }}>
              We would only charge if you approve
            </p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#0a0a0a", margin: 0, lineHeight: 1.5 }}>
              Note that no charges will be made to your account until you have approved for it to be done. Even when your subscription has ended a notification will be sent asking for your approval
            </p>
          </div>

          <Link href="/dashboard" style={{ ...BTN, textDecoration: "none" }}>
            <span>Start Free Trial</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 3l16 9-16 9z" fill="currentColor"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── root ─────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const [step, setStep] = useState(0);
  return (
    <div>
      <Navbar />
      {step === 0 && <Step1 onNext={() => setStep(1)} />}
      {step === 1 && <Step2 onNext={() => setStep(2)} />}
      {step === 2 && <Step3 onBack={() => setStep(1)} />}
    </div>
  );
}
