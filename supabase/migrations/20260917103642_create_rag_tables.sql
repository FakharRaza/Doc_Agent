/*
# Create RAG Document Tables

1. New Tables
- `documents`
  - `id` (uuid, primary key)
  - `filename` (text, name of uploaded file)
  - `content` (text, full extracted text)
  - `chunk_count` (int, number of chunks created)
  - `file_size` (bigint, size in bytes)
  - `mime_type` (text, file MIME type)
  - `created_at` (timestamp)
- `document_chunks`
  - `id` (uuid, primary key)
  - `document_id` (uuid, FK to documents)
  - `chunk_index` (int, ordering index)
  - `content` (text, chunk text)
  - `tsv` (tsvector, full-text search vector for content)
  - `created_at` (timestamp)

2. Indexes
- GIN index on `document_chunks.tsv` for fast full-text search
- B-tree index on `document_chunks.document_id` for join performance
- B-tree index on `documents.created_at` for listing

3. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD (single-tenant, no auth app — data is intentionally shared).
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  content text NOT NULL,
  chunk_count integer NOT NULL DEFAULT 0,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'text/plain',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chunks" ON document_chunks;
CREATE POLICY "anon_select_chunks" ON document_chunks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chunks" ON document_chunks;
CREATE POLICY "anon_insert_chunks" ON document_chunks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chunks" ON document_chunks;
CREATE POLICY "anon_update_chunks" ON document_chunks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chunks" ON document_chunks;
CREATE POLICY "anon_delete_chunks" ON document_chunks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv ON document_chunks USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at DESC);
