# Storage Security Migration Guide

## Problem
Aktuell sind alle Bilder/Dateien im Supabase Storage **PUBLIC** zugänglich. Jeder mit der URL kann sie sehen, auch ohne Login.

## Lösung
Umstellung auf **Authenticated Storage** mit **Signed URLs** (temporäre, authentifizierte URLs).

---

## ✅ Was bereits geändert wurde

### 1. **Desktop App**
- ✅ Split-Layout mit Preview-Panel implementiert
- ✅ GDI+ für Bildanzeige initialisiert
- ⏳ Image-Loading mit signed URLs (noch zu implementieren)

### 2. **Web Frontend**
- ✅ `useMessageAttachments.ts`: Speichert jetzt Storage-Pfade statt Public URLs
- ✅ `useSignedUrl.ts`: Neuer Hook für signed URL Generierung mit Caching
- ✅ `ChatAttachment.tsx`: Neue Komponente die automatisch signed URLs generiert
- ✅ `ChatMessage.tsx`: Verwendet jetzt `ChatAttachment` statt direkte URLs
- ✅ Build erfolgreich getestet

---

## 🔧 Was DU jetzt tun musst

### Schritt 1: Prüfe bestehende Daten in der Datenbank

Öffne Supabase SQL Editor und führe aus:

\`\`\`sql
-- Prüfe wie file_url aktuell aussieht
SELECT
  id,
  file_name,
  file_url,
  thumbnail_url
FROM message_attachments
LIMIT 5;
\`\`\`

**Mögliche Ergebnisse:**

#### Fall A: Vollständige URLs (z.B. `https://...supabase.co/storage/v1/object/public/chat-attachments/...`)
→ **Migration nötig!** Führe aus:

\`\`\`sql
-- Extrahiere Storage-Pfad aus Public URL
UPDATE message_attachments
SET
  file_url = REGEXP_REPLACE(
    file_url,
    '^https://[^/]+/storage/v1/object/(public|authenticated)/chat-attachments/',
    ''
  ),
  thumbnail_url = CASE
    WHEN thumbnail_url IS NOT NULL THEN
      REGEXP_REPLACE(
        thumbnail_url,
        '^https://[^/]+/storage/v1/object/(public|authenticated)/chat-attachments/',
        ''
      )
    ELSE NULL
  END
WHERE file_url LIKE '%/storage/v1/object/%';

-- Prüfe Ergebnis
SELECT id, file_name, file_url FROM message_attachments LIMIT 5;
-- Sollte jetzt sein: "USER_ID/MESSAGE_ID/filename.jpg"
\`\`\`

#### Fall B: Nur Pfade (z.B. `9187493e-.../f85c40e9-.../1760294689024.JPG`)
→ ✅ **Keine Migration nötig!** Weiter zu Schritt 2.

---

### Schritt 2: Storage Bucket Policy ändern

#### 2.1 Gehe zu Supabase Dashboard
1. Öffne dein Supabase Projekt
2. Gehe zu **Storage** → **Policies**
3. Wähle Bucket `chat-attachments`

#### 2.2 Lösche alte PUBLIC Policies

**Option A: Via Supabase Dashboard (Empfohlen - Einfacher!)**
1. Gehe zu **Storage** → **Policies**
2. Wähle Tabelle `objects` aus der Liste
3. Für jede Policy die `chat-attachments` betrifft:
   - Klicke auf **"..."** (3 Punkte rechts)
   - Klicke auf **"Delete policy"**
   - Bestätige mit **"Delete"**

**Option B: Via SQL (für Profis)**

```sql
-- 1. Liste alle Policies für den Bucket auf
SELECT policyname, definition
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND definition LIKE '%chat-attachments%';

-- 2. Lösche spezifische Policies (ersetze NAME mit echtem Namen aus Query oben)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- 3. ODER: Automatisch ALLE Policies für chat-attachments löschen
-- ACHTUNG: Nur verwenden wenn du sicher bist!
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND definition LIKE '%chat-attachments%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        RAISE NOTICE 'Deleted policy: %', pol.policyname;
    END LOOP;
