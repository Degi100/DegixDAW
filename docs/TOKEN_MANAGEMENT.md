# 🤖 Token-Management Guide

## Wann wird SESSION_CONTEXT.md aktualisiert?

### **Token-Schwellenwerte:**

| Token verbraucht | Status | Aktion |
|-----------------|--------|---------|
| 0 - 100k | ✅ Safe | Normal weiterarbeiten |
| 100k - 150k | ⚠️ Achtung | Dokumentation vorbereiten |
| 150k - 180k | 🔶 Kritisch | SESSION_CONTEXT.md **JETZT** updaten |
| 180k+ | 🚨 Limit nahe | Neue Session empfehlen! |

---

## 📋 Checkliste bei Token-Knappheit (>150k)

### **1. SESSION_CONTEXT.md aktualisieren:**

```markdown
## 📊 TOKEN-STATUS
- Session gestartet: [Datum/Zeit]
- Aktuelle Token-Nutzung: [z.B. 155k / 200k]
- Status: 🔶 Kritisch

## 🎯 WAS WURDE IN DIESER SESSION GEMACHT?
[Hier auflisten was gemacht wurde]

## 🔧 NÄCHSTE SCHRITTE
[Was als nächstes kommen sollte]

## 🚨 OFFENE PROBLEME
[Gibt es ungelöste Bugs oder Blocker?]
```

---

### **2. User informieren:**

```
⚠️ **Token-Limit bald erreicht!**

Aktuell: 155k / 200k Tokens verbraucht
Verbleibend: ~45k

Ich habe SESSION_CONTEXT.md aktualisiert mit:
- ✅ Was in dieser Session gemacht wurde
- ✅ Nächste Schritte
- ✅ Offene Probleme

**Empfehlung:**
Neue Session starten mit: "Lies PROJECT_SUMMARY.md und SESSION_CONTEXT.md"
```

---

### **3. Letzte Änderungen committen:**

```bash
git add SESSION_CONTEXT.md
git commit -m "docs: update session context (tokens critical)"
git push
```

---

## 🎯 Workflow für neue Session

### **User startet neue Session und sagt:**

```
"Lies PROJECT_SUMMARY.md und SESSION_CONTEXT.md"
```

### **Agent macht:**

1. ✅ Liest PROJECT_SUMMARY.md (kompletter Projekt-Kontext)
2. ✅ Liest SESSION_CONTEXT.md (letzte Session, offene Themen)
3. ✅ Fragt User: "Soll ich mit [letztem Thema] weitermachen oder was Neues?"

---

## 💾 Template für SESSION_CONTEXT.md Update

```markdown
# 🔄 Session Context - Snapshot

**Letzte Aktualisierung:** [Datum, Zeit]
**Token-Status:** [z.B. 155k / 200k] 🔶

---

## 📝 DIESE SESSION (Zusammenfassung)

### Hauptaufgaben:
1. [Was wurde gemacht?]
2. [Was wurde gemacht?]
3. [Was wurde gemacht?]

### Dateien geändert:
- `pfad/zu/datei.tsx` - [Was geändert]
- `pfad/zu/datei.ts` - [Was geändert]

### Git-Commits:
- [Commit-Message 1]
- [Commit-Message 2]

---

## ⏭️ NÄCHSTE SESSION

### Priorität 1 (dringend):
- [ ] [Was muss als nächstes gemacht werden?]

### Priorität 2 (wichtig):
- [ ] [Was sollte danach kommen?]

### Priorität 3 (später):
- [ ] [Was kann warten?]

---

## 🐛 OFFENE PROBLEME

### Bugs:
- [Gibt es Bugs?]

### Blocker:
- [Gibt es Blocker die User lösen muss?]

### Fragen an User:
- [Gibt es offene Entscheidungen?]

---

## 💡 WICHTIGE NOTIZEN

- [Besondere Hinweise]
- [Was User wissen sollte]
- [Workarounds oder temporäre Lösungen]

```

---

## 🚀 Quick Commands

### **Session-Kontext speichern:**
```bash
# 1. SESSION_CONTEXT.md updaten (manuell)
# 2. Committen:
git add SESSION_CONTEXT.md && git commit -m "docs: session snapshot at [150k tokens]" && git push
```

### **Neue Session starten:**
```
User sagt: "Lies PROJECT_SUMMARY.md und SESSION_CONTEXT.md und mach weiter"
```

---

## 📊 Token-Tracking Tipps

### **Token sparen durch:**
- ✅ Weniger große Dateien auf einmal lesen
- ✅ Gezielt suchen mit grep/semantic_search statt alles lesen
- ✅ Code-Änderungen klein halten (nicht komplette Files neu schreiben)
- ✅ Bei langen Konversationen: Neue Session mit Kontext-Dateien

### **Token-Verbrauch ist hoch wenn:**
- ❌ Viele große Dateien gelesen werden
- ❌ Lange Code-Blöcke in Prompts
- ❌ Viele Tool-Calls hintereinander
- ❌ Große Search-Results

---

## 🎯 Best Practice

**Bei jeder Session:**
1. Start: PROJECT_SUMMARY.md + SESSION_CONTEXT.md lesen
2. Arbeiten: Token-Nutzung im Auge behalten
3. Bei 150k: SESSION_CONTEXT.md updaten
4. Bei 180k: Neue Session empfehlen
5. Neue Session: Wieder bei 1. starten

**Vorteil:**
- 📚 Kein Kontext-Verlust
- 🔄 Nahtlose Fortsetzung möglich
- 💾 Alles dokumentiert
- ⚡ Schneller Wiedereinstieg

