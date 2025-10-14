# Analytics Chart Features - Implementierungsübersicht

Diese Datei dokumentiert die neu implementierten Analytics-Features für das Code Growth Chart.

## 🎯 Übersicht

Das Code Growth Chart im Admin Analytics Dashboard wurde mit mehreren interaktiven Features erweitert, um die Analyse der Code-Entwicklung über Zeit zu verbessern.

## ✅ Implementierte Features (Stand: 2025-10-14)

### 1. Rich Tooltips mit detaillierten Breakdowns

**Branch:** `chart-feature-informations` → merged to `main`
**Commits:** 36ab000, 237cf0d

**Was wurde implementiert:**
- Detaillierte Breakdowns für verschiedene Code-Kategorien beim Hovern über Chart-Linien
- Tree-Style Formatierung (├─ und └─) für bessere Lesbarkeit

**Breakdowns:**
- **TypeScript**: Frontend / Backend / Packages / Desktop
- **JavaScript**: Frontend / Backend / Packages / Desktop
- **JSON**: package-lock.json / Configs / Other
- **Markdown**: README / CLAUDE.md / Other Docs
- **Other**: YML / TOML / BAT / SH / HTML / XML / TXT

**Technische Details:**
- Backend API (`web/backend/src/index.ts`) sammelt detaillierte Breakdowns
- Snapshot Script (`web/frontend/scripts/analytics/create-snapshot-github-actions.js`) speichert Breakdowns in DB
- Custom Tooltip Komponente zeigt Breakdowns basierend auf aktivem Chart-Element
- Datenbank: `breakdown` JSONB column in `project_snapshots` table

**Migration:**
```sql
-- web/frontend/scripts/sql/add_breakdown_column.sql
ALTER TABLE project_snapshots
  ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb;
```

### 2. Milestone Markers

**Branch:** `chart-feature-informations` → merged to `main`
**Commit:** bc7c429

**Was wurde implementiert:**
- Automatische Erkennung und Visualisierung wichtiger Meilensteine im Chart
- Farbcodierte Marker mit Emojis und Labels

**Milestone-Typen:**
1. **🎯 Threshold Milestones** (gelb `#fbbf24`)
   - 10.000 LOC erreicht
   - 25.000 LOC erreicht
   - 50.000 LOC erreicht
   - 75.000 LOC erreicht
   - 100.000 LOC erreicht

2. **📈 Big Jumps** (orange `#f59e0b`)
   - Sprünge von >10.000 LOC an einem Tag
   - Label zeigt Größe des Sprungs (z.B. "+12.3k")

3. **⚙️ First C++** (blau `#659ad2`)
   - Markiert den Tag, an dem erstmals C++ Code hinzugefügt wurde

**Technische Details:**
- `detectMilestones()` Funktion analysiert Chart-Daten automatisch
- Verwendet Recharts' `ReferenceDot` Komponente für Visualisierung
- Milestones werden dynamisch basierend auf gefilterten Daten neu berechnet

### 3. Zeit-Range Filter

**Branch:** `chart-feature-informations` → merged to `main`
**Commit:** 564086d

**Was wurde implementiert:**
- Buttons zum Filtern der Chart-Daten nach verschiedenen Zeiträumen
- Dynamische Filterung basierend auf aktuellem Datum

**Verfügbare Filter:**
- **3 Tage** - Letzte 3 Tage
- **7 Tage** - Letzte Woche
- **14 Tage** - Letzte 2 Wochen
- **1 Monat** - Letzter Monat (30 Tage)
- **3 Monate** - Letztes Quartal (90 Tage)
- **6 Monate** - Letztes Halbjahr (180 Tage)
- **1 Jahr** - Letztes Jahr (365 Tage)
- **Alle** - Gesamte Historie (Standard)

