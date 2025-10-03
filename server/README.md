# API Server für File Operations

## 🚀 Start

Der API-Server muss **parallel zum Vite Dev Server** laufen:

```bash
# Terminal 1: Vite Dev Server
npm run dev

# Terminal 2: API Server
npm run api
```

## 📝 Endpoints

### POST `/api/save-markdown`

Speichert eine Markdown-Datei im Projekt-Root.

**Request:**
```json
{
  "content": "# Markdown Content...",
  "filename": "ISSUES_2025-10-03.md"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File saved: ISSUES_2025-10-03.md",
  "path": "/absolute/path/to/file.md"
}
```

### GET `/api/health`

Health Check Endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

## 🔧 Verwendung

Im Admin-Panel auf **"📝 MD"** klicken:
- API erstellt Markdown-Report
- Datei wird im Projekt-Root gespeichert: `ISSUES_YYYY-MM-DD.md`
- Toast-Benachrichtigung bei Erfolg

## 🛠️ Development

**Port:** 3001  
**CORS:** Aktiviert für alle Origins (nur für Development!)

## ⚠️ Hinweis

Der API-Server ist **nur für lokale Entwicklung** gedacht.
Für Production sollte eine richtige Backend-Lösung verwendet werden.
