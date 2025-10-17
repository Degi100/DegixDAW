# Deployment Strategy - DegixDAW

**Erstellt:** 2025-10-17
**Version:** 1.0

---

## 🌐 Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION INFRASTRUCTURE                        │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (Netlify)
├─ URL: https://app.degixdaw.com
├─ CDN: Global edge network
├─ SSL: Auto-managed (Let's Encrypt)
└─ Deploy: Auto on push to main

BACKEND (Supabase)
├─ Database: PostgreSQL (us-east-1)
├─ Storage: Multi-region S3-compatible
├─ Auth: Supabase Auth (JWT)
├─ Realtime: WebSocket (global)
└─ Edge Functions: Serverless (Deno)

VST PLUGIN (GitHub Releases)
├─ Windows: DegixDAW.vst3 + Installer
├─ macOS: Universal Binary (future)
└─ Auto-updater: In-plugin (future)

DESKTOP APP (GitHub Releases)
├─ Windows: DegixDAW-Desktop.exe
└─ Portable: No installer needed

MONITORING
├─ Uptime: UptimeRobot
├─ Errors: Sentry (optional)
└─ Analytics: Supabase built-in
```

---

## 🚀 Frontend Deployment (Netlify)

### Current Setup

```
Repository: github.com/yourusername/degixdaw
Branch: main
Build Command: npm run build:frontend
Publish Directory: web/frontend/dist
```

### netlify.toml

```toml
# Production Config
[build]
  base = "web/frontend"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# SPA Routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co"

# Cache Static Assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Environment Variables (set in Netlify Dashboard)
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_SUPER_ADMIN_EMAIL
```

### Deploy Commands

```bash
# Manual Deploy (CLI)
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Auto Deploy
# Push to main → Auto-deploy

# Preview Deploy
# PR → Preview URL (e.g., deploy-preview-123--degixdaw.netlify.app)
```

---

## 🗄️ Backend Deployment (Supabase)

### Database Migrations

```bash
# Setup Supabase CLI
npm install -g supabase

# Login
supabase login

# Link Project
supabase link --project-ref your-project-ref

# Generate Migration
supabase db diff -f migration_name

# Apply Migration
supabase db push

# Or: Run SQL directly in Supabase Dashboard
# SQL Editor → Run migration files
```

### Storage Buckets Setup

```sql
-- Run in Supabase SQL Editor

-- Create buckets (see 04_STORAGE_STRATEGY.md)
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('music-projects', 'music-projects', false, 104857600),
  ('project-thumbnails', 'project-thumbnails', true, 5242880);

-- Apply RLS policies (see 04_STORAGE_STRATEGY.md)
```

### Edge Functions (Optional)

```typescript
// supabase/functions/analytics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Your analytics logic here

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Deploy Edge Function:
```bash
supabase functions deploy analytics
```

---

## 🔌 VST Plugin Deployment (GitHub Actions)

### GitHub Actions Workflow

```yaml
# .github/workflows/build-vst.yml
name: Build VST Plugin

on:
  push:
    branches: [main, develop]
    paths:
      - 'vst-plugin/**'
      - '.github/workflows/build-vst.yml'
  release:
    types: [published]

jobs:
  build-windows:
    name: Build VST3 (Windows)
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          submodules: recursive # JUCE submodule

      - name: Setup MSVC
        uses: microsoft/setup-msbuild@v1

      - name: Setup CMake
        uses: jwlawson/actions-setup-cmake@v1
        with:
          cmake-version: '3.25.x'

      - name: Configure CMake
        run: |
          cd vst-plugin
          cmake -B build -G "Visual Studio 17 2022" -A x64

      - name: Build VST3
        run: |
          cd vst-plugin
          cmake --build build --config Release

      - name: Package VST3
        run: |
          cd vst-plugin/build/DegixDAW_artefacts/Release/VST3
          7z a -tzip ../../../../../DegixDAW-VST3-Windows.zip DegixDAW.vst3

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: DegixDAW-VST3-Windows
          path: vst-plugin/DegixDAW-VST3-Windows.zip

      - name: Create Release Asset (if tagged)
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: vst-plugin/DegixDAW-VST3-Windows.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build-macos:
    name: Build VST3 (macOS)
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Setup CMake
        uses: jwlawson/actions-setup-cmake@v1

      - name: Configure CMake
        run: |
          cd vst-plugin
          cmake -B build -G "Xcode"

      - name: Build VST3
        run: |
          cd vst-plugin
          cmake --build build --config Release

      - name: Package VST3
        run: |
          cd vst-plugin/build/DegixDAW_artefacts/Release/VST3
          zip -r ../../../../../DegixDAW-VST3-macOS.zip DegixDAW.vst3

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: DegixDAW-VST3-macOS
          path: vst-plugin/DegixDAW-VST3-macOS.zip

      - name: Create Release Asset
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: vst-plugin/DegixDAW-VST3-macOS.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Create Release

```bash
# Tag version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Or: Create release via GitHub UI
# Releases → Draft a new release → Tag: v1.0.0

# GitHub Actions will automatically build & attach VST3
```

---

## 💻 Desktop App Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/build-desktop.yml
name: Build Desktop App

on:
  push:
    branches: [main]
    paths:
      - 'desktop/**'
  release:
    types: [published]

jobs:
  build-windows:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup MSVC
        uses: microsoft/setup-msbuild@v1

      - name: Build Desktop App
        run: |
          cd desktop
          ./compile.bat

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: DegixDAW-Desktop-Windows
          path: desktop/build/DegixDAW.exe

      - name: Create Release Asset
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: desktop/build/DegixDAW.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📊 Monitoring & Analytics

### UptimeRobot (Free Tier)

```
Monitor 1: Frontend
├─ URL: https://app.degixdaw.com
├─ Interval: 5 minutes
└─ Alert: Email on downtime

Monitor 2: Supabase
├─ URL: https://your-project.supabase.co/rest/v1/
├─ Interval: 5 minutes
└─ Alert: Email on downtime

Monitor 3: Backend API (if separate)
├─ URL: https://api.degixdaw.com/health
├─ Interval: 5 minutes
└─ Alert: Email on downtime
```

### Sentry (Error Tracking)

```typescript
// web/frontend/src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1, // 10% of transactions
  });
}
```

### Supabase Analytics (Built-in)

```
Dashboard → Analytics
├─ API Requests/sec
├─ Database Queries/sec
├─ Storage Bandwidth
├─ Active Connections
└─ Error Rate
```

---

## 🔐 Environment Variables

### Frontend (Netlify)

```bash
# Set in Netlify Dashboard: Site settings → Environment variables

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPER_ADMIN_EMAIL=admin@degixdaw.com
VITE_API_URL=https://api.degixdaw.com (optional)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx (optional)
```

### Backend (Supabase)

```bash
# Set in Supabase Dashboard: Settings → API

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ... (public, safe for frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (PRIVATE! Backend only!)
```

### GitHub Actions

```bash
# Set in GitHub: Repo → Settings → Secrets → Actions

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NETLIFY_AUTH_TOKEN=xxx (optional, for CLI deploys)
```

---

## 🧪 Testing Before Deploy

### Frontend Tests

```bash
cd web/frontend

# Linting
npm run lint

# Type checking
npm run type-check

# Unit tests
npm test

# Build test
npm run build

# Preview build
npm run preview
```

### Backend Tests

```bash
cd web/backend

# Linting
npm run lint

# Build test
npm run build

# Start server
npm start
```

### VST Plugin Tests

```bash
cd vst-plugin

# Build
cmake --build build --config Release

# Manual test in DAW
# 1. Copy .vst3 to VST3 folder
# 2. Open Cubase
# 3. Test all features
```

---

## 🚦 Deployment Checklist

### Pre-Deploy

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build:all`)
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Storage buckets created

