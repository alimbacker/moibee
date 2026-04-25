# 🐝 MoiBee — Track Every Blessing

> Wedding gift & contribution tracker by **AllBee Solutions**

![MoiBee](https://img.shields.io/badge/MoiBee-Track%20Every%20Blessing-0F9DAD?style=for-the-badge)

---

## ✨ Features

- 🎁 Record guest contributions with name, place, mobile, amount & payment mode
- 📊 Dashboard with live stats — total collection, today's entries, highest gift
- 🔍 Records page with search, filter, and sort
- 🧾 Print individual receipts per guest
- 📤 Export as CSV / JSON / Printable report
- 📊 **Google Sheets auto-sync** — every new entry pushes to your sheet
- 🌙 Dark / Light theme toggle
- 🔐 Password-protected admin login
- 💾 Data stored locally in browser (localStorage)

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/moibee.git
cd moibee

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Default login:** `admin` / `moibee123`

---

## 📦 Deploy to Vercel (Free)

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Framework: **Vite** (auto-detected)
5. Click **Deploy** ✅

---

## 🌐 Deploy to Netlify (Free)

### Option A — Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option B — Netlify Dashboard
1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Connect your GitHub repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy site** ✅

---

## 📊 Google Sheets Integration

Automatically sync every new entry to a Google Sheet:

1. Open your Google Sheet → **Extensions → Apps Script**
2. Paste this script:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Name", "Mobile", "Place", "Amount", "Mode", "Notes", "Date", "ID"]);
  }
  sheet.appendRow([
    data.name, data.mobile, data.place, data.amount,
    data.mode, data.notes, data.date, data.id
  ]);
  return ContentService.createTextOutput("OK");
}
```

3. Click **Deploy → New Deployment → Web App**
4. Set *Execute as: Me*, *Who has access: Anyone*
5. Copy the Web App URL
6. In MoiBee → **Settings → Google Sheets Integration** → paste the URL

---

## 📁 Project Structure

```
moibee/
├── public/
│   └── favicon.svg          # App favicon
├── src/
│   ├── main.jsx             # React entry point
│   └── App.jsx              # Full MoiBee application
├── index.html               # HTML shell
├── package.json             # Dependencies
├── vite.config.js           # Vite config
├── netlify.toml             # Netlify deploy config
├── vercel.json              # Vercel deploy config
├── .gitignore
└── README.md
```

---

## 🛠️ Build for Production

```bash
npm run build
# Output in /dist folder — ready to upload anywhere
```

---

## 🔐 Default Credentials

| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `moibee123` |

> Change these in **Settings → Admin Credentials** after first login.

---

## 🐝 Powered by AllBee Solutions
