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

Build and run the examples:

```bash
npm run build
npm start
```

Or use the dev script to build and run in one command:

```bash
npm run dev
```

## Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run dev` - Build and run in one command
- `npm run migrate` - Run database migration (wipes and recreates tables)
- `npm run tsc` - Type check without emitting files
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check (alias for tsc)

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
