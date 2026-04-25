import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect, useCallback, useRef } from "react";
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const formatCurrency = (n) => "₹" + Number(n).toLocaleString("en-IN");
const formatDate = (iso) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const today = () => new Date().toISOString().slice(0, 10);

// ─── Storage helpers ─────────────────────────────────────────────────
const STORAGE_KEYS = { entries: "moibee_entries", settings: "moibee_settings", auth: "moibee_auth", theme: "moibee_theme" };
const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Default Settings ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  weddingName: "Wedding Celebration",
  brideName: "Bride",
  groomName: "Groom",
  familyName: "Family",
  headerNote: "With Blessings & Best Wishes",
  adminUser: "admin",
  adminPass: "moibee123",
  googleSheetWebhook: "", // Google Apps Script Web App URL
};

// ─── Theme tokens ────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0d1117",
    surface: "#111827",
    surface2: "#0d1117",
    border: "#1f2937",
    text: "#f9fafb",
    textMid: "#9ca3af",
    textMuted: "#6b7280",
    textDim: "#4b5563",
    accent: "#0F9DAD",
    inputBg: "#0d1117",
    hoverBg: "#0d111788",
    scrollbar: "#1f2937",
    modalBg: "rgba(0,0,0,0.75)",
    sidebarBg: "#111827",
    topbarBg: "#111827",
    colorScheme: "dark",
  },
  light: {
    bg: "#f0f4f8",
    surface: "#ffffff",
    surface2: "#f8fafc",
    border: "#e2e8f0",
    text: "#0f172a",
    textMid: "#475569",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    accent: "#0F9DAD",
    inputBg: "#f8fafc",
    hoverBg: "#f1f5f9",
    scrollbar: "#cbd5e1",
    modalBg: "rgba(0,0,0,0.5)",
    sidebarBg: "#ffffff",
    topbarBg: "#ffffff",
    colorScheme: "light",
  },
};

// ─── MoiBee Brand Logo (SVG from image) ─────────────────────────────
const MoiBeeLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* MB combined icon - slash + B shape inspired by brand */}
    {/* Left slash parallelogram */}
    <polygon points="18,72 30,18 42,18 30,72" fill="#0F9DAD" />
    {/* Middle slash parallelogram */}
    <polygon points="34,72 46,18 54,18 42,72" fill="#0F9DAD" />
    {/* B shape right side */}
    <path d="M52,18 L68,18 Q82,18 82,32 Q82,42 72,44 Q84,46 84,60 Q84,76 68,76 L52,76 Z
             M62,26 L62,40 L68,40 Q74,40 74,33 Q74,26 68,26 Z
             M62,48 L62,68 L68,68 Q76,68 76,58 Q76,48 68,48 Z"
      fill="#0F9DAD" />
    {/* Black divider lines on B */}
    <line x1="52" y1="42" x2="75" y2="42" stroke="#0d1117" strokeWidth="3" />
    <line x1="52" y1="50" x2="76" y2="50" stroke="#0d1117" strokeWidth="3" />
  </svg>
);

// ─── Icons (inline SVG) ──────────────────────────────────────────────
const Icon = ({ name, size = 18, className = "" }) => {
  const icons = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    add: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />,
    records: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    delete: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    print: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />,
    trophy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    money: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    export: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    eye: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    sun: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />,
    moon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
    sheets: <><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6M9 11h6M9 15h4"/></>,
    link: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
      {icons[name]}
    </svg>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === "error" ? "#ef4444" : t.type === "warning" ? "#f59e0b" : "#0F9DAD",
        color: "#fff", padding: "12px 20px", borderRadius: 12, fontFamily: "inherit",
        fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideIn 0.3s ease", display: "flex", alignItems: "center", gap: 10, minWidth: 240
      }}>
        <Icon name="check" size={16} />
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── MODAL ───────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, wide = false, th }) => {
  const t = th || THEMES.dark;
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: t.modalBg, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
        width: "100%", maxWidth: wide ? 760 : 520, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ color: t.text, fontWeight: 700, fontSize: 18 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMid, cursor: "pointer", padding: 4 }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── INPUT COMPONENT ─────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, style = {}, th }) => {
  const t = th || THEMES.dark;
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: "#0F9DAD", marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{
          width: "100%", background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "11px 14px",
          color: t.text, fontSize: 15, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
          fontFamily: "inherit"
        }}
        onFocus={e => e.target.style.borderColor = "#0F9DAD"}
        onBlur={e => e.target.style.borderColor = t.border}
      />
    </div>
  );
};

