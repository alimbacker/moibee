import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc, getDoc, where } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

// ─── Firebase ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);
// ─── Helpers ──────────────────────────────────────────────────────────
const formatCurrency = (n) => "₹" + Number(n||0).toLocaleString("en-IN");
const formatDate = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" }) : "—";
const todayStr = () => new Date().toISOString().slice(0,10);
const load = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const save = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };

// ─── Event Types ──────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value:"marriage",  label:"💍 Marriage",          color:"#e879f9" },
  { value:"puberty",   label:"🌸 Puberty Function",  color:"#f472b6" },
  { value:"birthday",  label:"🎂 Birthday",           color:"#fb923c" },
  { value:"housewarming", label:"🏠 House Warming",  color:"#34d399" },
  { value:"engagement",label:"💝 Engagement",         color:"#a78bfa" },
  { value:"other",     label:"🎉 Other Function",     color:"#60a5fa" },
];
const eventColor = (t) => EVENT_TYPES.find(e=>e.value===t)?.color || "#0F9DAD";
const eventLabel = (t) => EVENT_TYPES.find(e=>e.value===t)?.label || t;

// ─── Gift Types ───────────────────────────────────────────────────────
const GIFT_TYPES = [
  { value:"Cash",   label:"💵 Cash",         color:"#10b981", isMoney:true  },
  { value:"UPI",    label:"📱 UPI",           color:"#6366f1", isMoney:true  },
  { value:"Bank",   label:"🏦 Bank Transfer", color:"#3b82f6", isMoney:true  },
  { value:"Gold",   label:"🥇 Gold",          color:"#f59e0b", isMoney:false },
  { value:"Silver", label:"🥈 Silver",        color:"#94a3b8", isMoney:false },
  { value:"Gift",   label:"🎁 Other Gift",    color:"#ec4899", isMoney:false },
];
const isMoneyType = (t) => ["Cash","UPI","Bank"].includes(t);
const giftColor   = (t) => GIFT_TYPES.find(g=>g.value===t)?.color || "#0F9DAD";
const giftLabel   = (t) => GIFT_TYPES.find(g=>g.value===t)?.label || t;

// ─── Default Settings ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  adminUser:"admin", adminPass:"moibee123",
};

// ─── Themes ───────────────────────────────────────────────────────────
const THEMES = {
  dark:  { bg:"#0d1117",surface:"#111827",surface2:"#161d2b",border:"#1f2937",text:"#f9fafb",textMid:"#9ca3af",textMuted:"#6b7280",textDim:"#4b5563",inputBg:"#0d1117",hoverBg:"#ffffff08",scrollbar:"#1f2937",modalBg:"rgba(0,0,0,0.8)",sidebarBg:"#111827",topbarBg:"#111827",colorScheme:"dark" },
  light: { bg:"#f0f4f8",surface:"#ffffff",surface2:"#f8fafc",border:"#e2e8f0",text:"#0f172a",textMid:"#475569",textMuted:"#64748b",textDim:"#94a3b8",inputBg:"#f8fafc",hoverBg:"#f1f5f9",scrollbar:"#cbd5e1",modalBg:"rgba(0,0,0,0.5)",sidebarBg:"#ffffff",topbarBg:"#ffffff",colorScheme:"light" },
};

// ─── Logo ─────────────────────────────────────────────────────────────
const MoiBeeLogo = ({ size=40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="18,72 30,18 42,18 30,72" fill="#0F9DAD"/>
    <polygon points="34,72 46,18 54,18 42,72" fill="#0F9DAD"/>
    <path d="M52,18 L68,18 Q82,18 82,32 Q82,42 72,44 Q84,46 84,60 Q84,76 68,76 L52,76 Z M62,26 L62,40 L68,40 Q74,40 74,33 Q74,26 68,26 Z M62,48 L62,68 L68,68 Q76,68 76,58 Q76,48 68,48 Z" fill="#0F9DAD"/>
    <line x1="52" y1="42" x2="75" y2="42" stroke="#0d1117" strokeWidth="3"/>
    <line x1="52" y1="50" x2="76" y2="50" stroke="#0d1117" strokeWidth="3"/>
  </svg>
);

// ─── Icons ────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
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
    events:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>,
    back:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>,
    sheets:<><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6M9 11h6M9 15h4"/></>,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">{d[name]}</svg>;
};

