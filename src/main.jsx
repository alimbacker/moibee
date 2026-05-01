import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc, getDoc, where, getDocs } from "firebase/firestore";
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

// ─── Translations ─────────────────────────────────────────────────────
const LANG = {
  en: {
    // Nav
    dashboard:"Dashboard", addEntry:"Add Entry", records:"Records",
    export:"Export", eventSettings:"Event Settings",
    allEvents:"All Events", signOut:"Sign Out", synced:"Synced", offline:"Offline",
    // Login
    welcomeBack:"Welcome back", signInTo:"Sign in to manage your events",
    username:"Username", password:"Password", signIn:"Sign In →",
    register:"Register", createAccount:"Create account",
    registerSubtitle:"Register to access MoiBee — admin will approve your account",
    yourName:"Your Name", email:"Email", fullName:"Full name",
    createAccountBtn:T("createAccountBtn"), forgotPassword:T("forgotPassword"),
    resetPassword:"Reset password", resetSubtitle:"Enter your email to receive a reset link",
    sendReset:T("sendReset"), backToSignIn:T("backToSignIn"),
    adminApproval:"⏳ New accounts need admin approval before first login",
    // Dashboard
    liveEvent:"Live Event · Real-time Sync", giftBreakdown:T("giftBreakdown"),
    recentEntries:T("recentEntries"), noEntries:T("noEntries"),
    cashTotal:T("cashTotal"), totalGuests:T("totalGuests"),
    todayCollection:T("todayCollection"), highestGift:T("highestGift"),
    physicalGifts:T("physicalGifts"), payments:T("payments"),
    allEntries:T("allEntries"), today:"today", goldSilver:T("goldSilver"),
    // Add Entry
    newEntry:"New Entry", editEntry:"Edit Entry",
    recordGift:"Record a Gift", updateGiftEntry:"Update Gift Entry",
    guestName:"Guest Name", mobile:"Mobile", place:"Place",
    giftType:T("giftType"), quickAmount:T("quickAmount"),
    amount:T("amount"), notes:"Notes", description:"Description",
    weightQty:"Weight / Qty", estValue:"Est. Value (₹)",
    saving:"Saving...", saveEntry:"Save Entry →", update:"Update ✓", cancel:"Cancel",
    guestNameRequired:"Guest name required", amountRequired:"Amount required",
    describeGift:"Describe the gift",
    // Records
    searchPlaceholder:T("searchPlaceholder"),
    allTypes:T("allTypes"), newest:T("newest"), oldest:T("oldest"),
    highestAmt:T("highestAmt"), nameAZ:T("nameAZ"), clear:"Clear",
    entriesFound:"entries found", cashTotalLabel:T("cashTotalLabel"),
    noEntriesFound:T("noEntriesFound"),
    // Receipt
    printReceipt:"Print Receipt", print:T("openPrint"), close:"Close",
    giftAmount:"GIFT AMOUNT", gift:"GIFT", paperSize:"Paper Size:",
    // Export
    summary:"Summary", guests:T("guests"), downloadCSV:T("downloadCSV"),
    openPrint:"Print", csvDesc:T("csvDesc"),
    printDesc:T("printDesc"),
    // Events Hub
    activeEvents:"🟢 Active", completedEvents:"✅ Completed",
    newEvent:"New Event", openEvent:"Open Event →", viewRecords:"View Records →",
    collected:"Collected", markDone:T("markDone"), reopen:T("reopen"),
    totalEvents:"Total Events", grandTotal:"Grand Total",
    noActiveEvents:"All events are completed!", createEvent:"+ Create Event",
    completedArchive:"Completed Events Archive",
    markCompleted:"✅ Mark Completed",
    totalCollected:"Total Collected",
    // Event Form
    eventType:"Event Type", eventName:"Event Name", eventDate:"Event Date",
    venue:"Venue / Place", brideName:"Bride's Name", groomName:"Groom's Name",
    familyName:"Family Name", receiptNote:"Receipt Note",
    sheetsWebhook:"Google Sheets Webhook (optional)",
    createEventBtn:"Create Event →", updateEvent:"Update Event ✓",
    // Users
    userManagement:T("userManagement"), addUser:"Add User",
    pendingApproval:"pending approval", allTab:T("allTab"),
    pendingTab:T("pendingTab"), approvedTab:T("approvedTab"),
    approve:T("approve"), reject:T("reject"),
    assign:T("assign"), makeAdmin:T("makeAdmin"),
    removeAdmin:T("removeAdmin"), reApprove:T("reApprove"),
    addedByAdmin:T("addedByAdmin"),
    removeUser:T("removeUser"), removeUserTitle:T("removeUserTitle"),
    removeWarning:"This will permanently remove this user. They lose access immediately.",
    // Notifications
    notifications:T("notifications"), markAllRead:T("markAllRead"),
    noNotifications:T("noNotifications"),
    // Pending page
    accountPending:T("accountPending"),
    waitingApproval:T("waitingApproval"),
    willUpdateAuto:T("willUpdateAuto"),
    registeredAs:T("registeredAs"), waitingAdmin:T("waitingAdmin"),
    // Removed page
    accountRemoved:T("accountRemoved"), removedByAdmin:T("removedByAdmin"),
    wantToRejoin:T("wantToRejoin"),
    reRegisterNote:T("reRegisterNote"),
    reRegister:T("reRegister"),
  },
  ta: {
    // Nav
    dashboard:"டாஷ்போர்டு", addEntry:"உள்ளீடு சேர்", records:"பதிவுகள்",
    export:"ஏற்றுமதி", eventSettings:"நிகழ்வு அமைப்புகள்",
    allEvents:"அனைத்து நிகழ்வுகள்", signOut:"வெளியேறு", synced:"ஒத்திசைக்கப்பட்டது", offline:"இணைப்பு இல்லை",
    // Login
    welcomeBack:"மீண்டும் வரவேற்கிறோம்", signInTo:"உங்கள் நிகழ்வுகளை நிர்வகிக்க உள்நுழையவும்",
    username:"பயனர்பெயர்", password:"கடவுச்சொல்", signIn:"உள்நுழை →",
    register:"பதிவு செய்", createAccount:"கணக்கு உருவாக்கு",
    registerSubtitle:"MoiBee அணுகல் பெற பதிவு செய்யுங்கள் — நிர்வாகி அனுமதிப்பார்",
    yourName:"உங்கள் பெயர்", email:"மின்னஞ்சல்", fullName:"முழு பெயர்",
    createAccountBtn:"கணக்கு உருவாக்கு →", forgotPassword:"கடவுச்சொல் மறந்தீர்களா?",
    resetPassword:"கடவுச்சொல் மீட்டமை", resetSubtitle:"மீட்டமை இணைப்பு பெற மின்னஞ்சல் உள்ளிடுங்கள்",
    sendReset:"மீட்டமை மின்னஞ்சல் அனுப்பு", backToSignIn:"← உள்நுழைவுக்கு திரும்பு",
    adminApproval:"⏳ புதிய கணக்குகளுக்கு நிர்வாகி அனுமதி தேவை",
    // Dashboard
    liveEvent:"நேரடி நிகழ்வு · நேரடி ஒத்திசைவு", giftBreakdown:"பரிசு விவரம்",
    recentEntries:"சமீபத்திய பதிவுகள்", noEntries:"பதிவுகள் இல்லை",
    cashTotal:"பண/UPI/வங்கி மொத்தம்", totalGuests:"மொத்த விருந்தினர்கள்",
    todayCollection:"இன்றைய வசூல்", highestGift:"அதிக பரிசு",
    physicalGifts:"பொருள் பரிசுகள்", payments:"கொடுப்பனவுகள்",
    allEntries:"அனைத்து பதிவுகள்", today:"இன்று", goldSilver:"தங்கம், வெள்ளி & மேலும்",
    // Add Entry
    newEntry:"புதிய பதிவு", editEntry:"பதிவு திருத்து",
    recordGift:"பரிசை பதிவு செய்", updateGiftEntry:"பரிசு பதிவை புதுப்பி",
    guestName:"விருந்தினர் பெயர்", mobile:"கைபேசி", place:"இடம்",
    giftType:"பரிசு வகை", quickAmount:"விரைவு தொகை",
    amount:"தொகை (₹)", notes:"குறிப்புகள்", description:"விவரம்",
    weightQty:"எடை / அளவு", estValue:"மதிப்பீட்டு மதிப்பு (₹)",
    saving:"சேமிக்கிறது...", saveEntry:"பதிவு சேமி →", update:"புதுப்பி ✓", cancel:"ரத்து செய்",
    guestNameRequired:"விருந்தினர் பெயர் தேவை", amountRequired:"தொகை தேவை",
    describeGift:"பரிசை விவரிக்கவும்",
    // Records
    searchPlaceholder:"பெயர், இடம், பரிசு தேடு...",
    allTypes:"அனைத்து வகைகள்", newest:"புதியது முதல்", oldest:"பழையது முதல்",
    highestAmt:"அதிக ₹", nameAZ:"பெயர் A-Z", clear:"அழி",
    entriesFound:"பதிவுகள் கிடைத்தன", cashTotalLabel:"பண மொத்தம்:",
    noEntriesFound:"பதிவுகள் இல்லை",
    // Receipt
    printReceipt:"ரசீது அச்சிடு", print:"அச்சிடு", close:"மூடு",
    giftAmount:"பரிசு தொகை", gift:"பரிசு", paperSize:"காகித அளவு:",
    // Export
    summary:"சுருக்கம்", guests:"விருந்தினர்கள்", downloadCSV:"CSV பதிவிறக்கு",
    openPrint:"அச்சிடு", csvDesc:"Excel அல்லது Google Sheets-ல் திற",
    printDesc:"அனைத்து பதிவுகளுடன் அச்சிடக்கூடிய அறிக்கை",
    // Events Hub
    activeEvents:"🟢 செயலில்", completedEvents:"✅ முடிந்தவை",
    newEvent:"புதிய நிகழ்வு", openEvent:"நிகழ்வு திற →", viewRecords:"பதிவுகள் பார் →",
    collected:"வசூலிக்கப்பட்டது", markDone:"✓ முடிந்தது", reopen:"↩ மீண்டும் திற",
    totalEvents:"மொத்த நிகழ்வுகள்", grandTotal:"மொத்த தொகை",
    noActiveEvents:"அனைத்து நிகழ்வுகளும் முடிந்தன!", createEvent:"+ நிகழ்வு உருவாக்கு",
    completedArchive:"முடிந்த நிகழ்வுகள் காப்பகம்",
    markCompleted:"✅ முடிந்தது என குறி",
    totalCollected:"மொத்த வசூல்",
    // Event Form
    eventType:"நிகழ்வு வகை", eventName:"நிகழ்வு பெயர்", eventDate:"நிகழ்வு தேதி",
    venue:"இடம்", brideName:"மணமகள் பெயர்", groomName:"மணமகன் பெயர்",
    familyName:"குடும்பப் பெயர்", receiptNote:"ரசீது குறிப்பு",
    sheetsWebhook:"Google Sheets Webhook (விருப்பத்தேர்வு)",
    createEventBtn:"நிகழ்வு உருவாக்கு →", updateEvent:"நிகழ்வு புதுப்பி ✓",
    // Users
    userManagement:"பயனர் மேலாண்மை", addUser:"பயனர் சேர்",
    pendingApproval:"அனுமதி நிலுவையில்", allTab:"👥 அனைவரும்",
    pendingTab:"⏳ நிலுவையில்", approvedTab:"✅ அனுமதிக்கப்பட்டவர்கள்",
    approve:"✓ அனுமதி", reject:"✗ நிராகரி",
    assign:"📋 நியமி", makeAdmin:"👑 நிர்வாகி",
    removeAdmin:"நிர்வாகி நீக்கு", reApprove:"↩ மீண்டும் அனுமதி",
    addedByAdmin:"🔧 நிர்வாகியால் சேர்க்கப்பட்டது",
    removeUser:"🗑️ நீக்கு", removeUserTitle:"பயனரை நீக்கவா?",
    removeWarning:"இந்த பயனர் நிரந்தரமாக நீக்கப்படுவார். அணுகல் உடனடியாக இழக்கப்படும்.",
    // Notifications
    notifications:"🔔 அறிவிப்புகள்", markAllRead:"அனைத்தும் படித்தது என குறி",
    noNotifications:"அறிவிப்புகள் இல்லை",
    // Pending page
    accountPending:"கணக்கு அனுமதி நிலுவையில்",
    waitingApproval:"உங்கள் கணக்கு நிர்வாகி அனுமதிக்காக காத்திருக்கிறது.",
    willUpdateAuto:"அனுமதிக்கப்பட்டவுடன் இந்தப் பக்கம் தானாக புதுப்பிக்கப்படும்.",
    registeredAs:"பதிவு செய்யப்பட்டது", waitingAdmin:"நிர்வாகி அனுமதிக்காக காத்திருக்கிறது...",
    // Removed page
    accountRemoved:"கணக்கு நீக்கப்பட்டது", removedByAdmin:"நிர்வாகியால் நீக்கப்பட்டது.",
    wantToRejoin:"மீண்டும் சேர விரும்புகிறீர்களா?",
    reRegisterNote:"அதே மின்னஞ்சல் மற்றும் கடவுச்சொல்லுடன் மீண்டும் பதிவு செய்யலாம்.",
    reRegister:"மீண்டும் பதிவு செய் →",
  }
};

