// Main entry point - redirects to appropriate modules
// This file can be used as a simple launcher or removed if not needed

import { createSupabaseClient } from './src/clients.js';

async function main(): Promise<void> {
  console.log('OpenAI + Supabase Project');
  console.log('========================\n');
  console.log('Available commands:');
  console.log(
    '  npm run healthcheck - Check database connection and query bots'
  );
  console.log('  npm run openai      - Run OpenAI example prompts');
  console.log('  npm run chat        - Interactive chat with OpenAI');
  console.log('  npm run migrate     - Run database migrations\n');

  // Quick Supabase connection check
  const supabase = createSupabaseClient();
  if (supabase) {
    console.log('✓ Supabase is configured');
  } else {
    console.log(
      '⚠ Supabase is not configured (set SUPABASE_URL and SUPABASE_KEY)'
    );
  }

  console.log('\nRun a specific command to get started!');
}

main().catch(console.error);