END $$;
```

#### 2.3 Erstelle neue AUTHENTICATED Policies

\`\`\`sql
-- Policy 1: Authenticated users können Dateien sehen
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Policy 2: Authenticated users können Dateien hochladen
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Policy 3 (Optional): Users können nur ihre eigenen Dateien löschen
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
\`\`\`

#### 2.4 Bucket auf PRIVATE setzen

**Im Supabase Storage UI:**
1. Gehe zu **Storage** → **Buckets**
2. Klicke auf den Bucket `chat-attachments`
3. Oben rechts: Klicke auf **"Settings"** (Zahnrad-Icon)
4. Finde **"Public bucket"** Toggle
5. Setze auf **OFF** (grau) ❌
6. Klicke **"Save"**

**Oder via SQL:**
```sql
UPDATE storage.buckets
SET public = false
WHERE name = 'chat-attachments';
```

---

### Schritt 3: Teste die Web-App

1. **Starte Dev-Server:**
   \`\`\`bash
   cd web/frontend
   npm run dev
   \`\`\`

2. **Teste:**
   - ✅ Login funktioniert
   - ✅ Chat öffnen mit Bildern
   - ✅ Bilder werden angezeigt (kann 1-2 Sek dauern beim ersten Laden)
   - ✅ Neue Bilder hochladen funktioniert
   - ✅ Neue Bilder sind sofort sichtbar

3. **Falls Bilder nicht laden:**
   - Browser Console öffnen (F12)
   - Prüfe auf Fehler wie "403 Forbidden" oder "401 Unauthorized"
   - Falls 403: Storage Policies nochmal prüfen
   - Falls 401: User ist nicht eingeloggt → Auth prüfen

---

### Schritt 4: Deploy auf Netlify

1. **Commit & Push:**
   \`\`\`bash
   git add .
   git commit -m "feat: implement authenticated storage with signed URLs"
   git push
   \`\`\`

2. **Netlify Build:**
   - Netlify erkennt automatisch den Push
   - Build startet automatisch
   - Nach ~2-3 Minuten ist die neue Version live

3. **Teste Production:**
   - Öffne deine Live-URL
   - Teste Login + Bilder anzeigen
   - Teste neuen Bild-Upload

---

## 🔒 Security Check

Nach der Migration sollte Folgendes gelten:

### ❌ Das sollte NICHT funktionieren:
\`\`\`bash
# Public URL (ohne Auth) sollte 403 geben
curl https://xcdzugnjzrkngzmtzeip.supabase.co/storage/v1/object/public/chat-attachments/...
# → Expected: 403 Forbidden
\`\`\`

### ✅ Das sollte funktionieren:
\`\`\`bash
# Authenticated Request mit JWT Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://xcdzugnjzrkngzmtzeip.supabase.co/storage/v1/object/authenticated/chat-attachments/...
# → Expected: 200 OK + Image Data
\`\`\`

---

## 🚀 Desktop App (noch zu implementieren)

Die Desktop-App hat bereits:
- ✅ Split-Layout mit Preview-Panel
- ✅ GDI+ Bildanzeige
- ⏳ Noch zu tun: Image-Download mit signed URLs

**Nächster Schritt für Desktop:**
1. Storage-Path aus DB laden (statt nur file_name)
2. Signed URL generieren (wie Web-App)
3. Mit WinHTTP + JWT Token herunterladen
4. In GDI+ Image laden und anzeigen

---

## 📊 Migration Checkliste

- [ ] Schritt 1: Bestehende Daten geprüft
- [ ] Schritt 1 (Fall A): DB Migration ausgeführt (falls nötig)
- [ ] Schritt 2: Storage Bucket auf PRIVATE gesetzt
- [ ] Schritt 2: Policies aktualisiert
- [ ] Schritt 3: Web-App lokal getestet
- [ ] Schritt 3: Alle Bilder laden korrekt
- [ ] Schritt 4: Production deployed
- [ ] Schritt 4: Live-Site getestet
- [ ] Security Check: Public URLs geben 403
- [ ] Security Check: Authenticated Requests funktionieren

---

## 💡 Hilfe

Falls Probleme auftreten:

**Problem: Bilder laden nicht (403 Forbidden)**
→ Storage Policies nochmal prüfen, `authenticated` role muss SELECT haben

**Problem: Bilder laden nicht (401 Unauthorized)**
→ User ist nicht eingeloggt, Auth Session prüfen

**Problem: Upload funktioniert nicht**
→ Policy für INSERT prüfen, `authenticated` role muss INSERT haben

**Problem: Alte Bilder funktionieren nicht**
→ DB Migration nochmal prüfen, URLs müssen zu Pfaden konvertiert sein

---

## 📝 Anmerkungen

- Signed URLs haben eine Gültigkeit von **1 Stunde** (konfigurierbar in `useSignedUrl.ts`)
- URLs werden **gecacht** um unnötige API-Calls zu vermeiden
- Cache wird automatisch 5 Minuten vor Ablauf geleert
- Bei Logout sollte Cache manuell geleert werden (siehe `clearSignedUrlCache()`)

---

**Status:** Web-Frontend ist bereit! Du musst nur noch die Supabase-Seite konfigurieren. 🚀
