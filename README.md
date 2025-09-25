# 🎧 DegixDAW Frontend

**D**AW-integrated, **E**ffortless, **G**lobal, **I**nstant e**X**change - Professional React web application for music collaboration.

## ✨ Features

- 🎵 **Professional DAW Integration** - Seamless workflow with Digital Audio Workstations
- 🌍 **Global Collaboration** - Real-time project sharing with musicians worldwide  
- ⚡ **Modern Authentication** - Email/Password + OAuth (Google, Discord)
- 🔐 **Enhanced Security** - Password visibility toggle, secure validation
- 🎯 **Smart Username System** - AI-powered suggestions for names & creative words
- 📧 **Professional Email Validation** - Format validation with security-first approach
- 🎨 **Professional UI** - CSS Modules with consistent design system
- 📱 **Responsive Design** - Mobile-optimized with smooth animations
- 🔔 **Smart Notifications** - Toast system with intelligent welcome messages
- ⚙️ **User Management** - Complete profile system with avatar generation

## 🏗️ Architecture

### **Modern React Stack**
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **React Router** for client-side routing
- **Supabase** for authentication & backend

### **Professional Patterns**
- **CSS Modules** - Scoped styling with design tokens
- **Custom Hooks** - Reusable logic (useAuth, useForm, useToast)
- **Zod Validation** - Type-safe form schemas
- **Component Library** - Reusable UI components

### **Project Structure**
```
src/
├── components/ui/       # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities & validation
├── pages/              # Route components
└── styles/             # Design system & CSS modules
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build
```

### Environment Setup
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 🎯 Key Components

### **Authentication System**
- `Login.advanced.tsx` - Enhanced login/signup with password toggle & validation
- `useAuth.ts` - Centralized auth state management
- `UsernameSuggestions.tsx` - AI-powered username generation system
- Smart session handling with welcome messages
- Security-first email validation (format-only, no enumeration)

### **Dashboard & Navigation**  
- `Dashboard.advanced.tsx` - Feature grid with user awareness
- `UserSettings.advanced.tsx` - Profile management with avatars
- Intelligent navigation with loading states

### **UI Component Library**
- `Button.tsx` - Multi-variant button system
- `Input.tsx` - Enhanced form inputs with password toggle & validation indicators
- `Toast.tsx` - Notification system with animations
- `Loading.tsx` - Skeleton screens & spinners
- `UsernameSuggestions.tsx` - Intelligent username suggestion component

## 🚀 Advanced Features

### **Enhanced Authentication UX**
- **Password Visibility Toggle** - Secure show/hide functionality
- **Visual Validation Indicators** - Green checkmarks & error states
- **Real-time Form Validation** - Instant feedback with Zod schemas

### **Intelligent Username System**
- **Creative Name Generation** - Smart suggestions from full names
- **Fantasy Word Support** - Generates variations for words like "banane"
- **Availability Checking** - Real-time username conflict detection
- **Unified Component Logic** - Automatic mode detection (name vs. direct input)

### **Security-First Approach**
- **No Email Enumeration** - Protects against reconnaissance attacks
- **Format-Only Validation** - Professional email validation without data leakage
- **Rate Limiting Protection** - Handles Supabase API constraints gracefully

## 🎨 Design System

- **CSS Custom Properties** - Consistent theming
- **Responsive Grid** - Mobile-first approach
- **Smooth Animations** - Professional transitions
- **Accessibility** - WCAG compliant components

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### **Code Quality**
- TypeScript strict mode
- ESLint + Prettier configuration
- CSS Modules for scoped styling
- Zod for runtime validation
