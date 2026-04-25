import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, setDoc
} from "firebase/firestore";

// ─── Helpers ─────────────────────────────────────────────────────────
const formatCurrency = (n) => "₹" + Number(n).toLocaleString("en-IN");
const formatDate = (iso) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const today = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEYS = { auth: "moibee_auth", theme: "moibee_theme" };
const load = (key, fb) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// Gift type config
const GIFT_TYPES = [
  { value: "Cash",   label: "💵 Cash",         color: "#10b981", isMoney: true  },
  { value: "UPI",    label: "📱 UPI",           color: "#6366f1", isMoney: true  },
  { value: "Bank",   label: "🏦 Bank Transfer", color: "#3b82f6", isMoney: true  },
  { value: "Gold",   label: "🥇 Gold",          color: "#f59e0b", isMoney: false },
  { value: "Silver", label: "🥈 Silver",        color: "#94a3b8", isMoney: false },
  { value: "Gift",   label: "🎁 Other Gift",    color: "#ec4899", isMoney: false },
];
const isMoneyType = (t) => ["Cash","UPI","Bank"].includes(t);
const giftColor = (t) => GIFT_TYPES.find(g => g.value === t)?.color || "#0F9DAD";
const giftLabel = (t) => GIFT_TYPES.find(g => g.value === t)?.label || t;

const DEFAULT_SETTINGS = {
  weddingName: "Wedding Celebration", brideName: "Bride", groomName: "Groom",
  familyName: "Family", headerNote: "With Blessings & Best Wishes",
  adminUser: "admin", adminPass: "moibee123", googleSheetWebhook: "",
};

// ─── Themes ──────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:"#0d1117",surface:"#111827",surface2:"#0d1117",border:"#1f2937",
    text:"#f9fafb",textMid:"#9ca3af",textMuted:"#6b7280",textDim:"#4b5563",
    accent:"#0F9DAD",inputBg:"#0d1117",hoverBg:"#ffffff08",scrollbar:"#1f2937",
    modalBg:"rgba(0,0,0,0.75)",sidebarBg:"#111827",topbarBg:"#111827",colorScheme:"dark",
  },
  light: {
    bg:"#f0f4f8",surface:"#ffffff",surface2:"#f8fafc",border:"#e2e8f0",
    text:"#0f172a",textMid:"#475569",textMuted:"#64748b",textDim:"#94a3b8",
    accent:"#0F9DAD",inputBg:"#f8fafc",hoverBg:"#f1f5f9",scrollbar:"#cbd5e1",
    modalBg:"rgba(0,0,0,0.5)",sidebarBg:"#ffffff",topbarBg:"#ffffff",colorScheme:"light",
  },
};

// ─── Logo ─────────────────────────────────────────────────────────────
const MoiBeeLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="18,72 30,18 42,18 30,72" fill="#0F9DAD" />
    <polygon points="34,72 46,18 54,18 42,72" fill="#0F9DAD" />
    <path d="M52,18 L68,18 Q82,18 82,32 Q82,42 72,44 Q84,46 84,60 Q84,76 68,76 L52,76 Z M62,26 L62,40 L68,40 Q74,40 74,33 Q74,26 68,26 Z M62,48 L62,68 L68,68 Q76,68 76,58 Q76,48 68,48 Z" fill="#0F9DAD" />
    <line x1="52" y1="42" x2="75" y2="42" stroke="#0d1117" strokeWidth="3" />
    <line x1="52" y1="50" x2="76" y2="50" stroke="#0d1117" strokeWidth="3" />
  </svg>
);

// ─── Icons ────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const d = {
    dashboard:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
    add:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/>,
    records:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>,
    settings:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/>,
    edit:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>,
    delete:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>,
    print:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>,
    download:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>,
    logout:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>,
    menu:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16"/>,
    close:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12"/>,
    check:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>,
    trophy:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    calendar:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
    users:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>,
    money:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>,
    export:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>,
    eye:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>,
    sun:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>,
    moon:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>,
    gift:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>,
    sheets:<><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6M9 11h6M9 15h4"/></>,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {d[name]}
    </svg>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: t.type==="error"?"#ef4444":t.type==="warning"?"#f59e0b":"#0F9DAD", color:"#fff", padding:"12px 20px", borderRadius:12, fontFamily:"inherit", fontSize:14, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideIn 0.3s ease", display:"flex", alignItems:"center", gap:10, minWidth:240 }}>
        <Icon name="check" size={16} />{t.msg}
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, wide=false, th }) => {
  const t = th||THEMES.dark;
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:t.modalBg, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, width:"100%", maxWidth:wide?760:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${t.border}` }}>
          <span style={{ color:t.text, fontWeight:700, fontSize:18 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:t.textMid, cursor:"pointer", padding:4 }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Input / Select / Textarea ────────────────────────────────────────
const Input = ({ label, value, onChange, type="text", placeholder="", required=false, style={}, th }) => {
  const t = th||THEMES.dark;
  return (
    <div style={{ marginBottom:16, ...style }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {label}{required&&<span style={{ color:"#0F9DAD", marginLeft:3 }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.border}`, borderRadius:10, padding:"11px 14px", color:t.text, fontSize:15, outline:"none", transition:"border-color 0.2s", boxSizing:"border-box", fontFamily:"inherit" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border} />
    </div>
  );
};
const Sel = ({ label, value, onChange, options, th }) => {
  const t = th||THEMES.dark;
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.border}`, borderRadius:10, padding:"11px 14px", color:t.text, fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit", cursor:"pointer" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent="#0F9DAD", sub, th }) => {
  const t = th||THEMES.dark;
  return (
    <div style={{ background:t.surface, border:`1px solid ${accent}22`, borderRadius:16, padding:"22px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${accent}12` }} />
      <div style={{ background:`${accent}18`, borderRadius:10, padding:10, color:accent, display:"inline-flex", marginBottom:12 }}><Icon name={icon} size={20} /></div>
      <div style={{ fontSize:28, fontWeight:800, color:t.text, fontFamily:"'DM Serif Display',Georgia,serif", marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:t.textMuted, fontWeight:500 }}>{label}</div>
      {sub&&<div style={{ fontSize:12, color:accent, marginTop:4, fontWeight:600 }}>{sub}</div>}
    </div>
  );
};

