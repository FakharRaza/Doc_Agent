import { useState, useRef, useEffect } from 'react'
import type { Document, ChatMessage } from '../types'
import { searchChunks } from '../lib/api'
import { generateAnswer } from '../lib/answer'

interface ChatAreaProps {
  documents: Document[]
  onMenuClick: () => void
  onError: (msg: string) => void
}

export function ChatArea({ documents, onMenuClick, onError }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = async (text?: string) => {
    const query = text || input.trim()
    if (!query || thinking) return

    if (documents.length === 0) {
      onError('Please upload a document first.')
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    try {
      const results = await searchChunks(query, 5)

      if (results.length === 0) {
        const noMatchMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "I couldn't find any relevant information in the uploaded documents for your query. Try rephrasing your question or uploading additional documents that contain the information you're looking for.",
          sources: [],
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, noMatchMsg])
        return
      }

      const answer = generateAnswer(query, results)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        sources: results.map((r) => ({
          filename: r.document.filename,
          snippet: r.chunk.content.slice(0, 200) + (r.chunk.content.length > 200 ? '...' : ''),
        })),
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setThinking(false)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  const suggestions = [
    { icon: 'summary', text: 'Summarize the key points', hint: 'Get an overview' },
    { icon: 'search', text: 'What are the main topics covered?', hint: 'Find themes' },
    { icon: 'list', text: 'List all important details', hint: 'Extract facts' },
    { icon: 'help', text: 'Explain the core concepts', hint: 'Understand ideas' },
  ]

  return (
    <main className="main">
      <div className="chat-header">
        <div className="chat-header-info">
          <button className="menu-btn" onClick={onMenuClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <div className="chat-header-title">Chat with your documents</div>
            <div className="chat-header-status">
              <span className="status-dot" />
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} loaded
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={handleClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear chat
          </button>
        )}
      </div>

      <div className="messages">
        {messages.length === 0 && !thinking ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="welcome-title">Ask anything about your documents</h1>
            <p className="welcome-desc">
              Upload documents on the left, then ask questions. I'll search through your documents
              and provide answers with source references.
            </p>
            <div className="welcome-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-card"
                  onClick={() => handleSend(s.text)}
                  disabled={documents.length === 0}
                  style={documents.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <div className="suggestion-icon">
                    {s.icon === 'summary' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="14" y2="18" />
                      </svg>
                    )}
                    {s.icon === 'search' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    )}
                    {s.icon === 'list' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    )}
                    {s.icon === 'help' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="suggestion-text">{s.text}</div>
                    <div className="suggestion-hint">{s.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  )}
                </div>
                <div className="message-body">
                  <div className="message-role">
                    {msg.role === 'user' ? 'You' : 'DocQuery AI'}
                  </div>
                  <div className="message-content">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-panel">
                      <div className="sources-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18h6" />
                          <path d="M10 22h4" />
                          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                        </svg>
                        Sources ({msg.sources.length})
                      </div>
                      {msg.sources.map((src, i) => (
                        <div key={i} className="source-item">
                          <div className="source-filename">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {src.filename}
                          </div>
                          <div className="source-snippet">"{src.snippet}"</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="message assistant">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="message-body">
                  <div className="message-role">DocQuery AI</div>
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEnd} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask a question about your documents..."
              rows={1}
              disabled={thinking}
            />
          </div>
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </main>
  )
}