const Select = ({ label, value, onChange, options, required = false, th }) => {
  const t = th || THEMES.dark;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: "#0F9DAD", marginLeft: 3 }}>*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "11px 14px",
          color: t.text, fontSize: 15, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
          fontFamily: "inherit", cursor: "pointer"
        }}
        onFocus={e => e.target.style.borderColor = "#0F9DAD"}
        onBlur={e => e.target.style.borderColor = t.border}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent = "#0F9DAD", sub, th }) => {
  const t = th || THEMES.dark;
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${accent}22`, borderRadius: 16, padding: "22px 24px",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${accent}12` }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ background: `${accent}18`, borderRadius: 10, padding: 10, color: accent }}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: t.text, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: accent, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
};

// ─── THEME TOGGLE BUTTON ─────────────────────────────────────────────
const ThemeToggle = ({ theme, toggleTheme, t }) => (
  <button
    onClick={toggleTheme}
    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    style={{
      display: "flex", alignItems: "center", gap: 7,
      background: theme === "dark" ? "#1f2937" : "#e2e8f0",
      border: `1px solid ${theme === "dark" ? "#374151" : "#cbd5e1"}`,
      borderRadius: 20, padding: "6px 14px",
      color: theme === "dark" ? "#f9fafb" : "#0f172a",
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.25s ease"
    }}
  >
    <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
    {theme === "dark" ? "Light" : "Dark"}
  </button>
);

