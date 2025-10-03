# Deployment Checkliste für Netlify

## ✅ Vor dem Deployment

### 1. **Environment Variables in Netlify setzen**
Gehe zu: Netlify Dashboard → Site Settings → Environment Variables

Setze folgende Variablen:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. **Build testen**
```bash
npm run build
```

Prüfe auf Fehler. Der `dist/` Ordner sollte erstellt werden.

### 3. **TypeScript Errors checken**
```bash
npx tsc --noEmit
```

Sollte 0 Errors zeigen.

### 4. **Git Status prüfen**
```bash
git status
git add .
git commit -m "feat: Add Issue Management with API endpoints"
git push origin refactor/architecture-cleanup
```

## ⚠️ **Wichtige Unterschiede: Development vs Production**

### **Development (localhost)**
- ✅ Express API läuft auf Port 3001
- ✅ Markdown-Report wird **im Projekt gespeichert**
- ✅ Du startest: `npm run dev` + `npm run api`

### **Production (Netlify)**
- ❌ Express API läuft NICHT (Netlify = Static Host)
- ⚠️ Markdown-Report wird **heruntergeladen** (Browser Download)
- ✅ Netlify Functions können genutzt werden (optional)

### **server/api.js - NUR für Development!**
- Wird **NICHT deployed**
- Funktioniert nur lokal
- Ist in `.gitignore` NICHT enthalten → wird trotzdem gepusht (kein Problem)

## 🚀 **Deployment auf Netlify**

### **Option A: Via GitHub (empfohlen)**
1. Push zu GitHub: `git push origin refactor/architecture-cleanup`
2. Netlify Dashboard: New Site from Git
3. Wähle Repository: `DegixDAW`
4. Branch: `refactor/architecture-cleanup` (oder merge zu `main`)
5. Build Command: `npm run build`
6. Publish Directory: `dist`
7. Environment Variables setzen (siehe oben)
8. Deploy!

### **Option B: Via Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Init (first time)
netlify init

# Deploy
netlify deploy --prod
```

## 📝 **Was passiert mit dem MD-Button in Production?**

**Behavior:**
- **Local:** Klick auf "📝 MD" → Datei wird in `/frontend/ISSUES_DATE.md` gespeichert
- **Production:** Klick auf "📝 MD" → Datei wird als Browser-Download heruntergeladen

**Code Detection:**
```typescript
const isDevelopment = window.location.hostname === 'localhost';

if (isDevelopment) {
  // Save to server via Express API
} else {
  // Download to browser
}
```

## 🔒 **Security Checklist**

- [ ] `.env` ist in `.gitignore` (Supabase Keys nicht im Git!)
- [ ] Environment Variables in Netlify gesetzt
- [ ] RLS Policies in Supabase aktiviert
- [ ] Admin-Check funktioniert (is_admin flag)

## 📦 **Files die deployed werden**

✅ **Deployed:**
- `dist/` folder (nach build)
- `public/` folder (static assets)
- `netlify.toml` (config)
- `netlify/functions/` (serverless functions)

❌ **NICHT deployed / nicht relevant:**
- `server/api.js` (nur local dev)
- `node_modules/`
- `.env`
- `src/` (nur die gebaute `dist/` Version)

## 🐛 **Troubleshooting**

### Build Fehler
```bash
# Lokal testen
npm run build

# Logs checken
npm run build 2>&1 | tee build.log
```

### 404 Errors nach Deploy
→ Prüfe `netlify.toml` Redirects für SPA

### Environment Variables fehlen
→ Netlify Dashboard → Site Settings → Environment Variables

### API-Server läuft nicht
→ Das ist NORMAL in Production! MD-Button lädt dann herunter statt zu speichern.

## ✅ **Nach dem Deployment**

1. **Teste die Live-Site:**
   - Login/Register
   - Admin-Panel (nur als Admin)
   - Issue Management (Create, Edit, Delete, Copy)
   - MD-Export (sollte Download starten)

2. **Checke Browser Console:**
   - Keine Errors
   - Supabase Connection funktioniert

3. **Teste auf verschiedenen Devices:**
   - Desktop
   - Mobile
   - Verschiedene Browser

## 🎯 **Empfehlung**

**Für Production:**
Überlege, ob du den MD-Export brauchst oder ob JSON-Export ausreicht.
Alternativ: Verwende Supabase Edge Functions für serverseitige File-Operations.

**Für Development:**
Behalte `server/api.js` - funktioniert perfekt lokal!
