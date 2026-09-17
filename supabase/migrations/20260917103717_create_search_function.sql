/*
# Create search_document_chunks function

1. New Functions
- `search_document_chunks(search_query text, result_limit int)`
  - Performs full-text search on document_chunks using ts_rank
  - Joins with documents to return filename and metadata
  - Returns ranked results with snippet content

2. Security
- SECURITY INVOKER (default) — respects RLS policies
- Read-only function
*/

CREATE OR REPLACE FUNCTION search_document_chunks(
  search_query text,
  result_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  filename text,
  doc_content text,
  chunk_count int,
  file_size bigint,
  mime_type text,
  created_at timestamptz,
  rank real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    d.filename,
    d.content AS doc_content,
    d.chunk_count,
    d.file_size,
    d.mime_type,
    d.created_at,
    ts_rank(dc.tsv, plainto_tsquery('english', search_query)) AS rank
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE dc.tsv @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
$$;