// ─── Toast ────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10 }}>
    {toasts.map(t=>(
      <div key={t.id} style={{ background:t.type==="error"?"#ef4444":t.type==="warning"?"#f59e0b":"#0F9DAD",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"slideIn 0.3s ease",display:"flex",alignItems:"center",gap:10,minWidth:240 }}>
        <Icon name="check" size={16}/>{t.msg}
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, wide=false, th }) => {
  const t=th||THEMES.dark;
  if(!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:t.modalBg,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,width:"100%",maxWidth:wide?760:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:`1px solid ${t.border}` }}>
          <span style={{ color:t.text,fontWeight:700,fontSize:18 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:t.textMid,cursor:"pointer",padding:4 }}><Icon name="close" size={20}/></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Input / Select ───────────────────────────────────────────────────
const Input = ({ label, value, onChange, type="text", placeholder="", required=false, th }) => {
  const t=th||THEMES.dark;
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}{required&&<span style={{ color:"#0F9DAD",marginLeft:3 }}>*</span>}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",background:t.inputBg,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"11px 14px",color:t.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border}/>
    </div>
  );
};
const Sel = ({ label, value, onChange, options, th }) => {
  const t=th||THEMES.dark;
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%",background:t.inputBg,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"11px 14px",color:t.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",cursor:"pointer" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent="#0F9DAD", sub, th }) => {
  const t=th||THEMES.dark;
  return (
    <div style={{ background:t.surface,border:`1px solid ${accent}22`,borderRadius:16,padding:"20px 22px",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`${accent}12` }}/>
      <div style={{ background:`${accent}18`,borderRadius:10,padding:10,color:accent,display:"inline-flex",marginBottom:10 }}><Icon name={icon} size={18}/></div>
      <div style={{ fontSize:26,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif",marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:12,color:t.textMuted,fontWeight:500 }}>{label}</div>
      {sub&&<div style={{ fontSize:11,color:accent,marginTop:3,fontWeight:600 }}>{sub}</div>}
    </div>
  );
};

// ─── Theme Toggle ─────────────────────────────────────────────────────
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button onClick={toggleTheme} style={{ display:"flex",alignItems:"center",gap:7,background:theme==="dark"?"#1f2937":"#e2e8f0",border:`1px solid ${theme==="dark"?"#374151":"#cbd5e1"}`,borderRadius:20,padding:"6px 14px",color:theme==="dark"?"#f9fafb":"#0f172a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
    <Icon name={theme==="dark"?"sun":"moon"} size={15}/>
    {theme==="dark"?"Light":"Dark"}
  </button>
);

// ─── LOGIN ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
// ─── EVENTS HUB (home screen after login) ────────────────────────────
// ══════════════════════════════════════════════════════════════════════
function EventsHub({ theme, toggleTheme, onSelectEvent, onLogout, t, isAdmin, visibleEvents, allEvents, addToast }) {
  const events = visibleEvents || [];
  const loading = false;
  const [tab,       setTab]       = useState("active");
  const [showCreate,setShowCreate]= useState(false);
  const [showEdit,  setShowEdit]  = useState(null);
  const [deleteConfirm,setDeleteConfirm] = useState(null);
  const [completeConfirm,setCompleteConfirm] = useState(null);
  const [online,    setOnline]    = useState(navigator.onLine);

  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return ()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  },[]);

  const handleDelete = async (ev) => {
    await deleteDoc(doc(db,"events",ev.id));
    addToast(`"${ev.name}" deleted`,"error");
    setDeleteConfirm(null);
  };

  const handleMarkComplete = async (ev) => {
    await updateDoc(doc(db,"events",ev.id),{
      status:"completed",
      completedAt: new Date().toISOString(),
    });
    addToast(`"${ev.name}" marked as completed ✅`);
    setCompleteConfirm(null);
    setTab("completed");
  };

  const handleReopen = async (ev) => {
    await updateDoc(doc(db,"events",ev.id),{ status:"active", completedAt:null });
    addToast(`"${ev.name}" moved back to Active`);
    setTab("active");
  };

  const activeEvents    = events.filter(e=>(!e.status||e.status==="active"));
  const completedEvents = events.filter(e=>e.status==="completed");
  const shownEvents     = tab==="active" ? activeEvents : completedEvents;

  const totalAll       = events.reduce((s,e)=>s+(e.totalAmount||0),0);
  const totalCompleted = completedEvents.reduce((s,e)=>s+(e.totalAmount||0),0);
  const totalActive    = activeEvents.reduce((s,e)=>s+(e.totalAmount||0),0);

  // ─── Event Card ──────────────────────────────────────────────────────
  const EventCard = ({ ev }) => {
    const color   = eventColor(ev.eventType);
    const done    = ev.status==="completed";
    const dateStr = ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Date TBD";
    const completedStr = ev.completedAt ? new Date(ev.completedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : null;

    return (
      <div style={{ background:t.surface, border:`1px solid ${done?"#10b98133":t.border}`, borderRadius:18, overflow:"hidden", transition:"transform 0.15s,box-shadow 0.15s", opacity: done?0.92:1 }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 40px ${color}22`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
        {/* Top strip */}
        <div style={{ height:5, background: done ? "linear-gradient(90deg,#10b981,#34d399)" : `linear-gradient(90deg,${color},${color}88)` }}/>
        <div style={{ padding:22 }}>
          {/* Badge row */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ background:`${color}18`,color,borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700 }}>{eventLabel(ev.eventType)}</span>
              {done && <span style={{ background:"#10b98118",color:"#10b981",borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700 }}>✅ Completed</span>}
            </div>
            <div style={{ display:"flex",gap:5 }}>
              {!done && (
                <button onClick={e=>{e.stopPropagation();setCompleteConfirm(ev);}} title="Mark as Completed"
                  style={{ background:"#10b98118",border:"none",borderRadius:8,padding:"5px 8px",color:"#10b981",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>
                  ✓ Done
                </button>
              )}
              {done && (
                <button onClick={e=>{e.stopPropagation();handleReopen(ev);}} title="Reopen Event"
                  style={{ background:"#f59e0b18",border:"none",borderRadius:8,padding:"5px 8px",color:"#f59e0b",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>
                  ↩ Reopen
                </button>
              )}
              <button onClick={e=>{e.stopPropagation();setShowEdit(ev);}}
                style={{ background:t.surface2,border:"none",borderRadius:8,padding:"5px 8px",color:t.textMuted,cursor:"pointer" }}><Icon name="edit" size={13}/></button>
              <button onClick={e=>{e.stopPropagation();setDeleteConfirm(ev);}}
                style={{ background:"#ef444412",border:"none",borderRadius:8,padding:"5px 8px",color:"#ef4444",cursor:"pointer" }}><Icon name="delete" size={13}/></button>
            </div>
          </div>

          {/* Name */}
          <div style={{ fontSize:19,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif",marginBottom:4,lineHeight:1.3 }}>{ev.name}</div>
          <div style={{ fontSize:12,color:t.textMuted,marginBottom:done?4:14 }}>📅 {dateStr}{ev.place?` · 📍 ${ev.place}`:""}</div>
          {done && completedStr && <div style={{ fontSize:11,color:"#10b981",fontWeight:600,marginBottom:14 }}>🏁 Completed on {completedStr}</div>}

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
            <div style={{ background:t.surface2,borderRadius:10,padding:"10px 12px",textAlign:"center" }}>
              <div style={{ fontSize:17,fontWeight:800,color:done?"#10b981":"#0F9DAD" }}>{formatCurrency(ev.totalAmount||0)}</div>
              <div style={{ fontSize:10,color:t.textMuted,marginTop:2 }}>Collected</div>
            </div>
            <div style={{ background:t.surface2,borderRadius:10,padding:"10px 12px",textAlign:"center" }}>
              <div style={{ fontSize:17,fontWeight:800,color:t.text }}>{ev.entryCount||0}</div>
              <div style={{ fontSize:10,color:t.textMuted,marginTop:2 }}>Guests</div>
            </div>
          </div>

          <button onClick={()=>onSelectEvent(ev)}
            style={{ width:"100%",background:done?"linear-gradient(135deg,#10b981,#059669)":`linear-gradient(135deg,${color},${color}cc)`,border:"none",borderRadius:11,padding:"11px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
            {done?"View Records →":"Open Event →"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      <div>

        {/* Summary strip */}
        {!loading && events.length>0 && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:28 }}>
            {[
              { label:"Total Events",    value:events.length,              color:"#6366f1", sub:"all time" },
              { label:"Active Events",   value:activeEvents.length,        color:"#0F9DAD", sub:formatCurrency(totalActive) },
              { label:"Completed Events",value:completedEvents.length,     color:"#10b981", sub:formatCurrency(totalCompleted) },
              { label:"Grand Total",     value:formatCurrency(totalAll),   color:"#f59e0b", sub:"all events" },
            ].map(s=>(
              <div key={s.label} style={{ background:t.surface,border:`1px solid ${s.color}22`,borderRadius:14,padding:"16px 18px" }}>
                <div style={{ fontSize:22,fontWeight:800,color:s.color,fontFamily:"'DM Serif Display',Georgia,serif" }}>{s.value}</div>
                <div style={{ fontSize:12,color:t.textMuted,marginTop:3 }}>{s.label}</div>
                <div style={{ fontSize:11,color:s.color,marginTop:2,fontWeight:600 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs + New button */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
          {/* Tab pills */}
          <div style={{ display:"flex",background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:4,gap:4 }}>
            {[
              { key:"active",    label:"🟢 Active",    count:activeEvents.length },
              { key:"completed", label:"✅ Completed",  count:completedEvents.length },
            ].map(tb=>(
              <button key={tb.key} onClick={()=>setTab(tb.key)}
                style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 18px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all 0.2s",
                  background: tab===tb.key ? (tb.key==="completed"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#0F9DAD,#0a7a87)") : "transparent",
                  color: tab===tb.key ? "#fff" : t.textMuted }}>
                {tb.label}
                <span style={{ background:tab===tb.key?"rgba(255,255,255,0.25)":t.surface2,borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:800 }}>{tb.count}</span>
              </button>
            ))}
          </div>

          {isAdmin && <button onClick={()=>setShowCreate(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:12,padding:"11px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(15,157,173,0.3)" }}><Icon name="add" size={16}/> New Event</button>}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:200,flexDirection:"column",gap:14 }}>
            <div style={{ width:36,height:36,border:"3px solid #0F9DAD33",borderTop:"3px solid #0F9DAD",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
            <div style={{ color:t.textMuted,fontSize:14 }}>Loading events...</div>
          </div>
        )}

        {/* Empty states */}
        {!loading && tab==="active" && activeEvents.length===0 && (
          <div style={{ textAlign:"center",padding:"70px 20px",background:t.surface,borderRadius:20,border:`2px dashed ${t.border}` }}>
            <div style={{ fontSize:52,marginBottom:14 }}>🎉</div>
            <div style={{ fontSize:18,fontWeight:700,color:t.text,marginBottom:8 }}>{events.length>0?"All events are completed!":"No events yet"}</div>
            <div style={{ fontSize:13,color:t.textMuted,marginBottom:22 }}>{events.length>0?"Create a new event to get started again.":"Create your first event — marriage, puberty function, birthday and more"}</div>
            <button onClick={()=>setShowCreate(true)} style={{ background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:12,padding:"11px 26px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ Create Event</button>
          </div>
        )}

        {!loading && tab==="completed" && completedEvents.length===0 && (
          <div style={{ textAlign:"center",padding:"70px 20px",background:t.surface,borderRadius:20,border:`2px dashed ${t.border}` }}>
            <div style={{ fontSize:52,marginBottom:14 }}>📋</div>
            <div style={{ fontSize:18,fontWeight:700,color:t.text,marginBottom:8 }}>No completed events yet</div>
            <div style={{ fontSize:13,color:t.textMuted,marginBottom:22 }}>Once you mark an active event as done, it will appear here with all its records preserved.</div>
            <button onClick={()=>setTab("active")} style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:12,padding:"11px 26px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>← View Active Events</button>
          </div>
        )}

        {/* Event Cards */}
        {!loading && shownEvents.length>0 && (
          <>
            {/* Completed page header */}
            {tab==="completed" && (
              <div style={{ background:"linear-gradient(135deg,#10b98118,#10b98108)",border:"1px solid #10b98133",borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ fontSize:28 }}>🏆</div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#10b981" }}>Completed Events Archive</div>
                  <div style={{ fontSize:12,color:t.textMuted,marginTop:2 }}>{completedEvents.length} event{completedEvents.length!==1?"s":""} completed · Total collected: <strong style={{ color:"#10b981" }}>{formatCurrency(totalCompleted)}</strong></div>
                </div>
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18,animation:"fadeUp 0.35s ease" }}>
              {shownEvents.map(ev=><EventCard key={ev.id} ev={ev}/>)}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isAdmin && <EventFormModal open={showCreate||!!showEdit} editEvent={showEdit} onClose={()=>{setShowCreate(false);setShowEdit(null);}} addToast={addToast} t={t}/>}

      {/* Mark Complete Confirm */}
      <Modal open={!!completeConfirm} onClose={()=>setCompleteConfirm(null)} title="Mark as Completed?" th={t}>
        <div style={{ textAlign:"center",padding:"10px 0 6px" }}>
          <div style={{ fontSize:44,marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16,fontWeight:700,color:t.text,marginBottom:8 }}>{completeConfirm?.name}</div>
          <div style={{ fontSize:13,color:t.textMuted,marginBottom:6 }}>This event will be moved to <strong style={{ color:"#10b981" }}>Completed Events</strong>.</div>
          <div style={{ fontSize:13,color:t.textMuted,marginBottom:20 }}>All data is saved — you can still view records, print receipts and export. You can also reopen it anytime.</div>
          <div style={{ background:t.surface2,borderRadius:12,padding:"14px 16px",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:20,fontWeight:800,color:"#0F9DAD" }}>{formatCurrency(completeConfirm?.totalAmount||0)}</div>
              <div style={{ fontSize:11,color:t.textMuted }}>Total Collected</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:20,fontWeight:800,color:t.text }}>{completeConfirm?.entryCount||0}</div>
              <div style={{ fontSize:11,color:t.textMuted }}>Total Guests</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:12,justifyContent:"flex-end" }}>
          <button onClick={()=>setCompleteConfirm(null)} style={{ padding:"10px 20px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>handleMarkComplete(completeConfirm)} style={{ padding:"10px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14 }}>✅ Mark Completed</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Delete Event?" th={t}>
        <p style={{ color:t.textMid,marginTop:0 }}>Delete <strong style={{ color:t.text }}>{deleteConfirm?.name}</strong>? All entries will be permanently lost and cannot be recovered.</p>
        <div style={{ display:"flex",gap:12,justifyContent:"flex-end",marginTop:20 }}>
          <button onClick={()=>setDeleteConfirm(null)} style={{ padding:"10px 20px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>handleDelete(deleteConfirm)} style={{ padding:"10px 20px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Delete Event</button>
        </div>
      </Modal>

    </div>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────
function EventFormModal({ open, editEvent, onClose, addToast, t }) {
  const blank = { name:"", eventType:"marriage", eventDate:"", place:"", brideName:"", groomName:"", familyName:"", headerNote:"With Blessings & Best Wishes", googleSheetWebhook:"" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ setForm(editEvent?{...blank,...editEvent}:blank); },[editEvent,open]);

  const showNameFields = ["marriage","engagement"].includes(form.eventType);

  const handleSave = async () => {
    if(!form.name.trim()) { addToast("Event name is required","warning"); return; }
    setSaving(true);
    try {
      if(editEvent) {
        await updateDoc(doc(db,"events",editEvent.id),{...form,updatedAt:new Date().toISOString()});
        addToast("Event updated ✓");
      } else {
        await addDoc(collection(db,"events"),{...form,createdAt:new Date().toISOString(),totalAmount:0,entryCount:0});
        addToast(`"${form.name}" created 🎉`);
      }
      onClose();
    } catch(err){ addToast("Error: "+err.message,"error"); }
    setSaving(false);
  };

  if(!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={editEvent?"Edit Event":"Create New Event"} th={t}>
      <Sel label="Event Type" value={form.eventType} onChange={v=>set("eventType",v)} options={EVENT_TYPES.map(e=>({value:e.value,label:e.label}))} th={t}/>
      <Input label="Event Name" value={form.name} onChange={v=>set("name",v)} placeholder={`e.g. ${form.eventType==="marriage"?"Raj & Priya Marriage":form.eventType==="puberty"?"Priya Puberty Function":"My Event"}`} required th={t}/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px" }}>
        <Input label="Event Date" value={form.eventDate} onChange={v=>set("eventDate",v)} type="date" th={t}/>
        <Input label="Venue / Place" value={form.place} onChange={v=>set("place",v)} placeholder="Chennai" th={t}/>
      </div>
      {showNameFields && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px" }}>
          <Input label="Bride's Name" value={form.brideName} onChange={v=>set("brideName",v)} placeholder="Priya" th={t}/>
          <Input label="Groom's Name" value={form.groomName} onChange={v=>set("groomName",v)} placeholder="Raj" th={t}/>
        </div>
      )}
      <Input label="Family Name" value={form.familyName} onChange={v=>set("familyName",v)} placeholder="e.g. Murugan Family" th={t}/>
      <Input label="Receipt Note" value={form.headerNote} onChange={v=>set("headerNote",v)} placeholder="With Blessings & Best Wishes" th={t}/>
      <Input label="Google Sheets Webhook (optional)" value={form.googleSheetWebhook||""} onChange={v=>set("googleSheetWebhook",v)} placeholder="https://script.google.com/macros/s/.../exec" th={t}/>
      <div style={{ display:"flex",gap:12,marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1,padding:"12px 0",borderRadius:11,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex:2,background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"12px 0",color:saving?t.textMuted:"#fff",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit" }}>
          {saving?"Saving...":(editEvent?"Update Event ✓":"Create Event →")}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ─── EVENT APP (inside a single event) ───────────────────────────────
// ══════════════════════════════════════════════════════════════════════
function EventApp({ event, theme, toggleTheme, onBack, t }) {
  const [page, setPage]           = useState("dashboard");
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [receiptEntry, setReceiptEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [online, setOnline]       = useState(navigator.onLine);

  // Firestore path: events/{eventId}/entries
  const entriesCol = collection(db, "events", event.id, "entries");

  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return ()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  },[]);

  useEffect(()=>{
    const q=query(entriesCol,orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{ setEntries(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },()=>setLoading(false));
    return unsub;
  },[event.id]);

  const addToast=useCallback((msg,type="success")=>{
    const id=Date.now().toString();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  // Update event totals on entries change
  useEffect(()=>{
    if(loading) return;
    const total=entries.filter(e=>isMoneyType(e.giftType||e.mode)).reduce((s,e)=>s+Number(e.amount||0),0);
    updateDoc(doc(db,"events",event.id),{ totalAmount:total, entryCount:entries.length }).catch(()=>{});
  },[entries,loading]);

  const addEntry = async (data) => {
    const e={...data,createdAt:new Date().toISOString(),date:new Date().toISOString()};
    const r=await addDoc(entriesCol,e);
    return {id:r.id,...e};
  };
  const updateEntry = async (id,data) => { await updateDoc(doc(db,"events",event.id,"entries",id),data); };
  const deleteEntry = async (id)  => { await deleteDoc(doc(db,"events",event.id,"entries",id)); };

  const navItems = [
    {id:"dashboard",label:"Dashboard",icon:"dashboard"},
    {id:"add",label:"Add Entry",icon:"add"},
    {id:"records",label:"Records",icon:"records"},
    {id:"export",label:"Export",icon:"export"},
    {id:"settings",label:"Event Settings",icon:"settings"},
  ];

  const color = eventColor(event.eventType);

  return (
    <div style={{ minHeight:"100vh",background:t.bg,fontFamily:"'Sora','Segoe UI',sans-serif",color:t.text,display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:${t.bg}} ::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:3px}
        input::placeholder,textarea::placeholder{color:${t.textDim}!important}
        select option{background:${t.surface};color:${t.text}}
        @media print{.no-print{display:none!important}body{background:white!important;color:black!important}}
      `}</style>

      {/* Sidebar */}
      <div className="no-print" style={{ width:240,background:t.sidebarBg,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",padding:"20px 0",position:"fixed",top:0,left:sidebarOpen?0:-240,height:"100vh",zIndex:200,transition:"left 0.3s ease" }}>
        <div style={{ padding:"0 16px 16px",borderBottom:`1px solid ${t.border}`,marginBottom:12 }}>
          <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:8,background:t.surface2,border:`1px solid ${t.border}`,borderRadius:9,padding:"7px 12px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,marginBottom:14,width:"100%" }}>
            <Icon name="back" size={13}/> All Events
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            <span style={{ fontSize:18 }}>{eventLabel(event.eventType).split(" ")[0]}</span>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:t.text,lineHeight:1.2 }}>{event.name}</div>
              <span style={{ background:`${color}18`,color,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700 }}>{eventLabel(event.eventType)}</span>
            </div>
          </div>
          {event.eventDate && <div style={{ fontSize:11,color:t.textDim,marginTop:4 }}>📅 {new Date(event.eventDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}
        </div>
        <nav style={{ flex:1,padding:"0 10px" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}}
              style={{ width:"100%",display:"flex",alignItems:"center",gap:11,padding:"10px 13px",borderRadius:10,border:"none",cursor:"pointer",background:page===item.id?`${color}14`:"transparent",color:page===item.id?color:t.textMuted,fontSize:13,fontWeight:page===item.id?700:500,fontFamily:"inherit",marginBottom:3,textAlign:"left",borderLeft:page===item.id?`3px solid ${color}`:"3px solid transparent",transition:"all 0.15s" }}>
              <Icon name={item.icon} size={16}/>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 10px",borderTop:`1px solid ${t.border}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 13px",fontSize:12 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:online?"#10b981":"#ef4444",boxShadow:online?"0 0 6px #10b981":"none" }}/>
            <span style={{ color:online?"#10b981":"#ef4444",fontWeight:600 }}>{online?"Synced":"Offline"}</span>
          </div>
          <div style={{ textAlign:"center",marginTop:8,fontSize:10,color:t.textDim }}>🐝 Powered by AllBee Solutions</div>
        </div>
      </div>

      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:199 }}/>}

      {/* Main */}
      <div style={{ flex:1,marginLeft:240,minHeight:"100vh",display:"flex",flexDirection:"column" }} className="main-content">
        <style>{`@media(max-width:768px){.main-content{margin-left:0!important}}`}</style>
        <div className="no-print" style={{ background:t.topbarBg,borderBottom:`1px solid ${t.border}`,padding:"13px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <button className="mob-btn" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none",border:"none",color:t.textMid,cursor:"pointer",padding:4,display:"none" }}><Icon name="menu" size={22}/></button>
            <style>{`@media(max-width:768px){.mob-btn{display:block!important}.no-print{left:0!important}}@media(min-width:769px){.no-print{left:0!important}}`}</style>
            <div>
              <div style={{ fontSize:16,fontWeight:700,color:t.text }}>{navItems.find(n=>n.id===page)?.label}</div>
              <div style={{ fontSize:11,color:t.textMuted }}>{event.name} · {entries.length} entries</div>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {loading&&<div style={{ width:16,height:16,border:"2px solid #0F9DAD33",borderTop:"2px solid #0F9DAD",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>}
            <div style={{ background:`${color}18`,border:`1px solid ${color}33`,borderRadius:8,padding:"5px 12px",fontSize:12,color,fontWeight:600 }}>{entries.length} Entries</div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
          </div>
        </div>

        <div style={{ flex:1,padding:"24px 22px",maxWidth:1200,width:"100%" }}>
          {page==="dashboard" && <DashboardPage entries={entries} event={event} t={t} loading={loading}/>}
          {page==="add"       && <AddEntryPage addEntry={addEntry} updateEntry={updateEntry} addToast={addToast} editEntry={editEntry} setEditEntry={setEditEntry} setPage={setPage} event={event} t={t}/>}
          {page==="records"   && <RecordsPage entries={entries} addToast={addToast} setEditEntry={setEditEntry} setPage={setPage} setReceiptEntry={setReceiptEntry} setDeleteConfirm={setDeleteConfirm} event={event} t={t}/>}
          {page==="export"    && <ExportPage entries={entries} event={event} addToast={addToast} t={t}/>}
          {page==="settings"  && <EventSettingsPage event={event} addToast={addToast} t={t}/>}
        </div>
      </div>

      {receiptEntry && <ReceiptModal entry={receiptEntry} event={event} onClose={()=>setReceiptEntry(null)} t={t}/>}
      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Confirm Delete" th={t}>
        <p style={{ color:t.textMid,marginTop:0 }}>Delete entry for <strong style={{ color:t.text }}>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div style={{ display:"flex",gap:12,justifyContent:"flex-end",marginTop:20 }}>
          <button onClick={()=>setDeleteConfirm(null)} style={{ padding:"10px 20px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={async()=>{ await deleteEntry(deleteConfirm.id); addToast("Entry deleted","error"); setDeleteConfirm(null); }} style={{ padding:"10px 20px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Delete</button>
        </div>
      </Modal>
      <Toast toasts={toasts}/>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function DashboardPage({ entries, event, t, loading }) {
  const moneyEntries = entries.filter(e=>isMoneyType(e.giftType||e.mode));
  const giftEntries  = entries.filter(e=>!isMoneyType(e.giftType||e.mode));
  const total        = moneyEntries.reduce((s,e)=>s+Number(e.amount||0),0);
  const todayE       = entries.filter(e=>e.date?.slice(0,10)===todayStr());
  const todayMoney   = todayE.filter(e=>isMoneyType(e.giftType||e.mode)).reduce((s,e)=>s+Number(e.amount||0),0);
  const highest      = moneyEntries.length?Math.max(...moneyEntries.map(e=>Number(e.amount||0))):0;
  const highestE     = moneyEntries.find(e=>Number(e.amount||0)===highest);
  const byMode       = {Cash:0,UPI:0,Bank:0};
  moneyEntries.forEach(e=>{ if(byMode[e.giftType||e.mode]!==undefined) byMode[e.giftType||e.mode]+=Number(e.amount||0); });
  const byGiftType   = {};
  GIFT_TYPES.forEach(g=>{byGiftType[g.value]=0;});
  entries.forEach(e=>{const k=e.giftType||e.mode;if(byGiftType[k]!==undefined)byGiftType[k]++;});
  const color = eventColor(event.eventType);

  if(loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:280,flexDirection:"column",gap:14 }}><div style={{ width:36,height:36,border:"3px solid #0F9DAD33",borderTop:"3px solid #0F9DAD",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/><div style={{ color:t.textMuted,fontSize:14 }}>Loading...</div></div>;

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      <div style={{ background:`linear-gradient(135deg,${color}18 0%,${color}08 50%,${t.surface} 100%)`,border:`1px solid ${color}33`,borderRadius:18,padding:"24px 28px",marginBottom:24 }}>
        <div style={{ fontSize:12,color,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5 }}>{eventLabel(event.eventType)} · Live Sync</div>
        <div style={{ fontSize:26,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif" }}>{event.name}</div>
        <div style={{ fontSize:13,color:t.textMid,marginTop:5 }}>
          {event.brideName&&event.groomName&&`${event.brideName} ♥ ${event.groomName} · `}{event.familyName||""}{event.place&&` · 📍 ${event.place}`}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:14,marginBottom:24 }}>
        <StatCard icon="money"    label="Cash/UPI/Bank Total" value={formatCurrency(total)}      accent="#0F9DAD" sub={`${moneyEntries.length} payments`}  th={t}/>
        <StatCard icon="users"    label="Total Guests"         value={entries.length}             accent="#6366f1" sub="all entries"                        th={t}/>
        <StatCard icon="calendar" label="Today's Collection"   value={formatCurrency(todayMoney)} accent="#10b981" sub={`${todayE.length} today`}           th={t}/>
        <StatCard icon="trophy"   label="Highest Gift"         value={formatCurrency(highest)}    accent="#f59e0b" sub={highestE?.name||"—"}                th={t}/>
        <StatCard icon="gift"     label="Physical Gifts"       value={giftEntries.length}         accent="#ec4899" sub="gold, silver & more"                th={t}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22 }}>
          <div style={{ fontSize:13,fontWeight:700,color:t.textMuted,marginBottom:18,textTransform:"uppercase",letterSpacing:"0.05em" }}>Gift Breakdown</div>
          {GIFT_TYPES.map(g=>{
            const cnt=byGiftType[g.value]||0;
            const pct=entries.length>0?(cnt/entries.length)*100:0;
            return (
              <div key={g.value} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12,color:t.text }}>{g.label}</span>
                  <span style={{ fontSize:12,color:g.color,fontWeight:700 }}>{cnt}</span>
                </div>
                <div style={{ height:4,background:t.border,borderRadius:2 }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:g.color,borderRadius:2,transition:"width 0.8s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22 }}>
          <div style={{ fontSize:13,fontWeight:700,color:t.textMuted,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.05em" }}>Recent Entries</div>
          {entries.length===0&&<div style={{ color:t.textDim,fontSize:13 }}>No entries yet</div>}
          {entries.slice(0,8).map(e=>{
            const gt=e.giftType||e.mode; const money=isMoneyType(gt);
            return (
              <div key={e.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${t.surface2}` }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:t.text }}>{e.name}</div>
                  <div style={{ fontSize:11,color:t.textMuted }}>{e.place||""}  <span style={{ color:giftColor(gt) }}>{giftLabel(gt)}</span></div>
                </div>
                {money?<span style={{ fontSize:13,fontWeight:700,color:"#0F9DAD" }}>{formatCurrency(e.amount)}</span>:<span style={{ fontSize:12,fontWeight:600,color:giftColor(gt) }}>{e.giftDesc||gt}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADD ENTRY ────────────────────────────────────────────────────────
function AddEntryPage({ addEntry, updateEntry, addToast, editEntry, setEditEntry, setPage, event, t }) {
  const blank={name:"",mobile:"",place:"",giftType:"Cash",amount:"",giftDesc:"",giftWeight:"",giftUnit:"g",notes:""};
  const [form,setForm]=useState(()=>editEntry?{...blank,...editEntry}:blank);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{ setForm(editEntry?{...blank,...editEntry}:blank); },[editEntry]);
  const isMoney=isMoneyType(form.giftType);
  const quickAmounts=[101,501,1001,2001,5001,10001];

  const handleSubmit=async()=>{
    if(!form.name.trim()){addToast("Guest name required","warning");return;}
    if(isMoney&&!form.amount){addToast("Amount required","warning");return;}
    if(!isMoney&&!form.giftDesc.trim()){addToast("Describe the gift","warning");return;}
    setSaving(true);
    try {
      const payload={...form,amount:isMoney?Number(form.amount):0};
      if(editEntry){await updateEntry(editEntry.id,payload);addToast("Updated ✓");setEditEntry(null);setPage("records");}
      else{
        await addEntry(payload);
        addToast(isMoney?`₹${Number(form.amount).toLocaleString("en-IN")} saved for ${form.name} 🎉`:`${form.giftDesc} recorded for ${form.name} 🎁`);
        setForm(blank);
      }
    } catch(err){addToast("Error: "+err.message,"error");}
    setSaving(false);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease",maxWidth:640 }}>
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:18,padding:28 }}>
        <div style={{ fontSize:12,color:"#0F9DAD",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>{editEntry?"✏️ Edit":"🎁 New"} Entry</div>
        <div style={{ fontSize:20,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif",marginBottom:22 }}>{editEntry?"Update Gift Entry":"Record a Gift"}</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
          <div style={{ gridColumn:"1/-1" }}><Input label="Guest Name" value={form.name} onChange={v=>set("name",v)} placeholder="Full name" required th={t}/></div>
          <Input label="Mobile" value={form.mobile} onChange={v=>set("mobile",v)} placeholder="9876543210" type="tel" th={t}/>
          <Input label="Place" value={form.place} onChange={v=>set("place",v)} placeholder="Chennai" th={t}/>
        </div>
        {/* Gift type grid */}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>Gift Type <span style={{ color:"#0F9DAD" }}>*</span></label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7 }}>
            {GIFT_TYPES.map(g=>{
              const active=form.giftType===g.value;
              return <button key={g.value} onClick={()=>set("giftType",g.value)} style={{ padding:"11px 6px",borderRadius:11,border:`2px solid ${active?g.color:t.border}`,background:active?`${g.color}18`:t.inputBg,color:active?g.color:t.textMuted,cursor:"pointer",fontSize:12,fontWeight:active?700:500,fontFamily:"inherit",transition:"all 0.15s",textAlign:"center" }}>
                <div style={{ fontSize:18,marginBottom:3 }}>{g.label.split(" ")[0]}</div>
                <div>{g.label.split(" ").slice(1).join(" ")}</div>
              </button>;
            })}
          </div>
        </div>
        {isMoney&&(
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.05em" }}>Quick Amount</label>
              <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
                {quickAmounts.map(a=><button key={a} onClick={()=>set("amount",a)} style={{ padding:"7px 13px",borderRadius:8,border:`1.5px solid ${form.amount==a?"#0F9DAD":t.border}`,background:form.amount==a?"#0F9DAD18":t.inputBg,color:form.amount==a?"#0F9DAD":t.textMuted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>₹{a.toLocaleString("en-IN")}</button>)}
              </div>
            </div>
            <Input label="Amount (₹)" value={form.amount} onChange={v=>set("amount",v)} placeholder="Enter amount" type="number" required th={t}/>
          </>
        )}
        {!isMoney&&(
          <div style={{ background:`${giftColor(form.giftType)}0d`,border:`1.5px solid ${giftColor(form.giftType)}33`,borderRadius:12,padding:16,marginBottom:14 }}>
            <div style={{ fontSize:12,fontWeight:700,color:giftColor(form.giftType),marginBottom:12 }}>{giftLabel(form.giftType)} Details</div>
            <Input label="Description" value={form.giftDesc} onChange={v=>set("giftDesc",v)} placeholder={form.giftType==="Gold"?"e.g. Gold chain, Ring":form.giftType==="Silver"?"e.g. Silver plate, Coins":"e.g. Silk saree, Watch"} required th={t}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
              <Input label="Weight / Qty" value={form.giftWeight} onChange={v=>set("giftWeight",v)} placeholder="e.g. 10" th={t}/>
              <Sel label="Unit" value={form.giftUnit||"g"} onChange={v=>set("giftUnit",v)} options={[{value:"g",label:"Grams"},{value:"kg",label:"Kg"},{value:"pcs",label:"Pieces"},{value:"sets",label:"Sets"},{value:"nos",label:"Nos"}]} th={t}/>
            </div>
            {(form.giftType==="Gold"||form.giftType==="Silver")&&<Input label="Est. Value (₹)" value={form.amount} onChange={v=>set("amount",v)} placeholder="Approx market value" type="number" th={t}/>}
          </div>
        )}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em" }}>Notes</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..." rows={2} style={{ width:"100%",background:t.inputBg,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"10px 13px",color:t.text,fontSize:14,outline:"none",resize:"vertical",fontFamily:"inherit" }}/>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          {editEntry&&<button onClick={()=>{setEditEntry(null);setPage("records");}} style={{ flex:1,padding:"13px 0",borderRadius:11,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Cancel</button>}
          <button onClick={handleSubmit} disabled={saving} style={{ flex:2,background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"13px 0",color:saving?t.textMuted:"#fff",fontSize:15,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:saving?"none":"0 4px 20px rgba(15,157,173,0.3)" }}>
            {saving?"Saving...":editEntry?"Update ✓":"Save Entry →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS ─────────────────────────────────────────────────────────
function RecordsPage({ entries, addToast, setEditEntry, setPage, setReceiptEntry, setDeleteConfirm, event, t }) {
  const [search,setSearch]=useState("");
  const [filterType,setFilterType]=useState("All");
  const [filterDate,setFilterDate]=useState("");
  const [sortBy,setSortBy]=useState("newest");

  let filtered=entries.filter(e=>{
    const q=search.toLowerCase(); const gt=e.giftType||e.mode;
    if(search&&!e.name?.toLowerCase().includes(q)&&!e.place?.toLowerCase().includes(q)&&!e.mobile?.includes(q)&&!e.giftDesc?.toLowerCase().includes(q)) return false;
    if(filterType!=="All"&&gt!==filterType) return false;
    if(filterDate&&e.date?.slice(0,10)!==filterDate) return false;
    return true;
  });
  if(sortBy==="newest")  filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  if(sortBy==="oldest")  filtered.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  if(sortBy==="highest") filtered.sort((a,b)=>Number(b.amount||0)-Number(a.amount||0));
  if(sortBy==="name")    filtered.sort((a,b)=>a.name.localeCompare(b.name));

  const moneyTotal=filtered.filter(e=>isMoneyType(e.giftType||e.mode)).reduce((s,e)=>s+Number(e.amount||0),0);

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:"16px 18px",marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, place, gift..." style={{ flex:1,minWidth:180,background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:13,outline:"none",fontFamily:"inherit" }}/>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:12,fontFamily:"inherit",outline:"none" }}>
          <option value="All">All Types</option>
          {GIFT_TYPES.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:12,fontFamily:"inherit",outline:"none",colorScheme:t.colorScheme }}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:12,fontFamily:"inherit",outline:"none" }}>
          {[["newest","Newest"],["oldest","Oldest"],["highest","Highest ₹"],["name","Name A-Z"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        {(search||filterType!=="All"||filterDate)&&<button onClick={()=>{setSearch("");setFilterType("All");setFilterDate("");}} style={{ background:"#ef444418",border:"1px solid #ef444433",borderRadius:8,padding:"9px 13px",color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Clear</button>}
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12,padding:"0 2px" }}>
        <div style={{ fontSize:13,color:t.textMuted }}>{filtered.length} entries</div>
        <div style={{ fontSize:14,fontWeight:700,color:"#0F9DAD" }}>Cash Total: {formatCurrency(moneyTotal)}</div>
      </div>
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:t.surface2 }}>
              {["#","Name","Place","Mobile","Type","Amount / Gift","Date",""].map(h=><th key={h} style={{ padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={8} style={{ textAlign:"center",padding:"44px 16px",color:t.textDim,fontSize:14 }}>No entries found</td></tr>}
              {filtered.map((e,i)=>{
                const gt=e.giftType||e.mode; const money=isMoneyType(gt); const clr=giftColor(gt);
                return <tr key={e.id} style={{ borderTop:`1px solid ${t.surface2}` }}
                  onMouseEnter={el=>el.currentTarget.style.background=t.hoverBg}
                  onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"11px 14px",color:t.textDim,fontSize:12 }}>{i+1}</td>
                  <td style={{ padding:"11px 14px",fontWeight:600,color:t.text,fontSize:13 }}>{e.name}</td>
                  <td style={{ padding:"11px 14px",color:t.textMid,fontSize:12 }}>{e.place||"—"}</td>
                  <td style={{ padding:"11px 14px",color:t.textMid,fontSize:12 }}>{e.mobile||"—"}</td>
                  <td style={{ padding:"11px 14px" }}><span style={{ background:`${clr}18`,color:clr,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700 }}>{giftLabel(gt)}</span></td>
                  <td style={{ padding:"11px 14px",fontSize:12 }}>
                    {money?<span style={{ fontWeight:700,color:"#0F9DAD" }}>{formatCurrency(e.amount)}</span>
                    :<div><div style={{ fontWeight:600,color:clr,fontSize:13 }}>{e.giftDesc||gt}</div>{e.giftWeight&&<div style={{ fontSize:10,color:t.textDim }}>{e.giftWeight} {e.giftUnit||"g"}{e.amount>0?` · Est. ${formatCurrency(e.amount)}`:""}</div>}</div>}
                  </td>
                  <td style={{ padding:"11px 14px",color:t.textMuted,fontSize:11,whiteSpace:"nowrap" }}>{formatDate(e.createdAt)}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={()=>setReceiptEntry(e)} style={{ background:"#0F9DAD18",border:"none",borderRadius:6,padding:"5px 7px",color:"#0F9DAD",cursor:"pointer" }}><Icon name="eye" size={13}/></button>
                      <button onClick={()=>{setEditEntry(e);setPage("add");}} style={{ background:"#6366f118",border:"none",borderRadius:6,padding:"5px 7px",color:"#6366f1",cursor:"pointer" }}><Icon name="edit" size={13}/></button>
                      <button onClick={()=>setDeleteConfirm(e)} style={{ background:"#ef444418",border:"none",borderRadius:6,padding:"5px 7px",color:"#ef4444",cursor:"pointer" }}><Icon name="delete" size={13}/></button>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── RECEIPT MODAL ────────────────────────────────────────────────────
function ReceiptModal({ entry, event, onClose, t }) {
  const gt=entry.giftType||entry.mode; const money=isMoneyType(gt);
  const handlePrint=()=>{
    const w=window.open("","_blank","width=400,height=640");
    const giftBlock=money
      ?`<div class="amt"><div class="albl">Gift Amount</div><div class="aval">${formatCurrency(entry.amount)}</div></div>`
      :`<div class="amt"><div class="albl">Gift</div><div class="gval">${entry.giftDesc||gt}${entry.giftWeight?` · ${entry.giftWeight} ${entry.giftUnit||"g"}`:""}</div>${entry.amount>0?`<div style="font-size:12px;color:#999;margin-top:4px">Est. ${formatCurrency(entry.amount)}</div>`:""}</div>`;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;background:#fff;color:#1a1a1a;max-width:380px}
    .logo{font-size:22px;font-weight:900;color:#0F9DAD}.tag{font-size:10px;color:#999;letter-spacing:.2em;text-transform:uppercase}
    .hdr{text-align:center;padding-bottom:14px;border-bottom:1px dashed #ccc;margin-bottom:14px}
    .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
    .lbl{color:#666}.val{font-weight:600}
    .amt{background:#f0fafa;border-radius:8px;padding:14px;text-align:center;margin:16px 0}
    .albl{font-size:11px;color:#666;margin-bottom:4px}.aval{font-size:30px;font-weight:900;color:#0F9DAD}
    .gval{font-size:20px;font-weight:800;color:#f59e0b}
    .note{text-align:center;font-size:12px;color:#555;font-style:italic}
    .footer{text-align:center;margin-top:20px;font-size:10px;color:#999;border-top:1px dashed #ccc;padding-top:14px}
    </style></head><body>
    <div class="hdr"><div class="logo">moiBEE</div><div class="tag">TRACK EVERY BLESSING</div>
    <div style="font-size:16px;font-weight:700;margin-top:8px">${event.name}</div>
    <div style="font-size:12px;color:#555">${event.familyName||""}</div>
    <div style="font-size:10px;color:#999;margin-top:5px">Receipt #${entry.id?.slice(-6).toUpperCase()}</div></div>
    ${[["Guest Name",entry.name],["Mobile",entry.mobile||"—"],["Place",entry.place||"—"],["Gift Type",giftLabel(gt)],["Date",formatDate(entry.createdAt)],...(entry.notes?[["Notes",entry.notes]]:[])].map(([l,v])=>`<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
    ${giftBlock}
    <div class="note">${event.headerNote||"With Blessings & Best Wishes"}</div>
    <div class="footer">🐝 Powered by AllBee Solutions · MoiBee</div></body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close();},300);
  };
  return (
    <Modal open={true} onClose={onClose} title="Receipt" th={t}>
      <div style={{ border:`2px solid ${giftColor(gt)}33`,borderRadius:12,padding:22,background:t.surface2 }}>
        <div style={{ textAlign:"center",marginBottom:16,borderBottom:`1px dashed ${t.border}`,paddingBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8 }}><MoiBeeLogo size={32}/><div><div style={{ fontSize:18,fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div></div></div>
          <div style={{ fontSize:16,fontWeight:700,color:t.text }}>{event.name}</div>
          <div style={{ fontSize:12,color:t.textMuted }}>{event.familyName||""}</div>
          <div style={{ fontSize:10,color:t.textDim,marginTop:6 }}>Receipt #{entry.id?.slice(-6).toUpperCase()}</div>
        </div>
        {[["Guest",entry.name],["Mobile",entry.mobile||"—"],["Place",entry.place||"—"],["Type",giftLabel(gt)],["Date",formatDate(entry.createdAt)],...(entry.notes?[["Notes",entry.notes]]:[])].map(([l,v])=>(
          <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${t.border}`,fontSize:13 }}>
            <span style={{ color:t.textMuted }}>{l}</span><span style={{ fontWeight:600,color:t.text }}>{v}</span>
          </div>
        ))}
        <div style={{ background:`${giftColor(gt)}12`,border:`1px solid ${giftColor(gt)}33`,borderRadius:10,padding:18,textAlign:"center",margin:"16px 0" }}>
          <div style={{ fontSize:11,color:t.textMuted,textTransform:"uppercase",marginBottom:4 }}>{money?"Gift Amount":"Gift"}</div>
          {money?<div style={{ fontSize:32,fontWeight:900,color:"#0F9DAD" }}>{formatCurrency(entry.amount)}</div>
          :<><div style={{ fontSize:20,fontWeight:800,color:giftColor(gt) }}>{entry.giftDesc||giftLabel(gt)}</div>{entry.giftWeight&&<div style={{ fontSize:13,color:t.textMid,marginTop:3 }}>{entry.giftWeight} {entry.giftUnit||"g"}</div>}{entry.amount>0&&<div style={{ fontSize:12,color:t.textDim,marginTop:3 }}>Est. {formatCurrency(entry.amount)}</div>}</>}
        </div>
        <div style={{ textAlign:"center",fontSize:12,color:t.textMid,fontStyle:"italic" }}>{event.headerNote||"With Blessings & Best Wishes"}</div>
      </div>
      <div style={{ display:"flex",gap:10,marginTop:18,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 18px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Close</button>
        <button onClick={handlePrint} style={{ padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7 }}><Icon name="print" size={15}/> Print</button>
      </div>
    </Modal>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────
function ExportPage({ entries, event, addToast, t }) {
  const moneyEntries=entries.filter(e=>isMoneyType(e.giftType||e.mode));
  const giftEntries=entries.filter(e=>!isMoneyType(e.giftType||e.mode));
  const total=moneyEntries.reduce((s,e)=>s+Number(e.amount||0),0);

  const exportCSV=()=>{
    const h=["#","Name","Mobile","Place","Gift Type","Amount (₹)","Gift Description","Weight","Unit","Date","Notes"];
    const rows=entries.map((e,i)=>[i+1,e.name,e.mobile||"",e.place||"",e.giftType||e.mode,e.amount||"",e.giftDesc||"",e.giftWeight||"",e.giftUnit||"",e.date?new Date(e.date).toLocaleDateString("en-IN"):"",e.notes||""]);
    const csv=[h,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a"); a.href=url; a.download=`MoiBee_${event.name.replace(/\s+/g,"_")}_${todayStr()}.csv`; a.click(); URL.revokeObjectURL(url);
    addToast("CSV exported!");
  };

  const exportPrint=()=>{
    const rows=entries.map((e,i)=>{
      const gt=e.giftType||e.mode; const money=isMoneyType(gt);
      return `<tr><td>${i+1}</td><td>${e.name}</td><td>${e.place||"—"}</td><td>${e.mobile||"—"}</td><td><span style="background:${giftColor(gt)}18;color:${giftColor(gt)};padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px">${giftLabel(gt)}</span></td><td>${money?`<b style="color:#0F9DAD">${formatCurrency(e.amount)}</b>`:e.giftDesc||gt}${e.giftWeight?` (${e.giftWeight}${e.giftUnit||"g"})`:""}${!money&&e.amount>0?`<br><small style="color:#999">Est.${formatCurrency(e.amount)}</small>`:""}</td><td>${e.date?new Date(e.date).toLocaleDateString("en-IN"):"—"}</td></tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><title>${event.name}</title>
    <style>body{font-family:Georgia,serif;margin:0;padding:20px;background:#fff;color:#1a1a1a}h1{color:#0F9DAD;font-size:24px}.st{display:inline-block;background:#f0fafa;border:1px solid #0F9DAD33;border-radius:8px;padding:10px 18px;text-align:center;margin:0 10px 14px 0}.sv{font-size:20px;font-weight:900;color:#0F9DAD}.sl{font-size:11px;color:#666;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0F9DAD;color:#fff;padding:9px 11px;text-align:left}td{padding:8px 11px;border-bottom:1px solid #eee;vertical-align:top}tr:nth-child(even){background:#f8f8f8}.footer{margin-top:20px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px}</style>
    </head><body><h1>🐝 ${event.name}</h1>
    <div style="font-size:13px;color:#555;margin-bottom:16px">${eventLabel(event.eventType)} · ${event.familyName||""} · Exported ${new Date().toLocaleDateString("en-IN")}</div>
    <div><div class="st"><div class="sv">${formatCurrency(total)}</div><div class="sl">Cash Total</div></div><div class="st"><div class="sv">${entries.length}</div><div class="sl">Guests</div></div><div class="st"><div class="sv">${giftEntries.length}</div><div class="sl">Gifts</div></div></div>
    <table><thead><tr><th>#</th><th>Name</th><th>Place</th><th>Mobile</th><th>Type</th><th>Amount/Gift</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">🐝 Powered by AllBee Solutions · MoiBee — Track Every Blessing</div></body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
    addToast("Print view opened!");
  };

  const byType={};GIFT_TYPES.forEach(g=>{byType[g.value]=0;});entries.forEach(e=>{const k=e.giftType||e.mode;if(byType[k]!==undefined)byType[k]++;});

  return (
    <div style={{ animation:"fadeUp 0.4s ease",maxWidth:680 }}>
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:20,marginBottom:16 }}>
        <div style={{ fontSize:12,color:t.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14 }}>Summary — {event.name}</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
          {[["Cash Total",formatCurrency(total),"#0F9DAD"],["Guests",entries.length,t.text],["Gifts",giftEntries.length,"#ec4899"],...GIFT_TYPES.map(g=>[g.label,byType[g.value],g.color])].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:"center",padding:12,background:t.surface2,borderRadius:10 }}>
              <div style={{ fontSize:16,fontWeight:800,color:c }}>{v}</div>
              <div style={{ fontSize:10,color:t.textMuted,marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {[
        {icon:"download",label:"Export CSV",desc:"Open in Excel or Google Sheets",action:exportCSV,color:"#10b981",btn:"Download CSV"},
        {icon:"print",label:"Print Report",desc:"Full printable report with all entries",action:exportPrint,color:"#0F9DAD",btn:"Print"},
      ].map(c=>(
        <div key={c.label} style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:12 }}>
          <div style={{ display:"flex",gap:14,alignItems:"center",flex:1 }}>
            <div style={{ background:`${c.color}18`,borderRadius:11,padding:12,color:c.color,flexShrink:0 }}><Icon name={c.icon} size={20}/></div>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:t.text,marginBottom:3 }}>{c.label}</div>
              <div style={{ fontSize:12,color:t.textMuted }}>{c.desc}</div>
            </div>
          </div>
          <button onClick={c.action} style={{ background:`linear-gradient(135deg,${c.color},${c.color}cc)`,border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>{c.btn}</button>
        </div>
      ))}
    </div>
  );
}

// ─── EVENT SETTINGS ───────────────────────────────────────────────────
function EventSettingsPage({ event, addToast, t }) {
  const [form,setForm]=useState({...event});
  const [saving,setSaving]=useState(false);
  const [globalForm,setGlobalForm]=useState(DEFAULT_SETTINGS);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    onSnapshot(doc(db,"config","settings"),snap=>{ if(snap.exists()) setGlobalForm({...DEFAULT_SETTINGS,...snap.data()}); });
  },[]);

  const handleSave=async()=>{
    setSaving(true);
    try { await updateDoc(doc(db,"events",event.id),{...form,updatedAt:new Date().toISOString()}); addToast("Event settings saved ✓"); }
    catch(err){ addToast("Error: "+err.message,"error"); }
    setSaving(false);
  };

  const handleGlobalSave=async()=>{
    try { await setDoc(doc(db,"config","settings"),globalForm); addToast("Global settings saved ✓"); }
    catch(err){ addToast("Error: "+err.message,"error"); }
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease",maxWidth:620 }}>
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:18,padding:28,marginBottom:16 }}>
        <div style={{ fontSize:12,color:"#0F9DAD",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>⚙️ Event Settings</div>
        <div style={{ fontSize:20,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif",marginBottom:22 }}>{event.name}</div>
        <Sel label="Event Type" value={form.eventType||"marriage"} onChange={v=>set("eventType",v)} options={EVENT_TYPES.map(e=>({value:e.value,label:e.label}))} th={t}/>
        <Input label="Event Name" value={form.name||""} onChange={v=>set("name",v)} required th={t}/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
          <Input label="Event Date" value={form.eventDate||""} onChange={v=>set("eventDate",v)} type="date" th={t}/>
          <Input label="Place" value={form.place||""} onChange={v=>set("place",v)} th={t}/>
        </div>
        {["marriage","engagement"].includes(form.eventType)&&(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
            <Input label="Bride's Name" value={form.brideName||""} onChange={v=>set("brideName",v)} th={t}/>
            <Input label="Groom's Name" value={form.groomName||""} onChange={v=>set("groomName",v)} th={t}/>
          </div>
        )}
        <Input label="Family Name" value={form.familyName||""} onChange={v=>set("familyName",v)} th={t}/>
        <Input label="Receipt Note" value={form.headerNote||""} onChange={v=>set("headerNote",v)} th={t}/>
        <Input label="Google Sheets Webhook" value={form.googleSheetWebhook||""} onChange={v=>set("googleSheetWebhook",v)} placeholder="https://script.google.com/macros/s/.../exec" th={t}/>
        <button onClick={handleSave} disabled={saving} style={{ width:"100%",background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"13px 0",color:saving?t.textMuted:"#fff",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit" }}>
          {saving?"Saving...":"Save Event Settings ✓"}
        </button>
      </div>

      {/* Global Admin Settings */}
      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:18,padding:28 }}>
        <div style={{ fontSize:12,color:t.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16,paddingBottom:8,borderBottom:`1px solid ${t.border}` }}>🔐 Admin Credentials</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
          <Input label="Username" value={globalForm.adminUser||""} onChange={v=>setGlobalForm(f=>({...f,adminUser:v}))} th={t}/>
          <Input label="Password" value={globalForm.adminPass||""} onChange={v=>setGlobalForm(f=>({...f,adminPass:v}))} type="password" th={t}/>
        </div>
        <div style={{ background:"#f59e0b12",border:"1px solid #f59e0b33",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#fbbf24" }}>⚠️ Admin credentials apply to all events.</div>
        <button onClick={handleGlobalSave} style={{ width:"100%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:11,padding:"12px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Save Admin Settings ✓</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ─── ROOT APP ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// ─── AUTH PAGES ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

// ─── Auth Card wrapper ────────────────────────────────────────────────
const AuthCard = ({ title, subtitle, children, t }) => (
  <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,padding:34,boxShadow:"0 24px 80px rgba(0,0,0,0.12)" }}>
    <h2 style={{ color:t.text,fontSize:20,fontWeight:700,marginBottom:4,marginTop:0 }}>{title}</h2>
    {subtitle && <p style={{ color:t.textMuted,fontSize:13,marginBottom:24,marginTop:0 }}>{subtitle}</p>}
    {children}
  </div>
);

// ─── LOGIN PAGE ───────────────────────────────────────────────────────
function LoginPage({ theme, toggleTheme }) {
  const [tab,    setTab]    = useState("login"); // login | register | reset
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [name,   setName]   = useState("");
  const [err,    setErr]    = useState("");
  const [msg,    setMsg]    = useState("");
  const [loading,setLoading]= useState(false);
  const t = THEMES[theme];

  const handleLogin = async () => {
    if(!email||!pass){ setErr("Please fill in all fields"); return; }
    setLoading(true); setErr("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // onAuthStateChanged in MoiBee will handle the rest
    } catch(e) {
      setErr(e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"||e.code==="auth/user-not-found"
        ? "Invalid email or password." : e.code==="auth/too-many-requests"
        ? "Too many attempts. Try again later." : e.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if(!name.trim()||!email||!pass){ setErr("Please fill in all fields"); return; }
    if(pass.length<6){ setErr("Password must be at least 6 characters"); return; }
    setLoading(true); setErr("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      // Create user profile in Firestore — pending approval
      await setDoc(doc(db,"users",cred.user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "user",
        status: "pending", // pending | approved | rejected
        assignedEvents: [],
        createdAt: new Date().toISOString(),
      });
      await signOut(auth);
      setMsg("✅ Account created! Please wait for admin approval before logging in.");
      setTab("login");
      setEmail(""); setPass(""); setName("");
    } catch(e) {
      setErr(e.code==="auth/email-already-in-use" ? "This email is already registered." : e.message);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if(!email){ setErr("Enter your email address"); return; }
    setLoading(true); setErr("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("✅ Password reset email sent! Check your inbox.");
      setTab("login");
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const Btn = ({ onClick, label, color="#0F9DAD" }) => (
    <button onClick={onClick} disabled={loading} style={{ width:"100%",background:loading?t.border:`linear-gradient(135deg,${color},${color}cc)`,border:"none",borderRadius:12,padding:"13px 0",color:loading?t.textMuted:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":`0 4px 20px ${color}44`,marginTop:4 }}>
      {loading?"Please wait...":label}
    </button>
  );

  const FInput = ({ label,value,onChange,type="text",placeholder="" }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block",fontSize:11,fontWeight:600,color:t.textMuted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{ if(e.key==="Enter"){ tab==="login"?handleLogin():tab==="register"?handleRegister():handleReset(); }}}
        style={{ width:"100%",background:t.inputBg,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"11px 14px",color:t.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap'); *{box-sizing:border-box} @keyframes fadeUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ position:"fixed",top:20,right:20 }}><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>
      <div style={{ width:"100%",maxWidth:420,animation:"fadeUp 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:14 }}>
            <MoiBeeLogo size={50}/>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:22,fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
              <div style={{ fontSize:10,color:"#0F9DAD",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase" }}>Track Every Blessing</div>
              <div style={{ fontSize:10,color:t.textDim,marginTop:2 }}>Powered by AllBee Solutions</div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex",background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:4,gap:3,marginBottom:20 }}>
          {[["login","Sign In"],["register","Register"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setErr("");setMsg("");}}
              style={{ flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
                background:tab===k?"linear-gradient(135deg,#0F9DAD,#0a7a87)":"transparent",
                color:tab===k?"#fff":t.textMuted,transition:"all 0.2s" }}>
              {l}
            </button>
          ))}
        </div>

        {msg && <div style={{ background:"#10b98118",border:"1px solid #10b98144",borderRadius:10,padding:"11px 14px",color:"#10b981",fontSize:13,fontWeight:500,marginBottom:16 }}>{msg}</div>}

        {tab==="login" && (
          <AuthCard title="Welcome back" subtitle="Sign in to your MoiBee account" t={t}>
            <FInput label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com"/>
            <FInput label="Password" value={pass} onChange={setPass} type="password" placeholder="••••••••"/>
            {err && <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:13,marginBottom:12 }}>{err}</div>}
            <Btn onClick={handleLogin} label="Sign In →"/>
            <div style={{ textAlign:"center",marginTop:14 }}>
              <button onClick={()=>{setTab("reset");setErr("");}} style={{ background:"none",border:"none",color:t.textDim,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Forgot password?</button>
            </div>
          </AuthCard>
        )}

        {tab==="register" && (
          <AuthCard title="Create account" subtitle="Register to access MoiBee — admin will approve your account" t={t}>
            <FInput label="Your Name" value={name} onChange={setName} placeholder="Full name"/>
            <FInput label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com"/>
            <FInput label="Password" value={pass} onChange={setPass} type="password" placeholder="Min 6 characters"/>
            {err && <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:13,marginBottom:12 }}>{err}</div>}
            <Btn onClick={handleRegister} label="Create Account →"/>
            <div style={{ background:"#f59e0b12",border:"1px solid #f59e0b33",borderRadius:8,padding:"9px 13px",color:"#f59e0b",fontSize:12,marginTop:12,textAlign:"center" }}>
              ⏳ New accounts need admin approval before first login
            </div>
          </AuthCard>
        )}

        {tab==="reset" && (
          <AuthCard title="Reset password" subtitle="Enter your email to receive a reset link" t={t}>
            <FInput label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com"/>
            {err && <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:13,marginBottom:12 }}>{err}</div>}
            <Btn onClick={handleReset} label="Send Reset Email"/>
            <div style={{ textAlign:"center",marginTop:12 }}>
              <button onClick={()=>{setTab("login");setErr("");}} style={{ background:"none",border:"none",color:t.textDim,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>← Back to Sign In</button>
            </div>
          </AuthCard>
        )}

        <div style={{ textAlign:"center",marginTop:22,color:t.textDim,fontSize:11 }}>🐝 Powered by AllBee Solutions</div>
      </div>
    </div>
  );
}

// ─── PENDING APPROVAL PAGE ────────────────────────────────────────────
function PendingPage({ theme, toggleTheme, userProfile }) {
  const t = THEMES[theme];
  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <div style={{ position:"fixed",top:20,right:20 }}><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>
      <div style={{ textAlign:"center",maxWidth:400 }}>
        <div style={{ fontSize:56,marginBottom:16 }}>⏳</div>
        <div style={{ fontSize:22,fontWeight:800,color:t.text,marginBottom:8 }}>Account Pending Approval</div>
        <div style={{ fontSize:14,color:t.textMuted,marginBottom:24,lineHeight:1.7 }}>
          Hi <strong style={{ color:t.text }}>{userProfile?.name}</strong>, your account is waiting for admin approval.<br/>
          You'll be able to log in once an admin approves your account.
        </div>
        <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:20,marginBottom:20,fontSize:13,color:t.textMuted }}>
          📧 <strong>{userProfile?.email}</strong>
        </div>
        <button onClick={()=>signOut(auth)} style={{ background:"transparent",border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 24px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>Sign Out</button>
      </div>
    </div>
  );
}

// ─── REJECTED PAGE ────────────────────────────────────────────────────
function RejectedPage({ theme, toggleTheme }) {
  const t = THEMES[theme];
  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <div style={{ textAlign:"center",maxWidth:400 }}>
        <div style={{ fontSize:56,marginBottom:16 }}>❌</div>
        <div style={{ fontSize:22,fontWeight:800,color:t.text,marginBottom:8 }}>Account Not Approved</div>
        <div style={{ fontSize:14,color:t.textMuted,marginBottom:24 }}>Your account request was not approved. Please contact the admin.</div>
        <button onClick={()=>signOut(auth)} style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:10,padding:"11px 28px",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700 }}>Sign Out</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ─── ADMIN USER MANAGEMENT PANEL ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
function UserManagementPage({ t, addToast, allEvents }) {
  const [users,  setUsers]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [tab,    setTab]    = useState("pending"); // pending | approved | all
  const [assignModal, setAssignModal] = useState(null); // user being assigned events

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"users"), snap=>{
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return unsub;
  },[]);

  const approveUser = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ status:"approved" });
    addToast(`✅ ${user.name} approved`);
  };
  const rejectUser = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ status:"rejected" });
    addToast(`${user.name} rejected`,"error");
  };
  const makeAdmin = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ role:"admin" });
    addToast(`${user.name} is now an Admin`);
  };
  const removeAdmin = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ role:"user" });
    addToast(`${user.name} role changed to User`);
  };
  const deleteUser = async (user) => {
    await deleteDoc(doc(db,"users",user.id));
    addToast(`${user.name} removed`,"error");
  };

  const shown = tab==="pending" ? users.filter(u=>u.status==="pending")
              : tab==="approved"? users.filter(u=>u.status==="approved")
              : users;

  const statusColor = { pending:"#f59e0b", approved:"#10b981", rejected:"#ef4444" };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {/* Tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {[["pending","⏳ Pending",users.filter(u=>u.status==="pending").length],
          ["approved","✅ Approved",users.filter(u=>u.status==="approved").length],
          ["all","👥 All Users",users.length]
        ].map(([k,l,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
            background:tab===k?"linear-gradient(135deg,#0F9DAD,#0a7a87)":"transparent",
            color:tab===k?"#fff":t.textMuted,border:`1px solid ${tab===k?"transparent":t.border}` }}>
            {l} <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"1px 7px",fontSize:11,marginLeft:4 }}>{cnt}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ color:t.textMuted,padding:40,textAlign:"center" }}>Loading users...</div>}

      {!loading && shown.length===0 && (
        <div style={{ textAlign:"center",padding:"60px 20px",background:t.surface,borderRadius:16,border:`2px dashed ${t.border}` }}>
          <div style={{ fontSize:40,marginBottom:12 }}>👤</div>
          <div style={{ color:t.textMuted,fontSize:14 }}>{tab==="pending"?"No pending approvals":"No users found"}</div>
        </div>
      )}

      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {shown.map(user=>(
          <div key={user.id} style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:20,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
            {/* Avatar */}
            <div style={{ width:44,height:44,borderRadius:"50%",background:`${user.role==="admin"?"#f59e0b":"#0F9DAD"}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>
              {user.name?.[0]?.toUpperCase()||"?"}
            </div>
            {/* Info */}
            <div style={{ flex:1,minWidth:180 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                <span style={{ fontSize:15,fontWeight:700,color:t.text }}>{user.name}</span>
                {user.role==="admin" && <span style={{ background:"#f59e0b18",color:"#f59e0b",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700 }}>👑 ADMIN</span>}
              </div>
              <div style={{ fontSize:12,color:t.textMuted }}>{user.email}</div>
              <div style={{ fontSize:11,color:t.textDim,marginTop:3 }}>
                Joined {user.createdAt?new Date(user.createdAt).toLocaleDateString("en-IN"):"—"}
                {user.assignedEvents?.length>0 && ` · ${user.assignedEvents.length} event(s) assigned`}
              </div>
            </div>
            {/* Status badge */}
            <span style={{ background:`${statusColor[user.status]||"#6b7280"}18`,color:statusColor[user.status]||"#6b7280",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700 }}>
              {user.status==="pending"?"⏳ Pending":user.status==="approved"?"✅ Approved":"❌ Rejected"}
            </span>
            {/* Actions */}
            <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
              {user.status==="pending" && <>
                <button onClick={()=>approveUser(user)} style={{ background:"#10b98118",border:"1px solid #10b98133",borderRadius:8,padding:"7px 14px",color:"#10b981",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>✓ Approve</button>
                <button onClick={()=>rejectUser(user)} style={{ background:"#ef444418",border:"1px solid #ef444433",borderRadius:8,padding:"7px 14px",color:"#ef4444",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>✗ Reject</button>
              </>}
              {user.status==="approved" && <>
                <button onClick={()=>setAssignModal(user)} style={{ background:"#6366f118",border:"1px solid #6366f133",borderRadius:8,padding:"7px 14px",color:"#6366f1",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>📋 Assign Events</button>
                {user.role!=="admin"
                  ? <button onClick={()=>makeAdmin(user)} style={{ background:"#f59e0b18",border:"1px solid #f59e0b33",borderRadius:8,padding:"7px 14px",color:"#f59e0b",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>👑 Make Admin</button>
                  : <button onClick={()=>removeAdmin(user)} style={{ background:t.surface2,border:`1px solid ${t.border}`,borderRadius:8,padding:"7px 14px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12 }}>Remove Admin</button>
                }
              </>}
              <button onClick={()=>deleteUser(user)} style={{ background:"#ef444412",border:"none",borderRadius:8,padding:"7px 9px",color:"#ef4444",cursor:"pointer" }}><Icon name="delete" size={13}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Events Modal */}
      {assignModal && (
        <AssignEventsModal user={assignModal} allEvents={allEvents} onClose={()=>setAssignModal(null)} addToast={addToast} t={t}/>
      )}
    </div>
  );
}

// ─── Assign Events Modal ──────────────────────────────────────────────
function AssignEventsModal({ user, allEvents, onClose, addToast, t }) {
  const [selected, setSelected] = useState(new Set(user.assignedEvents||[]));
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db,"users",user.id),{ assignedEvents:[...selected] });
      addToast(`Events assigned to ${user.name} ✓`);
      onClose();
    } catch(e) { addToast("Error: "+e.message,"error"); }
    setSaving(false);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Assign Events — ${user.name}`} th={t}>
      <div style={{ fontSize:13,color:t.textMuted,marginBottom:16 }}>Select which events this user can access:</div>
      {allEvents.length===0 && <div style={{ color:t.textDim,fontSize:13,marginBottom:16 }}>No events created yet.</div>}
      <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20,maxHeight:340,overflowY:"auto" }}>
        {allEvents.map(ev=>{
          const color = eventColor(ev.eventType);
          const checked = selected.has(ev.id);
          return (
            <div key={ev.id} onClick={()=>toggle(ev.id)}
              style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:11,border:`1.5px solid ${checked?color:t.border}`,background:checked?`${color}0d`:t.surface2,cursor:"pointer",transition:"all 0.15s" }}>
              <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${checked?color:t.border}`,background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {checked && <Icon name="check" size={12}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:600,color:t.text }}>{ev.name}</div>
                <div style={{ fontSize:11,color:t.textMuted }}>{eventLabel(ev.eventType)}{ev.eventDate?` · ${new Date(ev.eventDate).toLocaleDateString("en-IN")}`:""}</div>
              </div>
              <span style={{ background:`${color}18`,color,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700 }}>{formatCurrency(ev.totalAmount||0)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:"11px 0",borderRadius:11,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex:2,padding:"11px 0",borderRadius:11,border:"none",background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)",color:saving?t.textMuted:"#fff",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit" }}>
          {saving?"Saving...":"Save Assignments ✓"}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ─── ROOT APP ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
function MoiBee() {
  const [authUser,    setAuthUser]    = useState(undefined); // undefined=loading, null=signed out
  const [userProfile, setUserProfile] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [theme,       setTheme]       = useState(()=>load("moibee_theme","dark"));
  const [allEvents,   setAllEvents]   = useState([]);
  const [appPage,     setAppPage]     = useState("events"); // events | users
  const t = THEMES[theme];
  const toggleTheme = () => { const n=theme==="dark"?"light":"dark"; setTheme(n); save("moibee_theme",n); };
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg,type="success")=>{
    const id=Date.now().toString();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  // ── Listen to Firebase Auth state
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if(user){
        setAuthUser(user);
        // Load user profile from Firestore
        const snap = await getDoc(doc(db,"users",user.uid));
        if(snap.exists()){
          setUserProfile({id:snap.id,...snap.data()});
        } else {
          // Could be the very first admin — auto-create admin profile
          const profile = { name:"Admin", email:user.email, role:"admin", status:"approved", assignedEvents:[], createdAt:new Date().toISOString() };
          await setDoc(doc(db,"users",user.uid), profile);
          setUserProfile({id:user.uid,...profile});
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
    });
    return unsub;
  },[]);

  // ── Load all events (needed for admin assignment + filtering for users)
  useEffect(()=>{
    const q = query(collection(db,"events"),orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>setAllEvents(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return unsub;
  },[]);

  // ── Loading state
  if(authUser===undefined) return (
    <div style={{ minHeight:"100vh",background:THEMES[theme].bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <MoiBeeLogo size={52}/>
        <div style={{ marginTop:16,width:36,height:36,border:"3px solid #0F9DAD33",borderTop:"3px solid #0F9DAD",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"16px auto 0" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Not logged in
  if(!authUser) return <LoginPage theme={theme} toggleTheme={toggleTheme}/>;

  // ── Pending approval
  if(userProfile?.status==="pending") return <PendingPage theme={theme} toggleTheme={toggleTheme} userProfile={userProfile}/>;

  // ── Rejected
  if(userProfile?.status==="rejected") return <RejectedPage theme={theme} toggleTheme={toggleTheme}/>;

  const isAdmin = userProfile?.role==="admin";

  // ── Filter events for regular users
  const visibleEvents = isAdmin ? allEvents : allEvents.filter(ev=>(userProfile?.assignedEvents||[]).includes(ev.id));

  // ── Inside an event
  if(activeEvent) return (
    <EventApp event={activeEvent} theme={theme} toggleTheme={toggleTheme} onBack={()=>setActiveEvent(null)} t={t} isAdmin={isAdmin}/>
  );

  // ── Main hub
  return (
    <div style={{ minHeight:"100vh",background:t.bg,fontFamily:"'Sora','Segoe UI',sans-serif",color:t.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap'); @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:3px}`}</style>

      {/* Top nav */}
      <div style={{ background:t.topbarBg,borderBottom:`1px solid ${t.border}`,padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <MoiBeeLogo size={32}/>
          <div>
            <div style={{ fontSize:17,fontWeight:800 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
            <div style={{ fontSize:9,color:"#0F9DAD",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Track Every Blessing</div>
          </div>
          {/* Admin nav tabs */}
          {isAdmin && (
            <div style={{ display:"flex",gap:4,marginLeft:20 }}>
              {[["events","🎉 Events"],["users","👥 Users"]].map(([k,l])=>(
                <button key={k} onClick={()=>setAppPage(k)} style={{ padding:"6px 14px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:appPage===k?"linear-gradient(135deg,#0F9DAD,#0a7a87)":"transparent",color:appPage===k?"#fff":t.textMuted }}>
                  {l}
                  {false && <span style={{ background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:10,display:"inline-flex",alignItems:"center",justifyContent:"center",marginLeft:5 }}>!</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {/* User info */}
          <div style={{ background:t.surface2,borderRadius:10,padding:"6px 12px",fontSize:12,color:t.textMuted,display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:24,height:24,borderRadius:"50%",background:isAdmin?"#f59e0b22":"#0F9DAD22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:isAdmin?"#f59e0b":"#0F9DAD" }}>
              {userProfile?.name?.[0]?.toUpperCase()||"?"}
            </div>
            <span style={{ fontWeight:600,color:t.text }}>{userProfile?.name}</span>
            {isAdmin && <span style={{ background:"#f59e0b18",color:"#f59e0b",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:800 }}>ADMIN</span>}
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
          <button onClick={()=>signOut(auth)} style={{ display:"flex",alignItems:"center",gap:7,background:"transparent",border:`1px solid ${t.border}`,borderRadius:10,padding:"7px 13px",color:t.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
            <Icon name="logout" size={14}/> Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100,margin:"0 auto",padding:"28px 24px" }}>
        {appPage==="events" && (
          <EventsHub
            theme={theme} toggleTheme={toggleTheme}
            onSelectEvent={setActiveEvent}
            onLogout={()=>signOut(auth)}
            t={t}
            isAdmin={isAdmin}
            visibleEvents={visibleEvents}
            allEvents={allEvents}
            addToast={addToast}
          />
        )}
        {appPage==="users" && isAdmin && (
          <UserManagementPage t={t} addToast={addToast} allEvents={allEvents}/>
        )}
      </div>
      <Toast toasts={toasts}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><MoiBee/></React.StrictMode>
)
