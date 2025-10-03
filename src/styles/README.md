# 🎨 SCSS Architecture Documentation

**Last Updated:** October 3, 2025  
**Version:** 2.0 (Modular Refactoring Complete)  
**Branch:** style-factoring

---

## 🏗️ **HYBRID ARCHITECTURE OVERVIEW**

This project uses a **deliberate hybrid styling system** combining:

1. **CSS Custom Properties** (`variables.css`) → Runtime theme switching
2. **Utility-First CSS** (`utilities/*.css`) → Quick prototyping, simple layouts
3. **SCSS Modules** (`main.scss` tree) → Complex component-specific styles

**Why Hybrid?**
- CSS Custom Properties enable **live theme switching without page reload**
- Utility classes provide **rapid development** (Tailwind-style)
- SCSS modules handle **complex, nested component logic**

---

## 📂 **FOLDER STRUCTURE**

### **Complete Architecture Map:**

```
src/styles/
├── 📄 variables.css           # CSS Custom Properties (Theme Variables)
├── 📄 main.scss               # SCSS Entry Point (imports all modules)
├── 📄 README.md               # This file
│
├── 📁 utilities/              # Utility-First CSS System (Pure CSS)
│   ├── index.css              # Entry point (imported by main.tsx)
│   ├── base.css               # Containers, layout, typography utilities
│   ├── buttons.css            # Button variants (.btn-primary, .btn-google)
│   ├── components.css         # Cards, avatars, grids
│   ├── forms.css              # Input variants, validation states
│   ├── loading.css            # Spinners, skeletons, progress bars
│   └── responsive.css         # Breakpoint utilities
│
├── 📁 abstracts/              # SCSS Variables & Functions (No CSS Output)
│   ├── index.scss             # Aggregator (forwards all modules)
│   └── variables/             # Categorized design tokens
│       ├── _colors.scss       # Color palette (165 lines)
│       ├── _typography.scss   # Fonts, weights, line heights (35 lines)
│       ├── _spacing.scss      # Spacing scale, border radius (30 lines)
│       ├── _layout.scss       # Breakpoints, z-index (22 lines)
│       ├── _effects.scss      # Shadows, transitions, blur (27 lines)
│       └── _legacy.scss       # Backward compatibility (48 lines)
│
├── 📁 components/             # Reusable UI Components
│   ├── forms/                 # Form-specific components
│   │   ├── _forms-core.scss   # Core form structure
│   │   ├── _forms.scss        # Form containers & layouts
│   │   ├── _inputs.scss       # Input fields & validation
│   │   └── _auth-forms.scss   # Authentication-specific forms
│   ├── ui/                    # General UI components
│   │   ├── _buttons.scss      # Button system (SCSS version)
│   │   ├── _cards.scss        # Card components
│   │   └── _modals.scss       # Modal dialogs
│   ├── layout/                # Layout components
│   │   └── header/            # Global header (modularized)
│   │       ├── index.scss     # Header aggregator
│   │       ├── _header-base.scss      (57 lines)
│   │       ├── _header-brand.scss     (84 lines)
│   │       ├── _header-navigation.scss (62 lines)
│   │       ├── _header-user-menu.scss (170 lines)
│   │       ├── _header-mobile.scss    (118 lines)
│   │       └── _header-theme.scss     (167 lines)
│   └── _mock-data-badge.scss  # Mock data warning badges
│
├── 📁 layout/                 # Global Layout Patterns
│   ├── _sidebar.scss          # Sidebar navigation
│   └── _responsive.scss       # Responsive layout utilities
│
├── 📁 pages/                  # Page-Specific Styles
│   ├── admin/                 # Admin panel (modularized)
│   │   ├── index.scss         # Admin aggregator
│   │   ├── _admin-base.scss           (273 lines)
│   │   ├── _admin-header.scss         (360 lines)
│   │   ├── _admin-users-table.scss    (236 lines)
│   │   ├── _admin-components.scss     (254 lines)
│   │   ├── _admin-modals.scss         (179 lines)
│   │   ├── _admin-settings.scss       (195 lines)
│   │   ├── _admin-dashboard.scss      (234 lines)
│   │   └── _admin-system.scss         (338 lines)
│   ├── auth/                  # Authentication pages
│   │   ├── _login-corporate.scss  # Corporate login
│   │   ├── _recovery.scss         # Password recovery
│   │   └── auth-landing/          # Landing page (modularized)
│   │       ├── index.scss         # Landing aggregator
│   │       ├── _auth-landing-base.scss    (41 lines)
│   │       ├── _auth-landing-header.scss  (86 lines)
│   │       ├── _auth-landing-hero.scss    (63 lines)
│   │       ├── _auth-landing-form.scss    (194 lines)
│   │       └── _auth-landing-theme.scss   (115 lines)
│   ├── dashboard/             # User dashboard
│   │   ├── _dashboard-corporate.scss   # Main dashboard
│   │   ├── _dashboard-header.scss      # Dashboard header
│   │   ├── _dashboard-profile.scss     # Profile section
│   │   ├── _dashboard-stats.scss       # Statistics cards
│   │   ├── _dashboard-features.scss    # Feature grid
│   │   ├── _dashboard-projects.scss    # Projects section
│   │   ├── _dashboard-components.scss  # Shared dashboard components
│   │   └── _dashboard-responsive.scss  # Dashboard responsive
│   └── settings/              # User settings
│       └── user-settings/     # User settings page (modularized)
│           ├── index.scss     # Settings aggregator
│           ├── _user-settings-base.scss     (36 lines)
│           ├── _user-settings-sidebar.scss  (142 lines)
│           └── _user-settings-content.scss  (105 lines)
│
└── 📁 themes/                 # Theme Overrides
    └── _dark.scss             # Dark mode theme
```

