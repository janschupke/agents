import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Example prompt interface
interface Example {
  name: string;
  prompt: string;
}

// Example prompts (currently commented out in main function)
// @ts-expect-error - Intentionally unused, will be used when OpenAI examples are uncommented
const examples: Example[] = [
  {
    name: 'Simple Question',
    prompt: 'What is the capital of France?',
  },
  {
    name: 'Code Explanation',
    prompt: 'Explain what a closure is in JavaScript in one sentence.',
  },
  {
    name: 'Creative Writing',
    prompt: 'Write a haiku about programming.',
  },
  {
    name: 'Problem Solving',
    prompt: 'How do I reverse a string in JavaScript? Provide a code example.',
  },
];

// Function to call OpenAI API (currently commented out in main function)
// @ts-expect-error - Intentionally unused, will be used when OpenAI examples are uncommented
async function runExample(example: Example): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Example: ${example.name}`);
  console.log(`Prompt: ${example.prompt}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'user',
          content: example.prompt,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      console.log('Response:');
      console.log(response);
      console.log('\n');
    }
  } catch (error) {
    const err = error as { message?: string; status?: number };
    console.error('Error:', err.message || 'Unknown error');
    if (err.status === 401) {
      console.error('Invalid API key. Please check your .env file.');
    }
  }
}

// Supabase connection verification
async function verifySupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
    return false;
  }

  try {
    // Simple connection test: try to query a non-existent table
    // This will return a "table not found" error if connection works,
    // or a network/connection error if it doesn't
    const { error } = await supabase
      .from('_connection_test_')
      .select('*')
      .limit(0);

    // PGRST116 or 42P01 means "table not found" - this is good! Connection works
    // Other errors might indicate connection issues (network, auth, etc.)
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // Table doesn't exist, but connection works
        return true;
      }
      // Check if it's an auth-related error that we can ignore
      if (
        error.message?.includes('Auth session missing') ||
        error.message?.includes('JWT') ||
        error.message?.includes('Invalid API key')
      ) {
        // Auth errors might mean the key is wrong, but let's try another method
        // Try a different approach: check if we can reach the API
        const { error: healthError } = await supabase
          .from('_health_check_')
          .select('*')
          .limit(0);

        if (
          healthError &&
          (healthError.code === 'PGRST116' ||
            healthError.code === '42P01' ||
            healthError.message?.includes('relation') ||
            healthError.message?.includes('does not exist'))
        ) {
          // Table doesn't exist, but we got a response - connection works
          return true;
        }
      }
      // If we get here, it might be a real connection error
      throw error;
    }

    return true;
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error('Supabase connection error:', err.message || 'Unknown error');
    return false;
  }
}

// Fetch database structure (table list)
async function fetchDatabaseStructure(): Promise<void> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    // Try to use a SQL function if available (requires creating a function in Supabase)
    // First, try using RPC to query information_schema
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_tables',
      {}
    );

    if (!rpcError && rpcData) {
      console.log('\nDatabase Tables:');
      console.log('================');
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        rpcData.forEach(
          (table: {
            table_schema: string;
            table_name: string;
            table_type: string;
          }) => {
            console.log(
              `  ${table.table_schema}.${table.table_name} (${table.table_type})`
            );
          }
        );
      } else {
        console.log('No tables found.');
      }
      return;
    }

    // Alternative: Try to query information_schema directly via PostgREST
    // This typically doesn't work, but we'll try
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .neq('table_schema', 'pg_catalog')
      .neq('table_schema', 'information_schema')
      .order('table_schema')
      .order('table_name');

    if (!schemaError && schemaData && schemaData.length > 0) {
      console.log('\nDatabase Tables:');
      console.log('================');
      schemaData.forEach(
        (table: {
          table_schema: string;
          table_name: string;
          table_type: string;
        }) => {
          console.log(
            `  ${table.table_schema}.${table.table_name} (${table.table_type})`
          );
        }
      );
      return;
    }

    // If direct queries don't work, provide instructions
    console.log(
      '\nNote: Direct schema queries are not available through PostgREST.'
    );
    console.log('To view your database structure:');
    console.log('  1. Go to your Supabase project dashboard');
    console.log('  2. Navigate to "Table Editor" to see all tables');
    console.log('  3. Or use the SQL Editor to run:');
    console.log(
      "     SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log(
      '\nTo enable programmatic table listing, create a SQL function:'
    );
    console.log('  CREATE OR REPLACE FUNCTION get_tables()');
    console.log(
      '  RETURNS TABLE(table_schema text, table_name text, table_type text)'
    );
    console.log('  AS $$');
    console.log(
      '    SELECT table_schema::text, table_name::text, table_type::text'
    );
    console.log('    FROM information_schema.tables');
    console.log(
      "    WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')"
    );
    console.log('    ORDER BY table_schema, table_name;');
    console.log('  $$ LANGUAGE sql SECURITY DEFINER;');
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error(
      'Error fetching database structure:',
      err.message || 'Unknown error'
    );
  }
}

// Main function to run all examples
async function main(): Promise<void> {
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set in .env file');
    console.error(
      'Please create a .env file with: OPENAI_API_KEY=your-api-key-here'
    );
    process.exit(1);
  }

  // console.log('OpenAI API Examples');
  // console.log('==================\n');

  // Run all examples
  // for (const example of examples) {
  //   await runExample(example);
  //   // Small delay between requests
  //   await new Promise((resolve) => setTimeout(resolve, 500));
  // }

  // Supabase examples
  if (supabase) {
    console.log('\n\n');
    console.log('Supabase Connection Examples');
    console.log('============================\n');

    console.log('Verifying Supabase connection...');
    const isConnected = await verifySupabaseConnection();
    if (isConnected) {
      console.log('✓ Supabase connection verified!\n');
      await fetchDatabaseStructure();
    } else {
      console.log('✗ Failed to verify Supabase connection\n');
    }
  } else {
    console.log('\n\n');
    console.log('Supabase: Not configured');
    console.log('========================');
    console.log(
      'To enable Supabase, set SUPABASE_URL and SUPABASE_KEY in your .env file'
    );
  }

  console.log('\nAll examples completed!');
}

// Run the main function
main().catch(console.error);
