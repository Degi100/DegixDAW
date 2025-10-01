# SCSS Architecture Documentation

## 📁 Ordnerstruktur (Hybrid-Architektur)

Diese SCSS-Struktur folgt einem hybriden Ansatz, der Skalierbarkeit, Wartbarkeit und klare Verantwortlichkeiten kombiniert.

```
src/styles/
├── abstracts/              # Keine CSS-Ausgabe
│   └── _variables.scss     # Design-Tokens (Farben, Spacing, Transitions)
│
├── base/                   # Basis-Styles (aktuell leer, reserviert)
│   └── _reset.scss         # Optional: CSS Reset
│
├── layout/                 # Layout-Komponenten
│   ├── _sidebar.scss       # Sidebar-Navigation
│   └── _responsive.scss    # Responsive Layout-Utilities
│
├── components/             # Wiederverwendbare UI-Komponenten
│   ├── forms/              # Form-spezifische Komponenten
│   │   ├── _forms-core.scss
│   │   ├── _forms.scss
│   │   ├── _inputs.scss
│   │   └── _auth-forms.scss
│   └── ui/                 # Allgemeine UI-Komponenten
│       ├── _cards.scss
│       └── _modals.scss
│
├── pages/                  # Seiten-spezifische Styles
│   ├── dashboard/          # Dashboard-Feature
│   │   ├── _dashboard-corporate.scss
│   │   ├── _dashboard-header.scss
│   │   ├── _dashboard-profile.scss
│   │   ├── _dashboard-stats.scss
│   │   ├── _dashboard-features.scss
│   │   ├── _dashboard-projects.scss
│   │   ├── _dashboard-components.scss
│   │   └── _dashboard-responsive.scss
│   ├── auth/               # Authentifizierung
│   │   ├── _login-corporate.scss
│   │   └── _recovery.scss
│   └── admin/              # Admin-Bereich
│       └── _admin-corporate.scss
│
├── themes/                 # Theme-Overrides
│   └── _dark.scss          # Dark Mode Theme
│
├── utilities/              # CSS Utility-Klassen
│   ├── base.css
│   ├── buttons.css
│   ├── components.css
│   ├── forms.css
│   ├── loading.css
│   ├── responsive.css
│   └── index.css
│
├── main.scss               # 🎯 Haupt-Entry-Point
└── variables.css           # CSS Custom Properties
```

---

## 🎯 Entry Point

**`main.scss`** ist der zentrale Import-Punkt für alle SCSS-Module.

```scss
// Import-Reihenfolge (wichtig für Cascade):
1. abstracts/     # Variablen (keine CSS-Ausgabe)
2. layout/        # Layout-Komponenten
3. components/    # UI-Komponenten
4. pages/         # Seiten-spezifisch
5. themes/        # Theme-Overrides
```

---

## 📖 Konventionen

### 1. **Dateinamen**
- Partials beginnen mit `_` (z.B. `_variables.scss`)
- Main Entry Points ohne `_` (z.B. `main.scss`)
- Kebab-case verwenden: `dashboard-header.scss`

### 2. **Import-Pfade**
```scss
// Relative Pfade von der jeweiligen Datei:
@import '../../abstracts/variables';  // Von pages/ oder components/
@import '../abstracts/variables';      // Von layout/ oder themes/
```

### 3. **Verantwortlichkeiten**

#### `abstracts/`
- **Keine CSS-Ausgabe**: Nur Variablen, Mixins, Funktionen
- Wird von allen anderen Modulen importiert
- Enthält Design-Tokens

#### `layout/`
- Strukturelle Layouts (Grid, Sidebar, etc.)
- Responsive Breakpoints
- Keine seiten-spezifische Logik

#### `components/`
- **Wiederverwendbare** UI-Komponenten
- Sollte in mehreren Pages verwendet werden können
- Gruppiert nach Funktion (forms/, ui/)

#### `pages/`
- **Seiten-spezifische** Styles
- Gruppiert nach Feature/Route
- Kann components/ nutzen

#### `themes/`
- Theme-Overrides (Dark Mode, Corporate Theme, etc.)
- Wird zuletzt geladen für höchste Spezifität

---

## 🚀 Neue Module hinzufügen

### Neue Component:
```bash
# Erstelle neue Datei in passendem Unterordner
touch src/styles/components/ui/_tooltips.scss

# Import in main.scss ergänzen
@import 'components/ui/tooltips';
```

### Neue Page:
```bash
# Erstelle neuen Page-Ordner
mkdir src/styles/pages/billing

# Erstelle Module
touch src/styles/pages/billing/_billing-overview.scss
touch src/styles/pages/billing/_billing-history.scss

# Import in main.scss ergänzen
@import 'pages/billing/billing-overview';
@import 'pages/billing/billing-history';
```

---

## 🔄 Migration History

### 2025-10-01: Hybrid-Struktur Migration
- ✅ Flache `scss/` Struktur in hierarchische Ordner migriert
- ✅ 22 SCSS-Dateien in logische Kategorien aufgeteilt
- ✅ Import-Pfade aktualisiert
- ✅ `settings-corporate.scss` → `main.scss` umbenannt
- ✅ Build erfolgreich getestet (2.47s)

**Vorher:**
```
components/scss/
  ├── _variables.scss
  ├── _dashboard-corporate.scss
  ├── _login-corporate.scss
  └── ... (alle flach)
```

**Nachher:**
```
abstracts/, layout/, components/, pages/, themes/
  (hierarchisch nach Verantwortlichkeit)

### 2025-10-01: Sass Module Migration (@import → @use/@forward)
- ✅ Alle `@import`-Anweisungen in `src/styles/` entfernt
- ✅ `@use '.../variables' as *` für Design-Tokens
- ✅ Module in `_dashboard-corporate.scss` vor allen Regeln mit `@use` eingebunden
- ✅ Build ohne Deprecation-Warnings verifiziert

Hinweis: Bei Sass müssen alle `@use`/`@forward` Anweisungen am Anfang der Datei stehen – vor jeglichen Selektoren oder CSS-Regeln.
```

---

## 🛠️ Wartung

### Build-Kommandos:
```bash
npm run build   # Production Build
npm run dev     # Development Server
```

### Deprecation Warnings:
- SASS `@import` ist deprecated (wird in Dart Sass 3.0 entfernt)
- **Zukünftige Migration**: `@import` → `@use`/`@forward`
- [Sass Modules Docs](https://sass-lang.com/documentation/at-rules/use)

---

## 📚 Ressourcen

- **Atomic Design**: [bradfrost.com/blog/post/atomic-web-design](https://bradfrost.com/blog/post/atomic-web-design/)
- **SMACSS**: [smacss.com](https://smacss.com/)
- **ITCSS**: [itcss.io](https://itcss.io/)
- **Sass Guidelines**: [sass-guidelin.es](https://sass-guidelin.es/)

---

**Erstellt**: 2025-10-01  
**Version**: 1.0  
**Architektur**: Hybrid (Custom)
