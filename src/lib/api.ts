import { supabase } from './supabase'
import { chunkText, extractTextFromFile } from './rag'
import type { Document, DocumentChunk } from '../types'

export async function uploadDocument(
  file: File,
  onProgress?: (status: string) => void
): Promise<Document> {
  onProgress?.('Reading file...')
  const text = await extractTextFromFile(file)

  onProgress?.('Chunking text...')
  const chunks = chunkText(text)

  onProgress?.('Saving document...')
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      filename: file.name,
      content: text,
      chunk_count: chunks.length,
      file_size: file.size,
      mime_type: file.type || 'text/plain',
    })
    .select()
    .single()

  if (docError) throw new Error(`Failed to save document: ${docError.message}`)
  if (!doc) throw new Error('No document returned')

  onProgress?.(`Storing ${chunks.length} chunks...`)
  const chunkRows = chunks.map((content, i) => ({
    document_id: (doc as Document).id,
    chunk_index: i,
    content,
  }))

  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunkRows)

  if (chunkError) throw new Error(`Failed to store chunks: ${chunkError.message}`)

  return doc as Document
}

export async function searchChunks(
  query: string,
  limit: number = 5
): Promise<{ chunk: DocumentChunk; document: Document; rank: number }[]> {
  const { data, error } = await supabase.rpc('search_document_chunks', {
    search_query: query,
    result_limit: limit,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)
  if (!data) return []

  return data.map((row: {
    id: string
    document_id: string
    chunk_index: number
    content: string
    filename: string
    doc_content: string
    chunk_count: number
    file_size: number
    mime_type: string
    created_at: string
    rank: number
  }) => ({
    chunk: {
      id: row.id,
      document_id: row.document_id,
      chunk_index: row.chunk_index,
      content: row.content,
    },
    document: {
      id: row.document_id,
      filename: row.filename,
      content: row.doc_content,
      chunk_count: row.chunk_count,
      file_size: row.file_size,
      mime_type: row.mime_type,
      created_at: row.created_at,
    },
    rank: row.rank,
  }))
}

export async function getAllDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load documents: ${error.message}`)
  return (data || []) as Document[]
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete: ${error.message}`)
}
