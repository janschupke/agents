-- Create exec_sql helper function for Supabase
-- This function allows executing arbitrary SQL via RPC
-- 
-- WARNING: This function allows executing arbitrary SQL. Only create it if you trust
-- the migration script and have proper access controls. Use SECURITY DEFINER carefully.
--
-- To use:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Run the SQL
-- 5. The function will be created and can be used by the migration script

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users (or anon if needed)
-- Adjust based on your security requirements
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
