# Deployment Strategy - DegixDAW

**Erstellt:** 2025-10-17
**Updated:** 2025-11-22 (Migrated to Coolify)
**Version:** 2.0

---

## 🌐 Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION INFRASTRUCTURE                        │
└─────────────────────────────────────────────────────────────────────┘

FULLSTACK (Coolify on Hetzner)
├─ URL: http://degix.94.130.185.204.sslip.io
├─ Frontend: React 19 + Vite (Static Files)
├─ Backend: Express API (Port 3001)
├─ SSL: TODO (Let's Encrypt via Coolify)
├─ Deploy: Auto on push to main (GitHub webhook)
└─ Build: Nixpacks (nixpacks.toml)

BACKEND SERVICES (Supabase)
├─ Database: PostgreSQL
├─ Storage: S3-compatible (Audio/Files)
├─ Auth: Supabase Auth (OAuth + JWT)
├─ Realtime: WebSocket (Chat, Presence, Sync Playback)
└─ Edge Functions: Serverless (Deno)

DESKTOP APP (GitHub Releases)
├─ Windows: DegixDAW-Desktop.exe
└─ Portable: No installer needed

VST PLUGIN (Planned)
├─ Windows: DegixDAW.vst3 + Installer
└─ macOS: Universal Binary (future)

MONITORING
├─ Health: /health endpoint
├─ Errors: Console logs (TODO: Sentry)
└─ Analytics: Supabase built-in
```

---

## 🚀 Fullstack Deployment (Coolify)

### Current Setup

**Hosting:** Hetzner Cloud VPS
**Platform:** Coolify (Self-hosted PaaS)
**Build System:** Nixpacks
**Production URL:** http://degix.94.130.185.204.sslip.io

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Container                      │
├─────────────────────────────────────────────────────────┤
│  Express Backend (Node.js)                              │
│  ├─ Serves API routes (/api/*, /health)                │
│  ├─ Serves Frontend static files (express.static)      │
│  └─ SPA fallback (index.html for all non-API routes)   │
│                                                          │
│  Frontend (Built Static Files)                          │
│  └─ web/frontend/dist/                                  │
│      ├─ index.html                                      │
│      ├─ assets/                                         │
│      └─ ...                                             │
└─────────────────────────────────────────────────────────┘
```

### Build Configuration (nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.install]
cmds = ['npm install']

[phases.build]
cmds = [
  'npm run build:frontend',
  'npm run build:backend'
]

[start]
cmd = 'NODE_ENV=production npm start'
```

**Key Points:**
- `NODE_ENV=production` activates static file serving in backend
- Backend serves frontend from `web/frontend/dist`
- Single Docker container for both frontend + backend

### Environment Variables (Coolify Dashboard)

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://xcdzugnjzrkngzmtzeip.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
FRONTEND_URL=http://degix.94.130.185.204.sslip.io
```

### Deployment Workflow

1. **Push to GitHub** (`main` branch)
2. **Coolify Webhook** triggers build
3. **Build Steps:**
   - Install dependencies (`npm install`)
   - Build frontend (`npm run build:frontend`)
   - Build backend (`npm run build:backend`)
4. **Create Docker Image** (Nixpacks auto-generates Dockerfile)
5. **Health Check** (GET `/health` → 200 OK)
6. **Rolling Update** (old container removed after new is healthy)

**Build Time:** ~2 minutes

---

## 🗄️ Backend Services (Supabase)

### Database

**Service:** Supabase PostgreSQL
**Region:** US East
**Tables:**
- `profiles`, `messages`, `conversations`, `issues`, `feature_flags`
- `projects`, `tracks`, `midi_events`, `mixdowns`, `presets`, `track_comments`

**RLS:** Enabled on all tables

### Storage

**Buckets:**
- `audio` - Track files (WAV/MP3)
- `presets` - VST Presets
- `avatars` - User profile pictures

**Security:** Row-Level Security + Signed URLs (1h expiry)

### Authentication

**Providers:**
- Email/Password
- OAuth (Google, GitHub)

**Redirect URLs (configured in Supabase):**
```
http://degix.94.130.185.204.sslip.io/**
http://localhost:5173/**
```

### Realtime

**Channels:**
- `messages` - Chat messages
- `presence` - Online users
- `sync_playback` - Multi-user playback sync

---

## 📦 Desktop App Deployment

### Build Process

```bash
cd desktop
compile.bat  # Windows MSVC build
```

**Output:** `desktop/build/DegixDAW.exe`

### Distribution

**Method:** GitHub Releases
**Versioning:** Semantic (v1.0.0)
**Auto-Updates:** Planned (future)

---

## 🎛️ VST Plugin Deployment (Planned)

### Build System

**Framework:** JUCE
**Platforms:** Windows (VST3), macOS (AU/VST3)

### GitHub Releases

**Artifacts:**
- `DegixDAW.vst3` (Windows)
- `DegixDAW.component` (macOS AU)
- `DegixDAW_Installer.exe` (Windows)

---

## 🔐 SSL/HTTPS Setup (TODO)

**Current:** HTTP only
**Planned:** Let's Encrypt via Coolify

**Steps:**
1. Configure custom domain (e.g., `app.degixdaw.com`)
2. Enable SSL in Coolify dashboard
3. Update Supabase redirect URLs

---

## 📊 Monitoring & Health Checks

### Health Endpoint

```bash
GET /health
Response: { "status": "ok", "message": "DegixDAW Backend is running" }
```

### Logs

**Access:** Coolify Dashboard → Logs
**Types:**
- Build logs
- Runtime logs
- Error logs

### Metrics (TODO)

- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Performance monitoring (New Relic/Datadog)

---

## 🚨 Rollback Strategy

### Quick Rollback

**Via Coolify:**
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

**Via Git:**
```bash
git revert HEAD
git push
# Coolify auto-deploys reverted commit
```

### Database Rollback

**Supabase:**
- Point-in-time recovery (PITR) available
- Manual SQL rollback via migrations

---

## 📝 Deployment Checklist

**Before Deploy:**
- [ ] Tests pass (`npm run test:all`)
- [ ] Build succeeds locally (`npm run build:all`)
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migrations applied

**After Deploy:**
- [ ] Health check returns 200
- [ ] Frontend loads correctly
- [ ] API endpoints work
- [ ] Realtime features work (chat, presence)
- [ ] OAuth login works

---

## 🔧 Troubleshooting

### 404 on Root Route

**Cause:** `NODE_ENV` not set to `production`
**Fix:** Add `NODE_ENV=production` to Coolify env vars

### Build Fails

**Check:**
- Build logs in Coolify
- TypeScript errors
- Missing dependencies

### Container Unhealthy

**Check:**
- `/health` endpoint returns 200
- Backend logs for errors
- Port 3001 accessible

---

## 📚 Related Documentation

- [nixpacks.toml](../../nixpacks.toml) - Build configuration
- [web/backend/src/index.ts](../../web/backend/src/index.ts) - Backend entry point
- [CLAUDE.md](../../CLAUDE.md) - Development guide
