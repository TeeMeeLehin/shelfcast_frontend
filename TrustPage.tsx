'use client';

import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

type UploadStatus = 'idle' | 'uploading' | 'error';

type TrustDocument = {
  id: string;
  assetId: string;
  fileName: string;
  url: string;
};

type AssetDocumentLookup = Record<string, TrustDocument | undefined>;

const ASSET_IDS = [
  'governance-statement', 'ai-inventory', 'risk-escalation',
  'data-ethics', 'acceptable-use', 'code-ethics',
  'accountability-guideline', 'customer-disclosure',
];

const GROUP_ASSETS: Record<string, string[]> = {
  governance: ['governance-statement', 'ai-inventory', 'risk-escalation'],
  ethics: ['data-ethics', 'acceptable-use', 'code-ethics'],
  public: ['accountability-guideline', 'customer-disclosure'],
};

const ZONE_DEFAULTS: Record<string, { label: string; desc: string }> = {
  'governance-statement':     { label: 'Upload PDF / Link Document',         desc: 'Required: Governance framework document' },
  'ai-inventory':             { label: 'Upload CSV / PDF',                   desc: 'Required: Complete AI systems inventory' },
  'risk-escalation':          { label: 'Upload Diagram / Workflow',           desc: 'Required: Risk escalation process flow' },
  'data-ethics':              { label: 'Upload Checklist Result',             desc: 'Required: Completed ethics verification' },
  'acceptable-use':           { label: 'Upload Policy Document',              desc: 'Required: User interaction guidelines' },
  'code-ethics':              { label: 'Upload Ethics Charter',               desc: 'Required: Company ethics standards' },
  'accountability-guideline': { label: 'Click to Upload Accountability Pack', desc: 'Required: Third-party APIs & Hosting Details' },
  'customer-disclosure':      { label: 'Click to Upload UI Screens/Copy',    desc: 'Must include fallback & bias control statements' },
};

