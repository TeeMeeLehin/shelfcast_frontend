"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { DEMO_MODE, API_BASE } from "@/lib/config";

/* ── friendly error messages by HTTP status ─────────────────────── */
function friendlyError(status: number, flow: "signup" | "login" | "onboarding"): string {
  // 4xx — user-side issues
  if (status === 400) {
    if (flow === "signup")    return "Please check that your email is valid and your password meets the requirements, then try again.";
    if (flow === "onboarding") return "Please fill in all required fields before continuing.";
    return "Please check your details and try again.";
  }
  if (status === 401) return "Incorrect email or password. Please try again.";
  if (status === 403) return "You don't have permission to do that. Kindly contact support if this continues.";
  if (status === 404) {
    if (flow === "login") return "No account found with that email. Please check your email or sign up.";
    return "We couldn't find what we were looking for. Kindly try again.";
  }
  if (status === 409) return "An account with this email already exists. Please sign in instead.";
  if (status === 422) return "Some of the information provided doesn't look right. Please review your details and try again.";
  if (status === 429) return "Too many attempts in a short time. Please wait a moment and try again.";
  // 5xx — server-side issues, never the user's fault
  if (status >= 500) return "We're experiencing a technical issue on our end. Kindly try again in a few moments — this is not your fault.";
  return "Something unexpected happened. Kindly try again shortly.";
}

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
  padding: "24px 28px",
  width: 400,
  maxWidth: "100%",
  boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
  flexShrink: 0,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #C0C0C0",
  borderRadius: 8,
  padding: "10px 14px",
  fontFamily: "'Gilroy',sans-serif",
  fontSize: 14,
  color: "#0a0a0a",
  outline: "none",
  background: "#fff",
};

const BTN: React.CSSProperties = {
  width: "100%",
  background: "#E8A205",
  color: "#0D1F0D",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontFamily: "'Gilroy',sans-serif",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "background 0.2s ease",
};

