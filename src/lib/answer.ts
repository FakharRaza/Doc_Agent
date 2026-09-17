interface SearchResult {
  chunk: {
    id: string
    document_id: string
    chunk_index: number
    content: string
  }
  document: {
    id: string
    filename: string
    content: string
    chunk_count: number
    file_size: number
    mime_type: string
    created_at: string
  }
  rank: number
}

export function generateAnswer(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return "I couldn't find any relevant information in the uploaded documents for your query."
  }

  const queryLower = query.toLowerCase().trim()

  const isSummaryQuestion =
    queryLower.includes('summar') ||
    queryLower.includes('overview') ||
    queryLower.includes('key points') ||
    queryLower.includes('main points') ||
    queryLower.includes('tldr') ||
    queryLower.includes('gist')

  const isListQuestion =
    queryLower.includes('list') ||
    queryLower.includes('what are') ||
    queryLower.includes('topics') ||
    queryLower.includes('important')

  const isExplainQuestion =
    queryLower.includes('explain') ||
    queryLower.includes('describe') ||
    queryLower.includes('how') ||
    queryLower.includes('what is') ||
    queryLower.includes('what does') ||
    queryLower.includes('tell me about')

  const topChunks = results.slice(0, 3)
  const allRelevantText = results.map((r) => r.chunk.content).join('\n\n')

  if (isSummaryQuestion) {
    const sentences = extractSentences(allRelevantText)
    const keySentences = sentences.slice(0, 5)
    return formatSummary(keySentences, results)
  }

  if (isListQuestion) {
    const points = extractKeyPoints(allRelevantText)
    return formatList(points, results)
  }

  if (isExplainQuestion) {
    return formatExplanation(query, topChunks, results)
  }

  return formatDirectAnswer(query, topChunks, results)
}

function extractSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 500)
}

function extractKeyPoints(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 15 && l.length < 300)

  if (lines.length > 8) {
    return lines.slice(0, 8)
  }

  return extractSentences(text).slice(0, 8)
}

function formatSummary(sentences: string[], results: SearchResult[]): string {
  if (sentences.length === 0) {
    return `Based on the document "${results[0].document.filename}", here's what I found:\n\n${results[0].chunk.content.slice(0, 500)}...`
  }

  let output = `Based on the uploaded document${results.length > 1 ? 's' : ''}, here are the key points:\n\n`
  sentences.forEach((s, i) => {
    output += `${i + 1}. ${s}\n`
  })
  return output
}

function formatList(points: string[], results: SearchResult[]): string {
  if (points.length === 0) {
    return `Here's what I found in "${results[0].document.filename}":\n\n${results[0].chunk.content.slice(0, 500)}`
  }

  let output = `Here are the key points from the document${results.length > 1 ? 's' : ''}:\n\n`
  points.forEach((p, i) => {
    output += `${i + 1}. ${p}\n`
  })
  return output
}

function formatExplanation(
  query: string,
  topChunks: SearchResult[],
  _results: SearchResult[]
): string {
  const combined = topChunks.map((r) => r.chunk.content).join('\n\n')
  const sentences = extractSentences(combined)

  if (sentences.length === 0) {
    return `Based on "${topChunks[0].document.filename}":\n\n${topChunks[0].chunk.content.slice(0, 600)}`
  }

  let output = `Based on the document "${topChunks[0].document.filename}":\n\n`
  output += sentences.slice(0, 4).join(' ')
  if (sentences.length > 4) output += '...'
  return output
}

function formatDirectAnswer(
  query: string,
  topChunks: SearchResult[],
  _results: SearchResult[]
): string {
  const combined = topChunks.map((r) => r.chunk.content).join('\n\n')
  const sentences = extractSentences(combined)

  if (sentences.length === 0) {
    return `Here's what I found in "${topChunks[0].document.filename}":\n\n${topChunks[0].chunk.content.slice(0, 600)}`
  }

  let output = `Based on "${topChunks[0].document.filename}":\n\n`
  output += sentences.slice(0, 3).join(' ')
  if (sentences.length > 3) output += '...'
  return output
}