---

## 🔄 **IMPORT FLOW & ENTRY POINTS**

### **Application Entry:**
```
src/main.tsx
  ↓ imports
utilities/index.css  ← ACTUAL ENTRY POINT
  ↓ imports
  ├── variables.css      (CSS Custom Properties)
  ├── base.css           (Utility classes)
  ├── buttons.css        (Utility classes)
  ├── components.css     (Utility classes)
  ├── forms.css          (Utility classes)
  ├── loading.css        (Utility classes)
  ├── responsive.css     (Utility classes)
  └── main.scss          (SCSS module tree)
       ↓ compiles to CSS by Vite
       ├── abstracts/     (Variables - no output)
       ├── layout/        (Layout components)
       ├── components/    (UI components)
       ├── pages/         (Page-specific styles)
       └── themes/        (Theme overrides)
```

### **Import Order in main.scss:**
```scss
1. @use 'abstracts/index'   # Design tokens (no CSS output)
2. @use 'layout/*'           # Structural layouts
3. @use 'components/*'       # Reusable UI components
4. @use 'pages/*'            # Page-specific styles
5. @use 'themes/*'           # Theme overrides (highest specificity)
```

---

## � **CSS CUSTOM PROPERTIES SYSTEM**

### **variables.css** - Runtime Theme Switching

**Purpose:** Enable live theme changes without page reload using CSS Custom Properties.

**Key Variable Groups:**
```css
:root {
  /* Theme Variables (switchable) */
  --theme-bg-primary: #FFFFFF;
  --theme-text-primary: #0F172A;
  --theme-border: #E2E8F0;
  
  /* Dark Mode Variables */
  --dark-bg-primary: #0F172A;
  --dark-text-primary: #F1F5F9;
  --dark-border: #334155;
  
  /* Static Design Tokens */
  --primary-color: #1E40AF;
  --spacing-md: 1rem;
  --radius-lg: 8px;
  --transition: all 0.2s ease-in-out;
}
```

**Usage in SCSS:**
```scss
// SCSS modules can use CSS Custom Properties
.admin-panel {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

// Dark mode switches these automatically
[data-theme="dark"] {
  --theme-bg-primary: var(--dark-bg-primary);
  --theme-text-primary: var(--dark-text-primary);
  --theme-border: var(--dark-border);
}
```

---

## 🛠️ **MODULAR REFACTORING STRATEGY**

### **Aggregator Pattern (index.scss):**

When a module grows too large (>400 lines), split it into focused sub-modules and create an aggregator:

**Example: admin/ folder**
```scss
// pages/admin/index.scss (Aggregator)
@forward './admin-base';
@forward './admin-header';
@forward './admin-users-table';
@forward './admin-components';
@forward './admin-modals';
@forward './admin-settings';
@forward './admin-dashboard';
@forward './admin-system';
```

**Usage:**
```scss
// Other files can now import the entire admin module
@use '../pages/admin';  // Imports all 8 sub-modules via index.scss
```

**Benefits:**
- ✅ Single import path for consumers
- ✅ Internal organization without breaking external imports
- ✅ Clear module boundaries
- ✅ Easier navigation (files <400 lines)

---

