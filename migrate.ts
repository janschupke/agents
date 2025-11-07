import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

const supabase = createSupabaseClient();

// Table names in dependency order (for dropping in reverse)
const tablesInOrder = [
  'memory_chunks',
  'messages',
  'chat_sessions',
  'bot_configs',
  'bots',
];

// Execute SQL via Supabase RPC (requires exec_sql helper function)
async function executeSQL(sql: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Read and sort SQL files
async function getSQLFiles(): Promise<{ name: string; content: string }[]> {
  const sqlDir = join(process.cwd(), 'sql');
  const files = await readdir(sqlDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort(); // Sort alphabetically (001, 002, etc.)

  const sqlContents = await Promise.all(
    sqlFiles.map(async (file) => {
      const content = await readFile(join(sqlDir, file), 'utf-8');
      return { name: file, content };
    })
  );

  return sqlContents;
}

// Generate migration SQL
async function generateMigrationSQL(): Promise<string> {
  const sqlFiles = await getSQLFiles();

  let migrationSQL = '-- Migration Script\n';
  migrationSQL +=
    '-- This script drops all existing tables and recreates them\n';
  migrationSQL +=
    '-- Generated automatically from SQL files in the sql/ folder\n\n';

  // Drop tables in reverse dependency order
  migrationSQL += '-- Drop existing tables (in reverse dependency order)\n';
  for (const tableName of tablesInOrder) {
    migrationSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
  }

  migrationSQL += '\n-- Create tables from SQL files\n';
  for (const { name, content } of sqlFiles) {
    migrationSQL += `\n-- From ${name}\n`;
    migrationSQL += content;
    if (!content.trim().endsWith(';')) {
      migrationSQL += ';\n';
    }
    migrationSQL += '\n';
  }

  return migrationSQL;
}

// Main migration function
async function migrate(): Promise<void> {
  if (!supabase) {
    console.error('Error: Supabase client not initialized');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
    process.exit(1);
  }

  console.log('Starting migration...');
  console.log('====================\n');

  try {
    // Generate the migration SQL
    const migrationSQL = await generateMigrationSQL();

    // Write to file
    const outputFile = join(process.cwd(), 'migration.sql');
    await writeFile(outputFile, migrationSQL, 'utf-8');
    console.log(`✓ Generated migration SQL: ${outputFile}\n`);

    // Try to execute via RPC if exec_sql function exists
    console.log('Attempting to execute migration via Supabase...');
    const executed = await executeSQL(migrationSQL);

    if (executed) {
      console.log('✓ Migration executed successfully via Supabase!\n');
    } else {
      console.log(
        '⚠ Cannot execute SQL directly (exec_sql function not available)'
      );
      console.log('\nTo run the migration:');
      console.log('  1. Open your Supabase project dashboard');
      console.log('  2. Go to SQL Editor');
      console.log(`  3. Copy and paste the contents of ${outputFile}`);
      console.log('  4. Run the SQL\n');
      console.log(
        'Alternatively, create an exec_sql helper function in Supabase:'
      );
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
      `);
    }

    console.log('====================');
    console.log('Migration script completed!');
  } catch (error) {
    const err = error as { message?: string };
    console.error('\nMigration failed:', err.message || 'Unknown error');
    process.exit(1);
  }
}

// Run migration
migrate().catch(console.error);