### Deploy

- [ ] Frontend: Push to `main` → Auto-deploy to Netlify
- [ ] Backend: Run migrations (`supabase db push`)
- [ ] VST Plugin: Create GitHub release → Auto-build
- [ ] Desktop App: Create GitHub release → Auto-build

### Post-Deploy

- [ ] Smoke test: Can users log in?
- [ ] Check Netlify deploy logs
- [ ] Check Supabase logs (Dashboard → Logs)
- [ ] Test VST plugin download
- [ ] Monitor error rates (Sentry)
- [ ] Check uptime monitors (UptimeRobot)

---

## 🔄 Rollback Strategy

### Frontend (Netlify)

```bash
# Rollback to previous deploy
# Netlify Dashboard → Deploys → Select previous → Publish deploy
```

### Database (Supabase)

```bash
# Rollback migration
supabase db reset

# Or: Run reverse migration manually
# SQL Editor → Run rollback script
```

### VST Plugin

```bash
# GitHub Releases → Delete bad release
# Users can download previous version
```

---

## 📈 Scaling Plan

### Current Capacity (Free Tier)

```
Netlify:
├─ Bandwidth: 100 GB/month
├─ Build minutes: 300/month
└─ Concurrent builds: 1

Supabase (Free):
├─ Database: 500 MB
├─ Storage: 1 GB
├─ Bandwidth: 2 GB
├─ Realtime connections: 200
└─ Edge functions: 500K invocations

GitHub:
├─ Actions: 2000 minutes/month (free)
└─ Storage: Unlimited
```

