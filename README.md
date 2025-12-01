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

3. Set up local database with Docker (recommended for local development):

```bash
# Start PostgreSQL with pgvector extension
docker-compose up -d

# Wait for database to be ready (usually takes 10-20 seconds)
# You can check status with: docker-compose ps
```

4. Set up environment variables:

Create `.env` file in `packages/api/`:

**For local development with Docker:**
```
# Local Docker PostgreSQL connection (port 5434 to avoid conflicts)
DIRECT_URL=postgresql://postgres:postgres@localhost:5434/postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/postgres

OPENAI_API_KEY=your-openai-api-key
CLERK_SECRET_KEY=your-clerk-secret-key
PORT=3001
```

**For production/cloud database (e.g., Supabase):**
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

5. Run database migrations:

For a fresh database, use `prisma migrate deploy` (recommended for local Docker setup):
```bash
cd packages/api
pnpm prisma:migrate
```

For development with shadow database (may fail if base tables don't exist):
```bash
cd packages/api
pnpm prisma:migrate:dev
```

**Note:** If `prisma migrate dev` fails with "table does not exist" errors, use `pnpm prisma:migrate` instead. The baseline migration (`0_init_baseline`) creates all the base tables first.

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

### Local Development with Docker

The project includes a `docker-compose.yml` file that sets up PostgreSQL with the pgvector extension for local development.

**Starting the database:**
```bash
# Start PostgreSQL container
docker-compose up -d
# or use the npm script: pnpm docker:up

# Check status
docker-compose ps
# or use: pnpm docker:ps

# View logs
docker-compose logs -f postgres
# or use: pnpm docker:logs
```

**Note:** The default port is `5434` to avoid conflicts with other PostgreSQL instances. If you need to use a different port, edit `docker-compose.yml` and update the port mapping (e.g., change `"5434:5432"` to `"YOUR_PORT:5432"`), then update your `.env` file accordingly.

**Stopping the database:**
```bash
# Stop the container (data persists in Docker volume)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

**Database connection details (local):**
- Host: `localhost`
- Port: `5434` (mapped from container port 5432 to avoid conflicts with other PostgreSQL instances)
- Database: `postgres`
- Username: `postgres`
- Password: `postgres`

### Setup

1. Start the local database (see above) or configure connection to your cloud database
2. Set the `DIRECT_URL` and `DATABASE_URL` in your `.env` file (see Setup section)
3. Run migrations:

```bash
cd packages/api
pnpm prisma:migrate:dev
```

4. Generate the Prisma client:

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
