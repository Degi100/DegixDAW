# 🚀 Quick Start: Database Automation

## Setup (einmalig)

### 1. Service Role Key holen
```bash
# Öffne Supabase Dashboard
# → Settings → API → Copy "service_role" key
```

### 2. In .env einfügen
```env
# Füge diese Zeile hinzu:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Verwendung

### Issues als DONE markieren
```bash
npm run db:mark-done
```

### Duplikate löschen
```bash
npm run db:cleanup
# ⚠️ Fragt nach Bestätigung
```

### Test-Daten einfügen
```bash
npm run db:seed
```

### Eigene SQL-Datei ausführen
```bash
npm run db:sql scripts/sql/mein-script.sql
```

## ⚠️ Wichtig

- Service Role Key **niemals committen**!
- Nur lokal verwenden
- Bypassed RLS (Row Level Security)

## 📚 Mehr Infos

Siehe [scripts/db/README.md](./README.md) für Details.
