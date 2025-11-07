import { createSupabaseClient } from './clients.js';

async function healthcheck(): Promise<void> {
  const supabase = createSupabaseClient();

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
    process.exit(1);
  }

  console.log('Health Check');
  console.log('============\n');

  // Test 1: Connection verification
  console.log('1. Testing database connection...');
  try {
    const { error } = await supabase.from('bots').select('*').limit(0);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log(
          '   ✓ Connection successful (table not found is expected)\n'
        );
      } else {
        throw error;
      }
    } else {
      console.log('   ✓ Connection successful\n');
    }
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error(`   ✗ Connection failed: ${err.message || 'Unknown error'}`);
    process.exit(1);
  }

  // Test 2: Query bots table
  console.log('2. Querying bots table...');
  try {
    const { data, error } = await supabase.from('bots').select('*').limit(10);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('   ⚠ Bots table does not exist yet');
        console.log('   Run "npm run migrate" to create the database schema\n');
      } else {
        throw error;
      }
    } else {
      console.log(`   ✓ Query successful - Found ${data?.length || 0} bot(s)`);
      if (data && data.length > 0) {
        console.log('\n   Bots:');
        data.forEach(
          (bot: { id: number; name: string; description?: string }) => {
            console.log(`     - ID: ${bot.id}, Name: ${bot.name}`);
            if (bot.description) {
              console.log(`       Description: ${bot.description}`);
            }
          }
        );
      }
      console.log('');
    }
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error(`   ✗ Query failed: ${err.message || 'Unknown error'}`);
    process.exit(1);
  }

  console.log('============');
  console.log('✓ Health check completed successfully!');
}

// Run healthcheck
healthcheck().catch((error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});
