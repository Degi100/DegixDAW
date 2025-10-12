# DegixDAW Backend

Express API server for DegixDAW.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
```

## Development

```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API info

## Tech Stack

- **Express**: Web framework
- **TypeScript**: Type safety
- **Supabase**: Database & Auth
- **tsx**: TypeScript execution with hot reload
