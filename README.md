# OpenAI Chat Monorepo

A fullstack monorepo with a NestJS backend and React frontend for OpenAI chat functionality.

## Structure

```
.
├── packages/
│   ├── backend/     # NestJS API backend
│   └── frontend/    # React + Vite frontend
├── pnpm-workspace.yaml
└── package.json
```

## Setup

1. Install pnpm (if not already installed):
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create `.env` file in `packages/backend/`:
```
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
PORT=3001
```

For frontend (optional, for production):
Create `.env` file in `packages/frontend/`:
```
VITE_API_URL=http://localhost:3001
```

## Development

Run both backend and frontend in development mode:
```bash
pnpm dev
```

Or run them separately:

Backend:
```bash
cd packages/backend
pnpm dev
```

Note: The backend uses NestJS. Make sure you have `@nestjs/cli` installed globally or use `pnpm` to run the commands.

Frontend:
```bash
cd packages/frontend
pnpm dev
```

## Build

Build all packages:
```bash
pnpm build
```

## API Endpoints

### Health Check
- `GET /api/healthcheck` - Check database connection and bot status

### Chat
- `GET /api/chat/:botId` - Get chat history for a bot
- `POST /api/chat/:botId` - Send a message to a bot
  - Body: `{ "message": "your message" }`

## Deployment

### Backend
The backend can be deployed to any Node.js hosting service (e.g., Railway, Render, Fly.io).

### Frontend
The frontend is configured for Vercel deployment. Simply connect your repository to Vercel and deploy the `packages/frontend` directory.

For Vercel, you may need to configure the API proxy in `vercel.json` to point to your backend URL.

## Database

Make sure to run the database migrations from the `sql/` directory in your Supabase project before using the application.
