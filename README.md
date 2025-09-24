# 🎧 DegixDAW

> **D**AW-integrated, **E**ffortless, **G**lobal, **I**nstant e**X**change  
> Eine Web-DAW, um spontane musikalische Ideen aufzunehmen – und sie **direkt in Cubase** (und andere DAWs) zu laden.

![DegixDAW Concept](https://via.placeholder.com/800x400?text=DegixDAW+Concept+Image) <!-- später ersetzen -->

---

## 🎯 Vision

Musiker:innen haben oft **blitzartige Ideen** – am Bahnhof, im Park, im Traum.  
Aber ohne Studio gehen sie verloren.

**DegixDAW schließt diese Lücke**:
1. Öffne die Web-App → nimm Audio/MIDI auf
2. Speichere in der Cloud
3. Öffne dein VST-Plugin in **Cubase** → lade die Idee mit einem Klick
4. Produziere weiter – **ohne Copy-Paste, ohne Dateimanager**

---

## 🛠️ Tech-Stack

| Komponente | Technologie |
|-----------|------------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | Tailwind CSS (optional später) |
| **Backend** | Supabase (Auth, PostgreSQL, Storage) |
| **Hosting** | Netlify |
| **VST-Plugin** | JUCE (C++) – geplant für Phase 2 |
| **Auth** | Google, Discord, GitHub (OAuth) |

---

## ✅ Entwicklungs-Checkliste

### 🌱 Phase 1: Web-App MVP
- [x] **Projektstruktur** (`degixdaw/` mit `web-app/`)
- [x] **GitHub-Repo** erstellt
- [x] **Supabase-Projekt** eingerichtet
- [x] **Login mit Google & Discord** (Woche 1)
- [ ] Audio-Aufnahme (MediaRecorder)
- [ ] Hochladen in Supabase Storage
- [ ] MIDI-Klaviatur + Export
- [ ] Ideen-Liste (eigene + öffentliche)
- [ ] Admin-Bereich (nur für @degering)

### 🧱 Phase 2: VST-Plugin
- [ ] JUCE-Projekt einrichten
- [ ] HTTPS-Client für Supabase-API
- [ ] MIDI/Audio herunterladen + in Cubase laden
- [ ] UI mit Ideen-Liste

### 🌐 Phase 3: Kollaboration
- [ ] Öffentliche Ideen teilen
- [ ] Remix-Funktion
- [ ] Audio-to-MIDI mit KI (Basic Pitch)

---

## 🚀 Lokal starten

```bash
cd web-app
npm install
npm run dev
