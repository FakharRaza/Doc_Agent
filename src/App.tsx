import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { ErrorBanner } from './components/ErrorBanner'
import type { Document } from './types'
import { getAllDocuments, uploadDocument, deleteDocument } from './lib/api'

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDocuments = async () => {
    try {
      const docs = await getAllDocuments()
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleUpload = async (file: File) => {
    try {
      await uploadDocument(file)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="app">
      <div
        className={`overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        documents={documents}
        loading={loading}
        onUpload={handleUpload}
        onDelete={handleDelete}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatArea
        documents={documents}
        onMenuClick={() => setSidebarOpen(true)}
        onError={setError}
      />
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
    </div>
  )
}