// ─── Language context helper ───────────────────────────────────────────
const t_ = (lang, key) => LANG[lang]?.[key] || LANG.en[key] || key;


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
function EventsHub({ theme, toggleTheme, onSelectEvent, onLogout, t, lang, T, isAdmin, visibleEvents, allEvents, addToast }) {
  if(!T) T = (k)=>k;
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
              <div style={{ fontSize:10,color:t.textMuted,marginTop:2 }}>{T("collected")}</div>
            </div>
            <div style={{ background:t.surface2,borderRadius:10,padding:"10px 12px",textAlign:"center" }}>
              <div style={{ fontSize:17,fontWeight:800,color:t.text }}>{ev.entryCount||0}</div>
              <div style={{ fontSize:10,color:t.textMuted,marginTop:2 }}>Guests</div>
            </div>
          </div>

          <button onClick={()=>onSelectEvent(ev)}
            style={{ width:"100%",background:done?"linear-gradient(135deg,#10b981,#059669)":`linear-gradient(135deg,${color},${color}cc)`,border:"none",borderRadius:11,padding:"11px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
            {done?T("viewRecords"):T("openEvent")}
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
          <div className="hub-summary" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24 }}>
            {[
              { label:T("totalEvents"),    value:events.length,              color:"#6366f1", sub:"all time" },
              { label:T("activeEvents"),   value:activeEvents.length,        color:"#0F9DAD", sub:formatCurrency(totalActive) },
              { label:T("completedEvents"),value:completedEvents.length,     color:"#10b981", sub:formatCurrency(totalCompleted) },
              { label:T("grandTotal"),     value:formatCurrency(totalAll),   color:"#f59e0b", sub:"all events" },
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
        <div className="hub-header" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
          {/* Tab pills */}
          <div style={{ display:"flex",background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:4,gap:4 }}>
            {[
              { key:"active",    label:T("activeEvents"),    count:activeEvents.length },
              { key:"completed", label:T("completedEvents"),  count:completedEvents.length },
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

          <button onClick={()=>setShowCreate(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:12,padding:"11px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(15,157,173,0.3)" }}><Icon name="add" size={16}/> {T("newEvent")}</button>
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
            <div className="hub-grid" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,animation:"fadeUp 0.35s ease" }}>
              {shownEvents.map(ev=><EventCard key={ev.id} ev={ev}/>)}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <EventFormModal open={showCreate||!!showEdit} editEvent={showEdit} onClose={()=>{setShowCreate(false);setShowEdit(null);}} addToast={addToast} t={t}/>

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
    {id:"dashboard",label:T("dashboard"),icon:"dashboard"},
    {id:"add",label:T("addEntry"),icon:"add"},
    {id:"records",label:T("records"),icon:"records"},
    {id:"export",label:T("export"),icon:"export"},
    {id:"settings",label:T("eventSettings"),icon:"settings"},
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
        @media print{.sidebar-panel,.mob-btn{display:none!important}body{background:white!important;color:black!important}}
        @media(min-width:769px){.sidebar-panel{left:0!important}.main-content{margin-left:240px!important}}
        @media(max-width:768px){.main-content{margin-left:0!important}.mob-btn{display:block!important}}
      `}</style>

      {/* Sidebar */}
      <div className="sidebar-panel" style={{ width:240,background:t.sidebarBg,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",padding:"20px 0",position:"fixed",top:0,left:sidebarOpen?0:-240,height:"100vh",zIndex:200,transition:"left 0.3s ease" }}>
        <div style={{ padding:"0 16px 16px",borderBottom:`1px solid ${t.border}`,marginBottom:12 }}>
          <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:8,background:t.surface2,border:`1px solid ${t.border}`,borderRadius:9,padding:"7px 12px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,marginBottom:14,width:"100%" }}>
            <Icon name="back" size={13}/> {T("allEvents")}
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
      <div className="main-content" style={{ flex:1,minHeight:"100vh",display:"flex",flexDirection:"column" }}>
        <div className="no-print" style={{ background:t.topbarBg,borderBottom:`1px solid ${t.border}`,padding:"13px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <button className="mob-btn" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none",border:"none",color:t.textMid,cursor:"pointer",padding:4,display:"none" }}><Icon name="menu" size={22}/></button>
            <style>{`@media(max-width:768px){.mob-btn{display:block!important}}@media(min-width:769px){.sidebar-panel{left:0!important}}`}</style>
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

        <div style={{ flex:1,padding:"18px 14px",maxWidth:1200,width:"100%" }} className="event-content">
          {page==="dashboard" && <DashboardPage entries={entries} event={event} t={t} loading={loading} T={T}/>}
          {page==="add"       && <AddEntryPage addEntry={addEntry} updateEntry={updateEntry} addToast={addToast} editEntry={editEntry} setEditEntry={setEditEntry} setPage={setPage} event={event} t={t} T={T}/>}
          {page==="records"   && <RecordsPage entries={entries} addToast={addToast} setEditEntry={setEditEntry} setPage={setPage} setReceiptEntry={setReceiptEntry} setDeleteConfirm={setDeleteConfirm} event={event} t={t} T={T}/>}
          {page==="export"    && <ExportPage entries={entries} event={event} addToast={addToast} t={t} T={T}/>}
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
function DashboardPage({ entries, event, t, loading, T }) {
  if(!T) T = (k)=>k;
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
function AddEntryPage({ addEntry, updateEntry, addToast, editEntry, setEditEntry, setPage, event, t, T }) {
  if(!T) T = (k)=>k;
  const blank={name:"",mobile:"",place:"",giftType:"Cash",amount:"",giftDesc:"",giftWeight:"",giftUnit:"g",notes:""};
  const [form,      setForm]      = useState(()=>editEntry?{...blank,...editEntry}:blank);
  const [saving,    setSaving]    = useState(false);
  const [savedEntry,setSavedEntry]= useState(null);  // triggers print modal
  const [paperSize, setPaperSize] = useState("80mm");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{ setForm(editEntry?{...blank,...editEntry}:blank); },[editEntry]);
  const isMoney=isMoneyType(form.giftType);
  const quickAmounts=[101,501,1001,2001,5001,10001];

  const handleSubmit=async()=>{
    if(!form.name.trim()){addToast(T("guestNameRequired"),"warning");return;}
    if(isMoney&&!form.amount){addToast(T("amountRequired"),"warning");return;}
    if(!isMoney&&!form.giftDesc.trim()){addToast(T("describeGift"),"warning");return;}
    setSaving(true);
    try {
      const payload={...form,amount:isMoney?Number(form.amount):0};
      if(editEntry){
        await updateEntry(editEntry.id,payload);
        addToast("Updated ✓");
        setEditEntry(null);
        setPage("records");
      } else {
        const newEntry = await addEntry(payload);
        addToast(isMoney?`₹${Number(form.amount).toLocaleString("en-IN")} saved for ${form.name} 🎉`:`${form.giftDesc} recorded for ${form.name} 🎁`);
        setSavedEntry(newEntry); // show print prompt
        setForm(blank);
      }
    } catch(err){addToast("Error: "+err.message,"error");}
    setSaving(false);
  };

  // ── Thermal print function (same as ReceiptModal)
  const handlePrint = (entry) => {
    const gt    = entry.giftType||entry.mode;
    const money = isMoneyType(gt);
    const width    = paperSize==="58mm"?"54mm":"76mm";
    const fontSize = paperSize==="58mm"?"11px":"13px";
    const bigFont  = paperSize==="58mm"?"22px":"28px";
    const midFont  = paperSize==="58mm"?"13px":"16px";
    const rows = [
      ["Name",   entry.name],
      ["Mobile", entry.mobile||""],
      ["Place",  entry.place||""],
      ["Type",   giftLabel(gt)],
      ["Date",   formatDate(entry.createdAt)],
      ...(entry.notes?[["Notes",entry.notes]]:[]),
    ].filter(([,v])=>v&&v!=="—");
    const amtBlock = money
      ?`<div class="amt-box"><div class="amt-lbl">GIFT AMOUNT</div><div class="amt-val">${formatCurrency(entry.amount)}</div></div>`
      :`<div class="amt-box"><div class="amt-lbl">GIFT</div><div class="gift-name">${entry.giftDesc||giftLabel(gt)}</div>${entry.giftWeight?`<div class="gift-sub">${entry.giftWeight} ${entry.giftUnit||"g"}</div>`:""}${entry.amount>0?`<div class="gift-sub">Est. ${formatCurrency(entry.amount)}</div>`:""}</div>`;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Receipt</title>
<style>
  @page{margin:0;size:${paperSize} auto}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',Courier,monospace;font-size:${fontSize};color:#000;background:#fff;width:${width};padding:4mm 3mm}
  .center{text-align:center}
  .logo{font-size:${midFont};font-weight:900;letter-spacing:2px}
  .tagline{font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-top:2px}
  .event-name{font-size:${midFont};font-weight:700;margin:4px 0 1px}
  .divider{border:none;border-top:1px dashed #000;margin:5px 0}
  .divider-solid{border:none;border-top:1px solid #000;margin:5px 0}
  .row{display:flex;justify-content:space-between;padding:2px 0;font-size:${fontSize}}
  .lbl{color:#555;flex-shrink:0;margin-right:6px}
  .val{font-weight:700;text-align:right;word-break:break-word}
  .amt-box{text-align:center;margin:6px 0;padding:5px 0;border-top:2px solid #000;border-bottom:2px solid #000}
  .amt-lbl{font-size:9px;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px}
  .amt-val{font-size:${bigFont};font-weight:900;letter-spacing:1px}
  .gift-name{font-size:${midFont};font-weight:900}
  .gift-sub{font-size:10px;color:#333;margin-top:2px}
  .footer{text-align:center;font-size:9px;margin-top:6px;letter-spacing:1px}
</style></head><body>
  <div class="center">
    <div class="logo">★ moiBEE ★</div>
    <div class="tagline">Track Every Blessing</div>
    <hr class="divider"/>
    <div class="event-name">${event.name}</div>
    ${event.familyName?`<div style="font-size:10px">${event.familyName}</div>`:""}
    <div style="font-size:9px;margin-top:3px">Receipt #${entry.id?.slice(-6).toUpperCase()||"------"}</div>
  </div>
  <hr class="divider-solid"/>
  ${rows.map(([l,v])=>`<div class="row"><span class="lbl">${l}:</span><span class="val">${v}</span></div>`).join("")}
  <hr class="divider"/>
  ${amtBlock}
  <hr class="divider"/>
  ${event.headerNote?`<div style="text-align:center;font-size:10px;margin:4px 0;font-style:italic">${event.headerNote}</div>`:""}
  <div class="footer">
    <div style="letter-spacing:4px">* * * * * *</div>
    <div style="margin-top:3px">Powered by MoiBee · AllBee Solutions</div>
    <div style="letter-spacing:4px;margin-top:2px">* * * * * *</div>
  </div>
</body></html>`;
    const w=window.open("","_blank","width=300,height=600");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(),500);
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease",maxWidth:640 }}>

      {/* ── Print Prompt — fixed overlay after save ── */}
      {savedEntry && (
        <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:500,padding:"0 0 0 0",animation:"slideUp 0.3s ease" }}>
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          <div style={{ background:t.surface,borderTop:`2px solid #10b981`,borderRadius:"16px 16px 0 0",padding:"20px 20px 28px",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",maxWidth:600,margin:"0 auto" }}>
            {/* Header row */}
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
              <div style={{ width:40,height:40,borderRadius:"50%",background:"#10b98120",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>✅</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontWeight:700,color:"#10b981" }}>Entry Saved!</div>
                <div style={{ fontSize:13,color:t.textMuted,marginTop:1 }}>
                  {isMoneyType(savedEntry.giftType||savedEntry.mode)
                    ? `${savedEntry.name} · ${formatCurrency(savedEntry.amount)}`
                    : `${savedEntry.name} · ${savedEntry.giftDesc||giftLabel(savedEntry.giftType)}`
                  }
                </div>
              </div>
              <button onClick={()=>setSavedEntry(null)} style={{ background:t.surface2,border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,cursor:"pointer",fontSize:16,flexShrink:0 }}>×</button>
            </div>
            {/* Paper size + print */}
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap" }}>
              <span style={{ fontSize:12,color:t.textMuted,fontWeight:600,marginRight:4 }}>Paper:</span>
              {["58mm","80mm"].map(s=>(
                <button key={s} onClick={()=>setPaperSize(s)}
                  style={{ padding:"5px 14px",borderRadius:20,border:`2px solid ${paperSize===s?"#0F9DAD":t.border}`,background:paperSize===s?"#0F9DAD18":t.inputBg,color:paperSize===s?"#0F9DAD":t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>handlePrint(savedEntry)}
                style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:12,padding:"13px 0",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(15,157,173,0.3)" }}>
                <Icon name="print" size={17}/> Print Receipt ({paperSize})
              </button>
              <button onClick={()=>setSavedEntry(null)}
                style={{ padding:"13px 20px",borderRadius:12,border:`1px solid ${t.border}`,background:"transparent",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500 }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:18,padding:28 }}>
        <div style={{ fontSize:12,color:"#0F9DAD",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>{editEntry?("✏️ " + T("editEntry")):("🎁 " + T("newEntry"))}</div>
        <div style={{ fontSize:20,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif",marginBottom:22 }}>{editEntry?T("updateGiftEntry"):T("recordGift")}</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 14px" }}>
          <div style={{ gridColumn:"1/-1" }}><Input label=T("guestName")} value={form.name} onChange={v=>set("name",v)} placeholder="Full name" required th={t}/></div>
          <Input label=T("mobile")} value={form.mobile} onChange={v=>set("mobile",v)} placeholder="9876543210" type="tel" th={t}/>
          <Input label=T("place")} value={form.place} onChange={v=>set("place",v)} placeholder="Chennai" th={t}/>
        </div>
        {/* Gift type grid */}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>Gift Type <span style={{ color:"#0F9DAD" }}>*</span></label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,minmax(80px,1fr))",gap:7 }}>
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
            {saving?T("saving"):editEntry?T("update"):T("saveEntry")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS ─────────────────────────────────────────────────────────
function RecordsPage({ entries, addToast, setEditEntry, setPage, setReceiptEntry, setDeleteConfirm, event, t, T }) {
  if(!T) T = (k)=>k;
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
        <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
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

// ─── RECEIPT MODAL (Thermal Printer Optimized) ───────────────────────
function ReceiptModal({ entry, event, onClose, t }) {
  const gt    = entry.giftType||entry.mode;
  const money = isMoneyType(gt);
  const [paperSize, setPaperSize] = useState("80mm"); // "58mm" | "80mm"

  const handlePrint = () => {
    const width   = paperSize === "58mm" ? "54mm" : "76mm";
    const fontSize = paperSize === "58mm" ? "11px" : "13px";
    const bigFont  = paperSize === "58mm" ? "22px" : "28px";
    const midFont  = paperSize === "58mm" ? "13px" : "16px";

    const rows = [
      ["Name",    entry.name],
      ["Mobile",  entry.mobile||""],
      ["Place",   entry.place||""],
      ["Type",    giftLabel(gt)],
      ["Date",    formatDate(entry.createdAt)],
      ...(entry.notes?[["Notes",entry.notes]]:[]),
    ].filter(([,v])=>v&&v!=="—");

    const amtBlock = money
      ? `<div class="amt-box">
           <div class="amt-lbl">GIFT AMOUNT</div>
           <div class="amt-val">${formatCurrency(entry.amount)}</div>
         </div>`
      : `<div class="amt-box">
           <div class="amt-lbl">GIFT</div>
           <div class="gift-name">${entry.giftDesc||giftLabel(gt)}</div>
           ${entry.giftWeight?`<div class="gift-sub">${entry.giftWeight} ${entry.giftUnit||"g"}</div>`:""}
           ${entry.amount>0?`<div class="gift-sub">Est. ${formatCurrency(entry.amount)}</div>`:""}
         </div>`;

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<title>Receipt</title>
<style>
  @page { margin: 0; size: ${paperSize} auto; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: ${fontSize};
    color: #000;
    background: #fff;
    width: ${width};
    padding: 4mm 3mm;
  }
  .center { text-align: center; }
  .logo { font-size: ${midFont}; font-weight: 900; letter-spacing: 2px; }
  .tagline { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
  .event-name { font-size: ${midFont}; font-weight: 700; margin: 4px 0 1px; }
  .family { font-size: 10px; }
  .receipt-no { font-size: 9px; margin-top: 3px; }
  .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  .divider-solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: ${fontSize}; }
  .lbl { color: #555; flex-shrink: 0; margin-right: 6px; }
  .val { font-weight: 700; text-align: right; word-break: break-word; }
  .amt-box { text-align: center; margin: 6px 0; padding: 5px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; }
  .amt-lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }
  .amt-val { font-size: ${bigFont}; font-weight: 900; letter-spacing: 1px; }
  .gift-name { font-size: ${midFont}; font-weight: 900; }
  .gift-sub { font-size: 10px; color: #333; margin-top: 2px; }
  .note { text-align: center; font-size: 10px; margin: 5px 0; }
  .footer { text-align: center; font-size: 9px; margin-top: 6px; letter-spacing: 1px; }
  .stars { letter-spacing: 4px; font-size: 10px; }
</style>
</head><body>
  <div class="center">
    <div class="logo">★ moiBEE ★</div>
    <div class="tagline">Track Every Blessing</div>
    <hr class="divider"/>
    <div class="event-name">${event.name}</div>
    ${event.familyName?`<div class="family">${event.familyName}</div>`:""}
    <div class="receipt-no">Receipt #${entry.id?.slice(-6).toUpperCase()||"------"}</div>
  </div>
  <hr class="divider-solid"/>
  ${rows.map(([l,v])=>`
    <div class="row">
      <span class="lbl">${l}:</span>
      <span class="val">${v}</span>
    </div>`).join("")}
  <hr class="divider"/>
  ${amtBlock}
  <hr class="divider"/>
  ${event.headerNote?`<div class="note">${event.headerNote}</div>`:""}
  <div class="footer">
    <div class="stars">* * * * * * * * * *</div>
    <div style="margin-top:3px">Powered by MoiBee</div>
    <div>AllBee Solutions</div>
    <div class="stars">* * * * * * * * * *</div>
  </div>
</body></html>`;

    const w = window.open("","_blank","width=300,height=600");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); }, 500);
  };

  // Preview styles mimic thermal paper
  const previewWidth = paperSize==="58mm" ? 220 : 280;

  return (
    <Modal open={true} onClose={onClose} title="Print Receipt" wide={true} th={t}>
      {/* Paper size selector */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18,padding:"12px 16px",background:t.surface2,borderRadius:12 }}>
        <span style={{ fontSize:13,color:t.textMuted,fontWeight:600 }}>Thermal Paper Size:</span>
        {["58mm","80mm"].map(s=>(
          <button key={s} onClick={()=>setPaperSize(s)}
            style={{ padding:"7px 18px",borderRadius:20,border:`2px solid ${paperSize===s?"#0F9DAD":t.border}`,background:paperSize===s?"#0F9DAD18":t.inputBg,color:paperSize===s?"#0F9DAD":t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all 0.15s" }}>
            {s}
          </button>
        ))}
        <span style={{ fontSize:11,color:t.textDim,marginLeft:6 }}>
          {paperSize==="58mm"?"Small / Mini printer":"Standard thermal printer"}
        </span>
      </div>

      {/* Thermal receipt preview */}
      <div style={{ display:"flex",justifyContent:"center",marginBottom:18 }}>
        <div style={{
          width:previewWidth, background:"#fff", color:"#000",
          fontFamily:"'Courier New',Courier,monospace",
          fontSize: paperSize==="58mm"?11:13,
          padding:"12px 10px",
          boxShadow:"0 2px 20px rgba(0,0,0,0.15)",
          borderRadius:4,
          border:"1px solid #ddd",
        }}>
          {/* Header */}
          <div style={{ textAlign:"center",marginBottom:8 }}>
            <div style={{ fontWeight:900,letterSpacing:2,fontSize: paperSize==="58mm"?13:16 }}>★ moiBEE ★</div>
            <div style={{ fontSize:9,letterSpacing:3,textTransform:"uppercase" }}>Track Every Blessing</div>
            <div style={{ borderTop:"1px dashed #000",margin:"5px 0" }}/>
            <div style={{ fontWeight:700,fontSize: paperSize==="58mm"?13:15 }}>{event.name}</div>
            {event.familyName&&<div style={{ fontSize:10 }}>{event.familyName}</div>}
            <div style={{ fontSize:9,marginTop:2 }}>Receipt #{entry.id?.slice(-6).toUpperCase()||"------"}</div>
          </div>

          <div style={{ borderTop:"2px solid #000",margin:"5px 0" }}/>

          {/* Rows */}
          {[["Name",entry.name],["Mobile",entry.mobile||""],["Place",entry.place||""],["Type",giftLabel(gt)],["Date",formatDate(entry.createdAt)],...(entry.notes?[["Notes",entry.notes]]:[])].filter(([,v])=>v&&v!=="—").map(([l,v])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize: paperSize==="58mm"?10:12 }}>
              <span style={{ color:"#555",flexShrink:0,marginRight:6 }}>{l}:</span>
              <span style={{ fontWeight:700,textAlign:"right",wordBreak:"break-word",maxWidth:"60%" }}>{v}</span>
            </div>
          ))}

          <div style={{ borderTop:"1px dashed #000",margin:"5px 0" }}/>

          {/* Amount / Gift */}
          <div style={{ textAlign:"center",padding:"5px 0",borderTop:"2px solid #000",borderBottom:"2px solid #000",margin:"4px 0" }}>
            <div style={{ fontSize:9,letterSpacing:2,textTransform:"uppercase",marginBottom:2 }}>{money?"GIFT AMOUNT":"GIFT"}</div>
            {money
              ? <div style={{ fontSize: paperSize==="58mm"?22:28,fontWeight:900,letterSpacing:1 }}>{formatCurrency(entry.amount)}</div>
              : <>
                  <div style={{ fontSize: paperSize==="58mm"?14:17,fontWeight:900 }}>{entry.giftDesc||giftLabel(gt)}</div>
                  {entry.giftWeight&&<div style={{ fontSize:10,color:"#333",marginTop:2 }}>{entry.giftWeight} {entry.giftUnit||"g"}</div>}
                  {entry.amount>0&&<div style={{ fontSize:10,color:"#333" }}>Est. {formatCurrency(entry.amount)}</div>}
                </>
            }
          </div>

          <div style={{ borderTop:"1px dashed #000",margin:"5px 0" }}/>
          {event.headerNote&&<div style={{ textAlign:"center",fontSize:10,margin:"4px 0",fontStyle:"italic" }}>{event.headerNote}</div>}

          {/* Footer */}
          <div style={{ textAlign:"center",fontSize:9,marginTop:6 }}>
            <div style={{ letterSpacing:4 }}>* * * * * *</div>
            <div style={{ marginTop:2 }}>Powered by MoiBee</div>
            <div>AllBee Solutions</div>
            <div style={{ letterSpacing:4,marginTop:2 }}>* * * * * *</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"11px 20px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Close</button>
        <button onClick={handlePrint} style={{ padding:"11px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(15,157,173,0.35)" }}>
          <Icon name="print" size={16}/> Print {paperSize}
        </button>
      </div>
    </Modal>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────
function ExportPage({ entries, event, addToast, t, T }) {
  if(!T) T = (k)=>k;
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
          {[[T("cashTotal"),formatCurrency(total),"#0F9DAD"],["Guests",entries.length,t.text],["Gifts",giftEntries.length,"#ec4899"],...GIFT_TYPES.map(g=>[g.label,byType[g.value],g.color])].map(([l,v,c])=>(
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

// ─── REMOVED PAGE ────────────────────────────────────────────────────
function RemovedPage({ theme, toggleTheme, email }) {
  const lang = load("moibee_lang","en");
  const T = (k) => t_(lang, k);
  const t = THEMES[theme];
  const [done, setDone] = useState(false);

  const handleReRegister = async () => {
    await signOut(auth);
    setDone(true);
  };

  if(done) return <LoginPage theme={theme} toggleTheme={toggleTheme}/>;

  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>
      <div style={{ position:"fixed",top:20,right:20 }}><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>
      <div style={{ textAlign:"center",maxWidth:420 }}>
        <div style={{ fontSize:56,marginBottom:16 }}>🚫</div>
        <div style={{ fontSize:22,fontWeight:800,color:t.text,marginBottom:10 }}>Account Removed</div>
        <div style={{ fontSize:14,color:t.textMuted,marginBottom:24,lineHeight:1.8 }}>
          Your account (<strong style={{ color:t.text }}>{email}</strong>) was removed by the admin.
        </div>
        <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:24,marginBottom:24 }}>
          <div style={{ fontSize:14,fontWeight:600,color:t.text,marginBottom:8 }}>Want to re-join?</div>
          <div style={{ fontSize:13,color:t.textMuted,marginBottom:16,lineHeight:1.7 }}>
            You can register again with the same email and password. Your request will go to the admin for approval.
          </div>
          <button onClick={handleReRegister}
            style={{ width:"100%",background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"12px 0",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(15,157,173,0.3)",marginBottom:10 }}>
            Re-register →
          </button>
          <button onClick={()=>signOut(auth)}
            style={{ width:"100%",background:"transparent",border:`1px solid ${t.border}`,borderRadius:11,padding:"10px 0",color:t.textMuted,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
            Sign Out
          </button>
        </div>
        <div style={{ fontSize:11,color:t.textDim }}>🐝 Powered by AllBee Solutions</div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────
function LoginPage({ theme, toggleTheme, lang:initLang, toggleLang }) {
  const [localLang, setLocalLang] = useState(()=>load("moibee_lang","en"));
  const activeLang = initLang || localLang;
  const T = (k) => t_(activeLang, k);
  const localToggleLang = toggleLang || (()=>{ const n=localLang==="en"?"ta":"en"; setLocalLang(n); save("moibee_lang",n); });
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
      // Use REST API to create account — doesn't affect current auth session
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ email:email.trim(), password:pass, returnSecureToken:true }) }
      );
      const data = await resp.json();

      let uid;
      if(data.error){
        if(data.error.message === "EMAIL_EXISTS"){
          // Auth account exists — check if Firestore profile exists
          const signResp = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            { method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ email:email.trim(), password:pass, returnSecureToken:true }) }
          );
          const signData = await signResp.json();
          if(signData.error){
            // Wrong password
            setErr("This email is already registered. Please sign in or use Forgot Password.");
            setLoading(false);
            return;
          }
          uid = signData.localId;
          // Check if Firestore profile exists
          const snap = await getDoc(doc(db,"users",uid));
          if(snap.exists()){
            setErr("This email is already registered. Please sign in instead.");
            setLoading(false);
            return;
          }
          // No profile = removed user re-registering with correct password ✅
        } else {
          setErr(data.error.message);
          setLoading(false);
          return;
        }
      } else {
        uid = data.localId;
      }

      // Create fresh Firestore profile — pending approval
      await setDoc(doc(db,"users",uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "user",
        status: "pending",
        assignedEvents: [],
        createdAt: new Date().toISOString(),
      });

      // Make sure no active session
      if(auth.currentUser) await signOut(auth);

      setMsg("✅ Account registered! Please wait for admin approval before logging in.");
      setTab("login");
      setEmail(""); setPass(""); setName("");
    } catch(e) {
      setErr(e.message||"Registration failed. Please try again.");
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

  // renderInput — NOT a component (avoids remount on every keystroke)
  const renderInput = (label, value, onChange, type="text", placeholder="") => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block",fontSize:11,fontWeight:600,color:t.textMuted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",background:t.inputBg,border:`1.5px solid ${t.border}`,borderRadius:10,padding:"11px 14px",color:t.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
        onFocus={e=>e.target.style.borderColor="#0F9DAD"} onBlur={e=>e.target.style.borderColor=t.border}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap'); *{box-sizing:border-box} @keyframes fadeUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ position:"fixed",top:20,right:20,display:"flex",gap:8 }}><LangToggle lang={activeLang} toggleLang={localToggleLang}/><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>
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
          <AuthCard title={T("welcomeBack")} subtitle={T("signInTo")} t={t}>
            {renderInput("Email", email, setEmail, "email", "you@email.com")}
            {renderInput("Password", pass, setPass, "password", "••••••••")}
            {err && <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:13,marginBottom:12 }}>{err}</div>}
            <Btn onClick={handleLogin} label="Sign In →"/>
            <div style={{ textAlign:"center",marginTop:14 }}>
              <button onClick={()=>{setTab("reset");setErr("");}} style={{ background:"none",border:"none",color:t.textDim,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Forgot password?</button>
            </div>
          </AuthCard>
        )}

        {tab==="register" && (
          <AuthCard title={T("createAccount")} subtitle={T("registerSubtitle")} t={t}>
            {renderInput("Your Name", name, setName, "text", "Full name")}
            {renderInput("Email", email, setEmail, "email", "you@email.com")}
            {renderInput("Password", pass, setPass, "password", "Min 6 characters")}
            {err && <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:13,marginBottom:12 }}>{err}</div>}
            <Btn onClick={handleRegister} label="Create Account →"/>
            <div style={{ background:"#f59e0b12",border:"1px solid #f59e0b33",borderRadius:8,padding:"9px 13px",color:"#f59e0b",fontSize:12,marginTop:12,textAlign:"center" }}>
              ⏳ New accounts need admin approval before first login
            </div>
          </AuthCard>
        )}

        {tab==="reset" && (
          <AuthCard title={T("resetPassword")} subtitle={T("resetSubtitle")} t={t}>
            {renderInput("Email", email, setEmail, "email", "you@email.com")}
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
  const lang = load("moibee_lang","en");
  const T = (k) => t_(lang, k);
  const t = THEMES[theme];
  const [pulse, setPulse] = useState(false);

  // Poll every 5s and show a banner when approved
  useEffect(()=>{
    if(!userProfile?.id) return;
    const unsub = onSnapshot(doc(db,"users",userProfile.id), snap=>{
      if(snap.exists() && snap.data().status==="approved"){
        // Force page reload to enter the app
        window.location.reload();
      }
    });
    // Subtle pulse animation
    const t = setInterval(()=>setPulse(p=>!p),1500);
    return ()=>{ unsub(); clearInterval(t); };
  },[userProfile?.id]);

  return (
    <div style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:16 }}>
      <div style={{ position:"fixed",top:20,right:20 }}><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>
      <div style={{ textAlign:"center",maxWidth:420 }}>
        {/* Animated hourglass */}
        <div style={{ fontSize:64,marginBottom:20,transition:"transform 0.5s",transform:pulse?"rotate(10deg)":"rotate(-10deg)" }}>⏳</div>
        <div style={{ fontSize:22,fontWeight:800,color:t.text,marginBottom:10 }}>Account Pending Approval</div>
        <div style={{ fontSize:14,color:t.textMuted,marginBottom:24,lineHeight:1.8 }}>
          Hi <strong style={{ color:t.text }}>{userProfile?.name}</strong>, your account is waiting for admin approval.
          <br/>This page will update automatically once approved.
        </div>

        {/* Info card */}
        <div style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:22,marginBottom:24 }}>
          <div style={{ fontSize:13,color:t.textMuted,marginBottom:12 }}>Registered as</div>
          <div style={{ fontSize:16,fontWeight:700,color:t.text }}>📧 {userProfile?.email}</div>
          {/* Live status indicator */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16,padding:"10px 0",borderTop:`1px solid ${t.border}` }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:"#f59e0b",boxShadow:"0 0 8px #f59e0b",animation:"pulse 1.5s infinite" }}/>
            <span style={{ fontSize:12,color:"#f59e0b",fontWeight:600 }}>Waiting for admin approval...</span>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>

        <button onClick={()=>signOut(auth)} style={{ background:"transparent",border:`1px solid ${t.border}`,borderRadius:10,padding:"11px 28px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>Sign Out</button>
        <div style={{ fontSize:11,color:t.textDim,marginTop:16 }}>🐝 Powered by AllBee Solutions</div>
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
function UserManagementPage({ t, lang, T, addToast, allEvents }) {
  if(!T) T = (k)=>k;
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("all");
  const [assignModal,   setAssignModal]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddUser,   setShowAddUser]   = useState(false);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"users"), snap=>{
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return unsub;
  },[]);

  const approveUser = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ status:"approved" });
    await addDoc(collection(db,"notifications"),{
      toUid:user.id, type:"approved",
      title:"Account Approved! 🎉",
      message:`Hi ${user.name}, your MoiBee account has been approved. You can now log in and access your events.`,
      read:false, createdAt:new Date().toISOString(),
    });
    addToast(`✅ ${user.name} approved`);
  };
  const rejectUser = async (user) => {
    await updateDoc(doc(db,"users",user.id),{ status:"rejected" });
    await addDoc(collection(db,"notifications"),{
      toUid:user.id, type:"rejected",
      title:"Account Not Approved",
      message:`Hi ${user.name}, your account request was not approved. Please contact the admin.`,
      read:false, createdAt:new Date().toISOString(),
    });
    addToast(`${user.name} rejected`,"error");
  };
  const makeAdmin   = async (user) => { await updateDoc(doc(db,"users",user.id),{role:"admin"}); addToast(`${user.name} is now Admin`); };
  const removeAdmin = async (user) => { await updateDoc(doc(db,"users",user.id),{role:"user"});  addToast(`${user.name} role changed to User`); };

  const deleteUser = async (user) => {
    try {
      await deleteDoc(doc(db,"users",user.id));
      const nSnap = await getDocs(query(collection(db,"notifications"),where("toUid","==",user.id)));
      for(const n of nSnap.docs) await deleteDoc(n.ref);
      addToast(`${user.name} removed`,"error");
      setDeleteConfirm(null);
    } catch(err){ addToast("Error: "+err.message,"error"); }
  };

  const shown = tab==="pending"  ? users.filter(u=>u.status==="pending")
              : tab==="approved" ? users.filter(u=>u.status==="approved")
              : users;

  const statusColor = { pending:"#f59e0b", approved:"#10b981", rejected:"#ef4444" };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      {/* Header row */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:800,color:t.text,fontFamily:"'DM Serif Display',Georgia,serif" }}>User Management</div>
          <div style={{ fontSize:12,color:t.textMuted,marginTop:2 }}>{users.length} total · {users.filter(u=>u.status==="pending").length} pending approval</div>
        </div>
        <button onClick={()=>setShowAddUser(true)}
          style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"10px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(15,157,173,0.3)" }}>
          <Icon name="add" size={16}/> Add User
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:7,marginBottom:18,flexWrap:"wrap" }}>
        {[["all","👥 All",users.length],
          ["pending","⏳ Pending",users.filter(u=>u.status==="pending").length],
          ["approved","✅ Approved",users.filter(u=>u.status==="approved").length],
        ].map(([k,l,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:"8px 16px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
            background:tab===k?"linear-gradient(135deg,#0F9DAD,#0a7a87)":"transparent",
            color:tab===k?"#fff":t.textMuted, border:`1px solid ${tab===k?"transparent":t.border}` }}>
            {l} <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"1px 7px",fontSize:11,marginLeft:3 }}>{cnt}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ color:t.textMuted,padding:40,textAlign:"center" }}>Loading users...</div>}

      {!loading && shown.length===0 && (
        <div style={{ textAlign:"center",padding:"50px 20px",background:t.surface,borderRadius:16,border:`2px dashed ${t.border}` }}>
          <div style={{ fontSize:36,marginBottom:10 }}>👤</div>
          <div style={{ color:t.textMuted,fontSize:14,marginBottom:16 }}>{tab==="pending"?"No pending approvals":"No users found"}</div>
          <button onClick={()=>setShowAddUser(true)} style={{ background:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:10,padding:"10px 22px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
            + Add User Manually
          </button>
        </div>
      )}

      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {shown.map(user=>(
          <div key={user.id} style={{ background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,padding:18,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
            {/* Avatar */}
            <div style={{ width:42,height:42,borderRadius:"50%",background:`${user.role==="admin"?"#f59e0b":"#0F9DAD"}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:user.role==="admin"?"#f59e0b":"#0F9DAD",flexShrink:0 }}>
              {user.name?.[0]?.toUpperCase()||"?"}
            </div>
            {/* Info */}
            <div style={{ flex:1,minWidth:160 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:2 }}>
                <span style={{ fontSize:14,fontWeight:700,color:t.text }}>{user.name}</span>
                {user.role==="admin" && <span style={{ background:"#f59e0b18",color:"#f59e0b",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700 }}>👑 ADMIN</span>}
                {user.addedByAdmin && <span style={{ background:"#6366f118",color:"#6366f1",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700 }}>🔧 Added by Admin</span>}
              </div>
              <div style={{ fontSize:12,color:t.textMuted }}>{user.email}</div>
              <div style={{ fontSize:11,color:t.textDim,marginTop:2 }}>
                {user.createdAt?new Date(user.createdAt).toLocaleDateString("en-IN"):"—"}
                {user.assignedEvents?.length>0&&` · ${user.assignedEvents.length} event(s)`}
              </div>
            </div>
            {/* Status */}
            <span style={{ background:`${statusColor[user.status]||"#6b7280"}18`,color:statusColor[user.status]||"#6b7280",borderRadius:20,padding:"4px 11px",fontSize:11,fontWeight:700,flexShrink:0 }}>
              {user.status==="pending"?"⏳ Pending":user.status==="approved"?"✅ Approved":"❌ Rejected"}
            </span>
            {/* Actions */}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {user.status==="pending" && <>
                <button onClick={()=>approveUser(user)} style={{ background:"#10b98118",border:"1px solid #10b98133",borderRadius:8,padding:"6px 12px",color:"#10b981",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>✓ Approve</button>
                <button onClick={()=>rejectUser(user)} style={{ background:"#ef444418",border:"1px solid #ef444433",borderRadius:8,padding:"6px 12px",color:"#ef4444",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>✗ Reject</button>
              </>}
              {user.status==="approved" && <>
                <button onClick={()=>setAssignModal(user)} style={{ background:"#6366f118",border:"1px solid #6366f133",borderRadius:8,padding:"6px 12px",color:"#6366f1",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>📋 Assign</button>
                {user.role!=="admin"
                  ?<button onClick={()=>makeAdmin(user)} style={{ background:"#f59e0b18",border:"1px solid #f59e0b33",borderRadius:8,padding:"6px 12px",color:"#f59e0b",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>👑 Admin</button>
                  :<button onClick={()=>removeAdmin(user)} style={{ background:t.surface2,border:`1px solid ${t.border}`,borderRadius:8,padding:"6px 12px",color:t.textMuted,cursor:"pointer",fontFamily:"inherit",fontSize:12 }}>Remove Admin</button>
                }
              </>}
              {user.status==="rejected" &&
                <button onClick={()=>approveUser(user)} style={{ background:"#10b98118",border:"1px solid #10b98133",borderRadius:8,padding:"6px 12px",color:"#10b981",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>↩ Re-approve</button>
              }
              <button onClick={()=>setDeleteConfirm(user)} style={{ background:"#ef444412",border:"none",borderRadius:8,padding:"6px 8px",color:"#ef4444",cursor:"pointer" }}><Icon name="delete" size={13}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddUser && <AddUserModal onClose={()=>setShowAddUser(false)} addToast={addToast} t={t} allEvents={allEvents}/>}

      {/* Assign Events Modal */}
      {assignModal && <AssignEventsModal user={assignModal} allEvents={allEvents} onClose={()=>setAssignModal(null)} addToast={addToast} t={t}/>}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Remove User?" th={t}>
        <div style={{ textAlign:"center",padding:"8px 0" }}>
          <div style={{ fontSize:44,marginBottom:12 }}>🗑️</div>
          <div style={{ fontSize:16,fontWeight:700,color:t.text,marginBottom:4 }}>{deleteConfirm?.name}</div>
          <div style={{ fontSize:13,color:t.textMuted,marginBottom:16 }}>{deleteConfirm?.email}</div>
          <div style={{ background:"#ef444412",border:"1px solid #ef444433",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#fca5a5",marginBottom:20 }}>
            ⚠️ This will permanently remove this user. They lose access immediately. They can re-register if needed.
          </div>
        </div>
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={()=>setDeleteConfirm(null)} style={{ padding:"10px 20px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>deleteUser(deleteConfirm)} style={{ padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700 }}>🗑️ Remove</button>
        </div>
      </Modal>
    </div>
  );
}


// ─── Add User Modal (Admin manually adds a user) ──────────────────────
function AddUserModal({ onClose, addToast, t, allEvents }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [role,     setRole]     = useState("user");
  const [selected, setSelected] = useState(new Set());
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  const toggle = (id) => setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  const handleAdd = async () => {
    if(!name.trim()||!email.trim()||!pass.trim()){ setErr("Name, email and password are required"); return; }
    if(pass.length<6){ setErr("Password must be at least 6 characters"); return; }
    setSaving(true); setErr("");
    try {
      // Check if user already exists in Firestore by email
      const existing = await getDocs(query(collection(db,"users"), where("email","==",email.trim().toLowerCase())));
      if(!existing.empty){
        setErr("A user with this email already exists.");
        setSaving(false);
        return;
      }

      // Use Firebase Auth REST API to create user WITHOUT signing out current admin
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass, returnSecureToken: true }),
        }
      );
      const data = await resp.json();
      if(data.error){
        throw new Error(data.error.message==="EMAIL_EXISTS"
          ? "This email already has an account. They can sign in directly."
          : data.error.message);
      }
      const uid = data.localId;

      // Create Firestore profile — auto approved since admin is adding
      await setDoc(doc(db,"users",uid),{
        name:           name.trim(),
        email:          email.trim().toLowerCase(),
        role:           role,
        status:         "approved",
        assignedEvents: [...selected],
        createdAt:      new Date().toISOString(),
        addedByAdmin:   true,
      });

      // Send welcome notification
      await addDoc(collection(db,"notifications"),{
        toUid:     uid,
        type:      "approved",
        title:     "Welcome to MoiBee! 🎉",
        message:   `Hi ${name.trim()}, your account has been created by the admin. You can now sign in with your email and password.`,
        read:      false,
        createdAt: new Date().toISOString(),
      });
      // Admin stays signed in — no signOut needed!

      addToast(`✅ ${name.trim()} added successfully! They can now sign in.`);
      onClose();
    } catch(e) {
      setErr(e.message||"Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  return (
    <Modal open={true} onClose={onClose} title="➕ Add User Manually" wide={true} th={t}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px" }}>
        <div style={{ gridColumn:"1/-1" }}>
          <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. Ravi Kumar" required th={t}/>
        </div>
        <Input label="Email Address" value={email} onChange={setEmail} type="email" placeholder="ravi@email.com" required th={t}/>
        <Input label="Password" value={pass} onChange={setPass} type="password" placeholder="Min 6 characters" required th={t}/>
      </div>

      {/* Role selector */}
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>Role</label>
        <div style={{ display:"flex",gap:10 }}>
          {[["user","👤 Regular User","Can access assigned events only"],["admin","👑 Admin","Full access to all events & users"]].map(([v,l,desc])=>(
            <div key={v} onClick={()=>setRole(v)}
              style={{ flex:1,padding:"12px 14px",borderRadius:11,border:`2px solid ${role===v?"#0F9DAD":t.border}`,background:role===v?"#0F9DAD0d":t.surface2,cursor:"pointer",transition:"all 0.15s" }}>
              <div style={{ fontSize:14,fontWeight:700,color:role===v?"#0F9DAD":t.text,marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:11,color:t.textMuted }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign events (only for regular users) */}
      {role==="user" && allEvents.length>0 && (
        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>
            Assign Events <span style={{ color:t.textDim,fontWeight:400,textTransform:"none",letterSpacing:0 }}>(optional)</span>
          </label>
          <div style={{ display:"flex",flexDirection:"column",gap:7,maxHeight:200,overflowY:"auto" }}>
            {allEvents.map(ev=>{
              const color   = eventColor(ev.eventType);
              const checked = selected.has(ev.id);
              return (
                <div key={ev.id} onClick={()=>toggle(ev.id)}
                  style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${checked?color:t.border}`,background:checked?`${color}0d`:t.surface2,cursor:"pointer",transition:"all 0.15s" }}>
                  <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${checked?color:t.border}`,background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {checked&&<Icon name="check" size={11}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:t.text }}>{ev.name}</div>
                    <div style={{ fontSize:11,color:t.textMuted }}>{eventLabel(ev.eventType)}{ev.eventDate?` · ${new Date(ev.eventDate).toLocaleDateString("en-IN")}`:""}</div>
                  </div>
                  <span style={{ background:`${color}18`,color,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700 }}>{formatCurrency(ev.totalAmount||0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {err && (
        <div style={{ background:"#7f1d1d20",border:"1px solid #ef444444",borderRadius:8,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:14 }}>
          ⚠️ {err}
        </div>
      )}

      <div style={{ background:`${t.surface2}`,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:t.textMuted,marginBottom:16 }}>
        💡 The user will be <strong style={{ color:"#10b981" }}>automatically approved</strong> and can sign in immediately with the email and password you set.
      </div>

      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:"12px 0",borderRadius:11,border:`1px solid ${t.border}`,background:"transparent",color:t.textMid,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Cancel</button>
        <button onClick={handleAdd} disabled={saving}
          style={{ flex:2,background:saving?t.border:"linear-gradient(135deg,#0F9DAD,#0a7a87)",border:"none",borderRadius:11,padding:"12px 0",color:saving?t.textMuted:"#fff",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:saving?"none":"0 4px 16px rgba(15,157,173,0.3)" }}>
          {saving?"Creating account...":"➕ Add User"}
        </button>
      </div>
    </Modal>
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
  const [appPage,       setAppPage]       = useState("events"); // events | users
  const [notifications, setNotifications] = useState([]);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [lang,          setLang]          = useState(()=>load("moibee_lang","en"));
  const T = (key) => t_(lang, key); // translation helper
  const toggleLang = () => { const n=lang==="en"?"ta":"en"; setLang(n); save("moibee_lang",n); };
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
        const snap = await getDoc(doc(db,"users",user.uid));
        if(snap.exists()){
          setUserProfile({id:snap.id,...snap.data()});
        } else {
          // No Firestore profile — check if any users exist at all
          const allUsersSnap = await getDocs(collection(db,"users"));
          if(allUsersSnap.empty){
            // Very first user ever — make them admin
            const profile = { name:"Admin", email:user.email, role:"admin", status:"approved", assignedEvents:[], createdAt:new Date().toISOString() };
            await setDoc(doc(db,"users",user.uid), profile);
            setUserProfile({id:user.uid,...profile});
          } else {
            // Auth account exists but Firestore profile deleted (removed user)
            // Set a special "removed" profile so we can show a proper message
            setUserProfile({ id:user.uid, email:user.email, status:"removed" });
          }
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
    });
    return unsub;
  },[]);

  // ── Request browser notification permission
  useEffect(()=>{
    if(!authUser) return;
    if("Notification" in window && Notification.permission==="default"){
      Notification.requestPermission();
    }
  },[authUser]);

  // ── Load notifications for current user
  useEffect(()=>{
    if(!authUser) return;
    const q = query(
      collection(db,"notifications"),
      where("toUid","==",authUser.uid)
    );
    const unsub = onSnapshot(q, snap=>{
      const notifs = snap.docs.map(d=>({id:d.id,...d.data()}))
        .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); // sort client-side, no index needed
      setNotifications(notifs);
      // Browser push notification for new unread ones
      const newest = notifs[0];
      if(newest && !newest.read && Notification.permission==="granted"){
        new Notification(newest.title,{ body:newest.message, icon:"/favicon.svg" });
      }
    });
    return unsub;
  },[authUser]);

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
  if(!authUser) return <LoginPage theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang}/>;

  // ── Pending approval
  if(userProfile?.status==="pending") return <PendingPage theme={theme} toggleTheme={toggleTheme} userProfile={userProfile}/>;

  // ── Rejected
  if(userProfile?.status==="rejected") return <RejectedPage theme={theme} toggleTheme={toggleTheme}/>;

  // ── Removed by admin — let them re-register
  if(userProfile?.status==="removed") return <RemovedPage theme={theme} toggleTheme={toggleTheme} email={userProfile?.email}/>;

  const isAdmin = userProfile?.role==="admin";

  // ── Filter events for regular users
  const visibleEvents = isAdmin ? allEvents : allEvents.filter(ev=>(userProfile?.assignedEvents||[]).includes(ev.id));

  // ── Inside an event
  if(activeEvent) return (
    <EventApp event={activeEvent} theme={theme} toggleTheme={toggleTheme} onBack={()=>setActiveEvent(null)} t={t} lang={lang} T={T} isAdmin={isAdmin}/>
  );

  // ── Main hub
  return (
    <div onClick={()=>setShowNotifs(false)} style={{ minHeight:"100vh",background:t.bg,fontFamily:"'Sora','Segoe UI',sans-serif",color:t.text,display:"flex",flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:3px}
        @media(max-width:600px){
          .root-user-name{display:none!important}
          .root-topbar{padding:10px 12px!important}
          .root-content{padding:12px 10px!important}
        }
      `}</style>

      {/* Top nav */}
      <div className="root-topbar" style={{ background:t.topbarBg,borderBottom:`1px solid ${t.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexShrink:0 }}>
        {/* Left: Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <MoiBeeLogo size={30}/>
          <div>
            <div style={{ fontSize:16,fontWeight:800,lineHeight:1 }}><span style={{ color:"#0F9DAD" }}>moi</span><span style={{ color:t.text }}>BEE</span></div>
            <div style={{ fontSize:8,color:"#0F9DAD",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Track Every Blessing</div>
          </div>
        </div>

        {/* Center: Admin tab switcher (always visible, including mobile) */}
        {isAdmin && (
          <div style={{ display:"flex",background:t.surface2,border:`1px solid ${t.border}`,borderRadius:10,padding:3,gap:3 }}>
            {[["events","🎉 " + T("allEvents")],["users",T("allTab")]].map(([k,l])=>(
              <button key={k} onClick={()=>setAppPage(k)}
                style={{ padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,transition:"all 0.2s",
                  background:appPage===k?"linear-gradient(135deg,#0F9DAD,#0a7a87)":"transparent",
                  color:appPage===k?"#fff":t.textMuted }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Right: User + actions */}
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,background:t.surface2,borderRadius:10,padding:"5px 10px" }}>
            <div style={{ width:22,height:22,borderRadius:"50%",background:isAdmin?"#f59e0b22":"#0F9DAD22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:isAdmin?"#f59e0b":"#0F9DAD",flexShrink:0 }}>
              {userProfile?.name?.[0]?.toUpperCase()||"?"}
            </div>
            <span className="root-user-name" style={{ fontSize:12,fontWeight:600,color:t.text }}>{userProfile?.name}</span>
            {isAdmin && <span style={{ background:"#f59e0b18",color:"#f59e0b",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:800 }}>ADMIN</span>}
          </div>
          {/* Notification Bell */}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowNotifs(v=>!v)} title="Notifications"
              style={{ position:"relative",background:t.surface2,border:`1px solid ${t.border}`,borderRadius:9,padding:"7px 10px",color:t.textMuted,cursor:"pointer",display:"flex",alignItems:"center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {notifications.filter(n=>!n.read).length > 0 && (
                <span style={{ position:"absolute",top:-4,right:-4,background:"#ef4444",color:"#fff",borderRadius:"50%",width:17,height:17,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {notifications.filter(n=>!n.read).length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div style={{ position:"absolute",right:0,top:"calc(100% + 8px)",width:320,background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",zIndex:300,overflow:"hidden" }}>
                <div style={{ padding:"14px 16px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700,fontSize:14,color:t.text }}>🔔 Notifications</span>
                  {notifications.some(n=>!n.read) && (
                    <button onClick={async()=>{
                      for(const n of notifications.filter(x=>!x.read)){
                        await updateDoc(doc(db,"notifications",n.id),{read:true});
                      }
                    }} style={{ background:"none",border:"none",color:"#0F9DAD",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight:320,overflowY:"auto" }}>
                  {notifications.length===0 && (
                    <div style={{ padding:"32px 16px",textAlign:"center",color:t.textDim,fontSize:13 }}>No notifications yet</div>
                  )}
                  {notifications.map(n=>(
                    <div key={n.id} onClick={async()=>{ if(!n.read) await updateDoc(doc(db,"notifications",n.id),{read:true}); }}
                      style={{ padding:"12px 16px",borderBottom:`1px solid ${t.surface2}`,background:n.read?"transparent":n.type==="approved"?"#10b98108":"#ef444408",cursor:"pointer",transition:"background 0.15s" }}>
                      <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                        <div style={{ fontSize:20,flexShrink:0,marginTop:1 }}>
                          {n.type==="approved"?"✅":n.type==="rejected"?"❌":"🔔"}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:2 }}>{n.title}</div>
                          <div style={{ fontSize:12,color:t.textMuted,lineHeight:1.5 }}>{n.message}</div>
                          <div style={{ fontSize:10,color:t.textDim,marginTop:4 }}>
                            {n.createdAt?new Date(n.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):""}
                          </div>
                        </div>
                        {!n.read && <div style={{ width:8,height:8,borderRadius:"50%",background:n.type==="approved"?"#10b981":"#ef4444",flexShrink:0,marginTop:4 }}/>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"10px 16px",borderTop:`1px solid ${t.border}`,textAlign:"center" }}>
                  <button onClick={()=>setShowNotifs(false)} style={{ background:"none",border:"none",color:t.textDim,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Close</button>
                </div>
              </div>
            )}
          </div>

          <LangToggle lang={lang} toggleLang={toggleLang}/>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
          <button onClick={()=>signOut(auth)} title={T("signOut")}
            style={{ display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1px solid ${t.border}`,borderRadius:9,padding:"7px 10px",color:t.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
            <Icon name="logout" size={14}/>
            <span className="root-user-name">{T("signOut")}</span>
          </button>
        </div>
      </div>

      <div className="root-content" style={{ maxWidth:1100,margin:"0 auto",padding:"24px 20px",width:"100%" }}>
        {appPage==="events" && (
          <EventsHub
            theme={theme} toggleTheme={toggleTheme}
            onSelectEvent={setActiveEvent}
            onLogout={()=>signOut(auth)}
            t={t} lang={lang} T={T}
            isAdmin={isAdmin}
            visibleEvents={visibleEvents}
            allEvents={allEvents}
            addToast={addToast}
          />
        )}
        {appPage==="users" && isAdmin && (
          <UserManagementPage t={t} lang={lang} T={T} addToast={addToast} allEvents={allEvents}/>
        )}
      </div>
      <Toast toasts={toasts}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><MoiBee/></React.StrictMode>
)