**Technische Details:**
- TypeScript Type: `TimeRange = '3d' | '7d' | '14d' | '1m' | '3m' | '6m' | '1y' | 'all'`
- `useEffect` Hook filtert `allData` basierend auf `timeRange` State
- Speichert `rawDate` (Date Object) für präzise Datums-Filterung
- Styles: `.time-filter` Buttons mit aktiver Hervorhebung (blaue Primary Color)

### 4. Zoom/Brush Tool

**Branch:** `chart-feature-informations` → merged to `main`
**Commit:** 564086d

**Was wurde implementiert:**
- Interaktiver Slider am unteren Chart-Rand für präzise Zeitbereich-Auswahl
- Ermöglicht freies Zoomen in beliebige Zeiträume

**Features:**
- Drag & Drop zum Auswählen eines Zeitraums
- Verschieben des ausgewählten Bereichs
- Resize-Handles an beiden Enden
- 30px Höhe, angepasst an Theme-Farben

**Technische Details:**
- Verwendet Recharts' `<Brush>` Komponente
- Props: `dataKey="date"`, `height={30}`, `stroke="var(--primary-color)"`
- Kombinierbar mit Zeit-Filter (Filter setzen Basis, Brush zoomt innerhalb)

## 📁 Wichtige Dateien

### Backend
```
web/backend/src/index.ts
```
- `/api/analytics/code` Endpoint erweitert mit Breakdown-Sammlung
- Kategorisiert Code nach Directory und File-Type

### Frontend - Komponenten
```
web/frontend/src/components/admin/analytics/CodeGrowthChart.tsx
```
- Haupt-Chart Komponente mit allen Features
- States: `timeRange`, `allData`, `chartData`, `milestones`, `visibleLines`
- Custom Tooltip mit Breakdown-Anzeige
- Milestone Detection Logik
- Zeit-Filter UI

### Frontend - Styles
```
web/frontend/src/styles/components/analytics/GrowthChart.scss
```
- `.growth-chart__time-filters` - Filter Button Container
- `.time-filter` - Einzelne Filter Buttons mit active State
- `.growth-chart__current-values` - Values Below Chart (Grid Layout)
- `.values-grid` - Responsive Grid für Current Values

### Frontend - Scripts
```
web/frontend/scripts/analytics/create-snapshot-github-actions.js
```
- GitHub Actions Snapshot Script (daily)
- Sammelt Breakdowns identisch zu Backend API
- Speichert in Supabase `project_snapshots` Table

```
web/frontend/scripts/analytics/backfill-snapshots-history.js
```
- Historische Snapshots nachträglich erstellen
- Geht durch Git History und erstellt Snapshots für jeden Tag
- Verwendet identische Breakdown-Logik

### Database Migration
```
web/frontend/scripts/sql/add_breakdown_column.sql
```
- Fügt `breakdown JSONB` Column zu `project_snapshots` hinzu
- Muss in Supabase SQL Editor ausgeführt werden

## 🔄 Data Flow

```
1. CODE ANALYSE:
   Git Repo → Backend API/Snapshot Scripts
   ↓
   Breakdown Collection (Directory/File-Type)

2. STORAGE:
   Breakdowns → Supabase (project_snapshots.breakdown JSONB)

3. LOADING:
   Supabase → getSnapshots(365) → allData State

4. FILTERING:
   timeRange State → useEffect → filtered chartData

5. DISPLAY:
   chartData → Recharts LineChart → Custom Tooltip (mit Breakdown)
   chartData → detectMilestones() → ReferenceDot Markers
   chartData → Brush Component (Zoom)
```

## 🎨 UI/UX Details

### Current Values Panel (Below Chart)
- Verschoben von Sidebar zu unterhalb des Charts
- CSS Grid Layout: `repeat(auto-fit, minmax(250px, 1fr))`
- Cards mit farbigen Left-Border (matching Line Colors)
- Größere, fettere Zahlen (1.1rem, font-weight 700, monospace)
- Hover Effects: `translateX(4px)` + `box-shadow`

### Chart Dimensionen
- Höhe: 450px (erhöht von 400px für bessere Lesbarkeit)
- Responsive Container: 100% Breite

