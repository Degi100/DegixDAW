# GitHub Actions - Automatische Tägliche Snapshots

Automatische Analytics-Snapshots via GitHub Actions - **KOSTENLOS, EINFACH, VOLLSTÄNDIG!**

## 🎯 Vorteile

✅ **Kostenlos** - GitHub Actions Free Tier (2000 Minuten/Monat, du brauchst ~1 Minute/Tag)
✅ **Volle Code-Metriken** - LOC, Commits, Files, Language Breakdown
✅ **Kein Server nötig** - Läuft in der GitHub Cloud
✅ **Automatisch** - Täglich um 00:00 UTC (1:00 AM CET)
✅ **Manuell triggerbar** - Via GitHub UI jederzeit
✅ **Zuverlässig** - GitHub Infrastructure

---

## 📋 Setup (5 Minuten)

### Schritt 1: GitHub Secrets erstellen

Gehe zu deinem Repository auf GitHub:

```
https://github.com/DEIN_USERNAME/DegixDAW/settings/secrets/actions
```

Klicke auf **"New repository secret"** und füge folgende Secrets hinzu:

#### Secret 1: `VITE_SUPABASE_URL`
- **Name:** `VITE_SUPABASE_URL`
- **Value:** Deine Supabase Project URL
  ```
  https://DEIN_PROJECT.supabase.co
  ```
- 📍 **Wo finden?** Supabase Dashboard → Settings → API → Project URL

#### Secret 2: `SUPABASE_SERVICE_ROLE_KEY`
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Dein Supabase Service Role Key (secret!)
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- 📍 **Wo finden?** Supabase Dashboard → Settings → API → Service Role Key
- ⚠️ **WICHTIG:** Dies ist der **Service Role Key**, NICHT der Anon Key!

---

### Schritt 2: Dateien committen & pushen

Die Dateien wurden bereits erstellt:

```
✅ .github/workflows/daily-snapshot.yml
✅ scripts/analytics/create-snapshot-github-actions.js
```

Jetzt einfach committen und pushen:

```bash
git add .github/workflows/daily-snapshot.yml
git add scripts/analytics/create-snapshot-github-actions.js
git commit -m "✨ Add GitHub Actions daily snapshots"
git push
```

---

### Schritt 3: Workflow manuell testen

Gehe zu GitHub:

```
https://github.com/DEIN_USERNAME/DegixDAW/actions
```

1. Klicke auf **"Daily Analytics Snapshot"** (linke Sidebar)
2. Klicke auf **"Run workflow"** (rechts oben)
3. Klicke auf **"Run workflow"** (grüner Button)
4. Warte ~1-2 Minuten
5. ✅ Erfolg! Check die Logs

---

### Schritt 4: Snapshot in Datenbank prüfen

Im Supabase SQL Editor:

```sql
SELECT * FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 1;
```

Du solltest einen neuen Snapshot mit:
- ✅ `total_loc` > 0
- ✅ `total_commits` > 0
- ✅ `typescript_loc`, `javascript_loc`, etc. gefüllt
- ✅ `metadata->>'created_via' = 'github_actions'`

---

## ⏰ Automatischer Zeitplan

Der Workflow läuft **täglich automatisch**:

- **UTC:** 00:00 (Mitternacht)
- **CET (Winter):** 01:00 morgens
- **CEST (Sommer):** 02:00 morgens

Du musst **nichts machen** - GitHub führt es automatisch aus!

---

## 🔍 Monitoring

### Workflow-Runs anzeigen

```
https://github.com/DEIN_USERNAME/DegixDAW/actions/workflows/daily-snapshot.yml
```

Hier siehst du:
- ✅ Erfolgreiche Runs (grüner Haken)
- ❌ Fehlgeschlagene Runs (rotes X)
- ⏳ Laufende Runs (gelber Kreis)
- 📊 Run-Historie (alle vergangenen Runs)

### Logs anzeigen

Klicke auf einen Run → Klicke auf "create-snapshot" Job → Sieh dir die Logs an:

```
📊 Calculating code metrics...
   ✅ Total LOC: 12,345
   ✅ Files: 234
   ✅ Commits: 567
   📊 Languages: TS=8900 | JS=1200 | SCSS=890 | SQL=234

📊 Fetching project metrics...
   ✅ Users: 42 (38 active)
   ✅ Messages: 1337 (25 conversations)
   ✅ Issues: 23 (5 open, 3 in progress, 15 closed)

✅ Snapshot created successfully!
   ID: abc-123-def-456
   Date: 2025-10-11
```

---

## 🐛 Troubleshooting

### ❌ "Error: Missing required environment variables"

**Problem:** GitHub Secrets nicht gesetzt oder falsch benannt.

**Lösung:**
1. Gehe zu Repository Settings → Secrets → Actions
2. Prüfe dass **genau diese Namen** existieren:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Achte auf Groß-/Kleinschreibung!

---

### ❌ "Error: Authentication failed"

**Problem:** Falscher Supabase Service Role Key.

**Lösung:**
1. Supabase Dashboard → Settings → API
2. Kopiere den **Service Role Key** (nicht Anon Key!)
3. Update das Secret `SUPABASE_SERVICE_ROLE_KEY`

---

### ❌ "Error: git command failed"

