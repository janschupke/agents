# OpenAI API Examples

A TypeScript Node.js project demonstrating OpenAI API usage with example prompts.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```bash
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

3. Add your API keys to `.env`:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

Note: `SUPABASE_URL` and `SUPABASE_KEY` are optional. The project will work with just OpenAI if Supabase is not configured.

## Usage

### Available Commands

**Main Commands:**

- `npm run healthcheck` - Check database connection and query bots table
- `npm run openai` - Run OpenAI example prompts
- `npm run chat` - Interactive chat with OpenAI (reads from command line)
- `npm run migrate` - Run database migration (wipes and recreates tables)

**Development Scripts:**

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the main entry point
- `npm run dev` - Build and run in one command
- `npm run tsc` - Type check without emitting files
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check (alias for tsc)

### Project Structure

```
openai/
├── src/
│   ├── clients.ts      # Shared OpenAI and Supabase client initialization
│   ├── healthcheck.ts   # Database connection and bots table query
│   ├── openai.ts        # OpenAI example prompts
│   └── chat.ts          # Interactive CLI chat interface
├── sql/                 # SQL migration files
├── index.ts             # Main entry point
├── migrate.ts           # Database migration script
└── package.json
```

### Interactive Chat

Run the interactive chat interface with a bot:

```bash
npm run chat [bot-id-or-name]
```

Examples:

```bash
npm run chat 1              # Use bot with ID 1
npm run chat TestBot        # Use bot named "TestBot"
```

**Features:**

- **Bot Configuration**: Loads bot and its configuration from Supabase (model, temperature, max_tokens, system prompts)
- **Session Management**: Creates or resumes chat sessions, automatically resumes the latest session
- **Message Persistence**: All messages saved to database, conversation history loaded when resuming
- **Memory Chunks**: Automatically saves memory chunks every 10 messages and on exit

**Commands:**

- Type messages and get AI responses
- Type `exit` or `quit` to end the conversation
- Type `clear` to clear in-memory history (reloads from database)
- Type `help` for more commands

**Database Tables Used:**

- `bots` - Bot definitions
- `bot_configs` - Bot configuration (model, temperature, etc.)
- `chat_sessions` - Chat session records
- `messages` - Individual messages in conversations
- `memory_chunks` - Summarized conversation chunks for memory

## Examples Included

### OpenAI Examples

- Simple Question: Basic factual question
- Code Explanation: Technical concept explanation
- Creative Writing: Haiku generation
- Problem Solving: Code example request

### Supabase Examples (if configured)

- Connection Verification: Tests Supabase connection
- Database Structure: Attempts to fetch table list from database

Note: To enable programmatic table listing, create a SQL function in your Supabase project:

```sql
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE(table_schema text, table_name text, table_type text)
AS $$
  SELECT table_schema::text, table_name::text, table_type::text
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  ORDER BY table_schema, table_name;
$$ LANGUAGE sql SECURITY DEFINER;
```

## Database Migration

The project includes a migration script that wipes existing data and recreates the database structure from SQL files in the `sql/` folder.

### Running Migrations

```bash
npm run migrate
```

This will:

1. Read all SQL files from the `sql/` folder (sorted by filename)
2. Generate a `migration.sql` file that:
   - Drops all existing tables in reverse dependency order
   - Recreates all tables from the SQL files
3. Attempt to execute the migration via Supabase (if `exec_sql` function exists)
4. If direct execution isn't available, provide instructions to run manually

### Manual Migration

If the `exec_sql` function doesn't exist in your Supabase project:

1. Run `npm run migrate` to generate `migration.sql`
2. Open your Supabase project dashboard
3. Go to SQL Editor
4. Copy and paste the contents of `migration.sql`
5. Run the SQL

### Creating exec_sql Helper Function (Optional)

To enable automatic migration execution, you need to create the `exec_sql` function in Supabase:

**Option 1: Using the provided SQL file (Recommended)**

1. Run `npm run setup:exec-sql` to view the SQL, or open `setup-exec-sql.sql`
2. Open your Supabase project dashboard
3. Go to SQL Editor
4. Copy and paste the contents of `setup-exec-sql.sql`
5. Run the SQL

**Option 2: Manual creation**

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run this SQL:

```sql
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
```

**Warning**: This function allows executing arbitrary SQL. Only create it if you trust the migration script and have proper access controls. The `SECURITY DEFINER` clause means it runs with the privileges of the function creator.

## CI/CD

GitHub Actions workflows automatically run on push and pull requests:

- TypeScript type checking
- ESLint linting
- Prettier format checking