const trustStyles = `
  .trust-root *, .trust-root *::before, .trust-root *::after { box-sizing: border-box; }

  .trust-root {
    --bg: #fef9ec;
    --card: #ffffff;
    --foreground: #0f172a;
    --muted: #64748b;
    --primary: #035C04;
    --primary-fg: #fef9ec;
    --secondary: #F9E3C0;
    --border: rgba(0,0,0,0.08);
    --radius: 0.5rem;
    --font: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-family: var(--font);
    background: var(--bg);
    color: var(--foreground);
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.5;
  }

  /* TOPBAR */
  .trust-topbar {
    height: 52px;
    border-bottom: 1px solid var(--border);
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .trust-topbar-inner {
    max-width: 1152px;
    margin: 0 auto;
    padding: 0 1rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .trust-topbar-actions { display: flex; align-items: center; gap: 0.75rem; }

  .trust-btn-icon {
    padding: 6px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    color: var(--foreground);
  }
  .trust-btn-icon:hover { background: rgba(249,227,192,0.5); }
  .trust-btn-icon.active { border-color: rgba(3,92,4,0.3); background: rgba(3,92,4,0.1); color: var(--primary); }

  .trust-badge-pill {
    display: none;
    align-items: center;
    gap: 0.5rem;
    background: rgba(249,227,192,0.4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 300;
    color: var(--foreground);
  }
  @media(min-width:640px) { .trust-badge-pill { display: flex; } }

  .trust-btn-outline {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    font-family: var(--font);
    font-weight: 300;
    transition: background 0.15s;
    color: var(--foreground);
  }
  .trust-btn-outline:hover { background: rgba(249,227,192,0.5); }
  .trust-btn-outline .trust-label { display: none; }
  @media(min-width:640px) { .trust-btn-outline .trust-label { display: inline; } }

  /* MAIN */
  .trust-main {
    max-width: 1152px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* CARDS */
  .trust-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    overflow: hidden;
  }
  .trust-card-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
    background: rgba(3,92,4,0.04);
  }
  .trust-card-header-row { display: flex; align-items: flex-start; gap: 1rem; }

  .trust-icon-box {
    width: 40px; height: 40px;
    border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .trust-icon-box.primary { background: var(--primary); color: var(--primary-fg); }
  .trust-icon-box.secondary { background: rgba(249,227,192,0.6); color: var(--primary); }
  .trust-icon-box.sm { width: 32px; height: 32px; border-radius: calc(var(--radius) * 0.8); }

  .trust-doc-counter {
    display: none;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 300;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 6px 12px;
    flex-shrink: 0;
    font-family: monospace;
  }
  @media(min-width:768px) { .trust-doc-counter { display: flex; } }
  .trust-doc-counter .num { color: var(--primary); font-weight: 300; }

  /* PILLARS */
  .trust-pillars {
    display: grid;
    grid-template-columns: 1fr;
    border-top: 1px solid var(--border);
  }
  @media(min-width:640px) {
    .trust-pillars { grid-template-columns: repeat(3,1fr); }
    .trust-pillar + .trust-pillar { border-left: 1px solid var(--border); border-top: none; }
  }
  .trust-pillar {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
  }
  @media(min-width:640px) { .trust-pillar { border-top: none; } }
  .trust-pillar-label { font-size: 11px; color: var(--muted); font-weight: 300; text-transform: uppercase; letter-spacing: 0.06em; }
  .trust-pillar-value { font-size: 13px; font-weight: 300; margin-top: 2px; }

  /* STATUS STRIP */
  .trust-status-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .trust-status-pill {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 6px 12px;
    font-size: 12px; font-weight: 300;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .trust-status-pill .s-label { color: var(--muted); }
  .trust-status-pill.done .s-label { color: var(--foreground); }
  .trust-status-pill .s-state { font-size: 11px; margin-left: 4px; color: var(--muted); }
  .trust-status-pill.done .s-state { color: var(--primary); }

  /* SECTION HEADER */
  .trust-section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
  .trust-section-num {
    width: 28px; height: 28px;
    border-radius: calc(var(--radius) * 0.6);
    background: var(--foreground); color: var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }
  .trust-section-title {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
    color: var(--foreground);
  }
  .trust-section-title svg { color: var(--muted); }

  /* GRIDS */
  .trust-grid-3 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .trust-grid-2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media(min-width:768px) { .trust-grid-3 { grid-template-columns: repeat(3,1fr); } }
  @media(min-width:768px) { .trust-grid-2 { grid-template-columns: repeat(2,1fr); } }

  /* ASSET CARD */
  .trust-asset-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    display: flex; flex-direction: column; overflow: hidden;
    transition: border-color 0.15s;
  }
  .trust-asset-card:hover { border-color: rgba(0,0,0,0.15); }
  .trust-asset-card.highlighted { box-shadow: 0 0 0 1px rgba(3,92,4,0.25), 0 1px 3px rgba(0,0,0,0.04); }
  .trust-asset-card-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    background: #FFF6ED;
  }
  .trust-asset-card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
  .trust-asset-card-title { font-size: 14px; font-weight: 600; line-height: 1.3; color: var(--foreground); }
  .trust-asset-badge {
    flex-shrink: 0; font-size: 10px; padding: 2px 8px; border-radius: 4px;
    background: rgba(249,227,192,0.6); color: var(--primary);
    border: 1px solid rgba(3,92,4,0.2); font-weight: 300;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .trust-asset-card-desc { font-size: 12px; color: var(--muted); margin-top: 4px; font-weight: 300; line-height: 1.5; }
  .trust-asset-card-body { padding: 1rem; margin-top: auto; }

  /* UPLOAD ZONE */
  .trust-upload-zone {
    border-radius: var(--radius); padding: 1rem; text-align: center;
    border: 1.5px dashed var(--border); cursor: pointer;
    transition: all 0.15s; user-select: none;
  }
  .trust-upload-zone:hover { border-color: rgba(3,92,4,0.3); background: rgba(249,227,192,0.1); }
  .trust-upload-zone.uploaded {
    border-style: solid; border-color: rgba(3,92,4,0.3);
    background: rgba(3,92,4,0.04); padding: 8px 1rem;
  }
  .trust-upload-zone.highlighted-zone {
    border-style: solid; border-color: var(--secondary);
    background: rgba(249,227,192,0.2);
  }
  .trust-upload-zone.highlighted-zone:hover { background: rgba(249,227,192,0.3); }
  .trust-upload-zone.uploading { opacity: 0.7; cursor: wait; }
  .uz-icon { margin: 0 auto 8px; color: var(--muted); }
  .trust-upload-zone.highlighted-zone .uz-icon { color: var(--primary); }
  .uz-label { font-size: 13px; font-weight: 300; display: block; margin-bottom: 4px; color: var(--foreground); }
  .uz-desc { font-size: 11px; color: var(--muted); }
  .uz-error { font-size: 11px; color: #ef4444; display: block; margin-top: 8px; }
  .uz-uploaded-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.5rem; color: var(--primary);
  }
  .uz-uploaded-info { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
  .uz-uploaded-name { font-size: 12px; font-weight: 600; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .uz-uploaded-file { font-size: 11px; font-weight: 300; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--primary); }
  .uz-view { font-size: 11px; color: var(--muted); flex-shrink: 0; }
  .uz-spinner { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--muted); font-size: 13px; font-weight: 300; }

  /* INFO BOX */
  .trust-info-box {
    background: rgba(249,227,192,0.3); border: 1px solid var(--border);
    border-radius: 12px; padding: 1rem;
    display: flex; align-items: flex-start; gap: 1rem;
  }
  .trust-info-box p { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }

  /* FOOTER */
  .trust-footer-strip { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-bottom: 2rem; }
  .trust-footer-tag {
    font-size: 11px; font-weight: 300; color: var(--muted);
    border: 1px solid var(--border); padding: 4px 10px;
    border-radius: var(--radius); background: var(--card);
  }
  .trust-footer-brand { margin-left: auto; font-size: 11px; color: var(--muted); font-weight: 300; align-self: center; }

  /* MODAL */
  .trust-modal-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(0,0,0,0.6); padding: 1rem;
    display: flex; align-items: center; justify-content: center;
  }
  @media(min-width:768px) { .trust-modal-overlay { padding: 2rem; } }
  .trust-modal-box {
    width: 100%; background: #fff;
    border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden;
  }
  .trust-modal-sm { max-width: 448px; }
  .trust-modal-lg { max-width: 900px; height: 85vh; display: flex; flex-direction: column; }
  .trust-modal-header {
    padding: 12px 1rem; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .trust-modal-header-info p:first-child { font-size: 13px; font-weight: 300; color: var(--foreground); }
  .trust-modal-header-info p:last-child { font-size: 11px; color: var(--muted); }
  .trust-modal-body { padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
  .trust-modal-inner-card {
    background: rgba(249,227,192,0.2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1rem;
  }
  .trust-modal-inner-card.light { background: rgba(249,227,192,0.1); }
  .trust-modal-inner-card p { font-size: 13px; margin-bottom: 8px; color: var(--foreground); }
  .trust-input-row { display: flex; gap: 0.5rem; }
  .trust-input-field {
    flex: 1; border: 1px solid var(--border); border-radius: var(--radius);
    padding: 8px 12px; font-size: 13px; font-family: var(--font);
    background: #fff; outline: none; transition: border-color 0.15s; color: var(--foreground);
  }
  .trust-input-field:focus { border-color: rgba(3,92,4,0.4); }
  .trust-input-row-icon {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 12px;
  }
  .trust-input-row-icon input {
    flex: 1; border: none; outline: none;
    font-size: 13px; font-family: var(--font); background: transparent; color: var(--foreground);
  }
  .trust-btn-sm {
    padding: 8px 12px; border-radius: var(--radius);
    border: 1px solid var(--border); background: transparent;
    font-size: 12px; font-family: var(--font);
    cursor: pointer; transition: background 0.15s; white-space: nowrap; color: var(--foreground);
  }
  .trust-btn-sm:hover { background: rgba(249,227,192,0.5); }
  .trust-btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }
  .trust-modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0 1rem 1rem; }
  .trust-msg-error { font-size: 11px; color: #ef4444; margin-top: 4px; }
  .trust-msg-success { font-size: 11px; color: var(--primary); margin-top: 4px; }

  @keyframes trust-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .trust-animate-pulse { animation: trust-pulse 1.5s ease-in-out infinite; }
`;

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#035C04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#035C04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#035C04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCheck = ({ stroke = 'currentColor' }: { stroke?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconScale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconUpload = ({ stroke = 'currentColor', size = 28 }: { stroke?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconLockSm = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#035C04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
);
const IconPrinter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconSparkles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#035C04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
const IconKeyModal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
);