const LABEL: React.CSSProperties = {
  fontFamily: "'Gilroy',sans-serif",
  fontSize: 13,
  fontWeight: 600,
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
            fontFamily: "'Gilroy',sans-serif",
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

/* ── STEP 1: register ────────────────────────────────────────────── */
function Step1({ onNext, onSwitchToLogin }: { onNext: () => void; onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (DEMO_MODE) { onNext(); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        await res.json().catch(() => null);
        setError(friendlyError(res.status, "signup"));
        return;
      }
      const { access_token } = await res.json();
      localStorage.setItem("sc_token", access_token);
      onNext();
    } catch {
      setError("We couldn't reach the server. Kindly check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={BG}>
      <div className="sc-auth-layout" style={{ justifyContent: "flex-end" }}>
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Sign up in a simple<br />3 step process
          </h1>
          <StepIndicator current={0} />
        </div>

        {/* card */}
        <div style={CARD}>
          <h2 style={{ fontFamily: "'ESKlarheit',sans-serif", fontSize: 22, color: "#0D1F0D", margin: 0, marginBottom: 4 }}>
            Let&apos;s get you started
          </h2>
          <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#666", margin: 0, marginBottom: 18 }}>
            Securely create your account in seconds
          </p>

          {error && (
            <div style={{ background: "#FFF0F0", border: "1.5px solid #e74c3c", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#c0392b", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL}>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={INPUT}
            />
          </div>

          {/* Password full-width */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={LABEL}>Password</label>
            <input
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...INPUT, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 12, bottom: 13, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#999", display: "flex" }}
            >
              {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* CTA */}
          <button
            style={{ ...BTN, marginBottom: 14, opacity: loading ? 0.7 : 1 }}
            onClick={handleRegister}
            disabled={loading}
          >
            <span>{loading ? "Creating account…" : "Create account"}</span>
            <ArrowRight size={18} weight="bold" />
          </button>

          <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#666", textAlign: "center", margin: 0, marginBottom: 14 }}>
            Already have an account?{" "}
            <span onClick={onSwitchToLogin} style={{ color: "#E8A205", cursor: "pointer", fontWeight: 600 }}>Sign in</span>
          </p>

          {/* User Disclosure */}
          <div style={{ background: "#F6FFF4", border: "1px dashed #178A00", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontFamily: "'ESKlarheit',sans-serif", fontSize: 12, color: "#178A00", margin: 0, marginBottom: 3 }}>
              User Disclosure :
            </p>
            <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 12, color: "#0D1F0D", margin: 0, lineHeight: 1.5 }}>
              For security purposes please ensure to use an official work email, this will help us know that whoever is uploading data on the website genuinely has access to the said data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── STEP 2: preferences ─────────────────────────────────────────── */
const LOCATIONS = ["Makola market", "Lapaz", "Kasoa", "Accra Mall", "Tema", "Kumasi", "Other"];
const PLATFORMS = ["Quickbooks", "Lightspeed ERP", "SAP", "Microsoft Dynamics", "Other"];

function Step2({ onNext }: { onNext: () => void }) {
  const [retailerName, setRetailerName] = useState("");
  const [locDropdown, setLocDropdown] = useState("Makola market");
  const [added, setAdded] = useState<string[]>([]);
  const [customLoc, setCustomLoc] = useState("");
  const [platform, setPlatform] = useState("Quickbooks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLocation = (loc: string) => {
    if (loc.trim() && !added.includes(loc.trim())) setAdded(p => [...p, loc.trim()]);
  };
  const removeLocation = (loc: string) => setAdded(p => p.filter(l => l !== loc));

  async function handleOnboarding() {
    setError(null);
    if (!retailerName.trim()) {
      setError("Please enter your retailer name.");
      return;
    }
    if (DEMO_MODE) { onNext(); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("sc_token");
      const res = await fetch(`${API_BASE}/api/v1/auth/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ retailer_name: retailerName, cities: added }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = (data as { detail?: string }).detail;
        void detail;
        // Non-fatal — preferences couldn't be saved server-side but the account
        // is already created. Proceed so the user isn't blocked.
      }
      localStorage.setItem("sc_onboarded", "true");
      localStorage.setItem("sc_retailer_name", retailerName);
      onNext();
    } catch (err) {
      // Still proceed — don't block the user over a preference step
      localStorage.setItem("sc_onboarded", "true");
      localStorage.setItem("sc_retailer_name", retailerName);
      onNext();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={BG}>
      <div className="sc-auth-layout">
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Welcome,<br />Lets get to know you
          </h1>
          <StepIndicator current={1} />
        </div>
        {/* card */}
        <div style={CARD}>
          {error && (
            <div style={{ background: "#FFF0F0", border: "1.5px solid #e74c3c", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#c0392b", margin: 0 }}>{error}</p>
            </div>
          )}

          <label style={LABEL}>Retailer / Store name :</label>
          <input
            type="text"
            placeholder="e.g. Makola Retail Store"
            value={retailerName}
            onChange={e => setRetailerName(e.target.value)}
            style={{ ...INPUT, marginBottom: 20 }}
          />

          <label style={LABEL}>Add locations :</label>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <select
              value={locDropdown}
              onChange={e => {
                const val = e.target.value;
                setLocDropdown(val);
                if (val !== "Other") addLocation(val);
              }}
              style={{ ...INPUT, appearance: "none", paddingRight: 40, cursor: "pointer" }}
            >
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
            <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {locDropdown === "Other" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Type a location…"
                value={customLoc}
                onChange={e => setCustomLoc(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && customLoc.trim()) {
                    addLocation(customLoc);
                    setCustomLoc("");
                  }
                }}
                style={{ ...INPUT, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => { if (customLoc.trim()) { addLocation(customLoc); setCustomLoc(""); } }}
                style={{ background: "#E8A205", border: "none", borderRadius: 8, padding: "0 16px", fontFamily: "'Gilroy',sans-serif", fontWeight: 600, fontSize: 13, color: "#0D1F0D", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Add
              </button>
            </div>
          )}

          {/* tags */}
          {added.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>Your added locations:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {added.map(l => (
                  <div key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid #CDCDCD", borderRadius: 999, padding: "4px 10px 4px 12px", fontFamily: "'Gilroy',sans-serif", fontSize: 12, color: "#0a0a0a" }}>
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

          <button style={{ ...BTN, opacity: loading ? 0.7 : 1 }} onClick={handleOnboarding} disabled={loading}>
            <span>{loading ? "Saving…" : "Save & Continue"}</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── STEP 3: free trial ──────────────────────────────────────────── */
function Step3({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    if (DEMO_MODE) { window.location.href = "/dashboard"; return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("sc_token");
      await fetch(`${API_BASE}/api/v1/auth/start-trial`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch {
      // Non-fatal — still redirect
    }
    window.location.href = "/dashboard";
  }

  const features = [
    "Up to 500 SKUs",
    "Daily inventory checks included",
    "Upload data via Excel or CSV",
    "No POS system connection available on trial",
  ];

  return (
    <div style={BG}>
      <div className="sc-auth-layout">
        {/* left */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Your Pricing Optimised<br />Specifically for you
          </h1>
          <StepIndicator current={2} />
        </div>
        {/* card column with go-back above */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontFamily: "'Gilroy',sans-serif", fontSize: 14, fontWeight: 600, padding: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back
          </button>
        {/* card — same size as sign-up card */}
        <div style={CARD}>
          {/* Congrats banner */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" fill="#E7FFE2"/>
              <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#178A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'ESKlarheit',sans-serif", fontWeight: 700, fontSize: 13, color: "#178A00", letterSpacing: "0.05em", textTransform: "uppercase" }}>Free Trial Unlocked</span>
          </div>

          <h2 style={{ fontFamily: "'ESKlarheit',sans-serif", fontSize: 26, color: "#0D1F0D", margin: 0, marginBottom: 6 }}>
            Congrats! You&apos;ve just unlocked<br />a free 30-day trial
          </h2>
          <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 14, color: "#666", margin: 0, marginBottom: 24 }}>
            No credit card needed. Here&apos;s what&apos;s included:
          </p>

          {/* Features */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {features.map(f => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" fill="#E7FFE2"/>
                  <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#178A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13.5, color: "#0a0a0a", lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Notice */}
          <div style={{ background: "#F6FFF4", border: "1px dashed #178A00", borderRadius: 8, padding: "10px 12px", marginBottom: 24 }}>
            <p style={{ fontFamily: "'Gilroy',sans-serif", fontWeight: 700, fontSize: 12.5, color: "#178A00", margin: 0, marginBottom: 4 }}>
              No charges during your trial
            </p>
            <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 12, color: "#0D1F0D", margin: 0, lineHeight: 1.5 }}>
              Your 30-day trial is completely free. You&apos;ll only be charged after the trial ends and only if you choose to continue.
            </p>
          </div>

          <button style={{ ...BTN, opacity: loading ? 0.7 : 1 }} onClick={handleStartTrial} disabled={loading}>
            <span>{loading ? "Starting trial…" : "Go to Dashboard"}</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

/* ── SIGN IN ──────────────────────────────────────────────────────── */
function SignIn({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    if (DEMO_MODE) { window.location.href = "/dashboard/register"; return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        await res.json().catch(() => null);
        setError(friendlyError(res.status, "login"));
        return;
      }
      const { access_token } = await res.json();
      localStorage.setItem("sc_token", access_token);
      localStorage.setItem("sc_onboarded", "true");
      window.location.href = "/dashboard/register";
    } catch {
      setError("We couldn't reach the server. Kindly check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...BG, justifyContent: "center" }}>
      <div style={{ ...CARD, width: 420, padding: "36px 32px" }}>
        <h2 style={{ fontFamily: "'ESKlarheit',sans-serif", fontSize: 28, color: "#0D1F0D", margin: 0, marginBottom: 6 }}>
          Sign in
        </h2>
        <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 14, color: "#666", margin: 0, marginBottom: 28 }}>
          Enter your credentials to continue
        </p>

        {error && (
          <div style={{ background: "#FFF0F0", border: "1.5px solid #e74c3c", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#c0392b", margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={LABEL}>Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={INPUT}
          />
        </div>

        <div style={{ marginBottom: 24, position: "relative" }}>
          <label style={LABEL}>Password</label>
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ ...INPUT, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: 12, bottom: 13, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#999", display: "flex" }}
          >
            {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          style={{ ...BTN, marginBottom: 14, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          <span>{loading ? "Signing in…" : "Sign in"}</span>
          <ArrowRight size={18} weight="bold" />
        </button>

        <p style={{ fontFamily: "'Gilroy',sans-serif", fontSize: 13, color: "#666", textAlign: "center", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <span onClick={onSwitch} style={{ color: "#E8A205", cursor: "pointer", fontWeight: 600 }}>Sign up</span>
        </p>
      </div>
    </div>
  );
}

/* ── root ─────────────────────────────────────────────────────────── */
function AuthPageInner() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"register" | "login">(
    searchParams.get("mode") === "login" ? "login" : "register"
  );
  const [resuming, setResuming] = useState(true);

  useEffect(() => {
    async function resumeFlow() {
      if (DEMO_MODE) { setResuming(false); return; }
      const token = localStorage.getItem("sc_token");
      if (!token) { setResuming(false); return; }

      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status >= 500) {
            // Backend error — keep the token, use localStorage state to decide
            const onboarded = localStorage.getItem("sc_onboarded");
            if (onboarded) {
              window.location.href = "/dashboard";
            } else {
              setStep(1);
              setResuming(false);
            }
            return;
          }
          // 401/403 — token invalid, clear and show login
          localStorage.removeItem("sc_token");
          localStorage.removeItem("sc_onboarded");
          setResuming(false);
          return;
        }
        const data = await res.json();
        const s: number = data.onboarding_step ?? 1;

        if (s >= 3 && data.trial_started_at) {
          window.location.href = "/dashboard";
          return;
        }
        if (s >= 2) {
          setStep(2);
        } else {
          setStep(1);
        }
      } catch {
        // Network error — if we have a token, let them in; don't strand them on the auth page
        const onboarded = localStorage.getItem("sc_onboarded");
        if (onboarded) {
          window.location.href = "/dashboard";
          return;
        }
        setResuming(false);
        return;
      }
      setResuming(false);
    }
    resumeFlow();
  }, []);

  if (resuming) {
    return (
      <div>
        <Navbar />
        <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d3a10" }}>
          <p style={{ fontFamily: "'Gilroy',sans-serif", color: "rgba(255,255,255,0.6)", fontSize: 15 }}>Resuming your session…</p>
        </div>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div>
        <Navbar />
        <SignIn onSwitch={() => setMode("register")} />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {step === 0 && <Step1 onNext={() => setStep(1)} onSwitchToLogin={() => setMode("login")} />}
      {step === 1 && <Step2 onNext={() => setStep(2)} />}
      {step === 2 && <Step3 onBack={() => setStep(1)} />}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