**Problem:** Git-History nicht vollständig gefetched.

**Lösung:** Das sollte nicht passieren, da `fetch-depth: 0` gesetzt ist. Falls doch:
1. Check Workflow-Logs
2. Öffne ein Issue im Repo

---

### ❌ Snapshot wird nicht erstellt

**Problem:** Workflow läuft, aber kein Snapshot in DB.

**Lösung:**
1. Check Workflow-Logs für Fehler
2. Prüfe ob Snapshot bereits existiert:
   ```sql
   SELECT * FROM project_snapshots WHERE snapshot_date = CURRENT_DATE;
   ```
3. Falls schon vorhanden: Das ist normal! Pro Tag nur 1 Snapshot.

---

### ❌ "Snapshot already exists for today"

**Problem:** Gar kein Problem! Das ist erwartetes Verhalten.

**Erklärung:** GitHub Actions könnte mehrmals am Tag laufen (z.B. wenn du es manuell triggerst). Die Funktion verhindert Duplikate.

---

## 📊 Was wird getrackt?

| Kategorie | Metriken | Quelle |
|-----------|----------|--------|
| **Code** | LOC, Files, Commits | Git Commands |
| **Languages** | TypeScript, JavaScript, SCSS, CSS, SQL, JSON, Markdown | File Analysis |
| **Users** | Total, Active | Supabase `profiles` |
| **Messages** | Total, Conversations | Supabase `messages` |
| **Issues** | Total, Open, Closed, In Progress | Supabase `issues` |
| **Storage** | Database Size | Supabase (estimate) |

**Alles wird automatisch getrackt - keine manuelle Arbeit nötig!** 🎉

---

## ⚙️ Konfiguration

### Zeitplan ändern

Edit [.github/workflows/daily-snapshot.yml](.github/workflows/daily-snapshot.yml):

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Täglich um 02:00 UTC (3:00 AM CET)
```

**Cron-Syntax:**
- `0 0 * * *` - Täglich um Mitternacht
- `0 */6 * * *` - Alle 6 Stunden
- `0 0 * * 0` - Wöchentlich (Sonntag Mitternacht)
- `0 0 1 * *` - Monatlich (1. des Monats)

Tool: https://crontab.guru/

---

### Manuellen Trigger deaktivieren

Entferne diese Zeile:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:  # <-- Diese Zeile löschen
```

---

### Notifications hinzufügen

Du kannst Email-Benachrichtigungen bei Fehlern einrichten:

Repository Settings → Notifications → Actions → "Only notify on failure"

---

## 💰 Kosten

### GitHub Actions Free Tier (Pro User):

| Plan | Minuten/Monat | Kosten |
|------|---------------|--------|
| **Pro** | 3000 | $10/Monat (hast du schon) |
| **Free** | 2000 | $0/Monat |

**Dein Verbrauch:**
- 1 Snapshot-Run: ~1-2 Minuten
- 30 Tage: ~30-60 Minuten
- **Gesamt: <2% deines Limits!** 🎉

---

## 🚀 Nächste Schritte

Nach dem Setup:

1. ✅ **Workflow läuft automatisch** - Keine Aktion nötig!
2. 📊 **Check Analytics Dashboard** - Neue Snapshots erscheinen im GrowthChart
3. 🧹 **Optional:** Alte Snapshots löschen (>90 Tage):
   ```sql
   SELECT * FROM cleanup_old_snapshots(90);
   ```

---

## 🔗 Verwandte Dateien

- Workflow: [.github/workflows/daily-snapshot.yml](../../.github/workflows/daily-snapshot.yml)
- Script: [scripts/analytics/create-snapshot-github-actions.js](./create-snapshot-github-actions.js)
- Alternative (pg_cron): [CRON_SETUP.md](./CRON_SETUP.md)
- Alternative (Edge Functions): [supabase/functions/daily-snapshot/](../../supabase/functions/daily-snapshot/)

---

## ❓ FAQ

### Q: Kann ich es öfter als täglich laufen lassen?

**A:** Ja! Ändere den Cron-Ausdruck. Aber Vorsicht: Die Funktion erlaubt nur **1 Snapshot pro Tag**. Mehrere Runs am selben Tag werden mit "Snapshot already exists" abgebrochen (das ist OK).

### Q: Kann ich es manuell triggern?

**A:** Ja! Gehe zu Actions → Daily Analytics Snapshot → Run workflow

### Q: Was passiert wenn GitHub Actions down ist?

**A:** Der Snapshot wird übersprungen. Am nächsten Tag läuft es wieder normal. Alte Tage können via `npm run analytics:backfill` nachgefüllt werden (aber ohne Code-Metriken).

### Q: Kann ich es lokal testen?

**A:** Ja!
```bash
export VITE_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
node scripts/analytics/create-snapshot-github-actions.js
```

### Q: Brauche ich trotzdem den manuellen Button im Dashboard?

**A:** Nein, aber er ist nützlich für:
- Manuelle Snapshots außer der Reihe
- Testing
- Snapshots an speziellen Tagen (z.B. Release-Tage)

---

**🎉 Fertig! Deine Analytics laufen jetzt vollautomatisch!**

Bei Fragen oder Problemen: Check die Workflow-Logs oder öffne ein Issue.
