const CHUNK_SIZE = 1200
const CHUNK_OVERLAP = 200

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (cleaned.length <= CHUNK_SIZE) return [cleaned]

  const chunks: string[] = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + CHUNK_SIZE
    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf('.', end)
      const lastNewline = cleaned.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > start + CHUNK_SIZE * 0.5) end = breakPoint + 1
    }
    chunks.push(cleaned.slice(start, end).trim())
    start = end - CHUNK_OVERLAP
    if (start < 0) start = 0
    if (start >= cleaned.length) break
  }

  return chunks.filter((c) => c.length > 0)
}

export function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result) {
        reject(new Error('Empty file'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))

    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/xml' ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.xml') ||
      file.name.endsWith('.log') ||
      file.name.endsWith('.rtf') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.htm')

    if (isText) {
      reader.readAsText(file)
    } else {
      reader.readAsText(file)
    }
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
