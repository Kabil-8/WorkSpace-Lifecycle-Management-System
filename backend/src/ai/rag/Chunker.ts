import { LoadedDocument } from './DocumentLoader.js'

export interface DocumentChunk {
  chunkId: string
  docId: string
  docTitle: string
  text: string
  ownerId: string
  chunkIndex: number
}

export class Chunker {
  static chunkDocument(doc: LoadedDocument, chunkSize: number = 800, overlap: number = 150): DocumentChunk[] {
    const text = doc.content
    if (!text) return []

    const chunks: DocumentChunk[] = []
    let start = 0
    let index = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      const chunkText = text.slice(start, end).trim()

      if (chunkText) {
        chunks.push({
          chunkId: `${doc.id}-chunk-${index}`,
          docId: doc.id,
          docTitle: doc.title,
          text: chunkText,
          ownerId: doc.ownerId,
          chunkIndex: index,
        })
        index++
      }

      start += chunkSize - overlap
    }

    return chunks
  }
}
