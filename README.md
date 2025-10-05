# DegixDAW Frontend

**D**AW-integrated, **E**ffortless, **G**lobal, **I**nstant e**X**change - Professional React web application for music collaboration.

## 🚀 Overview

A modern, full-stack music collaboration platform built with React 19 and TypeScript. Features real-time DAW integration, global collaboration tools, and comprehensive user management with Supabase backend.

## ✨ Key Features

- 🎵 **Professional DAW Integration** - Seamless workflow with digital audio workstations
- 🌍 **Real-time Collaboration** - Live project sharing and social features for musicians worldwide
- ⚡ **Modern Authentication** - Email/password + OAuth (Google, Discord) with secure password management
- 🔐 **Advanced Security** - Password visibility toggle, validation, and Supabase auth integration
- 🎯 **Smart Username System** - AI-powered suggestions with real-time availability checking
- 📧 **Professional Email Management** - Secure email change functionality with validation
- 🎨 **Modular Component Architecture** - Reusable UI components with TypeScript
- 📱 **Responsive Design** - Mobile-optimized interface with smooth animations
- 🔔 **Toast Notifications** - Professional notification system with error handling
- ⚙️ **Complete User Management** - Profile editing, settings, and account management
- 👥 **Social Features** - Friend connections and music collaboration tools
- 🔧 **Admin Panel** - Administrative tools for platform management

## 🏗️ Architecture

### Tech Stack
- **React 19** with TypeScript
- **Vite** for lightning-fast development and building
- **React Router** for client-side routing
- **Supabase** for authentication, database, and real-time features
- **Sass/SCSS** for advanced styling capabilities
- **Express.js** for local API development
- **Zod** for runtime type validation

### Project Structure
```
src/
├── components/
│   ├── admin/          # Administrative components
│   ├── auth/           # Authentication system
│   ├── chat/           # Real-time messaging
│   ├── dashboard/      # Main dashboard components
│   ├── layout/         # Layout and navigation
│   ├── profile/        # User profile management
│   ├── settings/       # User settings and preferences
│   ├── social/         # Social features and connections
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Route components and pages
├── styles/             # SCSS stylesheets and design system
└── utils/              # Helper functions and utilities
```

### Core UI Components
```
src/components/ui/
├── Button.tsx              # Multi-variant button system
├── Input.tsx               # Enhanced form inputs with validation
├── Toast.tsx               # Notification system
├── Loading.tsx             # Loading states and skeletons
├── UsernameSuggestions.tsx # AI-powered username generation
└── ErrorBoundary.tsx       # Error handling and fallbacks
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **npm** or **yarn**
- **Supabase account** (for backend services)

### Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Environment configuration:**
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

### Development Commands

#### Core Commands
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code quality checks

#### Database & API
- `npm run api` - Start local Express API server
- `npm run app` - Run both frontend and API concurrently
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

#### Utilities
- `npm run setup:issues` - Initialize issues tracking table
- `npm run db:cleanup` - Clean up database
- `npm run db:sync-profiles` - Sync user profiles with auth

## 🔧 Development

### Code Quality & Standards
- **TypeScript Strict Mode** - Full type safety across the application
- **ESLint** - Code linting with React and TypeScript rules
- **Prettier** - Code formatting for consistent style
- **Error Boundaries** - Graceful error handling throughout the app

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run api              # Start local API server
npm run app              # Run both dev and API together

# Building & Preview
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint checks

# Database Operations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:cleanup       # Clean database
npm run db:sync-profiles # Sync user profiles

# Utilities
npm run setup:issues     # Initialize issues table
```

## 📚 Documentation

Complete documentation available in the [`docs/`](./docs/) directory:

- **[📖 Documentation Index](./docs/README.md)** - Complete overview
- **[📋 Project Summary](./docs/PROJECT_SUMMARY.md)** - Architecture & features
- **[🗄️ Supabase Setup](./docs/SUPABASE_SETUP.md)** - Database configuration
- **[🔐 Token Management](./docs/TOKEN_MANAGEMENT.md)** - Authentication guide
- **[🚀 Deployment Guide](./DEPLOYMENT.md)** - Production deployment

