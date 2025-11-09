# OpenAI Chat Monorepo

A fullstack monorepo with a NestJS API and React client for OpenAI chat functionality.

## Structure

```
.
├── packages/
│   ├── api/         # NestJS API
│   ├── client/      # React + Vite client
│   └── admin/       # Admin portal
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

Create `.env` file in `packages/api/`:

```
# RECOMMENDED: Direct connection (port 5432) for best performance
# This avoids transaction overhead and enables prepared statements
# Used for both regular queries and migrations
DIRECT_URL=postgresql://postgres:[password]@aws-1-ap-southeast-1.compute.amazonaws.com:5432/postgres

# Fallback: Pooler connection (port 6543) - only used if DIRECT_URL not set
# Use this if you're hitting connection limits with direct connection
DATABASE_URL=postgresql://postgres:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

OPENAI_API_KEY=your-openai-api-key
CLERK_SECRET_KEY=your-clerk-secret-key
PORT=3001
```

**Finding Connection Strings in Supabase:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, you'll find two connection modes:
   - **Direct connection** (port 5432, usually `.compute.amazonaws.com`) → Use for `DIRECT_URL` (recommended)
   - **Pooler connection** (port 6543, with `.pooler.` in the URL) → Use for `DATABASE_URL` (fallback only)
4. Copy both connection strings and replace `[YOUR-PASSWORD]` with your database password
5. Add `?pgbouncer=true` to the pooler connection string (`DATABASE_URL`) if using it

**Why two connections?**
- **Direct connection** (`DIRECT_URL`): **RECOMMENDED** - Best performance, no transaction overhead, supports prepared statements. Used for both queries and migrations.
- **Pooler connection** (`DATABASE_URL`): Fallback only - Use if you're hitting connection limits. Has transaction overhead (100-120ms per query) but handles more concurrent connections.

6. Generate Prisma client:

```bash
cd packages/api
pnpm prisma:generate
```

For client (optional, for production):
Create `.env` file in `packages/client/`:

```
VITE_API_URL=http://localhost:3001
```

## Development

Run API, client, and admin in development mode:

```bash
pnpm dev
```

Or run them separately:

API:

```bash
cd packages/api
pnpm dev
```

Note: The API uses NestJS. Make sure you have `@nestjs/cli` installed globally or use `pnpm` to run the commands.

Client:

```bash
cd packages/client
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

### API

The API can be deployed to any Node.js hosting service (e.g., Railway, Render, Fly.io).

### Client

The client is configured for Vercel deployment. Simply connect your repository to Vercel and deploy the `packages/client` directory.

For Vercel, you may need to configure the API proxy in `vercel.json` to point to your API URL.

## Database

The API uses Prisma for database access. The Prisma schema is located at `packages/api/prisma/schema.prisma`.

### Setup

1. Make sure your database is set up with the schema from the `sql/` directory
2. Set the `DATABASE_URL` in your `.env` file
3. Generate the Prisma client:

```bash
cd packages/api
pnpm prisma:generate
```

### Prisma Commands

- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations (uses `prisma migrate deploy`)
- `pnpm prisma:migrate:dev` - Run migrations in development mode (uses shadow database)
- `pnpm prisma:migrate:apply` - Apply the latest migration directly using DIRECT_URL (bypasses shadow database issues)
- `pnpm prisma:studio` - Open Prisma Studio (database GUI)

**Note:** If `prisma migrate dev` fails due to shadow database connection issues, use `pnpm prisma:migrate:apply` instead. This script applies migrations directly using the `DIRECT_URL` connection and marks them as applied.
