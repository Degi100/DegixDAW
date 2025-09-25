# 🎧 DegixDAW Frontend

**D**AW-integrated, **E**ffortless, **G**lobal, **I**nstant e**X**change - Professional React web application for music collaboration.

## ✨ Features

- 🎵 **Professional DAW Integration** - Seamless workflow with Digital Audio Workstations
- 🌍 **Global Collaboration** - Real-time project sharing with musicians worldwide  
- ⚡ **Modern Authentication** - Email/Password + OAuth (Google, Discord)
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
- `Login.advanced.tsx` - Modern login/signup with OAuth
- `useAuth.ts` - Centralized auth state management
- Smart session handling with welcome messages

### **Dashboard & Navigation**  
- `Dashboard.advanced.tsx` - Feature grid with user awareness
- `UserSettings.advanced.tsx` - Profile management with avatars
- Intelligent navigation with loading states

### **UI Component Library**
- `Button.tsx` - Multi-variant button system
- `Input.tsx` - Form inputs with validation display  
- `Toast.tsx` - Notification system with animations
- `Loading.tsx` - Skeleton screens & spinners

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
