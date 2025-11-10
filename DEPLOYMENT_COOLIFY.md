# DegixDAW Deployment auf Coolify

## Überblick

DegixDAW wird als **EINE App** deployed (wie JOCH):
- Backend servet API-Endpoints (`/api/*`, `/health`)
- Backend servet Frontend statische Files (`web/frontend/dist`)
- SPA-Fallback für React Router

## Voraussetzungen

- ✅ Hetzner Server mit Coolify installiert
- ✅ GitHub Repository: `Degi100/DegixDAW`
- ✅ Supabase Account mit Project

## Deployment-Schritte

### 1. Neue App in Coolify erstellen

1. Öffne Coolify UI: `http://94.130.185.204:8000`
2. Klicke **"+ New Resource"** → **"Application"**
3. Wähle GitHub Repository: `Degi100/DegixDAW`
4. Branch: `main` (oder dein Feature-Branch)

### 2. Build-Konfiguration

**Wichtig:** Coolify erkennt `nixpacks.toml` automatisch!

- **Build Pack**: Nixpacks (Auto-detected)
- **Base Directory**: `.` (Root, nicht web/frontend oder web/backend!)
- **Port**: `3001` (Backend Port)

Nixpacks führt automatisch aus:
```bash
# Install
npm install

# Build
npm run build:frontend  # → web/frontend/dist
npm run build:backend   # → web/backend/dist

# Start
NODE_ENV=production npm start --workspace=web/backend
```

### 3. Environment Variables

Füge diese in Coolify UI hinzu (**Settings → Environment Variables**):

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xcdzugnjzrkngzmtzeip.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODczNjg2MCwiZXhwIjoyMDc0MzEyODYwfQ.OwORmN9NABGIN2QJgyUQzZkyAks2XDHAWA8rerbFFjc

# Frontend (Vite Build-Time Variables)
VITE_SUPABASE_URL=https://xcdzugnjzrkngzmtzeip.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU
VITE_SUPER_ADMIN_EMAIL=rene.degering2014@gmail.com

# Frontend URL (für Email-Redirects)
FRONTEND_URL=https://degixdaw.94.130.185.204.sslip.io

# Backend API URL (für Frontend API Calls)
VITE_API_URL=https://degixdaw.94.130.185.204.sslip.io
```

**⚠️ Wichtig:**
- `FRONTEND_URL` und `VITE_API_URL` müssen auf deine Coolify-URL zeigen!
- Coolify generiert URLs wie: `https://degixdaw.94.130.185.204.sslip.io`
- Passe diese nach dem ersten Deploy an!

### 4. Deploy starten

1. Klicke **"Deploy"** in Coolify
2. Watch Build-Logs (sollte ~2-5 Minuten dauern)
3. Wenn erfolgreich: Coolify zeigt dir die URL

### 5. Domain konfigurieren (Optional)

Wenn du eine eigene Domain hast:

1. Coolify → App Settings → **"Domains"**
2. Füge deine Domain hinzu (z.B. `degixdaw.com`)
3. Coolify generiert SSL-Zertifikat (Let's Encrypt)
4. Update ENV vars: `FRONTEND_URL` und `VITE_API_URL` auf neue Domain

## Struktur nach Deployment

```
Coolify Container:
├── node_modules/
├── web/
│   ├── frontend/
│   │   └── dist/              ← Statische Files (HTML, JS, CSS)
│   └── backend/
│       └── dist/
│           └── index.js       ← Express Server (läuft)
├── packages/
└── nixpacks.toml
```

**Backend servet:**
- API: `GET /health`, `GET /api/*`, `POST /api/*`
- Static Files: Alles aus `web/frontend/dist`
- SPA Fallback: `index.html` für alle Non-API-Routes

## Testing nach Deployment

### 1. Health Check
```bash
curl https://degixdaw.94.130.185.204.sslip.io/health
# Expected: {"status":"ok","message":"DegixDAW Backend is running"}
```

### 2. Frontend
Öffne im Browser:
```
https://degixdaw.94.130.185.204.sslip.io
```
Sollte Login-Page zeigen!

### 3. API Test
```bash
curl https://degixdaw.94.130.185.204.sslip.io/api
# Expected: {"message":"Welcome to DegixDAW API"}
```

## Troubleshooting

### Build schlägt fehl

**Error: "Cannot find module..."**
→ Check `package.json` dependencies

**Error: "TypeScript compilation failed"**
→ Check TypeScript errors lokal: `npm run build:all`

### Frontend zeigt 404

**Problem:** Backend servet Frontend nicht
→ Check ENV: `NODE_ENV=production` gesetzt?
→ Check Logs: "Serving static files from..." sollte da sein

### API funktioniert nicht

**Problem:** CORS oder ENV variables
→ Check ENV: Supabase Keys korrekt?
→ Check Logs: Backend Errors?

### Vite ENV Variables nicht verfügbar

**Problem:** `import.meta.env.VITE_*` ist `undefined`
→ ENV vars müssen mit `VITE_` Prefix beginnen!
→ ENV vars müssen bei **Build-Time** gesetzt sein (Coolify macht das automatisch)

## Logs anschauen

In Coolify UI:
1. Gehe zu deiner App
2. **"Logs"** Tab
3. Watch Realtime-Logs

Oder via SSH:
```bash
ssh root@94.130.185.204
docker ps                          # Find container ID
docker logs -f <container-id>     # Follow logs
```

## Redeploy nach Code-Änderungen

1. Push Code zu GitHub
2. Coolify → App → **"Redeploy"**
3. Oder: Enable **"Auto Deploy"** für automatische Deploys bei Push

## Vergleich: JOCH vs DegixDAW

| Feature | JOCH | DegixDAW |
|---------|------|----------|
| Monorepo | ✅ | ✅ |
| npm workspaces | ✅ | ✅ |
| Backend servet Frontend | ✅ | ✅ (neu hinzugefügt!) |
| nixpacks.toml | ✅ | ✅ (neu erstellt!) |
| Eine App in Coolify | ✅ | ✅ |

## Nächste Schritte

1. ✅ Backend erweitert (Static File Serving)
2. ✅ `nixpacks.toml` erstellt
3. 🔄 Deploy in Coolify testen
4. 🔄 ENV Variables anpassen (URLs)
5. 🔄 Domain konfigurieren (optional)

---

**Ready to deploy!** 🚀