const Logo = () => (
  <svg viewBox="0 0 892.5 186.5" style={{ height: 28, width: 'auto' }}>
    <path fill="#005e04" d="M213.05,97.15c-3.77-1.36-8.94-2.23-15.53-2.61l-12.25-.86c-2.72-.19-4.57-.55-5.55-1.09-.98-.54-1.47-1.34-1.47-2.42,0-1.33.79-2.37,2.37-3.13,1.58-.76,3.96-1.14,7.12-1.14,2.6,0,4.75.27,6.46.81,1.71.54,3.07,1.27,4.08,2.18,1.01.92,1.68,1.98,1.99,3.18h22.03c-.44-3.8-2.14-7.14-5.08-10.02-2.94-2.88-6.85-5.11-11.73-6.7-4.88-1.58-10.45-2.37-16.71-2.37s-11.97.68-16.71,2.04c-4.75,1.36-8.45,3.43-11.11,6.22-2.66,2.79-3.99,6.27-3.99,10.45,0,3.17.85,5.9,2.56,8.21,1.71,2.31,4.53,4.16,8.45,5.55,3.92,1.39,9.21,2.31,15.86,2.75l9.21.66c3.35.25,5.75.65,7.17,1.19,1.42.54,2.14,1.41,2.14,2.61,0,1.39-.9,2.45-2.71,3.18-1.8.73-4.42,1.09-7.83,1.09-2.79,0-5.14-.25-7.08-.76-1.93-.51-3.5-1.23-4.7-2.18-1.2-.95-2.03-2.09-2.47-3.42h-22.03c.19,3.99,1.76,7.5,4.7,10.54,2.94,3.04,7.03,5.38,12.25,7.03,5.22,1.65,11.28,2.47,18.19,2.47s12.52-.73,17.43-2.18c4.91-1.46,8.7-3.66,11.4-6.6,2.69-2.94,4.04-6.6,4.04-10.97,0-3.23-.81-5.98-2.42-8.26-1.61-2.28-4.31-4.1-8.07-5.46Z"/>
    <path fill="#005e04" d="M285.79,77.73c-3.7-2.09-8.18-3.13-13.44-3.13-4.31,0-8.26,1-11.87,2.99-2.89,1.6-5.42,3.82-7.6,6.66v-26.74h-21.75v73.12h21.75v-26.02c0-2.6.47-4.81,1.42-6.65.95-1.84,2.31-3.26,4.08-4.27,1.77-1.01,3.86-1.52,6.27-1.52,3.48,0,6.16.95,8.02,2.85,1.87,1.9,2.8,4.62,2.8,8.17v27.44h21.75v-30.58c0-5.13-.98-9.61-2.94-13.44-1.96-3.83-4.8-6.79-8.5-8.88Z"/>
    <path fill="#005e04" d="M365.46,88.84c-2.5-5.06-6.09-8.97-10.78-11.73-4.69-2.75-10.35-4.13-17-4.13s-12.05,1.19-17.14,3.56c-5.1,2.37-9.12,5.71-12.06,10.02-2.94,4.31-4.42,9.31-4.42,15s1.52,10.92,4.56,15.29c3.04,4.37,7.18,7.76,12.44,10.16,5.25,2.41,11.24,3.61,17.95,3.61,5.19,0,10.32-.74,15.38-2.23,5.06-1.49,9.53-3.62,13.39-6.41v-12.72c-3.29,2.09-6.92,3.67-10.87,4.75-3.96,1.08-7.99,1.61-12.11,1.61s-7.91-.58-10.83-1.76c-2.91-1.17-5.08-2.86-6.51-5.08-.42-.65-.77-1.35-1.06-2.09h42.8c0-6.84-1.25-12.79-3.75-17.85ZM331.09,88.93c1.87-1.14,4.13-1.71,6.79-1.71,2.41,0,4.48.48,6.22,1.42,1.74.95,3.13,2.33,4.18,4.13.54.94.98,2,1.33,3.18h-23.62c.22-.79.49-1.56.84-2.28.98-2.02,2.41-3.61,4.27-4.75Z"/>
    <rect fill="#005e04" x="376.91" y="57.5" width="21.75" height="73.12"/>
    <path fill="#005e04" d="M446.51,55.88c-6.4,0-11.81.97-16.24,2.9-4.43,1.93-7.79,4.78-10.07,8.55-2.24,3.7-3.37,8.25-3.41,13.63h-10.93v15.95h10.92v33.71h21.75v-33.71h21.27v-15.95h-21.27v-.66c0-2.85.73-4.95,2.18-6.31,1.46-1.36,4.24-2.04,8.36-2.04,2.22,0,4.31.16,6.27.47,1.96.32,3.93.76,5.89,1.33v-15.76c-2.6-.7-5.02-1.22-7.26-1.57-2.25-.35-4.73-.52-7.45-.52Z"/>
    <path fill="#e8a205" d="M493.48,90.4c1.9-.98,4.11-1.47,6.65-1.47,3.29,0,6.08.78,8.36,2.33,2.28,1.55,3.74,3.81,4.37,6.79h21.56c-.51-5.06-2.31-9.46-5.41-13.2-3.1-3.74-7.14-6.65-12.11-8.74-4.97-2.09-10.56-3.13-16.76-3.13-6.77,0-12.77,1.22-17.99,3.66-5.22,2.44-9.29,5.81-12.2,10.11-2.91,4.31-4.37,9.34-4.37,15.1s1.46,10.64,4.37,15c2.91,4.37,6.98,7.76,12.2,10.16,5.22,2.41,11.22,3.61,17.99,3.61,6.2,0,11.79-1.04,16.76-3.13,4.97-2.09,9.01-5.02,12.11-8.78,3.1-3.77,4.91-8.15,5.41-13.15h-21.56c-.63,2.72-2.09,4.92-4.37,6.6-2.28,1.68-5.06,2.52-8.36,2.52-2.53,0-4.75-.49-6.65-1.47-1.9-.98-3.36-2.42-4.37-4.32-1.01-1.9-1.52-4.24-1.52-7.03s.51-5.14,1.52-7.07c1.01-1.93,2.47-3.39,4.37-4.37Z"/>
    <path fill="#e8a205" d="M589.96,74.59l-1.32,10.04c-2.39-3.43-5.29-6.15-8.7-8.14-4.02-2.34-8.63-3.51-13.82-3.51s-9.91,1.19-13.96,3.56c-4.05,2.37-7.2,5.73-9.45,10.07-2.25,4.34-3.37,9.42-3.37,15.24s1.12,10.72,3.37,15.05c2.25,4.34,5.4,7.71,9.45,10.11,4.05,2.41,8.7,3.61,13.96,3.61s9.8-1.19,13.82-3.56c3.42-2.02,6.31-4.76,8.68-8.2l1.34,10.15h22.6l-3.61-27.25,3.61-27.16h-22.6ZM585.4,108.21c-1.65,1.84-3.55,3.29-5.7,4.37-2.15,1.08-4.4,1.61-6.74,1.61s-4.31-.54-6.08-1.61c-1.77-1.08-3.15-2.53-4.13-4.37-.98-1.84-1.47-3.96-1.47-6.36s.49-4.54,1.47-6.41c.98-1.87,2.36-3.34,4.13-4.42,1.77-1.08,3.8-1.61,6.08-1.61s4.59.54,6.74,1.61c2.15,1.08,4.05,2.55,5.7,4.42,1.65,1.87,2.85,4,3.61,6.41-.76,2.41-1.96,4.53-3.61,6.36Z"/>
    <path fill="#e8a205" d="M675.66,97.15c-3.77-1.36-8.94-2.23-15.53-2.61l-12.25-.86c-2.72-.19-4.57-.55-5.55-1.09-.98-.54-1.47-1.34-1.47-2.42,0-1.33.79-2.37,2.37-3.13,1.58-.76,3.96-1.14,7.12-1.14,2.6,0,4.75.27,6.46.81,1.71.54,3.07,1.27,4.08,2.18,1.01.92,1.68,1.98,1.99,3.18h22.03c-.44-3.8-2.14-7.14-5.08-10.02-2.94-2.88-6.85-5.11-11.73-6.7-4.88-1.58-10.45-2.37-16.71-2.37s-11.97.68-16.71,2.04c-4.75,1.36-8.45,3.43-11.11,6.22-2.66,2.79-3.99,6.27-3.99,10.45,0,3.17.85,5.9,2.56,8.21,1.71,2.31,4.53,4.16,8.45,5.55,3.93,1.39,9.21,2.31,15.86,2.75l9.21.66c3.36.25,5.75.65,7.17,1.19,1.42.54,2.14,1.41,2.14,2.61,0,1.39-.9,2.45-2.71,3.18-1.8.73-4.42,1.09-7.83,1.09-2.79,0-5.14-.25-7.07-.76-1.93-.51-3.5-1.23-4.7-2.18s-2.03-2.09-2.47-3.42h-22.03c.19,3.99,1.76,7.5,4.7,10.54,2.94,3.04,7.03,5.38,12.25,7.03,5.22,1.65,11.28,2.47,18.18,2.47s12.52-.73,17.43-2.18c4.91-1.46,8.7-3.66,11.4-6.6,2.69-2.94,4.04-6.6,4.04-10.97,0-3.23-.81-5.98-2.42-8.26-1.62-2.28-4.31-4.1-8.07-5.46Z"/>
    <path fill="#e8a205" d="M738.57,113.57c-2.03.41-4.34.62-6.93.62-4.18,0-6.98-.76-8.4-2.28-1.42-1.52-2.14-4.11-2.14-7.79v-13.58h22.03v-15.95h-22.03v-14.72h-12.35l-9.5,16.33-10.83,4.94v9.4h10.83v16.52c0,4.81,1,8.99,2.99,12.53,1.99,3.55,5,6.27,9.02,8.17,4.02,1.9,9.13,2.85,15.34,2.85,3.42,0,6.68-.27,9.78-.81,3.1-.54,5.67-1.12,7.69-1.76v-16.05c-1.65.63-3.48,1.16-5.51,1.57Z"/>
    <g>
      <rect fill="#005e04" x="124.76" y="82.89" width="12.5" height="12.52"/>
      <rect fill="#005e04" x="91.17" y="82.89" width="29.54" height="12.52"/>
      <rect fill="#005e04" x="91.17" y="99.43" width="29.54" height="12.52"/>
      <rect fill="#005e04" x="91.17" y="117.09" width="29.54" height="12.52"/>
      <rect fill="#005e04" x="57.73" y="99.43" width="29.54" height="12.52"/>
      <rect fill="#005e04" x="40.68" y="82.89" width="46.39" height="12.52"/>
      <rect fill="#005e04" x="124.76" y="99.43" width="12.5" height="12.52"/>
      <rect fill="#005e04" x="124.76" y="117.09" width="12.5" height="12.52"/>
      <rect fill="#005e04" x="74.78" y="117.09" width="12.5" height="12.52"/>
    </g>
    <g>
      <rect fill="#e8a205" x="764.96" y="82.89" width="12.5" height="12.52" transform="translate(1542.41 178.31) rotate(-180)"/>
      <rect fill="#e8a205" x="781.5" y="82.89" width="29.54" height="12.52" transform="translate(1592.55 178.31) rotate(-180)"/>
      <rect fill="#e8a205" x="781.5" y="99.43" width="29.54" height="12.52" transform="translate(1592.55 211.39) rotate(-180)"/>
      <rect fill="#e8a205" x="781.5" y="117.09" width="29.54" height="12.52" transform="translate(1592.55 246.71) rotate(-180)"/>
      <rect fill="#e8a205" x="814.94" y="99.43" width="29.54" height="12.52" transform="translate(1659.43 211.39) rotate(-180)"/>
      <rect fill="#e8a205" x="815.15" y="82.89" width="46.39" height="12.52" transform="translate(1676.69 178.31) rotate(-180)"/>
      <rect fill="#e8a205" x="764.96" y="99.43" width="12.5" height="12.52" transform="translate(1542.41 211.39) rotate(-180)"/>
      <rect fill="#e8a205" x="764.96" y="117.09" width="12.5" height="12.52" transform="translate(1542.41 246.71) rotate(-180)"/>
      <rect fill="#e8a205" x="814.94" y="117.09" width="12.5" height="12.52" transform="translate(1642.38 246.71) rotate(-180)"/>
    </g>
  </svg>
);

