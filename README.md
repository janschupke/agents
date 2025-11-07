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
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
OPENAI_API_KEY=your-openai-api-key
PORT=3001
```

**Finding DATABASE_URL in Supabase:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, select **Transaction** mode (for Prisma migrations) or **Session** mode (for connection pooling)
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password
5. For Prisma migrations, use the **Transaction** mode connection string
6. For production/connection pooling, use the **Session** mode connection string with `?pgbouncer=true`

7. Generate Prisma client:

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
