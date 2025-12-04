# OpenAI Chat Monorepo

A fullstack monorepo with a NestJS API and React client for AI-powered chat functionality. Features include multi-agent conversations, message translation, vocabulary management, and persistent memory using vector embeddings.

## Structure

```
.
├── apps/
│   ├── api/         # NestJS API with Prisma ORM
│   ├── client/      # React + Vite client application
│   └── admin/       # Admin portal
├── packages/
│   ├── ui/          # Shared UI components and design system
│   ├── i18n/        # Internationalization package
│   ├── utils/       # Shared utilities package
│   └── shared-types/ # Shared types, constants, and enums
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

Create `.env` file in `apps/api/`:

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
cd apps/api
pnpm prisma:migrate
```

For development with shadow database (may fail if base tables don't exist):
```bash
cd apps/api
pnpm prisma:migrate:dev
```

**Note:** If `prisma migrate dev` fails with "table does not exist" errors, use `pnpm prisma:migrate` instead. The baseline migration (`0_init_baseline`) creates all the base tables first.

6. Generate Prisma client:

```bash
cd apps/api
pnpm prisma:generate
```

For client (optional, for production):
Create `.env` file in `apps/client/`:

```
VITE_API_URL=http://localhost:3001
```

## Development

Run all apps in development mode:

```bash
pnpm dev
```

This starts the API, client, and admin concurrently.

Or run them separately:

**API:**
```bash
pnpm dev:api
# or
cd apps/api && pnpm dev
```

**Client:**
```bash
pnpm dev:client
# or
cd apps/client && pnpm dev
```

**Admin:**
```bash
pnpm dev:admin
# or
cd apps/admin && pnpm dev
```

**Note:** The API uses NestJS. Make sure you have `@nestjs/cli` installed globally or use `pnpm` to run the commands.

### Building Packages

Build all packages and apps:
```bash
pnpm build
```

Build specific package:
```bash
pnpm --filter @openai/ui build
pnpm --filter @openai/utils build
pnpm --filter @openai/i18n build
pnpm --filter @openai/shared-types build
```

### Code Quality

Run linting, type checking, and tests:
```bash
pnpm lint          # Lint all packages
pnpm typecheck     # Type check all packages
pnpm test          # Run all tests
pnpm check         # Run lint, typecheck, test, and build
```

Run for specific scope:
```bash
pnpm lint:apps     # Lint only apps
pnpm lint:packages # Lint only packages
```

### Internationalization

Extract translation keys from code:
```bash
pnpm i18n:extract        # Extract once
pnpm i18n:extract:watch  # Watch mode
```


## Packages

### `@openai/ui`

Shared UI component library with design system components, layout primitives, and theming support via CSS variables.

**Key features:**
- Layout components: `PageContainer`, `PageHeader`, `Card`, `Container`, `Sidebar`, etc.
- Form components: `Input`, `Button`, `Textarea`, `FormField`, etc.
- Feedback components: `Toast`, `Skeleton`, `EmptyState`, etc.
- Theming via CSS variables (apps can override brand colors)

### `@openai/utils`

Shared utility functions for date/time formatting, validation, and form handling.

**Available utilities:**
- Date/time formatting (using Luxon)
- Form validation hooks
- Validation utilities

### `@openai/i18n`

Internationalization package with support for multiple languages and namespaces.

**Namespaces:**
- `CLIENT` - Client app translations
- `ADMIN` - Admin app translations
- `API` - API translations
- `COMMON` - Common translations

### `@openai/shared-types`

Shared types, constants, and enums used across client, admin, and API apps.

**Available exports:**
- `PERSONALITY_TYPES` and `PersonalityType` - Agent personality type definitions
- `INTERESTS` and `Interest` - Agent interest definitions
- `NUMERIC_CONSTANTS` - Shared numeric constants (UI timeouts, file limits, pagination)
- `OPENAI_MODELS` - OpenAI model name constants
- `MAGIC_STRINGS` - Shared string constants (user roles, provider names, etc.)

**Subpath exports:**
- `@openai/shared-types/personality-types`
- `@openai/shared-types/interests`
- `@openai/shared-types/numeric`
- `@openai/shared-types/openai`
- `@openai/shared-types/magic-strings`

## API Endpoints

### Health Check

- `GET /api/healthcheck` - Check database connection and system status

### Agents

- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an agent
- `GET /api/agents/:id/memories` - Get agent memories
- `POST /api/agents/:id/memories/summarize` - Summarize agent memories

### Chat

- `GET /api/chat/:agentId` - Get chat history for an agent
- `POST /api/chat/:agentId` - Send a message to an agent
  - Body: `{ "message": "your message", "sessionId": 123 }` (sessionId optional)
- `GET /api/chat/:agentId/sessions` - Get all sessions for an agent
- `GET /api/chat/:agentId/sessions/:sessionId` - Get specific session

### Sessions

- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session (e.g., rename)
- `DELETE /api/sessions/:id` - Delete session

### Messages

- `POST /api/messages/:id/translate` - Translate a message
- `POST /api/messages/:id/translate-with-words` - Translate message with word-level translations
- `GET /api/messages/:id/word-translations` - Get word translations for a message
- `POST /api/messages/:id/words/translate` - Translate words in a message
- `GET /api/messages/translations` - Get all translations

### Saved Words

- `GET /api/saved-words` - List saved words
- `POST /api/saved-words` - Create a saved word
- `GET /api/saved-words/:id` - Get saved word details
- `PUT /api/saved-words/:id` - Update a saved word
- `DELETE /api/saved-words/:id` - Delete a saved word
- `GET /api/saved-words/matching` - Find matching saved words
- `GET /api/saved-words/:id/sentences` - Get sentences for a saved word
- `POST /api/saved-words/:id/sentences` - Add a sentence to a saved word

### User

- `GET /api/user/me` - Get current user
- `GET /api/user/all` - Get all users (admin only)

### API Credentials

- `GET /api/api-credentials/openai` - Get OpenAI API key
- `POST /api/api-credentials/openai` - Set OpenAI API key
- `POST /api/api-credentials/openai/check` - Check if API key is valid

### System Config

- `GET /api/system-config/behavior-rules` - Get system behavior rules
- `PUT /api/system-config/behavior-rules` - Update system behavior rules

## Deployment

### API

The API can be deployed to any Node.js hosting service (e.g., Railway, Render, Fly.io).

### Client

The client is configured for Vercel deployment. Simply connect your repository to Vercel and deploy the `apps/client` directory.

For Vercel, you may need to configure the API proxy in `vercel.json` to point to your API URL.

## Database

The API uses Prisma for database access. The Prisma schema is located at `apps/api/prisma/schema.prisma`.

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
cd apps/api
pnpm prisma:migrate:dev
```

4. Generate the Prisma client:

```bash
cd apps/api
pnpm prisma:generate
```

### Prisma Commands

- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations (uses `prisma migrate deploy`)
- `pnpm prisma:migrate:dev` - Run migrations in development mode (uses shadow database)
- `pnpm prisma:migrate:apply` - Apply the latest migration directly using DIRECT_URL (bypasses shadow database issues)
- `pnpm prisma:studio` - Open Prisma Studio (database GUI)

**Note:** If `prisma migrate dev` fails due to shadow database connection issues, use `pnpm prisma:migrate:apply` instead. This script applies migrations directly using the `DIRECT_URL` connection and marks them as applied.