## � **CONVENTIONS & BEST PRACTICES**

### **1. File Naming:**
- **Partials:** Start with `_` (e.g., `_variables.scss`)
- **Aggregators:** No `_` prefix (e.g., `index.scss`)
- **Format:** Kebab-case (`dashboard-header.scss`, not `dashboardHeader.scss`)

### **2. Import Syntax:**
```scss
// Modern SCSS: Use @use instead of @import
@use 'abstracts/index' as *;          // Import all (namespace-free)
@use '../../abstracts/index';         // Import with namespace
@use '../abstracts/index' as vars;    // Custom namespace

// Aggregators: Use @forward to re-export
@forward './admin-base';
@forward './admin-header';
```

### **3. Folder Responsibilities:**

#### **abstracts/**
- ✅ Variables, mixins, functions
- ✅ Design tokens (colors, spacing, typography)
- ❌ NO CSS output (just tools for other modules)
- 📦 Current: 6 categorized modules (colors, typography, spacing, layout, effects, legacy)

#### **utilities/**
- ✅ Pure CSS utility classes (Tailwind-style)
- ✅ Rapid prototyping, simple layouts
- ❌ NO SCSS (keep it simple)
- 📦 Current: 7 modules (base, buttons, components, forms, loading, responsive, index)

#### **components/**
- ✅ Reusable UI components
- ✅ Should work in multiple contexts
- ❌ NO page-specific logic
- 📦 Grouped by type: forms/, ui/, layout/

#### **pages/**
- ✅ Page-specific styles
- ✅ Can use components + abstracts
- ✅ Modularize if >400 lines
- 📦 Grouped by feature: admin/, auth/, dashboard/, settings/

#### **themes/**
- ✅ Theme overrides (dark mode, etc.)
- ✅ Loaded last for highest specificity
- 📦 Current: _dark.scss

---

## 🚀 **ADDING NEW MODULES**

### **New Component:**
```bash
# Create file in appropriate subfolder
touch src/styles/components/ui/_tooltips.scss

# Add to main.scss
@use 'components/ui/tooltips';
```

### **New Page:**
```bash
# Create page folder and modules
mkdir src/styles/pages/billing
touch src/styles/pages/billing/_billing-overview.scss
touch src/styles/pages/billing/_billing-history.scss

# Add to main.scss
@use 'pages/billing/billing-overview';
@use 'pages/billing/billing-history';
```

### **Refactoring Large File (>400 lines):**
```bash
# 1. Analyze file structure
# 2. Identify logical sections (e.g., header, sidebar, content)
# 3. Create subfolder with focused modules
mkdir src/styles/pages/admin
mv src/styles/pages/_admin-corporate.scss src/styles/pages/admin/_admin-base.scss

# 4. Split into modules
# - Extract each section into separate file
# - Keep each file <400 lines

# 5. Create aggregator
touch src/styles/pages/admin/index.scss

# 6. Update imports
@forward './admin-base';
@forward './admin-header';
# ... etc

# 7. Update main.scss to import aggregator
@use 'pages/admin';  # Instead of individual files
```

---

## 📊 **REFACTORING HISTORY**

### **October 2025 - Major Modular Refactoring:**

**Completed Refactorings:**

1. **admin-corporate** → **8 modules** (2,289 lines → avg 286 lines/file)
   - `_admin-base.scss` (273 lines) - Core layout & structure
   - `_admin-header.scss` (360 lines) - Header & navigation
   - `_admin-users-table.scss` (236 lines) - User management table
   - `_admin-components.scss` (254 lines) - Shared components
   - `_admin-modals.scss` (179 lines) - Modal dialogs
   - `_admin-settings.scss` (195 lines) - Settings section
   - `_admin-dashboard.scss` (234 lines) - Dashboard overview
   - `_admin-system.scss` (338 lines) - System health & stats

2. **header** → **6 modules** (631 lines → avg 105 lines/file)
   - `_header-base.scss` (57 lines) - Core structure
   - `_header-brand.scss` (84 lines) - Logo & branding
   - `_header-navigation.scss` (62 lines) - Nav links
   - `_header-user-menu.scss` (170 lines) - User dropdown
   - `_header-mobile.scss` (118 lines) - Mobile menu
   - `_header-theme.scss` (167 lines) - Theme switcher

3. **auth-landing** → **5 modules** (464 lines → avg 93 lines/file)
   - `_auth-landing-base.scss` (41 lines) - Layout foundation
   - `_auth-landing-header.scss` (86 lines) - Landing header
   - `_auth-landing-hero.scss` (63 lines) - Hero section
   - `_auth-landing-form.scss` (194 lines) - Auth forms
   - `_auth-landing-theme.scss` (115 lines) - Theme support

