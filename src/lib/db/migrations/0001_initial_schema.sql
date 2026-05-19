-- ============================================================
-- Migration: 0001_initial_schema.sql
-- Run this in your Supabase SQL editor (once, in order).
-- ============================================================

-- 1. Enable the pgvector extension (already available on Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Resources table
CREATE TABLE IF NOT EXISTS resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  source_type  TEXT NOT NULL CHECK (source_type IN ('url','document','text','video')),
  source_url   TEXT,
  drive_file_id TEXT,
  raw_text     TEXT NOT NULL,
  summary      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tags table
CREATE TABLE IF NOT EXISTS tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- 4. Resource <-> Tag join table
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- 5. Embeddings table with a pgvector column (512 dims = voyage-3-lite)
CREATE TABLE IF NOT EXISTS embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL UNIQUE REFERENCES resources(id) ON DELETE CASCADE,
  model       TEXT NOT NULL DEFAULT 'voyage-3-lite',
  vector      vector(512) NOT NULL
);

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx
  ON embeddings USING hnsw (vector vector_cosine_ops);

-- 6. Relationships table (concept graph)
CREATE TABLE IF NOT EXISTS relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  concept     TEXT NOT NULL,
  relation    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS relationships_resource_idx ON relationships(resource_id);

-- 7. Auto-update updated_at on resources
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
