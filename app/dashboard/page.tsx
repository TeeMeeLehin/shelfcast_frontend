"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  {
    label: "Command Center",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: "Catalogue",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    label: "Product Demand",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Opportunities",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

function DashboardNav() {
  return (
    <nav
      className="sc-dash-nav"
      style={{
        height: 60,
        background: "#fff",
        borderBottom: "1px solid #e8e0d4",
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link href="/" style={{ flexShrink: 0, marginRight: 48, textDecoration: "none" }}>
        <Image src="/logo.jpeg" alt="ShelfCast" width={120} height={28} style={{ height: 28, width: "auto" }} />
      </Link>

      <div className="sc-dash-nav-links" style={{ height: "100%" }}>
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 20px",
              background: "none",
              border: "none",
              borderBottom: i === 0 ? "2.5px solid #178A00" : "2.5px solid transparent",
              cursor: "pointer",
              fontFamily: "'Poppins',sans-serif",
              fontSize: 13,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? "#178A00" : "#555",
              whiteSpace: "nowrap",
              height: "100%",
            }}
          >
            <span style={{ color: i === 0 ? "#178A00" : "#888" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: "auto" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.3 }}>
            Makafui Gley
          </div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "#888", lineHeight: 1.3 }}>
            Melcom, Tema Branch
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#0d3a10",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: "#E8A205",
          flexShrink: 0,
        }}>
          MG
        </div>
      </div>
    </nav>
  );
}

function UploadArea() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="sc-dash-content">
      {/* header */}
      <div className="sc-dash-upload-header">
        <p style={{
          fontFamily: "'Poppins',sans-serif",
          fontSize: 14,
          color: "#3a3a3a",
          lineHeight: 1.6,
          maxWidth: 400,
          margin: 0,
        }}>
          To begin please upload the latest batch of reports from your
          POS &amp; Inventory Management System
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            background: "#E8A205",
            color: "#1a1100",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontFamily: "'Poppins',sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          upload new batch
        </button>
      </div>

      {/* drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); }}
        style={{
          border: `2px dashed ${dragging ? "#178A00" : "#9dc89e"}`,
          borderRadius: 12,
          background: dragging ? "rgba(23,138,0,0.04)" : "rgba(255,255,255,0.6)",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
          marginBottom: 28,
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V8M8 12l4-4 4 4" stroke="#178A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="#178A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontFamily: "'Poppins',sans-serif",
          fontSize: 13,
          color: "#178A00",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          upload excel or<br />CSV file
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
        />
      </div>

      {/* divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1, height: 1, background: "#d8d0c4" }} />
        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#888" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#d8d0c4" }} />
      </div>

      {/* integrations */}
      <div className="sc-dash-integrations">
        <p style={{
          fontFamily: "'Poppins',sans-serif",
          fontSize: 13,
          color: "#555",
          lineHeight: 1.6,
          maxWidth: 340,
          margin: 0,
        }}>
          Coming soon with the feature for you to connect to existing
          POS or ERP Solutions you are already signed up on to.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["lightspeed", "quickbooks"].map(name => (
            <button
              key={name}
              disabled
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "1.5px solid #178A00",
                borderRadius: 8,
                padding: "9px 18px",
                fontFamily: "'Poppins',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#178A00",
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#178A00" strokeWidth="2"/>
                <path d="M12 7v5l3 3" stroke="#178A00" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f0e8" }}>
      <DashboardNav />

      <main style={{ flex: 1 }}>
        <UploadArea />
      </main>

      <div
        className="sc-dash-bottom"
        style={{
          borderTop: "1px solid #e8e0d4",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#555",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "#555",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}