4. **variables** → **6 categorized modules** (299 lines → avg 50 lines/file)
   - `_colors.scss` (165 lines) - Complete color palette
   - `_typography.scss` (35 lines) - Fonts, weights, line heights
   - `_spacing.scss` (30 lines) - Spacing scale, border radius
   - `_layout.scss` (22 lines) - Breakpoints, z-index
   - `_effects.scss` (27 lines) - Shadows, transitions, blur
   - `_legacy.scss` (48 lines) - Backward compatibility

5. **user-settings** → **3 modules** (252 lines → avg 84 lines/file)
   - `_user-settings-base.scss` (36 lines) - Base layout
   - `_user-settings-sidebar.scss` (142 lines) - Settings nav
   - `_user-settings-content.scss` (105 lines) - Content area

**Metrics:**
- **Total refactored:** 3,935 lines → 28 focused modules
- **Average module size:** ~140 lines (was >400)
- **Build time:** ~2.6s (unchanged)
- **Bundle size:** 104.46 KB → 98.26 KB (-6 KB, -6%)

---

## 🎯 **DESIGN PRINCIPLES**

### **1. Modularity:**
- Files should be <400 lines
- Single responsibility per module
- Use aggregators for logical grouping

### **2. Maintainability:**
- Clear folder structure
- Descriptive file names
- Consistent naming conventions

### **3. Scalability:**
- Easy to add new modules
- Minimal impact on build time
- Small bundle size increase

### **4. Developer Experience:**
- Quick navigation
- Easy to find specific styles
- Clear module boundaries

---

## 🔧 **BUILD CONFIGURATION**

### **Vite Config:**
```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // Additional SCSS options can go here
      }
    }
  }
});
```

### **Build Output:**
```bash
npm run build

# Expected output:
✓ 275 modules transformed
dist/assets/index-[hash].css: 98.26 kB │ gzip: 15.37 kB
✓ built in 2.66s
```

---

## 📚 **RESOURCES**

### **SCSS Documentation:**
- [Sass Official Guide](https://sass-lang.com/guide)
- [@use and @forward](https://sass-lang.com/documentation/at-rules/use)
- [Modern Sass](https://sass-lang.com/blog/the-module-system-is-launched)

### **Architecture Patterns:**
- [7-1 Pattern](https://sass-guidelin.es/#the-7-1-pattern)
- [ITCSS](https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/)
- [BEM Methodology](http://getbem.com/)

### **CSS Custom Properties:**
- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Tricks: Custom Properties Guide](https://css-tricks.com/a-complete-guide-to-custom-properties/)

---

## ✅ **MIGRATION CHECKLIST**

When refactoring a large file:

- [ ] Identify file >400 lines
- [ ] Analyze logical sections
- [ ] Create subfolder
- [ ] Split into focused modules (<400 lines each)
- [ ] Create index.scss aggregator
- [ ] Update imports in main.scss
- [ ] Test build (`npm run build`)
- [ ] Verify no visual regressions
- [ ] Commit changes
- [ ] Remove old file (keep in git history)

---

## 🐛 **TROUBLESHOOTING**

### **Build fails after refactoring:**
```bash
# Check all import paths are correct
grep -r "@use" src/styles/

# Verify no circular dependencies
npm run build
```

### **Styles not applying:**
```bash
# Check import order in main.scss
# Ensure abstracts/ is imported first
# Themes should be last
```

### **CSS Custom Properties not working:**
```css
/* Ensure variables.css is loaded */
/* Check :root selector exists */
/* Verify var(--variable-name) syntax */
```

---

**Last Updated:** October 3, 2025  
**Maintainer:** Refactoring Team  
**Questions?** Check git history or ask the team!
- ✅ Page-specific styles
- ✅ Can use components + abstracts
- ✅ Modularize if >400 lines
- 📦 Grouped by feature: admin/, auth/, dashboard/, settings/

#### **themes/**
- ✅ Theme overrides (dark mode, etc.)
- ✅ Loaded last for highest specificity
- 📦 Current: _dark.scss

---

## 🚀 **ADDING NEW MODULES**

### **New Component:**
```bash
# Create file in appropriate subfolder
touch src/styles/components/ui/_tooltips.scss

# Add to main.scss
@use 'components/ui/tooltips';

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
