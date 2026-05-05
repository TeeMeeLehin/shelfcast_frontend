// ─── Demo / Live toggle ───────────────────────────────────────────────────────
// Set DEMO_MODE = false (and ensure NEXT_PUBLIC_API_BASE is set in .env.local)
// to switch the entire app to the real backend.
export const DEMO_MODE = false;

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
