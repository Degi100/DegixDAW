# DegixDAW Monorepo

**D**AW-integrated, **E**ffortless, **G**lobal, **I**nstant e**X**change - Professional music collaboration platform with native desktop and VST plugin support.

## 🎵 Overview

DegixDAW is a comprehensive music collaboration ecosystem consisting of:

- **Web Frontend**: React 19 + TypeScript web application
- **Web Backend**: Express API server with Supabase integration
- **Desktop App**: Native desktop application (Electron/Tauri) - Coming Soon
- **VST Plugins**: Audio plugins for DAW integration (JUCE) - Coming Soon
- **Shared Packages**: Common types, utilities, and constants

## 📦 Monorepo Structure

```
DegixDAW/
├── web/
│   ├── frontend/        # React 19 + TypeScript web app
│   └── backend/         # Express API server
├── desktop/             # Electron/Tauri desktop app (Coming Soon)
├── vst/                 # VST/AU/AAX plugins (Coming Soon)
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── utils/           # Shared utilities
│   └── constants/       # Shared constants
├── .github/
│   └── workflows/       # CI/CD pipelines
└── package.json         # Monorepo root with workspaces
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm 9+**
- **Supabase account** (for backend services)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/degixdaw.git
cd degixdaw

# Install all dependencies (root + workspaces)
npm install

# Or manually:
npm run install:all
```

### Development

```bash
# Start frontend dev server (Vite on port 5173)
npm run dev:frontend

# Start backend dev server (Express on port 3001)
npm run dev:backend

# Start both simultaneously
npm run dev:all
```

### Building

```bash
# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Build everything
npm run build:all
```

### Testing & Linting

```bash
# Run frontend tests
npm run test:frontend

# Lint frontend
npm run lint:frontend

# Lint backend
npm run lint:backend

# Lint everything
npm run lint:all
```

## 🏗️ Project Details

### Web Frontend ([web/frontend/](web/frontend/))

Modern React web application with:
- React 19 + TypeScript
- Vite for fast dev/build
- Supabase auth & realtime
- Real-time chat & social features
- Feature flags system
- Admin panel with role-based access

**Tech Stack**: React, TypeScript, Vite, Supabase, SCSS, Zod

[📚 Frontend Documentation](web/frontend/README.md)

### Web Backend ([web/backend/](web/backend/))

Express API server providing:
- RESTful API endpoints
- Supabase integration
- Authentication middleware
- CORS configuration
- Health monitoring

**Tech Stack**: Express, TypeScript, Supabase

[📚 Backend Documentation](web/backend/README.md)

### Desktop App ([desktop/](desktop/))

🚧 **Coming Soon** - Native desktop application with:
- VST plugin hosting
- DAW protocol integration
- Low-latency audio processing
- System tray integration

**Tech Stack**: Electron/Tauri (TBD), React, Rust/Node.js

[📚 Desktop Documentation](desktop/README.md)

### VST Plugins ([vst/](vst/))

🚧 **Coming Soon** - Native audio plugins:
- VST3 format
- Audio Unit (macOS)
- AAX (Pro Tools)
- Real-time audio processing

**Tech Stack**: JUCE Framework, C++

[📚 VST Documentation](vst/README.md)

### Shared Packages ([packages/](packages/))

Shared code across all workspaces:

- **@degixdaw/types**: TypeScript interfaces and types
- **@degixdaw/utils**: Common utility functions
- **@degixdaw/constants**: Shared constants and enums

## 📜 Available Scripts

### Development
```bash
npm run dev:frontend      # Start frontend dev server
npm run dev:backend       # Start backend dev server
npm run dev:all           # Start both (concurrently)
```

### Building
```bash
npm run build:frontend    # Build frontend for production
npm run build:backend     # Build backend for production
npm run build:all         # Build everything
```

### Testing & Linting
```bash
npm run test:frontend     # Run frontend tests
npm run test:all          # Run all tests
npm run lint:frontend     # Lint frontend code
npm run lint:backend      # Lint backend code
npm run lint:all          # Lint everything
```

### Utilities
```bash
npm run install:all       # Install all dependencies
npm run clean             # Remove all node_modules
```

## 🔧 Environment Setup

### Frontend Environment

Create `web/frontend/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPER_ADMIN_EMAIL=admin@example.com
```

### Backend Environment

Create `web/backend/.env`:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Supabase, SCSS |
| **Backend** | Express, TypeScript, Supabase |
| **Desktop** | Electron/Tauri (TBD), React |
| **VST** | JUCE, C++ |
| **Shared** | TypeScript, npm workspaces |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Realtime** | Supabase Realtime |

## 📚 Documentation

- [Web Frontend Docs](web/frontend/README.md)
- [Web Backend Docs](web/backend/README.md)
- [Desktop Docs](desktop/README.md)
- [VST Docs](vst/README.md)
- [Deployment Guide](DEPLOYMENT.md)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with modern web technologies and a passion for music collaboration.

---

**Status**: 
- ✅ Web Frontend - Production Ready
- ✅ Web Backend - In Development
- 🚧 Desktop App - Planned
- 🚧 VST Plugins - Planned
