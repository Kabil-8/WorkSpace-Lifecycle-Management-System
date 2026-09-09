import { DocumentChunk } from './Chunker.js'
import { EmbeddingService } from './EmbeddingService.js'

export interface IndexedChunk extends DocumentChunk {
  vector: Record<string, number>
}

export class VectorStore {
  private static store: IndexedChunk[] = []

  static addChunks(chunks: DocumentChunk[]) {
    for (const chunk of chunks) {
      const vector = EmbeddingService.generateEmbedding(chunk.text)
      this.store.push({ ...chunk, vector })
    }
  }

  static getStore(): IndexedChunk[] {
    return this.store
  }

  static clear() {
    this.store = []
  }
}