type AssetCardProps = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
  group: string;
  uploadedFiles: Record<string, string>;
  uploadStatuses: Record<string, UploadStatus>;
  assetDocuments: AssetDocumentLookup;
  isManagementUnlocked: boolean;
  onUpload: (id: string, file: File) => void;
  onOpenViewer: (id: string) => void;
  onOpenKeyModal: () => void;
};

const AssetCard = ({
  id, title, description, badge, highlighted = false, uploadedFiles,
  uploadStatuses, assetDocuments, isManagementUnlocked,
  onUpload, onOpenViewer, onOpenKeyModal,
}: AssetCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileName = uploadedFiles[id];
  const isUploading = uploadStatuses[id] === 'uploading';
  const hasError = uploadStatuses[id] === 'error';
  const defaults = ZONE_DEFAULTS[id];

  const handleZoneClick = () => {
    if (assetDocuments[id]) { onOpenViewer(id); return; }
    if (!isManagementUnlocked) { onOpenKeyModal(); return; }
    fileInputRef.current?.click();
  };

  return (
    <div className={`trust-asset-card${highlighted ? ' highlighted' : ''}`}>
      <div className="trust-asset-card-header">
        <div className="trust-asset-card-header-row">
          <div className="trust-asset-card-title">{title}</div>
          {badge && <span className="trust-asset-badge">{badge}</span>}
        </div>
        <div className="trust-asset-card-desc">{description}</div>
      </div>
      <div className="trust-asset-card-body">
        <div
          className={`trust-upload-zone${fileName ? ' uploaded' : ''}${highlighted && !fileName ? ' highlighted-zone' : ''}${isUploading ? ' uploading' : ''}`}
          onClick={handleZoneClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(id, f); }}
          />
          {isUploading ? (
            <div className="uz-spinner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trust-animate-pulse">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Uploading...
            </div>
          ) : fileName ? (
            <div className="uz-uploaded-row">
              <div className="uz-uploaded-info">
                <IconLockSm />
                <div style={{ minWidth: 0 }}>
                  <div className="uz-uploaded-name">{title}</div>
                  <div className="uz-uploaded-file">{fileName}</div>
                </div>
              </div>
              <span className="uz-view">View PDF</span>
            </div>
          ) : (
            <>
              <div className="uz-icon">
                <IconUpload stroke={highlighted ? '#035C04' : 'currentColor'} />
              </div>
              <span className="uz-label">{defaults.label}</span>
              <span className="uz-desc">{defaults.desc}</span>
              {hasError && <span className="uz-error">Upload failed. Try again.</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const TrustPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
  const [documents, setDocuments] = useState<TrustDocument[]>([]);
  const [isAccessUnlocked, setIsAccessUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [replaceCode, setReplaceCode] = useState('');
  const [replaceCodeError, setReplaceCodeError] = useState('');
  const [isManagementUnlocked, setIsManagementUnlocked] = useState(false);

  const trustViewPassword = process.env.NEXT_PUBLIC_TRUST_VIEW_PASSWORD;
  const trustReplacePassword = process.env.NEXT_PUBLIC_TRUST_REPLACE_PASSWORD;

  const assetDocuments = documents.reduce<AssetDocumentLookup>((acc, doc) => {
    if (!acc[doc.assetId]) acc[doc.assetId] = doc;
    return acc;
  }, {});

  const uploadedCount = Object.keys(assetDocuments).length;

  const groupDone = {
    governance: GROUP_ASSETS.governance.every(id => !!uploadedFiles[id]),
    ethics: GROUP_ASSETS.ethics.every(id => !!uploadedFiles[id]),
    public: GROUP_ASSETS.public.every(id => !!uploadedFiles[id]),
  };

  useEffect(() => {
    const docsQuery = query(collection(db, 'trust_documents'), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(docsQuery, (snapshot) => {
      const nextDocs = snapshot.docs.map((docItem) => {
        const data = docItem.data() as Omit<TrustDocument, 'id'>;
        return { id: docItem.id, assetId: data.assetId, fileName: data.fileName, url: data.url };
      });
      setDocuments(nextDocs);
      setUploadedFiles(() => {
        const latest: Record<string, string> = {};
        nextDocs.forEach((doc) => { if (!latest[doc.assetId]) latest[doc.assetId] = doc.fileName; });
        return latest;
      });
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (id: string, file: File) => {
    setUploadStatuses((prev) => ({ ...prev, [id]: 'uploading' }));
    try {
      const fileRef = ref(storage, `trust-documents/${id}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await addDoc(collection(db, 'trust_documents'), {
        assetId: id, fileName: file.name, url, uploadedAt: serverTimestamp(),
      });
      setUploadedFiles((prev) => ({ ...prev, [id]: file.name }));
      setUploadStatuses((prev) => ({ ...prev, [id]: 'idle' }));
    } catch (error) {
      console.error(`Failed to upload ${id}:`, error);
      setUploadStatuses((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const openViewer = (id: string) => {
    setActiveDocId(id);
    setAccessCode('');
    setAccessError('');
    setEmail('');
    setEmailError('');
    setRequestStatus('idle');
    setIsAccessUnlocked(false);
  };

  const closeViewer = () => { setActiveDocId(null); setIsAccessUnlocked(false); };

  const handleUnlock = () => {
    if (!trustViewPassword) { setAccessError('Trust view password is not configured.'); return; }
    if (accessCode.trim() !== trustViewPassword) { setAccessError('Invalid access code. Request access below.'); return; }
    setAccessError('');
    setIsAccessUnlocked(true);
  };

  const requestAccess = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setEmailError('Enter a valid email address.'); return; }
    setEmailError('');
    setRequestStatus('submitting');
    try {
      await addDoc(collection(db, 'trust_access_requests'), {
        email: normalizedEmail, requestedAt: serverTimestamp(), status: 'pending',
      });
      setRequestStatus('submitted');
      setEmail('');
    } catch {
      setRequestStatus('error');
    }
  };

  const openKeyModal = () => { setIsKeyModalOpen(true); setReplaceCode(''); setReplaceCodeError(''); };
  const closeKeyModal = () => setIsKeyModalOpen(false);

  const submitManagementCode = () => {
    if (!trustReplacePassword) { setReplaceCodeError('Management password is not configured.'); return; }
    if (replaceCode.trim() !== trustReplacePassword) { setReplaceCodeError('Invalid code.'); return; }
    setIsManagementUnlocked(true);
    setIsKeyModalOpen(false);
  };

  const activeDoc = activeDocId ? assetDocuments[activeDocId] : null;

  const sharedCardProps = {
    uploadedFiles, uploadStatuses, assetDocuments,
    isManagementUnlocked, onUpload: handleUpload,
    onOpenViewer: openViewer, onOpenKeyModal: openKeyModal,
  };

  return (
    <div className="trust-root">
      <style>{trustStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* TOPBAR */}
      <header className="trust-topbar">
        <div className="trust-topbar-inner">
          <Logo />
          <div className="trust-topbar-actions">
            <button
              className={`trust-btn-icon${isManagementUnlocked ? ' active' : ''}`}
              title="Enter management code"
              onClick={openKeyModal}
            >
              <IconKey />
            </button>
            <div className="trust-badge-pill">
              <IconCheck stroke="#035C04" />
              Ghana AI Strategy Aligned
            </div>
            <button className="trust-btn-outline" onClick={() => window.print()}>
              <IconPrinter />
              <span className="trust-label">Export Pack</span>
            </button>
          </div>
        </div>
      </header>

      <main className="trust-main">

        {/* HERO CARD */}
        <div className="trust-card">
          <div className="trust-card-header">
            <div className="trust-card-header-row">
              <div className="trust-icon-box primary"><IconShield /></div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Our Commitment to Accountability</h1>
                <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300, lineHeight: 1.6, maxWidth: 600 }}>
                  This public trust pack provides transparency into our governance, data ethics, and algorithmic
                  accountability standards — aligned with the Ghana National AI Strategy.
                </p>
              </div>
              <div className="trust-doc-counter">
                <span className="num">{uploadedCount}</span>
                <span>/ 8 docs uploaded</span>
              </div>
            </div>
          </div>
          <div className="trust-pillars">
            {[
              { icon: <IconGlobe />, label: 'Data Sovereignty', value: 'Ghana-Based Hosting & Control' },
              { icon: <IconEye />, label: 'Transparency', value: 'Human-in-the-Loop Safeguards' },
              { icon: <IconUsers />, label: 'Inclusivity', value: 'Localised Context-Aware Logic' },
            ].map((p) => (
              <div key={p.label} className="trust-pillar">
                <div className="trust-icon-box sm secondary">{p.icon}</div>
                <div>
                  <div className="trust-pillar-label">{p.label}</div>
                  <div className="trust-pillar-value">{p.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS STRIP */}
        <div className="trust-status-strip">
          {[
            { key: 'governance', label: 'Governance', done: groupDone.governance },
            { key: 'ethics', label: 'Ethics & Privacy', done: groupDone.ethics },
            { key: 'public', label: 'Public Accountability', done: groupDone.public },
          ].map((s) => (
            <div key={s.key} className={`trust-status-pill${s.done ? ' done' : ''}`}>
              {s.done ? <IconCheck stroke="#035C04" /> : <IconAlert />}
              <span className="s-label">{s.label}</span>
              <span className="s-state">{s.done ? 'Complete' : 'Pending'}</span>
            </div>
          ))}
        </div>

        {/* SECTION 2 — GOVERNANCE */}
        <section>
          <div className="trust-section-header">
            <div className="trust-section-num">2</div>
            <div className="trust-section-title"><IconScale />Governance Foundations &amp; Risk Management</div>
          </div>
          <div className="trust-grid-3">
            <AssetCard id="governance-statement" title="AI Governance Statement" description="High-level public commitment to ethical AI usage." group="governance" {...sharedCardProps} />
            <AssetCard id="ai-inventory" title="AI Inventory List" description="Summary of internal AI models and systems in use." group="governance" {...sharedCardProps} />
            <AssetCard id="risk-escalation" title="Risk Escalation Map" description="Process for reporting and mitigating algorithmic risks." group="governance" {...sharedCardProps} />
          </div>
        </section>

        {/* SECTION 3 — ETHICS */}
        <section>
          <div className="trust-section-header">
            <div className="trust-section-num">3</div>
            <div className="trust-section-title"><IconLock />Applied Ethics &amp; Data Privacy</div>
          </div>
          <div className="trust-grid-3">
            <AssetCard id="data-ethics" title="Data Ethics Checklist" description="Internal verification for ethical data sourcing and handling." group="ethics" {...sharedCardProps} />
            <AssetCard id="acceptable-use" title="Acceptable Use Policy" description="Rules for user interaction with AI features." group="ethics" {...sharedCardProps} />
            <AssetCard id="code-ethics" title="Code of Ethics" description="Company-wide standards for responsible AI development." group="ethics" {...sharedCardProps} />
          </div>
        </section>

        {/* SECTION 4 — PUBLIC TRUST */}
        <section>
          <div className="trust-section-header">
            <div className="trust-section-num">4</div>
            <div className="trust-section-title"><IconFileText />Public Trust &amp; Accountability</div>
          </div>
          <div className="trust-grid-2">
            <AssetCard id="accountability-guideline" title="Algorithmic Accountability Guideline" description="Public declaration of logic, API dependencies, and data sovereignty — covering third-party hosting and data flows." badge="Procurement Ready" highlighted group="public" {...sharedCardProps} />
            <AssetCard id="customer-disclosure" title="Customer Disclosure Statement" description="Onboarding copy explaining AI interaction and human fallbacks — must include bias control statements." badge="B2C / User Facing" highlighted group="public" {...sharedCardProps} />
          </div>
        </section>

        {/* INFO BOX */}
        <div className="trust-info-box">
          <IconSparkles />
          <p>
            All documentation submitted here is stored in secure cloud storage and used solely for compliance readiness review. ShelfCast
            aligns with Pillars 4 (Data Sovereignty) and 6 (Ethical Governance) of the Ghana National AI Strategy and the ARISE Framework.
          </p>
        </div>

        {/* FOOTER */}
        <div className="trust-footer-strip">
          {['Pillar 4: Data Sovereignty', 'Pillar 6: Ethical Governance', 'ARISE Framework'].map((tag) => (
            <span key={tag} className="trust-footer-tag">{tag}</span>
          ))}
          <span className="trust-footer-brand">Public AI Trust Pack — ShelfCast Intelligence</span>
        </div>

      </main>

      {/* KEY MODAL */}
      {isKeyModalOpen && (
        <div className="trust-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeKeyModal(); }}>
          <div className="trust-modal-box trust-modal-sm">
            <div className="trust-modal-header" style={{ display: 'block' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Enter management access code</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontWeight: 300 }}>Use the management code to unlock privileged actions.</p>
            </div>
            <div className="trust-modal-body">
              <div className="trust-input-row-icon">
                <IconKeyModal />
                <input
                  type="password"
                  value={replaceCode}
                  onChange={(e) => setReplaceCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitManagementCode(); }}
                  placeholder="Management access code"
                />
              </div>
              {replaceCodeError && <p className="trust-msg-error">{replaceCodeError}</p>}
            </div>
            <div className="trust-modal-footer">
              <button className="trust-btn-sm" onClick={closeKeyModal}>Cancel</button>
              <button className="trust-btn-sm" onClick={submitManagementCode}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWER MODAL */}
      {activeDocId && (
        <div className="trust-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeViewer(); }}>
          <div className={`trust-modal-box${isAccessUnlocked ? ' trust-modal-lg' : ' trust-modal-sm'}`}>
            <div className="trust-modal-header">
              <div className="trust-modal-header-info">
                <p>{activeDoc?.fileName ?? ''}</p>
                <p>View-only mode: print and download shortcuts are blocked in this viewer.</p>
              </div>
              <button className="trust-btn-sm" onClick={closeViewer}>Close</button>
            </div>

            {!isAccessUnlocked ? (
              <div className="trust-modal-body">
                <div className="trust-modal-inner-card">
                  <p>Enter access code to view this PDF</p>
                  <div className="trust-input-row">
                    <input
                      type="password"
                      className="trust-input-field"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                      placeholder="Access code"
                    />
                    <button className="trust-btn-sm" onClick={handleUnlock}>Unlock</button>
                  </div>
                  {accessError && <p className="trust-msg-error">{accessError}</p>}
                </div>
                <div className="trust-modal-inner-card light">
                  <p>No code? Request access</p>
                  <div className="trust-input-row">
                    <input
                      type="email"
                      className="trust-input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') requestAccess(); }}
                      placeholder="you@company.com"
                    />
                    <button className="trust-btn-sm" onClick={requestAccess} disabled={requestStatus === 'submitting'}>
                      {requestStatus === 'submitting' ? 'Submitting...' : 'Request'}
                    </button>
                  </div>
                  {emailError && <p className="trust-msg-error">{emailError}</p>}
                  {requestStatus === 'submitted' && <p className="trust-msg-success">Access request submitted.</p>}
                  {requestStatus === 'error' && <p className="trust-msg-error">Could not submit request. Try again.</p>}
                </div>
              </div>
            ) : (
              <iframe
                title={activeDoc?.fileName ?? 'Document viewer'}
                src={`${activeDoc?.url}#toolbar=0&navpanes=0&scrollbar=1`}
                style={{ width: '100%', flex: 1, border: 'none', display: 'block' }}
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && ['p', 's'].includes(e.key.toLowerCase())) e.preventDefault();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustPage;