### When to Upgrade

```
Upgrade Netlify Pro ($19/month) if:
├─ Bandwidth > 100 GB/month
├─ Need more build minutes
└─ Want faster builds (parallel)

Upgrade Supabase Pro ($25/month) if:
├─ Database > 500 MB
├─ Storage > 1 GB
├─ Need more than 200 concurrent Realtime connections
└─ Need daily backups

Add CDN if:
├─ Global users (latency issues)
├─ Heavy media files (videos, large samples)
└─ High bandwidth usage
```

---

## 🛡️ Security Checklist

### Supabase

- [ ] RLS policies enabled on all tables
- [ ] Storage policies enabled on all buckets
- [ ] Service role key NEVER exposed to frontend
- [ ] Anon key rate-limited
- [ ] Auth email confirmation enabled
- [ ] OAuth providers configured correctly

### Frontend

- [ ] No secrets in code
- [ ] Environment variables prefixed with `VITE_`
- [ ] CSP headers configured (netlify.toml)
- [ ] HTTPS enforced
- [ ] SameSite cookies

### VST Plugin

- [ ] Auth tokens encrypted in storage
- [ ] HTTPS only for API calls
- [ ] Token refresh on expiry
- [ ] No hardcoded secrets

---

## 📝 Release Notes Template

```markdown
# DegixDAW v1.0.0

**Release Date:** 2025-10-17

## 🎉 New Features
- MIDI Editor in Browser (Piano Roll + Tone.js playback)
- VST3 Plugin for Cubase/Ableton/Logic
- Project download from cloud to DAW
- Mixdown upload from DAW to cloud

## 🐛 Bug Fixes
- Fixed signed URL expiry issues
- Fixed chat notification count

## 🔧 Improvements
- Faster project loading
- Better error messages in VST plugin

## 📦 Downloads
- [Windows VST3](https://github.com/.../DegixDAW-VST3-Windows.zip)
- [macOS VST3](https://github.com/.../DegixDAW-VST3-macOS.zip)
- [Desktop App](https://github.com/.../DegixDAW-Desktop.exe)

## 🔗 Links
- [Documentation](https://docs.degixdaw.com)
- [Discord Community](https://discord.gg/degixdaw)
```

---

## 🎯 Next Steps

1. **Setup Netlify:** Connect GitHub repo → Auto-deploy
2. **Setup Supabase:** Apply migrations + storage buckets
3. **Setup GitHub Actions:** Enable VST build workflow
4. **Setup Monitoring:** UptimeRobot + Sentry
5. **First Deploy:** Test end-to-end flow

---

**See also:**
- [00_BIG_PICTURE.md](00_BIG_PICTURE.md) - Architecture overview
- [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md) - Database migrations
- [05_VST_PLUGIN.md](05_VST_PLUGIN.md) - VST build instructions
