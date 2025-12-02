-- Enable pgvector extension for vector similarity search
-- This allows efficient vector similarity queries using cosine distance

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Update memory_chunks table to use vector type instead of REAL[]
-- Note: This requires dropping and recreating the column if it already exists
-- For new installations, this will work directly
-- For existing installations, you may need to migrate data

-- Add vector_embedding column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memory_chunks' AND column_name = 'vector_embedding'
  ) THEN
    ALTER TABLE memory_chunks ADD COLUMN vector_embedding vector(1536);
    
    -- Migrate existing data from vector (REAL[]) to vector_embedding (vector)
    -- Convert array format to vector format
    UPDATE memory_chunks
    SET vector_embedding = vector::text::vector(1536)
    WHERE vector IS NOT NULL AND vector_embedding IS NULL;
  END IF;
END $$;

-- Create index for vector similarity search using HNSW (Hierarchical Navigable Small World)
-- This enables fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_memory_chunks_vector_embedding 
ON memory_chunks 
USING hnsw (vector_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Function to find similar memory chunks using vector similarity
-- Uses cosine distance for semantic similarity
CREATE OR REPLACE FUNCTION find_similar_memories(
  query_embedding vector(1536),
  session_ids integer[],
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id integer,
  session_id integer,
  chunk text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.session_id,
    mc.chunk,
    1 - (mc.vector_embedding <=> query_embedding) as similarity
  FROM memory_chunks mc
  WHERE 
    mc.vector_embedding IS NOT NULL
    AND (session_ids IS NULL OR mc.session_id = ANY(session_ids))
    AND (1 - (mc.vector_embedding <=> query_embedding)) >= match_threshold
  ORDER BY mc.vector_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to find similar memories for an agent (across all sessions)
CREATE OR REPLACE FUNCTION find_similar_memories_for_agent(
  query_embedding vector(1536),
  agent_id_param integer,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id integer,
  session_id integer,
  chunk text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  session_ids_array integer[];
BEGIN
  -- Get all session IDs for this agent
  SELECT ARRAY_AGG(id) INTO session_ids_array
  FROM chat_sessions
  WHERE agent_id = agent_id_param;
  
  -- If no sessions found, return empty
  IF session_ids_array IS NULL THEN
    RETURN;
  END IF;
  
  -- Use the general function with agent's session IDs
  RETURN QUERY
  SELECT * FROM find_similar_memories(
    query_embedding,
    session_ids_array,
    match_threshold,
    match_count
  );
END;
$$;
