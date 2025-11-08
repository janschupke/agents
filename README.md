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
# Pooler connection for regular queries (better for connection pooling)
DATABASE_URL=postgresql://postgres:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true

# Direct connection for migrations (required for Prisma migrations)
DIRECT_URL=postgresql://postgres:[password]@aws-1-ap-southeast-1.compute.amazonaws.com:5432/postgres

OPENAI_API_KEY=your-openai-api-key
CLERK_SECRET_KEY=your-clerk-secret-key
PORT=3001
```

**Finding Connection Strings in Supabase:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, you'll find two connection modes:
   - **Session mode** (with `.pooler.` in the URL) → Use for `DATABASE_URL` (regular queries)
   - **Transaction mode** (direct connection, usually `.compute.amazonaws.com`) → Use for `DIRECT_URL` (migrations)
4. Copy both connection strings and replace `[YOUR-PASSWORD]` with your database password
5. Add `?pgbouncer=true` to the pooler connection string (`DATABASE_URL`)

**Why two connections?**
- **Pooler connection** (`DATABASE_URL`): Better for regular queries, handles connection pooling efficiently
- **Direct connection** (`DIRECT_URL`): Required for Prisma migrations, which need a direct database connection without pooling

6. Generate Prisma client:

```bash
cd packages/backend
pnpm prisma:generate
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

The backend uses Prisma for database access. The Prisma schema is located at `packages/backend/prisma/schema.prisma`.

### Setup

1. Make sure your database is set up with the schema from the `sql/` directory
2. Set the `DATABASE_URL` in your `.env` file
3. Generate the Prisma client:

```bash
cd packages/backend
pnpm prisma:generate
```

### Prisma Commands

- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio (database GUI)
