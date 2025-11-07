// Example: Inserting data WITHOUT exec_sql
// This shows that exec_sql is NOT needed for regular data operations

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

const supabase = createSupabaseClient();

// Example: Insert a bot (DML - Data Manipulation Language)
// NO exec_sql needed! Use the Supabase client directly
async function insertBot() {
  if (!supabase) {
    console.error('Supabase not initialized');
    return;
  }

  const { data, error } = await supabase
    .from('bots')
    .insert({
      name: 'My Bot',
      description: 'A test bot',
    })
    .select();

  if (error) {
    console.error('Error inserting bot:', error);
  } else {
    console.log('Bot inserted:', data);
  }
}

// Example: Update a bot (DML)
async function updateBot(botId: number) {
  if (!supabase) return;

  const { data, error } = await supabase
    .from('bots')
    .update({ description: 'Updated description' })
    .eq('id', botId)
    .select();

  if (error) {
    console.error('Error updating bot:', error);
  } else {
    console.log('Bot updated:', data);
  }
}

// Example: Delete a bot (DML)
async function deleteBot(botId: number) {
  if (!supabase) return;

  const { data, error } = await supabase
    .from('bots')
    .delete()
    .eq('id', botId)
    .select();

  if (error) {
    console.error('Error deleting bot:', error);
  } else {
    console.log('Bot deleted:', data);
  }
}

// Example: Query bots (DML)
async function getBots() {
  if (!supabase) return;

  const { data, error } = await supabase.from('bots').select('*');

  if (error) {
    console.error('Error fetching bots:', error);
  } else {
    console.log('Bots:', data);
  }
}

// Summary:
// - DDL (CREATE TABLE, DROP TABLE): Requires exec_sql or SQL Editor
// - DML (INSERT, UPDATE, DELETE, SELECT): Use Supabase client directly, NO exec_sql needed!
