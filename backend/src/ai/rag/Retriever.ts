import { VectorStore, IndexedChunk } from './VectorStore.js'
import { EmbeddingService } from './EmbeddingService.js'

export class Retriever {
  /**
   * Retrieves relevant document chunks matching user query, enforcing strict document ownership.
   */
  static retrieveRelevantChunks(query: string, authenticatedUserId: string, topK: number = 3): IndexedChunk[] {
    const store = VectorStore.getStore()
    const queryVector = EmbeddingService.generateEmbedding(query)

    const scored = store
      .filter(chunk => chunk.ownerId === authenticatedUserId || chunk.ownerId === 'public' || chunk.ownerId === 'system')
      .map(chunk => ({
        chunk,
        score: EmbeddingService.computeSimilarity(queryVector, chunk.vector),
      }))
      .filter(item => item.score > 0.05)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, topK).map(item => item.chunk)
  }
}
