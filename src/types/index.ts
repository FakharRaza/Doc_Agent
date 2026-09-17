export interface Document {
  id: string
  filename: string
  content: string
  chunk_count: number
  file_size: number
  mime_type: string
  created_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { filename: string; snippet: string }[]
  timestamp: number
}