// ─── GOOGLE SHEETS PUSH ──────────────────────────────────────────────
async function pushToGoogleSheet(webhookUrl, entry, settings) {
  if (!webhookUrl) return { ok: false, reason: "no_url" };
  try {
    const payload = {
      name: entry.name,
      mobile: entry.mobile || "",
      place: entry.place || "",
      amount: Number(entry.amount),
      mode: entry.mode,
      notes: entry.notes || "",
      date: entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : "",
      weddingName: settings.weddingName,
      id: entry.id,
    };
    // Use no-cors since Google Apps Script requires it from browser
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────
const LoginPage = ({ onLogin, theme, toggleTheme }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const settings = load(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const t = THEMES[theme];

  const handleSubmit = () => {
    if (user === settings.adminUser && pass === settings.adminPass) {
      save(STORAGE_KEYS.auth, { loggedIn: true, ts: Date.now() });
      onLogin();
    } else {
      setErr("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Sora', 'Segoe UI', sans-serif", padding: 16, transition: "background 0.3s"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Theme toggle top right */}
      <div style={{ position: "fixed", top: 20, right: 20 }}>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} t={t} />
      </div>

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <MoiBeeLogo size={56} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
                <span style={{ color: "#0F9DAD" }}>moi</span>
                <span style={{ color: t.text }}>BEE</span>
              </div>
              <div style={{ fontSize: 11, color: "#0F9DAD", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>Track Every Blessing</div>
              <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>Powered by AllBee Solutions</div>
            </div>
          </div>
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: 36, boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>
          <h2 style={{ color: t.text, fontSize: 22, fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Welcome back</h2>
          <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 28, marginTop: 0 }}>Sign in to manage {settings.weddingName}</p>

          <Input label="Username" value={user} onChange={setUser} placeholder="admin" required th={t} />
          <Input label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••" required th={t} />

          {err && <div style={{ background: "#7f1d1d20", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>{err}</div>}

          <button onClick={handleSubmit} style={{
            width: "100%", background: "linear-gradient(135deg, #0F9DAD, #0a7a87)", border: "none", borderRadius: 12,
            padding: "14px 0", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "transform 0.1s, box-shadow 0.2s",
            boxShadow: "0 4px 20px rgba(15,157,173,0.4)"
          }}
            onMouseDown={e => e.target.style.transform = "scale(0.98)"}
            onMouseUp={e => e.target.style.transform = "scale(1)"}
          >Sign In →</button>


        </div>

        <div style={{ textAlign: "center", marginTop: 24, color: t.textDim, fontSize: 12 }}>
          🐝 Powered by AllBee Solutions
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────
export default function MoiBee() {
  const [loggedIn, setLoggedIn] = useState(() => {
    const a = load(STORAGE_KEYS.auth, null);
    return a?.loggedIn === true;
  });
  const [page, setPage] = useState("dashboard");
  const [entries, setEntries] = useState(() => load(STORAGE_KEYS.entries, []));
  const [settings, setSettings] = useState(() => load(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [receiptEntry, setReceiptEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [theme, setTheme] = useState(() => load(STORAGE_KEYS.theme, "dark"));

  const t = THEMES[theme];

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    save(STORAGE_KEYS.theme, next);
  };

  useEffect(() => { save(STORAGE_KEYS.entries, entries); }, [entries]);
  useEffect(() => { save(STORAGE_KEYS.settings, settings); }, [settings]);

  const addToast = useCallback((msg, type = "success") => {
    const id = generateId();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const logout = () => {
    save(STORAGE_KEYS.auth, { loggedIn: false });
    setLoggedIn(false);
  };

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} theme={theme} toggleTheme={toggleTheme} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "add", label: "Add Entry", icon: "add" },
    { id: "records", label: "Records", icon: "records" },
    { id: "export", label: "Export", icon: "export" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Sora', 'Segoe UI', sans-serif", color: t.text, display: "flex", transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: ${t.textDim} !important; }
        select option { background: ${t.surface}; color: ${t.text}; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="no-print" style={{
        width: 240, background: t.sidebarBg, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", padding: "20px 0",
        position: "fixed", top: 0, left: sidebarOpen ? 0 : -240, height: "100vh", zIndex: 200,
        transition: "left 0.3s ease, background 0.3s",
        ...(typeof window !== "undefined" && window.innerWidth >= 768 ? { left: 0 } : {})
      }}>
        {/* Brand Logo */}
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${t.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MoiBeeLogo size={38} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                <span style={{ color: "#0F9DAD" }}>moi</span>
                <span style={{ color: t.text }}>BEE</span>
              </div>
              <div style={{ fontSize: 9, color: "#0F9DAD", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>TRACK EVERY BLESSING</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: page === item.id ? "linear-gradient(135deg, #0F9DAD18, #0F9DAD08)" : "transparent",
                color: page === item.id ? "#0F9DAD" : t.textMuted,
                fontSize: 14, fontWeight: page === item.id ? 600 : 500, fontFamily: "inherit",
                marginBottom: 4, transition: "all 0.15s", textAlign: "left",
                borderLeft: page === item.id ? "3px solid #0F9DAD" : `3px solid transparent`
              }}>
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ padding: "0 14px 12px", fontSize: 12, color: t.textDim }}>
            <div style={{ fontWeight: 600, color: t.textMuted }}>{settings.weddingName}</div>
            <div style={{ marginTop: 2 }}>{settings.brideName} & {settings.groomName}</div>
          </div>
          <button onClick={logout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 10, border: "none", background: "transparent", color: t.textMuted,
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
          }}>
            <Icon name="logout" size={16} /> Sign Out
          </button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: t.textDim }}>
            🐝 Powered by AllBee Solutions
          </div>
        </div>
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 199 }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 240, minHeight: "100vh", display: "flex", flexDirection: "column" }} className="main-content">
        <style>{`@media (max-width: 768px) { .main-content { margin-left: 0 !important; } }`}</style>

        {/* Top Bar */}
        <div className="no-print" style={{
          background: t.topbarBg, borderBottom: `1px solid ${t.border}`, padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
          transition: "background 0.3s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: t.textMid, cursor: "pointer", padding: 4, display: "none" }}>
              <Icon name="menu" size={22} />
            </button>
            <style>{`@media (max-width: 768px) { .mobile-menu-btn { display: block !important; } }`}</style>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>
                {navItems.find(n => n.id === page)?.label}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#0F9DAD18", border: "1px solid #0F9DAD33", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#0F9DAD", fontWeight: 600 }}>
              {entries.length} Entries
            </div>
            {/* Theme toggle in topbar */}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} t={t} />
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "28px 24px", maxWidth: 1200, width: "100%" }}>
          {page === "dashboard" && <DashboardPage entries={entries} settings={settings} t={t} />}
          {page === "add" && <AddEntryPage entries={entries} setEntries={setEntries} addToast={addToast} editEntry={editEntry} setEditEntry={setEditEntry} setPage={setPage} settings={settings} t={t} />}
          {page === "records" && <RecordsPage entries={entries} setEntries={setEntries} addToast={addToast} setEditEntry={setEditEntry} setPage={setPage} setReceiptEntry={setReceiptEntry} setDeleteConfirm={setDeleteConfirm} settings={settings} t={t} />}
          {page === "export" && <ExportPage entries={entries} settings={settings} addToast={addToast} t={t} />}
          {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} addToast={addToast} t={t} />}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptEntry && (
        <ReceiptModal entry={receiptEntry} settings={settings} onClose={() => setReceiptEntry(null)} t={t} />
      )}

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" th={t}>
        <p style={{ color: t.textMid, marginTop: 0 }}>Are you sure you want to delete the entry for <strong style={{ color: t.text }}>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.textMid, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>Cancel</button>
          <button onClick={() => {
            setEntries(prev => prev.filter(e => e.id !== deleteConfirm.id));
            addToast("Entry deleted successfully", "error");
            setDeleteConfirm(null);
          }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>Delete</button>
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────
function DashboardPage({ entries, settings, t }) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const todayEntries = entries.filter(e => e.date?.slice(0, 10) === today());
  const todayTotal = todayEntries.reduce((s, e) => s + Number(e.amount), 0);
  const highest = entries.length ? Math.max(...entries.map(e => Number(e.amount))) : 0;
  const highestEntry = entries.find(e => Number(e.amount) === highest);

  const byMode = { Cash: 0, UPI: 0, Bank: 0 };
  entries.forEach(e => { if (byMode[e.mode] !== undefined) byMode[e.mode] += Number(e.amount); });

  const recent = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Wedding banner */}
      <div style={{
        background: `linear-gradient(135deg, #0F9DAD22 0%, #0a7a8714 50%, ${t.surface} 100%)`,
        border: "1px solid #0F9DAD33", borderRadius: 20, padding: "28px 32px", marginBottom: 28,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 180, height: 180, borderRadius: "50%", background: "#0F9DAD08" }} />
        <div style={{ fontSize: 13, color: "#0F9DAD", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>💐 Live Event</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: t.text, fontFamily: "'DM Serif Display', Georgia, serif" }}>{settings.weddingName}</div>
        <div style={{ fontSize: 15, color: t.textMid, marginTop: 6 }}>{settings.brideName} ♥ {settings.groomName} · {settings.familyName}</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="money" label="Total Collection" value={formatCurrency(total)} accent="#0F9DAD" sub={`${entries.length} contributions`} th={t} />
        <StatCard icon="users" label="Total Guests" value={entries.length} accent="#6366f1" sub="registered" th={t} />
        <StatCard icon="calendar" label="Today's Collection" value={formatCurrency(todayTotal)} accent="#10b981" sub={`${todayEntries.length} entries today`} th={t} />
        <StatCard icon="trophy" label="Highest Gift" value={formatCurrency(highest)} accent="#f59e0b" sub={highestEntry?.name || "—"} th={t} />
      </div>

      {/* Payment mode breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.textMuted, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment Breakdown</div>
          {Object.entries(byMode).map(([mode, amt]) => {
            const pct = total > 0 ? (amt / total) * 100 : 0;
            const colors = { Cash: "#10b981", UPI: "#6366f1", Bank: "#f59e0b" };
            return (
              <div key={mode} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>{mode}</span>
                  <span style={{ fontSize: 14, color: colors[mode], fontWeight: 700 }}>{formatCurrency(amt)}</span>
                </div>
                <div style={{ height: 6, background: t.border, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[mode], borderRadius: 3, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent entries */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.textMuted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Entries</div>
          {recent.length === 0 && <div style={{ color: t.textDim, fontSize: 14 }}>No entries yet</div>}
          {recent.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.surface2}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{e.name}</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{e.place} · {e.mode}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F9DAD" }}>{formatCurrency(e.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADD ENTRY ────────────────────────────────────────────────────────
function AddEntryPage({ entries, setEntries, addToast, editEntry, setEditEntry, setPage, settings, t }) {
  const blank = { name: "", mobile: "", place: "", amount: "", mode: "Cash", notes: "" };
  const [form, setForm] = useState(() => editEntry ? { ...editEntry } : blank);
  const [saving, setSaving] = useState(false);
  const [sheetStatus, setSheetStatus] = useState(null); // "syncing" | "ok" | "fail"

  useEffect(() => {
    if (editEntry) setForm({ ...editEntry });
    else setForm(blank);
  }, [editEntry]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.amount) { addToast("Name and Amount are required", "warning"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));

    if (editEntry) {
      setEntries(prev => prev.map(e => e.id === editEntry.id ? { ...form, id: editEntry.id } : e));
      addToast(`Updated entry for ${form.name}`);
      setEditEntry(null);
      setPage("records");
    } else {
      const newEntry = { ...form, id: generateId(), createdAt: new Date().toISOString(), date: new Date().toISOString() };
      setEntries(prev => [...prev, newEntry]);
      addToast(`₹${Number(form.amount).toLocaleString("en-IN")} entry saved for ${form.name} 🎉`);

      // Push to Google Sheets if webhook is configured
      if (settings.googleSheetWebhook?.trim()) {
        setSheetStatus("syncing");
        const result = await pushToGoogleSheet(settings.googleSheetWebhook.trim(), newEntry, settings);
        if (result.ok || result.reason === undefined) {
          setSheetStatus("ok");
          addToast("📊 Synced to Google Sheet!", "success");
        } else if (result.reason === "no_url") {
          setSheetStatus(null);
        } else {
          setSheetStatus("fail");
          addToast("⚠️ Sheet sync failed: " + result.reason, "warning");
        }
        setTimeout(() => setSheetStatus(null), 4000);
      }

      setForm(blank);
    }
    setSaving(false);
  };

  const quickAmounts = [101, 501, 1001, 2001, 5001, 10001];

  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 640 }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: 32 }}>
        <div style={{ fontSize: 13, color: "#0F9DAD", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          {editEntry ? "✏️ Edit Entry" : "🎁 New Contribution"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 28 }}>
          {editEntry ? "Update Gift Entry" : "Record a Gift"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1 / -1" }}><Input label="Guest Name" value={form.name} onChange={v => set("name", v)} placeholder="Enter full name" required th={t} /></div>
          <Input label="Mobile Number" value={form.mobile} onChange={v => set("mobile", v)} placeholder="9876543210" type="tel" th={t} />
          <Input label="Place / City" value={form.place} onChange={v => set("place", v)} placeholder="Chennai" th={t} />
        </div>

        {/* Quick amounts */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Amount</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickAmounts.map(a => (
              <button key={a} onClick={() => set("amount", a)}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${form.amount == a ? "#0F9DAD" : t.border}`,
                  background: form.amount == a ? "#0F9DAD18" : t.inputBg, color: form.amount == a ? "#0F9DAD" : t.textMuted,
                  cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s"
                }}>₹{a.toLocaleString("en-IN")}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Amount (₹)" value={form.amount} onChange={v => set("amount", v)} placeholder="Enter amount" type="number" required th={t} />
          <Select label="Payment Mode" value={form.mode} onChange={v => set("mode", v)} options={[
            { value: "Cash", label: "💵 Cash" },
            { value: "UPI", label: "📱 UPI" },
            { value: "Bank", label: "🏦 Bank Transfer" },
          ]} th={t} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes (Optional)</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..."
            rows={2} style={{
              width: "100%", background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "11px 14px",
              color: t.text, fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit"
            }} />
        </div>

        {/* Google Sheet Sync status indicator */}
        {settings.googleSheetWebhook?.trim() && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 14px", background: "#0F9DAD0a", border: "1px solid #0F9DAD22", borderRadius: 8, fontSize: 12, color: t.textMuted }}>
            <Icon name="sheets" size={14} />
            {sheetStatus === "syncing" && <span style={{ color: "#f59e0b" }}>⏳ Syncing to Google Sheets...</span>}
            {sheetStatus === "ok" && <span style={{ color: "#10b981" }}>✅ Synced to Google Sheets</span>}
            {sheetStatus === "fail" && <span style={{ color: "#ef4444" }}>❌ Sheet sync failed</span>}
            {!sheetStatus && <span>Google Sheets sync is active</span>}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          {editEntry && (
            <button onClick={() => { setEditEntry(null); setForm(blank); setPage("records"); }}
              style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${t.border}`, background: "transparent", color: t.textMid, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "inherit" }}>
              Cancel
            </button>
          )}
          <button onClick={handleSubmit} disabled={saving}
            style={{
              flex: 2, background: saving ? t.border : "linear-gradient(135deg, #0F9DAD, #0a7a87)", border: "none", borderRadius: 12,
              padding: "14px 0", color: saving ? t.textMuted : "#fff", fontSize: 16, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: saving ? "none" : "0 4px 20px rgba(15,157,173,0.35)", transition: "all 0.2s"
            }}>
            {saving ? "Saving..." : editEntry ? "Update Entry ✓" : "Save Entry →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS ──────────────────────────────────────────────────────────
function RecordsPage({ entries, setEntries, addToast, setEditEntry, setPage, setReceiptEntry, setDeleteConfirm, settings, t }) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  let filtered = entries.filter(e => {
    const q = search.toLowerCase();
    if (search && !e.name?.toLowerCase().includes(q) && !e.place?.toLowerCase().includes(q) && !e.mobile?.includes(q)) return false;
    if (filterMode !== "All" && e.mode !== filterMode) return false;
    if (filterDate && e.date?.slice(0, 10) !== filterDate) return false;
    return true;
  });

  if (sortBy === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortBy === "highest") filtered.sort((a, b) => Number(b.amount) - Number(a.amount));
  else if (sortBy === "lowest") filtered.sort((a, b) => Number(a.amount) - Number(b.amount));
  else if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const modeColors = { Cash: "#10b981", UPI: "#6366f1", Bank: "#f59e0b" };

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Filters */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, place, mobile..."
            style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 12px 9px 12px", color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        </div>
        {[
          <select key="mode" value={filterMode} onChange={e => setFilterMode(e.target.value)}
            style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 12px", color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            {["All", "Cash", "UPI", "Bank"].map(m => <option key={m}>{m}</option>)}
          </select>,
          <input key="date" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 12px", color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none", colorScheme: t.colorScheme }} />,
          <select key="sort" value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 12px", color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            {[["newest", "Newest First"], ["oldest", "Oldest First"], ["highest", "Highest Amount"], ["lowest", "Lowest Amount"], ["name", "Name A-Z"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ]}
        {(search || filterMode !== "All" || filterDate) && (
          <button onClick={() => { setSearch(""); setFilterMode("All"); setFilterDate(""); }}
            style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: 8, padding: "9px 14px", color: "#ef4444", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            Clear
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
        <div style={{ fontSize: 14, color: t.textMuted }}>{filtered.length} entries found</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F9DAD" }}>Total: {formatCurrency(filteredTotal)}</div>
      </div>

      {/* Table */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: t.surface2 }}>
                {["#", "Guest Name", "Place", "Mobile", "Amount", "Mode", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: t.textDim, fontSize: 15 }}>No entries found</td></tr>
              )}
              {filtered.map((e, i) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${t.surface2}`, transition: "background 0.1s" }}
                  onMouseEnter={el => el.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={el => el.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", color: t.textDim, fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: t.text, fontSize: 14 }}>{e.name}</td>
                  <td style={{ padding: "12px 16px", color: t.textMid, fontSize: 13 }}>{e.place || "—"}</td>
                  <td style={{ padding: "12px 16px", color: t.textMid, fontSize: 13 }}>{e.mobile || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F9DAD", fontSize: 14 }}>{formatCurrency(e.amount)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: `${modeColors[e.mode]}18`, color: modeColors[e.mode], borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>{e.mode}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: t.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{e.createdAt ? formatDate(e.createdAt) : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setReceiptEntry(e)} title="View Receipt"
                        style={{ background: "#0F9DAD18", border: "none", borderRadius: 7, padding: "6px 8px", color: "#0F9DAD", cursor: "pointer" }}><Icon name="eye" size={14} /></button>
                      <button onClick={() => { setEditEntry(e); setPage("add"); }} title="Edit"
                        style={{ background: "#6366f118", border: "none", borderRadius: 7, padding: "6px 8px", color: "#6366f1", cursor: "pointer" }}><Icon name="edit" size={14} /></button>
                      <button onClick={() => setDeleteConfirm(e)} title="Delete"
                        style={{ background: "#ef444418", border: "none", borderRadius: 7, padding: "6px 8px", color: "#ef4444", cursor: "pointer" }}><Icon name="delete" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── RECEIPT MODAL ────────────────────────────────────────────────────
function ReceiptModal({ entry, settings, onClose, t }) {
  const receiptRef = useRef();

  const handlePrint = () => {
    const printContent = `
      <div class="header">
        <div class="logo-text">moiBEE</div>
        <div class="tagline">TRACK EVERY BLESSING</div>
        <div class="wedding-name">${settings.weddingName}</div>
        <div class="couple">${settings.brideName} ♥ ${settings.groomName}</div>
        <div class="couple">${settings.familyName}</div>
        <div class="receipt-number">Receipt #${entry.id?.slice(-6).toUpperCase()}</div>
      </div>
      ${[["Guest Name", entry.name], ["Mobile", entry.mobile || "—"], ["Place", entry.place || "—"], ["Payment Mode", entry.mode], ["Date & Time", entry.createdAt ? formatDate(entry.createdAt) : "—"], ...(entry.notes ? [["Notes", entry.notes]] : [])].map(([l, v]) => `<div class="detail-row"><span class="detail-label">${l}</span><span class="detail-value">${v}</span></div>`).join("")}
      <div class="amount-section"><div class="amount-label">Gift Amount</div><div class="amount-value">${formatCurrency(entry.amount)}</div></div>
      <div class="note">${settings.headerNote}</div>
    `;
    const w = window.open("", "_blank", "width=400,height=600");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;background:#fff;color:#1a1a1a;max-width:380px}
      .logo-text{font-size:24px;font-weight:900;color:#0F9DAD}.tagline{font-size:10px;color:#999;letter-spacing:.2em;text-transform:uppercase}
      .wedding-name{font-size:18px;font-weight:700;margin-top:8px}.couple{font-size:13px;color:#555}.receipt-number{font-size:11px;color:#999;margin-top:6px}
      .header{text-align:center;padding-bottom:16px;border-bottom:1px dashed #ccc;margin-bottom:16px}
      .detail-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
      .detail-label{color:#666}.detail-value{font-weight:600;color:#1a1a1a}
      .amount-section{background:#f0fafa;border-radius:8px;padding:16px;text-align:center;margin:20px 0}
      .amount-label{font-size:12px;color:#666}.amount-value{font-size:32px;font-weight:900;color:#0F9DAD}
      .footer{text-align:center;margin-top:24px;font-size:11px;color:#999;border-top:1px dashed #ccc;padding-top:16px}
      .note{text-align:center;font-size:13px;color:#555;font-style:italic;margin:8px 0}
      </style></head><body>${printContent}
      <div class="footer">🐝 Powered by AllBee Solutions · MoiBee</div></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <Modal open={true} onClose={onClose} title="Receipt Preview" th={t}>
      <div ref={receiptRef}>
        <div style={{ border: "2px solid #0F9DAD33", borderRadius: 12, padding: 28, background: t.surface2 }}>
          <div style={{ textAlign: "center", marginBottom: 20, borderBottom: `1px dashed ${t.border}`, paddingBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <MoiBeeLogo size={36} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F9DAD" }}>moi<span style={{ color: t.text }}>BEE</span></div>
                <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.1em" }}>TRACK EVERY BLESSING</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.text, marginTop: 10 }}>{settings.weddingName}</div>
            <div style={{ fontSize: 13, color: t.textMid }}>{settings.brideName} ♥ {settings.groomName}</div>
            <div style={{ fontSize: 12, color: t.textMuted }}>{settings.familyName}</div>
            <div style={{ fontSize: 11, color: t.textDim, marginTop: 8 }}>Receipt #{entry.id?.slice(-6).toUpperCase()}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            {[["Guest Name", entry.name], ["Mobile", entry.mobile || "—"], ["Place", entry.place || "—"], ["Payment Mode", entry.mode], ["Date & Time", entry.createdAt ? formatDate(entry.createdAt) : "—"], ...(entry.notes ? [["Notes", entry.notes]] : [])].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: 14 }}>
                <span style={{ color: t.textMuted }}>{label}</span>
                <span style={{ fontWeight: 600, color: t.text }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#0F9DAD12", border: "1px solid #0F9DAD33", borderRadius: 10, padding: 20, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Gift Amount</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#0F9DAD" }}>{formatCurrency(entry.amount)}</div>
          </div>

          <div style={{ textAlign: "center", fontSize: 13, color: t.textMid, fontStyle: "italic" }}>{settings.headerNote}</div>
          <div style={{ textAlign: "center", marginTop: 20, borderTop: `1px dashed ${t.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: t.textDim }}>🐝 Powered by AllBee Solutions · MoiBee</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.textMid, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        <button onClick={handlePrint} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0F9DAD, #0a7a87)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="print" size={16} /> Print Receipt
        </button>
      </div>
    </Modal>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────
function ExportPage({ entries, settings, addToast, t }) {
  const exportCSV = () => {
    const headers = ["#", "Name", "Mobile", "Place", "Amount", "Mode", "Date", "Notes"];
    const rows = entries.map((e, i) => [i + 1, e.name, e.mobile || "", e.place || "", e.amount, e.mode, e.date ? new Date(e.date).toLocaleDateString("en-IN") : "", e.notes || ""]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `MoiBee_${settings.weddingName.replace(/\s+/g, "_")}_${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast("CSV exported successfully!");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ settings, entries, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
    a.download = `MoiBee_backup_${today()}.json`; a.click(); URL.revokeObjectURL(url);
    addToast("JSON backup exported!");
  };

  const exportPrintView = () => {
    const total = entries.reduce((s, e) => s + Number(e.amount), 0);
    const rows = entries.map((e, i) => `<tr><td>${i + 1}</td><td>${e.name}</td><td>${e.place || "—"}</td><td>${e.mobile || "—"}</td><td style="font-weight:700;color:#0F9DAD">₹${Number(e.amount).toLocaleString("en-IN")}</td><td>${e.mode}</td><td>${e.date ? new Date(e.date).toLocaleDateString("en-IN") : "—"}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><title>MoiBee - ${settings.weddingName}</title>
    <style>body{font-family:Georgia,serif;margin:0;padding:20px;background:#fff;color:#1a1a1a}h1{color:#0F9DAD;font-size:28px;margin-bottom:4px}.meta{color:#555;font-size:14px;margin-bottom:20px}.summary{display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap}.stat{background:#f0fafa;border:1px solid #0F9DAD33;border-radius:8px;padding:12px 20px;text-align:center}.stat-val{font-size:22px;font-weight:900;color:#0F9DAD}.stat-lbl{font-size:11px;color:#666;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0F9DAD;color:#fff;padding:10px 12px;text-align:left}td{padding:9px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f8f8}.footer{margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}</style>
    </head><body>
    <h1>🐝 MoiBee — ${settings.weddingName}</h1>
    <div class="meta">${settings.brideName} ♥ ${settings.groomName} · ${settings.familyName} · Exported ${new Date().toLocaleDateString("en-IN")}</div>
    <div class="summary">
      <div class="stat"><div class="stat-val">₹${total.toLocaleString("en-IN")}</div><div class="stat-lbl">Total Collection</div></div>
      <div class="stat"><div class="stat-val">${entries.length}</div><div class="stat-lbl">Total Guests</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Name</th><th>Place</th><th>Mobile</th><th>Amount</th><th>Mode</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">🐝 Powered by AllBee Solutions · MoiBee — Track Every Blessing</div>
    </body></html>`;
    const w = window.open("", "_blank"); w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); }, 400);
    addToast("Print view opened!");
  };

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const byMode = { Cash: 0, UPI: 0, Bank: 0 };
  entries.forEach(e => { if (byMode[e.mode] !== undefined) byMode[e.mode] += Number(e.amount); });

  const exportCards = [
    { icon: "download", label: "Export CSV / Excel", desc: "Download as CSV file — open in Excel, Google Sheets, or any spreadsheet app.", action: exportCSV, color: "#10b981", btn: "Download CSV" },
    { icon: "print", label: "Print Full Report", desc: "Opens a printable HTML report with all entries and summary stats.", action: exportPrintView, color: "#0F9DAD", btn: "Open Print View" },
    { icon: "download", label: "JSON Backup", desc: "Download a complete JSON backup of all entries and settings for safekeeping.", action: exportJSON, color: "#6366f1", btn: "Download Backup" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 700 }}>
      <div style={{ marginBottom: 28, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Export Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <div style={{ textAlign: "center", padding: 16, background: t.surface2, borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F9DAD" }}>{formatCurrency(total)}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Total Collection</div>
          </div>
          <div style={{ textAlign: "center", padding: 16, background: t.surface2, borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>{entries.length}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Total Guests</div>
          </div>
          {Object.entries(byMode).map(([m, a]) => (
            <div key={m} style={{ textAlign: "center", padding: 16, background: t.surface2, borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{formatCurrency(a)}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{m}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {exportCards.map(c => (
          <div key={c.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
              <div style={{ background: `${c.color}18`, borderRadius: 12, padding: 14, color: c.color, flexShrink: 0 }}>
                <Icon name={c.icon} size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: t.textMuted }}>{c.desc}</div>
              </div>
            </div>
            <button onClick={c.action} style={{
              background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`, border: "none", borderRadius: 10,
              padding: "11px 22px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", boxShadow: `0 4px 16px ${c.color}33`
            }}>{c.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────
function SettingsPage({ settings, setSettings, addToast, t }) {
  const [form, setForm] = useState({ ...settings });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    setSettings(form);
    addToast("Settings saved successfully!");
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 640 }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: 32 }}>
        <div style={{ fontSize: 13, color: "#0F9DAD", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>⚙️ Configuration</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 28 }}>Event Settings</div>

        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
          Wedding Details
        </div>
        <Input label="Wedding Name" value={form.weddingName} onChange={v => set("weddingName", v)} placeholder="e.g. Raj & Priya Wedding" th={t} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Bride's Name" value={form.brideName} onChange={v => set("brideName", v)} placeholder="Priya" th={t} />
          <Input label="Groom's Name" value={form.groomName} onChange={v => set("groomName", v)} placeholder="Raj" th={t} />
        </div>
        <Input label="Family Name" value={form.familyName} onChange={v => set("familyName", v)} placeholder="e.g. Murugan Family" th={t} />
        <Input label="Receipt Header Note" value={form.headerNote} onChange={v => set("headerNote", v)} placeholder="e.g. With Blessings & Best Wishes" th={t} />

        {/* Google Sheets Integration */}
        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 14px", paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
          📊 Google Sheets Integration
        </div>
        <Input
          label="Google Apps Script Web App URL"
          value={form.googleSheetWebhook || ""}
          onChange={v => set("googleSheetWebhook", v)}
          placeholder="https://script.google.com/macros/s/.../exec"
          th={t}
        />
        <div style={{ background: "#0F9DAD0a", border: "1px solid #0F9DAD22", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: t.textMid }}>
          <div style={{ fontWeight: 700, color: "#0F9DAD", marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="sheets" size={14} /> How to connect Google Sheets:
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Open Google Sheets → <strong>Extensions → Apps Script</strong></li>
            <li>Paste this code and save:
              <pre style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 11, marginTop: 6, overflowX: "auto", color: t.text }}>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Name","Mobile","Place","Amount","Mode","Notes","Date","ID"]);
  }
  sheet.appendRow([data.name,data.mobile,data.place,data.amount,data.mode,data.notes,data.date,data.id]);
  return ContentService.createTextOutput("OK");
}`}</pre>
            </li>
            <li>Click <strong>Deploy → New Deployment → Web App</strong></li>
            <li>Set <em>Execute as: Me</em>, <em>Who has access: Anyone</em></li>
            <li>Copy the Web App URL and paste it above</li>
          </ol>
        </div>

        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 14px", paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
          Admin Credentials
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Admin Username" value={form.adminUser} onChange={v => set("adminUser", v)} th={t} />
          <Input label="Admin Password" value={form.adminPass} onChange={v => set("adminPass", v)} type="password" th={t} />
        </div>

        <div style={{ background: "#f59e0b12", border: "1px solid #f59e0b33", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#fbbf24" }}>
          ⚠️ Changing credentials will require you to log in again. All data is stored locally in your browser.
        </div>

        <button onClick={handleSave} style={{
          width: "100%", background: "linear-gradient(135deg, #0F9DAD, #0a7a87)", border: "none", borderRadius: 12,
          padding: "14px 0", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 20px rgba(15,157,173,0.35)"
        }}>Save Settings ✓</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MoiBee />
  </React.StrictMode>,
)