### Time Filter Buttons
- Horizontales Layout mit Wrap
- Active State: Weiße Schrift auf Primary Color Background
- Hover: Border Color ändert sich zu Primary Color
- Font-Size: 0.8125rem (kompakt)

## 🧪 Testing

### Backfill Historical Data
```bash
cd web/frontend
node scripts/analytics/backfill-snapshots-history.js
```
**Ergebnis (2025-10-14):**
- ✅ 20 Snapshots erstellt (2025-09-24 bis 2025-10-13)
- Projekt Start: 2025-09-24
- Erster C++ Code: 2025-10-12 (896 LOC)

### Build Status
```bash
npm run build:frontend
```
**Status:** ✅ Erfolgreicher Build (5.24s)
**Bundle Size:** AdminAnalytics-DCefpVYx.js: 399.13 KB (gzip: 117.08 KB)

## 📊 Datenbank Schema

### `project_snapshots` Table
```sql
- id (uuid, primary key)
- snapshot_date (date, unique)
- total_loc (integer)
- typescript_loc (integer)
- javascript_loc (integer)
- cpp_loc (integer)
- scss_loc (integer)
- css_loc (integer)
- sql_loc (integer)
- json_loc (integer)
- markdown_loc (integer)
- other_loc (integer)
- breakdown (jsonb) -- NEU!
- git_commit (text)
- created_at (timestamp)
- created_by (uuid, foreign key users.id)
- metadata (jsonb)
```

### `breakdown` JSONB Struktur
```json
{
  "typescript": {
    "frontend": 12000,
    "backend": 5000,
    "packages": 800,
    "desktop": 200
  },
  "javascript": {
    "frontend": 100,
    "backend": 50,
    "packages": 0,
    "desktop": 0
  },
  "cpp": {
    "files": 5,
    "loc": 896
  },
  "json": {
    "packageLock": 50000,
    "configs": 500,
    "other": 200,
    "files": 10
  },
  "markdown": {
    "readme": 300,
    "docs": 400,
    "other": 100,
    "files": 5
  },
  "other": {
    "yml": 150,
    "toml": 50,
    "bat": 30,
    "sh": 20,
    "html": 100,
    "xml": 40,
    "txt": 10,
    "files": 7
  }
}
```

## 🚀 Deployment

### Netlify (Frontend)
- Auto-deploy on push to `main`
- Build Command: `npm run build:frontend`
- Publish Directory: `web/frontend/dist`

### GitHub Actions (Daily Snapshots)
```yaml
# .github/workflows/daily-snapshot.yml
- Läuft täglich um 00:00 UTC
- Erstellt automatisch Snapshot mit Breakdowns
- Speichert in Supabase
```

## 🔮 Mögliche Erweiterungen

### Kurzfristig
- [ ] SQL Migration in Supabase ausführen (`add_breakdown_column.sql`)
- [ ] Backfill Script für ältere Snapshots ohne Breakdown-Daten
- [ ] Mobile Optimierung der Zeit-Filter Buttons

### Langfristig
- [ ] Export Chart als PNG/SVG
- [ ] Vergleich zwischen zwei Zeiträumen
- [ ] Velocity Metrics (LOC pro Tag/Woche)
- [ ] Contributor-basierte Breakdowns (wer hat wieviel Code geschrieben)
- [ ] Weitere Milestone-Typen (z.B. "First Test", "100 Files", etc.)

## 📝 Commits Timeline

```
564086d - feat(analytics): add zoom and time range filters to chart
bc7c429 - feat(analytics): add milestone markers to chart
237cf0d - feat(analytics): implement rich tooltips with detailed breakdowns
36ab000 - feat(analytics): add detailed breakdown data for rich tooltips
```

**Branch:** `chart-feature-informations` (gelöscht nach Merge)
**Merged to:** `main` (Fast-forward)
**Pushed:** 2025-10-14

---

**Erstellt:** 2025-10-14
**Branch:** `main`
**Status:** ✅ Production Ready
