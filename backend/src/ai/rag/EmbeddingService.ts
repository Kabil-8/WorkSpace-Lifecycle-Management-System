import { logger } from '../../config/logger.js'

export class EmbeddingService {
  private static cache = new Map<string, number[]>()
  private static readonly MAX_CACHE_SIZE = 500

  /**
   * Generates a 768-dimensional dense vector embedding for input text.
   * Priority:
   * 1. In-Memory LRU Cache
   * 2. Gemini text-embedding-004 API (if key available)
   * 3. Deterministic 768-dim vector fallback
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = (text || '').trim().slice(0, 2048)
    if (!cleanText) return new Array(768).fill(0)

    // Check cache
    if (this.cache.has(cleanText)) {
      return this.cache.get(cleanText)!
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY
      if (apiKey && apiKey.trim().length > 15) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: cleanText }] },
            }),
            signal: AbortSignal.timeout(5000)
          }
        )

        if (res.ok) {
          const data: any = await res.json()
          if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
            const vector = data.embedding.values as number[]
            this.setCache(cleanText, vector)
            return vector
          }
        }
      }
    } catch (err: any) {
      logger.debug({ err: err.message }, '[EmbeddingService] Embedding API unavailable, using vector fallback')
    }

    // Deterministic fallback
    const fallbackVec = this.generateDeterministicVector(cleanText)
    this.setCache(cleanText, fallbackVec)
    return fallbackVec
  }

  /**
   * Lightweight TF-IDF term frequency vector for in-memory keyword matching.
   */
  static generateTfIdfVector(text: string): Record<string, number> {
    const terms = (text || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    const freq: Record<string, number> = {}
    for (const term of terms) {
      if (term.length > 2) freq[term] = (freq[term] || 0) + 1
    }
    const total = terms.length || 1
    for (const key in freq) freq[key] = freq[key] / total
    return freq
  }

  /**
   * Lexical Cosine Similarity calculation between two term frequency dictionaries.
   */
  static computeSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
    let dot = 0
    let magA = 0
    let magB = 0
    for (const key in vecA) {
      magA += vecA[key] * vecA[key]
      if (vecB[key]) dot += vecA[key] * vecB[key]
    }
    for (const key in vecB) magB += vecB[key] * vecB[key]
    if (magA === 0 || magB === 0) return 0
    return dot / (Math.sqrt(magA) * Math.sqrt(magB))
  }

  /**
   * Cosine Similarity calculation between two dense vectors.
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0
    const dim = Math.min(vecA.length, vecB.length)
    let dot = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < dim; i++) {
      dot += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Deterministic 768-dimensional normalized word-token frequency projection vector.
   * Ensures semantic word matches produce high cosine similarity even when offline.
   */
  static generateDeterministicVector(text: string): number[] {
    const vector = new Array(768).fill(0)
    const clean = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    const words = clean.split(/\s+/).filter(w => w.length > 2)
    if (words.length === 0) return vector

    for (const word of words) {
      let h = 0
      for (let i = 0; i < word.length; i++) {
        h = (Math.imul(31, h) + word.charCodeAt(i)) | 0
      }
      const idx = Math.abs(h) % 768
      vector[idx] += 1.0
    }

    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1
    return vector.map(v => v / mag)
  }

  private static setCache(key: string, vector: number[]) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
    this.cache.set(key, vector)
  }
}