// ─── Theme Toggle ─────────────────────────────────────────────────────
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button onClick={toggleTheme} style={{ display:"flex", alignItems:"center", gap:7, background:theme==="dark"?"#1f2937":"#e2e8f0", border:`1px solid ${theme==="dark"?"#374151":"#cbd5e1"}`, borderRadius:20, padding:"6px 14px", color:theme==="dark"?"#f9fafb":"#0f172a", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s ease" }}>
    <Icon name={theme==="dark"?"sun":"moon"} size={15} />
    {theme==="dark"?"Light":"Dark"}
  </button>
);

// ─── Google Sheet Push ────────────────────────────────────────────────
async function pushToGoogleSheet(webhookUrl, entry, settings) {
  if (!webhookUrl) return { ok:false, reason:"no_url" };
  try {
    await fetch(webhookUrl, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...entry, weddingName:settings.weddingName }) });
    return { ok:true };
  } catch(err) { return { ok:false, reason:err.message }; }
}

// ─── LOGIN ────────────────────────────────────────────────────────────
function LoginPage({ onLogin, theme, toggleTheme }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const t = THEMES[theme];
  useEffect(() => {
    const unsub = onSnapshot(doc(db,"config","settings"), snap => { if(snap.exists()) setSettings({...DEFAULT_SETTINGS,...snap.data()}); });
    return unsub;
  }, []);
  const handleLogin = () => {
    if(user===settings.adminUser && pass===settings.adminPass) { save(STORAGE_KEYS.auth,{loggedIn:true}); onLogin(); }
    else setErr("Invalid credentials. Please try again.");
  };
  return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Segoe UI',sans-serif", padding:16, transition:"background 0.3s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap'); @keyframes fadeUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} *{box-sizing:border-box}`}</style>
      <div style={{ position:"fixed", top:20, right:20 }}><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></div>
      <div style={{ width:"100%", maxWidth:400, animation:"fadeUp 0.5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:14 }}>
            <MoiBeeLogo size={56} />
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:22, fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
              <div style={{ fontSize:11, color:"#0F9DAD", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase" }}>Track Every Blessing</div>
              <div style={{ fontSize:10, color:t.textDim, marginTop:2 }}>Powered by AllBee Solutions</div>
            </div>
          </div>
        </div>
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:36, boxShadow:"0 24px 80px rgba(0,0,0,0.15)" }}>
          <h2 style={{ color:t.text, fontSize:22, fontWeight:700, marginBottom:6, marginTop:0 }}>Welcome back</h2>
          <p style={{ color:t.textMuted, fontSize:14, marginBottom:28, marginTop:0 }}>Sign in to manage {settings.weddingName}</p>
          <Input label="Username" value={user} onChange={setUser} placeholder="admin" required th={t} />
          <Input label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••" required th={t} />
          {err && <div style={{ background:"#7f1d1d20", border:"1px solid #ef444444", borderRadius:8, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginBottom:16 }}>{err}</div>}
          <button onClick={handleLogin} style={{ width:"100%", background:"linear-gradient(135deg,#0F9DAD,#0a7a87)", border:"none", borderRadius:12, padding:"14px 0", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(15,157,173,0.4)" }}>Sign In →</button>
        </div>
        <div style={{ textAlign:"center", marginTop:24, color:t.textDim, fontSize:12 }}>🐝 Powered by AllBee Solutions</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────
function MoiBee() {
  const [loggedIn, setLoggedIn] = useState(()=>load(STORAGE_KEYS.auth,null)?.loggedIn===true);
  const [page, setPage] = useState("dashboard");
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [receiptEntry, setReceiptEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [theme, setTheme] = useState(()=>load(STORAGE_KEYS.theme,"dark"));
  const [online, setOnline] = useState(navigator.onLine);
  const t = THEMES[theme];

  const toggleTheme = () => { const n=theme==="dark"?"light":"dark"; setTheme(n); save(STORAGE_KEYS.theme,n); };

  useEffect(() => {
    const on=()=>setOnline(true), off=()=>setOnline(false);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return ()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  },[]);

  useEffect(() => {
    const q = query(collection(db,"entries"),orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap => { setEntries(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); }, ()=>setLoading(false));
    return unsub;
  },[]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db,"config","settings"), snap=>{ if(snap.exists()) setSettings({...DEFAULT_SETTINGS,...snap.data()}); });
    return unsub;
  },[]);

  const addToast = useCallback((msg,type="success")=>{
    const id = Date.now().toString();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  const addEntry    = async (data) => { const e={...data,createdAt:new Date().toISOString(),date:new Date().toISOString()}; const r=await addDoc(collection(db,"entries"),e); return {id:r.id,...e}; };
  const updateEntry = async (id,data) => { await updateDoc(doc(db,"entries",id),data); };
  const deleteEntry = async (id) => { await deleteDoc(doc(db,"entries",id)); };
  const saveSettings= async (s) => { await setDoc(doc(db,"config","settings"),s); };
  const logout = () => { save(STORAGE_KEYS.auth,{loggedIn:false}); setLoggedIn(false); };

  if(!loggedIn) return <LoginPage onLogin={()=>setLoggedIn(true)} theme={theme} toggleTheme={toggleTheme} />;

  const navItems = [
    {id:"dashboard",label:"Dashboard",icon:"dashboard"},
    {id:"add",label:"Add Entry",icon:"add"},
    {id:"records",label:"Records",icon:"records"},
    {id:"export",label:"Export",icon:"export"},
    {id:"settings",label:"Settings",icon:"settings"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"'Sora','Segoe UI',sans-serif", color:t.text, display:"flex", transition:"background 0.3s,color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${t.bg}}
        ::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:3px}
        input::placeholder,textarea::placeholder{color:${t.textDim}!important}
        select option{background:${t.surface};color:${t.text}}
        @media print{.no-print{display:none!important}body{background:white!important;color:black!important}}
      `}</style>

      {/* Sidebar */}
      <div className="no-print" style={{ width:240, background:t.sidebarBg, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column", padding:"20px 0", position:"fixed", top:0, left:sidebarOpen?0:-240, height:"100vh", zIndex:200, transition:"left 0.3s ease,background 0.3s", ...(typeof window!=="undefined"&&window.innerWidth>=768?{left:0}:{}) }}>
        <div style={{ padding:"0 20px 20px", borderBottom:`1px solid ${t.border}`, marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <MoiBeeLogo size={38} />
            <div>
              <div style={{ fontSize:18, fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
              <div style={{ fontSize:9, color:"#0F9DAD", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>TRACK EVERY BLESSING</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"0 12px" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", background:page===item.id?"linear-gradient(135deg,#0F9DAD18,#0F9DAD08)":"transparent", color:page===item.id?"#0F9DAD":t.textMuted, fontSize:14, fontWeight:page===item.id?600:500, fontFamily:"inherit", marginBottom:4, transition:"all 0.15s", textAlign:"left", borderLeft:page===item.id?"3px solid #0F9DAD":"3px solid transparent" }}>
              <Icon name={item.icon} size={17} />{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"16px 12px", borderTop:`1px solid ${t.border}` }}>
          <div style={{ padding:"0 14px 12px", fontSize:12, color:t.textDim }}>
            <div style={{ fontWeight:600, color:t.textMuted }}>{settings.weddingName}</div>
            <div style={{ marginTop:2 }}>{settings.brideName} & {settings.groomName}</div>
          </div>
          <div style={{ padding:"6px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:online?"#10b981":"#ef4444", boxShadow:online?"0 0 6px #10b981":"none" }} />
            <span style={{ color:online?"#10b981":"#ef4444", fontWeight:600 }}>{online?"Synced":"Offline"}</span>
          </div>
          <button onClick={logout} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:"none", background:"transparent", color:t.textMuted, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>
            <Icon name="logout" size={16} /> Sign Out
          </button>
          <div style={{ textAlign:"center", marginTop:12, fontSize:10, color:t.textDim }}>🐝 Powered by AllBee Solutions</div>
        </div>
      </div>

      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:199 }} />}

      {/* Main */}
      <div style={{ flex:1, marginLeft:240, minHeight:"100vh", display:"flex", flexDirection:"column" }} className="main-content">
        <style>{`@media(max-width:768px){.main-content{margin-left:0!important}}`}</style>
        <div className="no-print" style={{ background:t.topbarBg, borderBottom:`1px solid ${t.border}`, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, transition:"background 0.3s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button className="mobile-menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", color:t.textMid, cursor:"pointer", padding:4, display:"none" }}><Icon name="menu" size={22} /></button>
            <style>{`@media(max-width:768px){.mobile-menu-btn{display:block!important}}`}</style>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:t.text }}>{navItems.find(n=>n.id===page)?.label}</div>
              <div style={{ fontSize:12, color:t.textMuted }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {loading&&<div style={{ width:18, height:18, border:"2px solid #0F9DAD33", borderTop:"2px solid #0F9DAD", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />}
            <div style={{ background:"#0F9DAD18", border:"1px solid #0F9DAD33", borderRadius:8, padding:"6px 12px", fontSize:13, color:"#0F9DAD", fontWeight:600 }}>{entries.length} Entries</div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>

        <div style={{ flex:1, padding:"28px 24px", maxWidth:1200, width:"100%" }}>
          {page==="dashboard" && <DashboardPage entries={entries} settings={settings} t={t} loading={loading} />}
          {page==="add"       && <AddEntryPage addEntry={addEntry} updateEntry={updateEntry} addToast={addToast} editEntry={editEntry} setEditEntry={setEditEntry} setPage={setPage} settings={settings} t={t} />}
          {page==="records"   && <RecordsPage entries={entries} deleteEntry={deleteEntry} addToast={addToast} setEditEntry={setEditEntry} setPage={setPage} setReceiptEntry={setReceiptEntry} setDeleteConfirm={setDeleteConfirm} settings={settings} t={t} />}
          {page==="export"    && <ExportPage entries={entries} settings={settings} addToast={addToast} t={t} />}
          {page==="settings"  && <SettingsPage settings={settings} saveSettings={saveSettings} addToast={addToast} t={t} />}
        </div>
      </div>

      {receiptEntry && <ReceiptModal entry={receiptEntry} settings={settings} onClose={()=>setReceiptEntry(null)} t={t} />}

      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Confirm Delete" th={t}>
        <p style={{ color:t.textMid, marginTop:0 }}>Delete entry for <strong style={{ color:t.text }}>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:24 }}>
          <button onClick={()=>setDeleteConfirm(null)} style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${t.border}`, background:"transparent", color:t.textMid, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>Cancel</button>
          <button onClick={async()=>{ await deleteEntry(deleteConfirm.id); addToast("Entry deleted","error"); setDeleteConfirm(null); }} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600 }}>Delete</button>
        </div>
      </Modal>
      <Toast toasts={toasts} />
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function DashboardPage({ entries, settings, t, loading }) {
  const moneyEntries = entries.filter(e=>isMoneyType(e.giftType||e.mode));
  const giftEntries  = entries.filter(e=>!isMoneyType(e.giftType||e.mode));
  const total        = moneyEntries.reduce((s,e)=>s+Number(e.amount||0),0);
  const todayE       = entries.filter(e=>e.date?.slice(0,10)===today());
  const todayMoney   = todayE.filter(e=>isMoneyType(e.giftType||e.mode)).reduce((s,e)=>s+Number(e.amount||0),0);
  const highest      = moneyEntries.length ? Math.max(...moneyEntries.map(e=>Number(e.amount||0))) : 0;
  const highestEntry = moneyEntries.find(e=>Number(e.amount||0)===highest);

  const byType = {};
  GIFT_TYPES.forEach(g=>{ byType[g.value]=0; });
  entries.forEach(e=>{ const k=e.giftType||e.mode; if(byType[k]!==undefined) byType[k]++; });

  const recent = entries.slice(0,8);

  if(loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, flexDirection:"column", gap:16 }}>
      <div style={{ width:40, height:40, border:"3px solid #0F9DAD33", borderTop:"3px solid #0F9DAD", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ color:t.textMuted, fontSize:14 }}>Loading from Firebase...</div>
    </div>
  );

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {/* Banner */}
      <div style={{ background:`linear-gradient(135deg,#0F9DAD22 0%,#0a7a8714 50%,${t.surface} 100%)`, border:"1px solid #0F9DAD33", borderRadius:20, padding:"28px 32px", marginBottom:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-30, top:-30, width:180, height:180, borderRadius:"50%", background:"#0F9DAD08" }} />
        <div style={{ fontSize:13, color:"#0F9DAD", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>💐 Live Event · Real-time Sync</div>
        <div style={{ fontSize:28, fontWeight:800, color:t.text, fontFamily:"'DM Serif Display',Georgia,serif" }}>{settings.weddingName}</div>
        <div style={{ fontSize:15, color:t.textMid, marginTop:6 }}>{settings.brideName} ♥ {settings.groomName} · {settings.familyName}</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:16, marginBottom:28 }}>
        <StatCard icon="money"    label="Total Cash/UPI/Bank"  value={formatCurrency(total)}     accent="#0F9DAD" sub={`${moneyEntries.length} payments`}   th={t} />
        <StatCard icon="users"    label="Total Guests"          value={entries.length}            accent="#6366f1" sub="all entries"                         th={t} />
        <StatCard icon="calendar" label="Today's Collection"    value={formatCurrency(todayMoney)} accent="#10b981" sub={`${todayE.length} entries today`}   th={t} />
        <StatCard icon="trophy"   label="Highest Gift"          value={formatCurrency(highest)}   accent="#f59e0b" sub={highestEntry?.name||"—"}             th={t} />
        <StatCard icon="gift"     label="Physical Gifts"        value={giftEntries.length}        accent="#ec4899" sub="gold, silver & more"                 th={t} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Gift type breakdown */}
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.textMuted, marginBottom:20, textTransform:"uppercase", letterSpacing:"0.05em" }}>Gift Breakdown</div>
          {GIFT_TYPES.map(g=>{
            const count = byType[g.value]||0;
            const pct   = entries.length>0?(count/entries.length)*100:0;
            return (
              <div key={g.value} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:13, color:t.text, fontWeight:500 }}>{g.label}</span>
                  <span style={{ fontSize:13, color:g.color, fontWeight:700 }}>{count} entries</span>
                </div>
                <div style={{ height:5, background:t.border, borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:g.color, borderRadius:3, transition:"width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent entries */}
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.textMuted, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.05em" }}>Recent Entries</div>
          {recent.length===0 && <div style={{ color:t.textDim, fontSize:14 }}>No entries yet</div>}
          {recent.map(e=>{
            const gt = e.giftType||e.mode;
            const money = isMoneyType(gt);
            return (
              <div key={e.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.surface2}` }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{e.name}</div>
                  <div style={{ fontSize:11, color:t.textMuted }}>{e.place} · <span style={{ color:giftColor(gt) }}>{giftLabel(gt)}</span></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {money
                    ? <div style={{ fontSize:14, fontWeight:700, color:"#0F9DAD" }}>{formatCurrency(e.amount)}</div>
                    : <div style={{ fontSize:13, fontWeight:700, color:giftColor(gt) }}>{e.giftDesc||gt}</div>
                  }
                  {e.giftWeight && <div style={{ fontSize:11, color:t.textDim }}>{e.giftWeight}g</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADD ENTRY ────────────────────────────────────────────────────────
function AddEntryPage({ addEntry, updateEntry, addToast, editEntry, setEditEntry, setPage, settings, t }) {
  const blank = { name:"", mobile:"", place:"", giftType:"Cash", amount:"", giftDesc:"", giftWeight:"", giftUnit:"g", notes:"" };
  const [form, setForm] = useState(()=>editEntry?{...blank,...editEntry}:blank);
  const [saving, setSaving] = useState(false);
  const [sheetStatus, setSheetStatus] = useState(null);

  useEffect(()=>{ if(editEntry) setForm({...blank,...editEntry}); else setForm(blank); },[editEntry]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const isMoney = isMoneyType(form.giftType);
  const quickAmounts = [101,501,1001,2001,5001,10001];

  const handleSubmit = async () => {
    if(!form.name.trim()) { addToast("Guest name is required","warning"); return; }
    if(isMoney && !form.amount) { addToast("Amount is required for payment entries","warning"); return; }
    if(!isMoney && !form.giftDesc.trim()) { addToast("Please describe the gift","warning"); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: isMoney ? Number(form.amount) : 0 };
      if(editEntry) {
        await updateEntry(editEntry.id, payload);
        addToast(`Updated entry for ${form.name}`);
        setEditEntry(null); setPage("records");
      } else {
        const newEntry = await addEntry(payload);
        const msg = isMoney
          ? `₹${Number(form.amount).toLocaleString("en-IN")} saved for ${form.name} 🎉`
          : `${form.giftDesc} gift recorded for ${form.name} 🎁`;
        addToast(msg);
        if(settings.googleSheetWebhook?.trim()) {
          setSheetStatus("syncing");
          const r = await pushToGoogleSheet(settings.googleSheetWebhook.trim(),newEntry,settings);
          setSheetStatus(r.ok?"ok":r.reason==="no_url"?null:"fail");
          if(r.ok) addToast("📊 Synced to Google Sheet!");
          setTimeout(()=>setSheetStatus(null),4000);
        }
        setForm(blank);
      }
    } catch(err) { addToast("Failed: "+err.message,"error"); }
    setSaving(false);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease", maxWidth:660 }}>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:32 }}>
        <div style={{ fontSize:13, color:"#0F9DAD", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>
          {editEntry?"✏️ Edit Entry":"🎁 New Contribution"}
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:t.text, fontFamily:"'DM Serif Display',Georgia,serif", marginBottom:28 }}>
          {editEntry?"Update Gift Entry":"Record a Gift"}
        </div>

        {/* Guest info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div style={{ gridColumn:"1/-1" }}><Input label="Guest Name" value={form.name} onChange={v=>set("name",v)} placeholder="Enter full name" required th={t} /></div>
          <Input label="Mobile Number" value={form.mobile} onChange={v=>set("mobile",v)} placeholder="9876543210" type="tel" th={t} />
          <Input label="Place / City" value={form.place} onChange={v=>set("place",v)} placeholder="Chennai" th={t} />
        </div>

        {/* Gift Type selector - big pill buttons */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Gift Type <span style={{ color:"#0F9DAD" }}>*</span></label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {GIFT_TYPES.map(g=>{
              const active = form.giftType===g.value;
              return (
                <button key={g.value} onClick={()=>set("giftType",g.value)}
                  style={{ padding:"12px 8px", borderRadius:12, border:`2px solid ${active?g.color:t.border}`, background:active?`${g.color}18`:t.inputBg, color:active?g.color:t.textMuted, cursor:"pointer", fontSize:13, fontWeight:active?700:500, fontFamily:"inherit", transition:"all 0.15s", textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{g.label.split(" ")[0]}</div>
                  <div>{g.label.split(" ").slice(1).join(" ")}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Money fields */}
        {isMoney && (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Quick Amount</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {quickAmounts.map(a=>(
                  <button key={a} onClick={()=>set("amount",a)}
                    style={{ padding:"8px 14px", borderRadius:8, border:`1.5px solid ${form.amount==a?"#0F9DAD":t.border}`, background:form.amount==a?"#0F9DAD18":t.inputBg, color:form.amount==a?"#0F9DAD":t.textMuted, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 0.15s" }}>
                    ₹{a.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Amount (₹)" value={form.amount} onChange={v=>set("amount",v)} placeholder="Enter amount" type="number" required th={t} />
          </>
        )}

        {/* Physical gift fields */}
        {!isMoney && (
          <div style={{ background:`${giftColor(form.giftType)}0d`, border:`1.5px solid ${giftColor(form.giftType)}33`, borderRadius:12, padding:18, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:giftColor(form.giftType), marginBottom:14 }}>
              {giftLabel(form.giftType)} Details
            </div>
            <Input label="Gift Description" value={form.giftDesc} onChange={v=>set("giftDesc",v)} placeholder={form.giftType==="Gold"?"e.g. Gold chain, Ring, Earrings":form.giftType==="Silver"?"e.g. Silver plate, Coins":"e.g. Silk saree, Watch, Cutlery set"} required th={t} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <Input label={`Weight / Quantity (optional)`} value={form.giftWeight} onChange={v=>set("giftWeight",v)} placeholder={form.giftType==="Gold"||form.giftType==="Silver"?"e.g. 10":"e.g. 2 pieces"} th={t} />
              <Sel label="Unit" value={form.giftUnit||"g"} onChange={v=>set("giftUnit",v)} options={[{value:"g",label:"Grams (g)"},{value:"kg",label:"Kilograms (kg)"},{value:"pcs",label:"Pieces"},{value:"sets",label:"Sets"},{value:"nos",label:"Nos"}]} th={t} />
            </div>
            {/* Estimated value for gold/silver */}
            {(form.giftType==="Gold"||form.giftType==="Silver") && (
              <Input label="Estimated Value (₹, optional)" value={form.amount} onChange={v=>set("amount",v)} placeholder="Approximate market value" type="number" th={t} />
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:t.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Notes (Optional)</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..." rows={2}
            style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.border}`, borderRadius:10, padding:"11px 14px", color:t.text, fontSize:15, outline:"none", resize:"vertical", fontFamily:"inherit" }} />
        </div>

        {settings.googleSheetWebhook?.trim() && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, padding:"8px 14px", background:"#0F9DAD0a", border:"1px solid #0F9DAD22", borderRadius:8, fontSize:12, color:t.textMuted }}>
            <Icon name="sheets" size={14} />
            {sheetStatus==="syncing"&&<span style={{ color:"#f59e0b" }}>⏳ Syncing...</span>}
            {sheetStatus==="ok"&&<span style={{ color:"#10b981" }}>✅ Synced to Google Sheets</span>}
            {sheetStatus==="fail"&&<span style={{ color:"#ef4444" }}>❌ Sync failed</span>}
            {!sheetStatus&&<span>Google Sheets sync active</span>}
          </div>
        )}

        <div style={{ display:"flex", gap:12 }}>
          {editEntry && (
            <button onClick={()=>{setEditEntry(null);setForm(blank);setPage("records");}}
              style={{ flex:1, padding:"14px 0", borderRadius:12, border:`1px solid ${t.border}`, background:"transparent", color:t.textMid, cursor:"pointer", fontSize:15, fontWeight:600, fontFamily:"inherit" }}>Cancel</button>
          )}
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex:2, background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)", border:"none", borderRadius:12, padding:"14px 0", color:saving?t.textMuted:"#fff", fontSize:16, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:saving?"none":"0 4px 20px rgba(15,157,173,0.35)", transition:"all 0.2s" }}>
            {saving?"Saving...":editEntry?"Update Entry ✓":"Save Entry →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS ──────────────────────────────────────────────────────────
function RecordsPage({ entries, deleteEntry, addToast, setEditEntry, setPage, setReceiptEntry, setDeleteConfirm, settings, t }) {
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy]       = useState("newest");

  let filtered = entries.filter(e=>{
    const q=search.toLowerCase();
    const gt=e.giftType||e.mode;
    if(search && !e.name?.toLowerCase().includes(q) && !e.place?.toLowerCase().includes(q) && !e.mobile?.includes(q) && !e.giftDesc?.toLowerCase().includes(q)) return false;
    if(filterType!=="All" && gt!==filterType) return false;
    if(filterDate && e.date?.slice(0,10)!==filterDate) return false;
    return true;
  });

  if(sortBy==="newest")  filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  if(sortBy==="oldest")  filtered.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  if(sortBy==="highest") filtered.sort((a,b)=>Number(b.amount||0)-Number(a.amount||0));
  if(sortBy==="lowest")  filtered.sort((a,b)=>Number(a.amount||0)-Number(b.amount||0));
  if(sortBy==="name")    filtered.sort((a,b)=>a.name.localeCompare(b.name));

  const moneyTotal = filtered.filter(e=>isMoneyType(e.giftType||e.mode)).reduce((s,e)=>s+Number(e.amount||0),0);

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {/* Filters */}
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"18px 20px", marginBottom:20, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ flex:1, minWidth:200 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, place, gift..."
            style={{ width:"100%", background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, padding:"9px 12px", color:t.text, fontSize:14, outline:"none", fontFamily:"inherit" }} />
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, padding:"9px 12px", color:t.text, fontSize:13, fontFamily:"inherit", outline:"none" }}>
          <option value="All">All Types</option>
          {GIFT_TYPES.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, padding:"9px 12px", color:t.text, fontSize:13, fontFamily:"inherit", outline:"none", colorScheme:t.colorScheme }} />
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, padding:"9px 12px", color:t.text, fontSize:13, fontFamily:"inherit", outline:"none" }}>
          {[["newest","Newest"],["oldest","Oldest"],["highest","Highest ₹"],["lowest","Lowest ₹"],["name","Name A-Z"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        {(search||filterType!=="All"||filterDate) && (
          <button onClick={()=>{setSearch("");setFilterType("All");setFilterDate("");}} style={{ background:"#ef444418", border:"1px solid #ef444433", borderRadius:8, padding:"9px 14px", color:"#ef4444", fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Clear</button>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, padding:"0 4px" }}>
        <div style={{ fontSize:14, color:t.textMuted }}>{filtered.length} entries found</div>
        <div style={{ fontSize:15, fontWeight:700, color:"#0F9DAD" }}>Cash Total: {formatCurrency(moneyTotal)}</div>
      </div>

      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:t.surface2 }}>
                {["#","Guest Name","Place","Mobile","Gift Type","Amount / Gift","Date","Actions"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={8} style={{ textAlign:"center", padding:"48px 16px", color:t.textDim, fontSize:15 }}>No entries found</td></tr>}
              {filtered.map((e,i)=>{
                const gt = e.giftType||e.mode;
                const money = isMoneyType(gt);
                const color = giftColor(gt);
                return (
                  <tr key={e.id} style={{ borderTop:`1px solid ${t.surface2}`, transition:"background 0.1s" }}
                    onMouseEnter={el=>el.currentTarget.style.background=t.hoverBg}
                    onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px 16px", color:t.textDim, fontSize:13 }}>{i+1}</td>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:t.text, fontSize:14 }}>{e.name}</td>
                    <td style={{ padding:"12px 16px", color:t.textMid, fontSize:13 }}>{e.place||"—"}</td>
                    <td style={{ padding:"12px 16px", color:t.textMid, fontSize:13 }}>{e.mobile||"—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ background:`${color}18`, color, borderRadius:6, padding:"3px 9px", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{giftLabel(gt)}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:13 }}>
                      {money
                        ? <span style={{ fontWeight:700, color:"#0F9DAD" }}>{formatCurrency(e.amount)}</span>
                        : <div>
                            <div style={{ fontWeight:600, color }}>{e.giftDesc||gt}</div>
                            {e.giftWeight && <div style={{ fontSize:11, color:t.textDim }}>{e.giftWeight} {e.giftUnit||"g"}{e.amount>0&&` · Est. ${formatCurrency(e.amount)}`}</div>}
                          </div>
                      }
                    </td>
                    <td style={{ padding:"12px 16px", color:t.textMuted, fontSize:12, whiteSpace:"nowrap" }}>{e.createdAt?formatDate(e.createdAt):"—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setReceiptEntry(e)} style={{ background:"#0F9DAD18", border:"none", borderRadius:7, padding:"6px 8px", color:"#0F9DAD", cursor:"pointer" }}><Icon name="eye" size={14} /></button>
                        <button onClick={()=>{setEditEntry(e);setPage("add");}} style={{ background:"#6366f118", border:"none", borderRadius:7, padding:"6px 8px", color:"#6366f1", cursor:"pointer" }}><Icon name="edit" size={14} /></button>
                        <button onClick={()=>setDeleteConfirm(e)} style={{ background:"#ef444418", border:"none", borderRadius:7, padding:"6px 8px", color:"#ef4444", cursor:"pointer" }}><Icon name="delete" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── RECEIPT MODAL ────────────────────────────────────────────────────
function ReceiptModal({ entry, settings, onClose, t }) {
  const gt    = entry.giftType||entry.mode;
  const money = isMoneyType(gt);

  const handlePrint = () => {
    const giftSection = money
      ? `<div class="amt"><div class="amtlbl">Gift Amount</div><div class="amtval">${formatCurrency(entry.amount)}</div></div>`
      : `<div class="amt"><div class="amtlbl">Gift</div><div class="giftval">${entry.giftDesc||gt}${entry.giftWeight?` · ${entry.giftWeight} ${entry.giftUnit||"g"}`:""}${entry.amount>0?`<br><small>Est. ${formatCurrency(entry.amount)}</small>`:""}</div></div>`;

    const w = window.open("","_blank","width=400,height=640");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;background:#fff;color:#1a1a1a;max-width:380px}
    .logo{font-size:24px;font-weight:900;color:#0F9DAD}.tag{font-size:10px;color:#999;letter-spacing:.2em;text-transform:uppercase}
    .wname{font-size:18px;font-weight:700;margin-top:8px}.couple{font-size:13px;color:#555}
    .hdr{text-align:center;padding-bottom:16px;border-bottom:1px dashed #ccc;margin-bottom:16px}
    .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
    .lbl{color:#666}.val{font-weight:600}
    .amt{background:#f0fafa;border-radius:8px;padding:16px;text-align:center;margin:20px 0}
    .amtlbl{font-size:12px;color:#666;margin-bottom:4px}.amtval{font-size:32px;font-weight:900;color:#0F9DAD}
    .giftval{font-size:22px;font-weight:800;color:#f59e0b}
    .note{text-align:center;font-size:13px;color:#555;font-style:italic}
    .footer{text-align:center;margin-top:24px;font-size:11px;color:#999;border-top:1px dashed #ccc;padding-top:16px}
    </style></head><body>
    <div class="hdr">
      <div class="logo">moiBEE</div><div class="tag">TRACK EVERY BLESSING</div>
      <div class="wname">${settings.weddingName}</div>
      <div class="couple">${settings.brideName} ♥ ${settings.groomName} · ${settings.familyName}</div>
      <div style="font-size:11px;color:#999;margin-top:6px">Receipt #${entry.id?.slice(-6).toUpperCase()}</div>
    </div>
    ${[["Guest Name",entry.name],["Mobile",entry.mobile||"—"],["Place",entry.place||"—"],["Gift Type",giftLabel(gt)],["Date & Time",entry.createdAt?formatDate(entry.createdAt):"—"],...(entry.notes?[["Notes",entry.notes]]:[])]
      .map(([l,v])=>`<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
    ${giftSection}
    <div class="note">${settings.headerNote}</div>
    <div class="footer">🐝 Powered by AllBee Solutions · MoiBee</div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close();},300);
  };

  return (
    <Modal open={true} onClose={onClose} title="Receipt Preview" th={t}>
      <div style={{ border:"2px solid #0F9DAD33", borderRadius:12, padding:28, background:t.surface2 }}>
        <div style={{ textAlign:"center", marginBottom:20, borderBottom:`1px dashed ${t.border}`, paddingBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
            <MoiBeeLogo size={36} />
            <div>
              <div style={{ fontSize:20, fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
              <div style={{ fontSize:10, color:t.textMuted, letterSpacing:"0.1em" }}>TRACK EVERY BLESSING</div>
            </div>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:t.text, marginTop:10 }}>{settings.weddingName}</div>
          <div style={{ fontSize:13, color:t.textMid }}>{settings.brideName} ♥ {settings.groomName}</div>
          <div style={{ fontSize:12, color:t.textMuted }}>{settings.familyName}</div>
          <div style={{ fontSize:11, color:t.textDim, marginTop:8 }}>Receipt #{entry.id?.slice(-6).toUpperCase()}</div>
        </div>
        {[["Guest Name",entry.name],["Mobile",entry.mobile||"—"],["Place",entry.place||"—"],["Gift Type",giftLabel(gt)],["Date & Time",entry.createdAt?formatDate(entry.createdAt):"—"],...(entry.notes?[["Notes",entry.notes]]:[])].map(([label,value])=>(
          <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.border}`, fontSize:14 }}>
            <span style={{ color:t.textMuted }}>{label}</span>
            <span style={{ fontWeight:600, color:t.text }}>{value}</span>
          </div>
        ))}
        {/* Gift value box */}
        <div style={{ background:`${giftColor(gt)}12`, border:`1px solid ${giftColor(gt)}33`, borderRadius:10, padding:20, textAlign:"center", margin:"20px 0" }}>
          <div style={{ fontSize:11, color:t.textMuted, textTransform:"uppercase", marginBottom:4 }}>
            {money?"Gift Amount":"Gift"}
          </div>
          {money
            ? <div style={{ fontSize:36, fontWeight:900, color:"#0F9DAD" }}>{formatCurrency(entry.amount)}</div>
            : <>
                <div style={{ fontSize:24, fontWeight:800, color:giftColor(gt) }}>{entry.giftDesc||giftLabel(gt)}</div>
                {entry.giftWeight && <div style={{ fontSize:14, color:t.textMid, marginTop:4 }}>{entry.giftWeight} {entry.giftUnit||"g"}</div>}
                {entry.amount>0 && <div style={{ fontSize:13, color:t.textDim, marginTop:4 }}>Est. {formatCurrency(entry.amount)}</div>}
              </>
          }
        </div>
        <div style={{ textAlign:"center", fontSize:13, color:t.textMid, fontStyle:"italic" }}>{settings.headerNote}</div>
      </div>
      <div style={{ display:"flex", gap:12, marginTop:20, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${t.border}`, background:"transparent", color:t.textMid, cursor:"pointer", fontFamily:"inherit" }}>Close</button>
        <button onClick={handlePrint} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#0F9DAD,#0a7a87)", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
          <Icon name="print" size={16} /> Print Receipt
        </button>
      </div>
    </Modal>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────
function ExportPage({ entries, settings, addToast, t }) {
  const moneyEntries = entries.filter(e=>isMoneyType(e.giftType||e.mode));
  const giftEntries  = entries.filter(e=>!isMoneyType(e.giftType||e.mode));
  const total        = moneyEntries.reduce((s,e)=>s+Number(e.amount||0),0);

  const exportCSV = () => {
    const headers = ["#","Name","Mobile","Place","Gift Type","Amount (₹)","Gift Description","Weight/Qty","Unit","Date","Notes"];
    const rows = entries.map((e,i)=>{
      const gt=e.giftType||e.mode;
      return [i+1,e.name,e.mobile||"",e.place||"",gt,e.amount||"",e.giftDesc||"",e.giftWeight||"",e.giftUnit||"",e.date?new Date(e.date).toLocaleDateString("en-IN"):"",e.notes||""];
    });
    const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`MoiBee_${settings.weddingName.replace(/\s+/g,"_")}_${today()}.csv`; a.click(); URL.revokeObjectURL(url);
    addToast("CSV exported!");
  };

  const exportJSON = () => {
    const blob=new Blob([JSON.stringify({settings,entries,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`MoiBee_backup_${today()}.json`; a.click(); URL.revokeObjectURL(url);
    addToast("Backup exported!");
  };

  const exportPrint = () => {
    const rows = entries.map((e,i)=>{
      const gt=e.giftType||e.mode; const money=isMoneyType(gt);
      return `<tr><td>${i+1}</td><td>${e.name}</td><td>${e.place||"—"}</td><td>${e.mobile||"—"}</td><td><span style="background:${giftColor(gt)}18;color:${giftColor(gt)};padding:2px 8px;border-radius:4px;font-weight:700">${giftLabel(gt)}</span></td><td>${money?`<b style="color:#0F9DAD">${formatCurrency(e.amount)}</b>`:e.giftDesc||gt}${e.giftWeight?` (${e.giftWeight}${e.giftUnit||"g"})`:""}${!money&&e.amount>0?`<br><small style="color:#999">Est. ${formatCurrency(e.amount)}</small>`:""}</td><td>${e.date?new Date(e.date).toLocaleDateString("en-IN"):"—"}</td></tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><title>MoiBee - ${settings.weddingName}</title>
    <style>body{font-family:Georgia,serif;margin:0;padding:20px;background:#fff;color:#1a1a1a}h1{color:#0F9DAD;font-size:26px}.meta{color:#555;font-size:14px;margin-bottom:20px}.stat{background:#f0fafa;border:1px solid #0F9DAD33;border-radius:8px;padding:12px 20px;text-align:center;display:inline-block;margin:0 10px 16px 0}.sv{font-size:20px;font-weight:900;color:#0F9DAD}.sl{font-size:11px;color:#666;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0F9DAD;color:#fff;padding:10px 12px;text-align:left}td{padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top}tr:nth-child(even){background:#f8f8f8}.footer{margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}</style>
    </head><body>
    <h1>🐝 MoiBee — ${settings.weddingName}</h1>
    <div class="meta">${settings.brideName} ♥ ${settings.groomName} · ${settings.familyName} · Exported ${new Date().toLocaleDateString("en-IN")}</div>
    <div>
      <div class="stat"><div class="sv">${formatCurrency(total)}</div><div class="sl">Cash/UPI/Bank Total</div></div>
      <div class="stat"><div class="sv">${entries.length}</div><div class="sl">Total Guests</div></div>
      <div class="stat"><div class="sv">${giftEntries.length}</div><div class="sl">Physical Gifts</div></div>
    </div>
    <table><thead><tr><th>#</th><th>Name</th><th>Place</th><th>Mobile</th><th>Type</th><th>Amount / Gift</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">🐝 Powered by AllBee Solutions · MoiBee — Track Every Blessing</div></body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
    addToast("Print view opened!");
  };

  const byType={};
  GIFT_TYPES.forEach(g=>{byType[g.value]=0;});
  entries.forEach(e=>{const k=e.giftType||e.mode;if(byType[k]!==undefined)byType[k]++;});

  return (
    <div style={{ animation:"fadeUp 0.4s ease", maxWidth:700 }}>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ fontSize:13, color:t.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:16 }}>Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:16 }}>
          <div style={{ textAlign:"center", padding:16, background:t.surface2, borderRadius:12 }}>
            <div style={{ fontSize:20, fontWeight:800, color:"#0F9DAD" }}>{formatCurrency(total)}</div>
            <div style={{ fontSize:12, color:t.textMuted, marginTop:4 }}>Cash Total</div>
          </div>
          <div style={{ textAlign:"center", padding:16, background:t.surface2, borderRadius:12 }}>
            <div style={{ fontSize:20, fontWeight:800, color:t.text }}>{entries.length}</div>
            <div style={{ fontSize:12, color:t.textMuted, marginTop:4 }}>Total Guests</div>
          </div>
          {GIFT_TYPES.map(g=>(
            <div key={g.value} style={{ textAlign:"center", padding:16, background:t.surface2, borderRadius:12 }}>
              <div style={{ fontSize:20, fontWeight:800, color:g.color }}>{byType[g.value]}</div>
              <div style={{ fontSize:12, color:t.textMuted, marginTop:4 }}>{g.label}</div>
            </div>
          ))}
        </div>
      </div>
      {[
        {icon:"download",label:"Export CSV / Excel",desc:"Full export including gift type, weight, description — open in Excel or Sheets.",action:exportCSV,color:"#10b981",btn:"Download CSV"},
        {icon:"print",label:"Print Full Report",desc:"Printable report with all entries, gift types and summary.",action:exportPrint,color:"#0F9DAD",btn:"Open Print View"},
        {icon:"download",label:"JSON Backup",desc:"Complete backup of all data for safekeeping.",action:exportJSON,color:"#6366f1",btn:"Download Backup"},
      ].map(c=>(
        <div key={c.label} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:24, display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, flexWrap:"wrap", marginBottom:14 }}>
          <div style={{ display:"flex", gap:16, alignItems:"center", flex:1 }}>
            <div style={{ background:`${c.color}18`, borderRadius:12, padding:14, color:c.color, flexShrink:0 }}><Icon name={c.icon} size={22} /></div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:t.text, marginBottom:4 }}>{c.label}</div>
              <div style={{ fontSize:13, color:t.textMuted }}>{c.desc}</div>
            </div>
          </div>
          <button onClick={c.action} style={{ background:`linear-gradient(135deg,${c.color},${c.color}cc)`, border:"none", borderRadius:10, padding:"11px 22px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:`0 4px 16px ${c.color}33` }}>{c.btn}</button>
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────
function SettingsPage({ settings, saveSettings, addToast, t }) {
  const [form, setForm] = useState({...settings});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    setSaving(true);
    try { await saveSettings(form); addToast("Settings saved to Firebase ✓"); }
    catch(err) { addToast("Failed: "+err.message,"error"); }
    setSaving(false);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease", maxWidth:640 }}>
      <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:20, padding:32 }}>
        <div style={{ fontSize:13, color:"#0F9DAD", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>⚙️ Configuration</div>
        <div style={{ fontSize:22, fontWeight:800, color:t.text, fontFamily:"'DM Serif Display',Georgia,serif", marginBottom:28 }}>Event Settings</div>

        <div style={{ fontSize:12, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14, paddingBottom:8, borderBottom:`1px solid ${t.border}` }}>Wedding Details</div>
        <Input label="Wedding Name" value={form.weddingName} onChange={v=>set("weddingName",v)} placeholder="e.g. Raj & Priya Wedding" th={t} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Input label="Bride's Name" value={form.brideName} onChange={v=>set("brideName",v)} th={t} />
          <Input label="Groom's Name" value={form.groomName} onChange={v=>set("groomName",v)} th={t} />
        </div>
        <Input label="Family Name" value={form.familyName} onChange={v=>set("familyName",v)} th={t} />
        <Input label="Receipt Header Note" value={form.headerNote} onChange={v=>set("headerNote",v)} th={t} />

        <div style={{ fontSize:12, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", margin:"24px 0 14px", paddingBottom:8, borderBottom:`1px solid ${t.border}` }}>📊 Google Sheets</div>
        <Input label="Apps Script Web App URL" value={form.googleSheetWebhook||""} onChange={v=>set("googleSheetWebhook",v)} placeholder="https://script.google.com/macros/s/.../exec" th={t} />

        <div style={{ fontSize:12, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", margin:"24px 0 14px", paddingBottom:8, borderBottom:`1px solid ${t.border}` }}>Admin Credentials</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Input label="Username" value={form.adminUser} onChange={v=>set("adminUser",v)} th={t} />
          <Input label="Password" value={form.adminPass} onChange={v=>set("adminPass",v)} type="password" th={t} />
        </div>
        <div style={{ background:"#f59e0b12", border:"1px solid #f59e0b33", borderRadius:10, padding:"12px 16px", marginBottom:24, fontSize:13, color:"#fbbf24" }}>
          ⚠️ Settings sync across all devices via Firebase instantly.
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ width:"100%", background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)", border:"none", borderRadius:12, padding:"14px 0", color:saving?t.textMuted:"#fff", fontSize:16, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:saving?"none":"0 4px 20px rgba(15,157,173,0.35)" }}>
          {saving?"Saving...":"Save Settings ✓"}
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MoiBee />
  </React.StrictMode>,
)
