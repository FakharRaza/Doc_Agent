import { useState, useRef } from 'react'
import type { Document } from '../types'
import { formatFileSize } from '../lib/rag'

interface SidebarProps {
  documents: Document[]
  loading: boolean
  onUpload: (file: File) => Promise<void>
  onDelete: (id: string) => Promise<void>
  open: boolean
  onClose: () => void
}

export function Sidebar({
  documents,
  loading,
  onUpload,
  onDelete,
  open,
  onClose,
}: SidebarProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setUploadStatus('Processing...')
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
      setUploadStatus('')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
        <div>
          <div className="sidebar-title">DocQuery AI</div>
          <div className="sidebar-subtitle">RAG Document Chat</div>
        </div>
      </div>

      <div
        className={`upload-area ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInput.current?.click()}
      >
        <input
          ref={fileInput}
          type="file"
          accept=".txt,.md,.csv,.json,.xml,.log,.rtf,.html,.htm,text/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <div className="upload-icon">
          {uploading ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        <div className="upload-text">
          {uploading ? uploadStatus : 'Drop a file or click to upload'}
        </div>
        <div className="upload-hint">
          {uploading ? '' : 'TXT, MD, CSV, JSON, XML, HTML — up to 5MB'}
        </div>
        {uploading && <div className="upload-progress">{uploadStatus}</div>}
      </div>

      <div className="docs-list">
        <div className="docs-list-header">
          <span className="docs-list-label">Documents</span>
          <span className="docs-count">{documents.length}</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="upload-progress">Loading...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="empty-state-text">No documents yet. Upload one to get started.</div>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div className="doc-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.filename}</div>
                <div className="doc-meta">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>·</span>
                  <span>{doc.chunk_count} chunks</span>
                </div>
              </div>
              <button
                className="doc-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(doc.id)
                }}
                title="Delete document"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
