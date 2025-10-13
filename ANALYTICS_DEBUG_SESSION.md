# Analytics Debug Session - 13. Oktober 2025

## 🎯 Problem
Kachel zeigt **46.7K LOC**, Chart zeigt **83K LOC** - verschiedene Werte!

---

## ✅ Was wir gefixed haben

### 1. Backend Analytics API Migration
**Problem:** Die Analytics-Route existierte nur im alten `web/frontend/server/api.js`, nicht im neuen Backend `web/backend/src/index.ts`

**Fix:** Analytics-Route migriert nach `web/backend/src/index.ts`
- Endpoint: `GET /api/analytics/code-metrics`
- Berechnet live LOC via Git Commands
- Funktioniert jetzt mit `npm run dev:all`

**Ergebnis:** Kachel zeigt jetzt **echte live LOC: 65.2K** ✅

---

### 2. Snapshot erstellt
**Problem:** Chart zeigte alte Snapshots (83K) von vor dem Monorepo-Refactor

**Fix:** Manueller Snapshot erstellt via "📸 Snapshot" Button

**Ergebnis:** Chart zeigt jetzt auch **65.2K LOC** ✅

---

## 🤔 Offene Frage: GitHub Actions

### Das eigentliche Setup sollte sein:
- **Kachel:** Live LOC via lokale API (für Dev) ✅
- **Chart:** Historische LOC aus Snapshots (via GitHub Actions) ❓

### Zu klären morgen (14.10. ca. 17 Uhr):

**Frage:** Erstellen die GitHub Actions noch automatisch Snapshots?

**Check:**
1. Letzten manuellen Snapshot löschen
2. Bis morgen warten
3. Prüfen ob GitHub Action automatisch neuen Snapshot erstellt

**SQL Query zum Prüfen:**
```sql
SELECT
  snapshot_date,
  total_loc,
  metadata->>'created_via' as source,
  created_at
FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 10;
```

**Erwartung:**
- `source = 'github_actions'` → GitHub Action läuft ✅
- `source = 'manual'` oder `'backfill'` → GitHub Action läuft nicht ❌

---

## 📊 Aktuelle Projekt-Stats (13.10.2025)

**Echte LOC (von API):**
```json
{
  "loc": 65181,
  "files": 485,
  "commits": 282,
  "projectAge": {
    "days": 19,
    "startDate": "2025-09-24"
  },
  "languageStats": {
    "typescript": 32521,
    "javascript": 3121,
    "scss": 16991,
    "css": 799,
    "sql": 4443,
    "json": 228,
    "markdown": 7078
  }
}
```

---

## 🚀 Was jetzt funktioniert

### Lokale Entwicklung:
```bash
# Startet Frontend + Backend gleichzeitig
npm run dev:all
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:3001
**Analytics API:** http://localhost:3001/api/analytics/code-metrics

### Live LOC in der Kachel:
- Zeigt echte LOC aus Git Repo
- Updated bei jedem Refresh
- Perfekt für "nerdy" Live-Tracking beim Coden 🤓

---

## 📝 TODO für morgen (14.10. ~17:00 Uhr)

### 1. ✅ Letzten Snapshot löschen (DONE)
```sql
-- Den manuell erstellten Snapshot von heute löschen
DELETE FROM project_snapshots
WHERE snapshot_date = '2025-10-13'
AND metadata->>'created_via' = 'manual';
```

### 2. ✅ GitHub Actions GEFIXED! (DONE)

**Problem gefunden:**
Nach dem Monorepo-Refactor waren die Pfade falsch:
- Workflow war in `web/frontend/.github/workflows/` (falsch)
- Script-Pfad im Workflow: `scripts/analytics/...` (falsch)
- ProjectRoot im Script: `../.` (nur 2 Ebenen hoch, falsch)

**Fixes applied:**
1. ✅ Workflow nach `.github/workflows/daily-snapshot.yml` verschoben (Root)
2. ✅ Script-Pfad im Workflow: `node web/frontend/scripts/analytics/create-snapshot-github-actions.js`
3. ✅ ProjectRoot im Script: `path.resolve(__dirname, '..', '..', '..', '..')` (4 Ebenen hoch)

**Geänderte Dateien:**
- `.github/workflows/daily-snapshot.yml` (neu erstellt im Root)
- `web/frontend/scripts/analytics/create-snapshot-github-actions.js` (projectRoot gefixt)
- `web/frontend/.github/workflows/daily-snapshot.yml` (alte Version, kann gelöscht werden)

**Diese Änderungen müssen noch committed & gepusht werden!**

### 3. Morgen (14.10.) prüfen
```sql
-- Hat GitHub Action automatisch Snapshot erstellt?
SELECT
  snapshot_date,
  total_loc,
  metadata->>'created_via' as source,
  created_at
FROM project_snapshots
WHERE snapshot_date = '2025-10-14';
```

**Erwartung:** Snapshot mit `source = 'github_actions'` und `total_loc ≈ 65181` ✅

**Falls JA:** 🎉 GitHub Action funktioniert wieder!
**Falls NEIN:** ❌ Weitere Fehler in GitHub Actions Logs prüfen

---

## 🔧 Mögliche Probleme mit GitHub Actions

### Falls keine Snapshots erstellt werden:

#### Problem 1: Secrets fehlen
GitHub Repo → Settings → Secrets → Check:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Problem 2: Workflow disabled
GitHub Repo → Actions → "Daily Snapshot" → Enable

#### Problem 3: Workflow-Fehler
GitHub Repo → Actions → Letzten Run anschauen → Logs prüfen

#### Problem 4: Monorepo-Pfade falsch
Nach Monorepo-Migration müssen Pfade angepasst sein:
- Script-Pfad: `web/frontend/scripts/analytics/create-snapshot-github-actions.js`
- Oder: Root-Pfad falls Script verschoben wurde

---

## 📚 Relevante Dateien

### Backend:
- `web/backend/src/index.ts` - Analytics API Route (NEU hinzugefügt)

### Frontend:
- `web/frontend/src/lib/services/analytics/codeMetricsService.browser.ts` - API Client
- `web/frontend/src/components/admin/analytics/StatsGrid.tsx` - Kachel
- `web/frontend/src/components/admin/analytics/GrowthChart.tsx` - Chart

### GitHub Actions:
- `.github/workflows/daily-snapshot.yml` - Daily Cron Job
- `web/frontend/scripts/analytics/create-snapshot-github-actions.js` - Snapshot Script

### Docs:
- `web/frontend/scripts/analytics/README.md`
- `web/frontend/scripts/analytics/GITHUB_ACTIONS_SETUP.md`
- `web/frontend/docs/ANALYTICS_SYSTEM.md`

---

## 🎉 Erfolge heute

1. ✅ Netlify Deployment gefixed (Monorepo-Config)
2. ✅ Backend Analytics API migriert
3. ✅ Kachel zeigt live LOC (65.2K)
4. ✅ Chart zeigt aktuellen Snapshot (65.2K)
5. ✅ `npm run dev:all` funktioniert

---

## 💬 Notizen

- **Kachel 46.7K:** War Fallback-Wert (hardcoded)
- **Chart 83K:** War alter Snapshot von vor Monorepo-Refactor
- **Echte LOC 65.2K:** Aktueller Stand nach Monorepo-Migration
- **GitHub Actions:** Läuft seit 11.10., aber nach Refactor evtl. broken?

---

**Bis morgen! 🚀**
