# Vercel Deployment Guide - DegixDAW

## 🚀 Quick Deploy

1. **Vercel Account erstellen**: https://vercel.com/signup
2. **GitHub verbinden**: Mit deinem GitHub Account einloggen
3. **Repository importieren**: DegixDAW Repository auswählen
4. **Deploy!** - Vercel erkennt `vercel.json` automatisch

## 📋 Environment Variables

Im Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables (Production)

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPER_ADMIN_EMAIL=your-admin@email.com
```

### Optional Variables (Backend - später)

```env
VITE_API_URL=https://your-backend.railway.app
```

**WICHTIG:**
- Diese Variables müssen in Vercel Dashboard gesetzt werden!
- NICHT in Git committen (Sicherheit!)
- Für alle Environments (Production, Preview, Development)

## ⚙️ Build Configuration

Die `vercel.json` im Root ist bereits konfiguriert:

- **Build Command:** `npm install && npm run build:frontend`
- **Output Directory:** `web/frontend/dist`
- **Framework:** React (Vite)
- **Node Version:** 20.x (automatisch)

## 🔄 Deployment Workflow

1. **Automatic Deployments:**
   - Push zu `main` → Production Deployment
   - Push zu anderen Branches → Preview Deployment

2. **Manual Deploy:**
   - Vercel Dashboard → Deploy Button

3. **Rollback:**
   - Vercel Dashboard → Deployments → Previous Version

## 📊 What Works After Deployment?

✅ **Frontend (React App)**
- Login/Register
- Chat System
- FileBrowser mit Upload/Download
- Social Features
- Admin Panel

✅ **Supabase Integration**
- Database (PostgreSQL)
- Auth (Login/Register)
- Storage (File Upload)
- Realtime (Chat Updates)

⚠️ **Backend API (Port 3001)**
- Wird NICHT deployed (Express Server fehlt)
- Features die Backend brauchen: noch nicht verfügbar
- **Lösung:** Backend später auf Railway deployen

## 🐛 Troubleshooting

### Build Error: "Module not found"
→ Check `vercel.json` buildCommand
→ Ensure all dependencies in `package.json`

### 404 on routes (z.B. `/chat`)
→ `vercel.json` rewrites sollten funktionieren
→ Check if `destination: /index.html` existiert

### Environment Variables nicht verfügbar
→ Vercel Dashboard → Settings → Environment Variables
→ WICHTIG: Neu deployen nach Variables-Änderung!

### Supabase Connection Error
→ Check `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`
→ Check Supabase RLS Policies (deployed domain erlauben)

## 💰 Vercel Free Tier Limits

- ✅ 100 GB Bandwidth/Monat
- ✅ Unlimited Deployments
- ✅ Automatic HTTPS/SSL
- ✅ 100 GB-Hours Serverless
- ✅ Preview Deployments

**Für DegixDAW mehr als genug!**

## 📝 Next Steps

1. ✅ Frontend auf Vercel deployed
2. ⏳ Backend auf Railway deployen (optional)
3. ⏳ Custom Domain verbinden (optional)
4. ⏳ Supabase Production Config (RLS, Policies)

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- DegixDAW Docs: [docs/](./docs/)
- Supabase Dashboard: https://app.supabase.com

---

**Created:** 2025-10-18
**Last Updated:** 2025-10-18