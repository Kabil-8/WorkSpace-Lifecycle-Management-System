import { EdenDocument } from '../models/EdenDocument.js'
import { logger } from '../config/logger.js'

export class RAGEngine {
  /**
   * Generates a 768-dimensional vector embedding for text via Gemini text-embedding-004 API.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY
      if (!key || key.trim().length < 15) {
        return RAGEngine.generateDeterministicVector(text)
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: text.slice(0, 2048) }] },
          }),
        },
      )

      if (res.ok) {
        const data: any = await res.json()
        if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
          return data.embedding.values
        }
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, '[RAGEngine] Embedding API call failed, using vector fallback')
    }

    return RAGEngine.generateDeterministicVector(text)
  }

  /**
   * Cosine Similarity calculation between two dense vectors
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
   * Hybrid Vector Retrieval Engine:
   * 1. Attempts MongoDB Atlas $vectorSearch pipeline aggregation query if available
   * 2. Fallbacks to in-memory Cosine Similarity with metadata filtering & keyword term boost
   */
  static async retrieveChunks(query: string, department?: string): Promise<string[]> {
    const q = (query || '').toLowerCase().trim()
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|yo|sup)\b/i.test(q)
    const isCoding = /(code|java|python|javascript|typescript|cpp|c\+\+|html|css|sql|function|script|algorithm|sort)/i.test(q)
    const isNavigation = /(open|go to|take me to)\b/i.test(q)

    // Skip RAG for simple greetings, direct coding, or navigation requests to prevent prompt pollution
    if (isGreeting || isCoding || isNavigation) {
      return []
    }

    try {
      const queryVector = await RAGEngine.generateEmbedding(query)

      // Attempt Atlas $vectorSearch aggregation query
      try {
        const atlasResults = await EdenDocument.aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: 20,
              limit: 5,
            },
          },
        ])

        if (atlasResults && atlasResults.length > 0) {
          logger.info({ count: atlasResults.length }, '[Vector RAGEngine] Retrieved via MongoDB Atlas Vector Search')
          return atlasResults.map(doc => `[Doc: ${doc.title} (${doc.category})]\n${doc.content.slice(0, 1000)}`)
        }
      } catch {
        // Fallback to in-memory Cosine Similarity matching for non-Atlas MongoDB setups
      }

      const docs = await EdenDocument.find().lean()
      if (!docs || docs.length === 0) return []

      const scoredChunks: { text: string; score: number; docTitle: string; category: string }[] = []

      for (const doc of docs) {
        if (department && doc.department && doc.department !== 'All Departments' && doc.department.toLowerCase() !== department.toLowerCase()) {
          continue
        }

        let docSimilarity = 0
        if (doc.embedding && doc.embedding.length > 0) {
          docSimilarity = RAGEngine.cosineSimilarity(queryVector, doc.embedding)
        }

        if (doc.chunks && doc.chunks.length > 0) {
          for (const chunk of doc.chunks) {
            let chunkSimilarity = docSimilarity
            if (chunk.embedding && chunk.embedding.length > 0) {
              chunkSimilarity = RAGEngine.cosineSimilarity(queryVector, chunk.embedding)
            }

            const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            const textLower = chunk.text.toLowerCase()
            const matchCount = queryTerms.filter(t => textLower.includes(t)).length
            const keywordBoost = queryTerms.length > 0 ? (matchCount / queryTerms.length) * 0.2 : 0

            const finalScore = chunkSimilarity + keywordBoost

            if (finalScore > 0.15) {
              scoredChunks.push({
                text: chunk.text,
                score: finalScore,
                docTitle: doc.title,
                category: doc.category,
              })
            }
          }
        } else {
          scoredChunks.push({
            text: doc.content.slice(0, 1000),
            score: docSimilarity || 0.3,
            docTitle: doc.title,
            category: doc.category,
          })
        }
      }

      scoredChunks.sort((a, b) => b.score - a.score)
      const topChunks = scoredChunks.slice(0, 5)

      logger.info({ query, totalMatched: topChunks.length }, '[Vector RAGEngine] In-Memory Cosine Vector Search Complete')

      return topChunks.map(c => `[Doc: ${c.docTitle} (${c.category}) | Relevance: ${(c.score * 100).toFixed(1)}%]\n${c.text}`)
    } catch (err: any) {
      logger.error({ err: err.message }, '[Vector RAGEngine] Retrieval failed')
      return []
    }
  }

  /**
   * Chunk document and compute dense vector embeddings
   */
  static async chunkAndEmbedDocument(title: string, category: any, department: string, content: string, uploadedBy?: any) {
    const chunkStrings = RAGEngine.splitTextIntoChunks(content, 500, 100)
    const chunks: { text: string; keywords: string[]; embedding?: number[] }[] = []

    for (const str of chunkStrings) {
      const keywords = str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4).slice(0, 8)
      const embedding = await RAGEngine.generateEmbedding(str)
      chunks.push({ text: str, keywords, embedding })
    }

    const docEmbedding = await RAGEngine.generateEmbedding(`${title} ${content.slice(0, 1000)}`)

    const newDoc = await EdenDocument.create({
      title,
      category,
      department,
      content,
      embedding: docEmbedding,
      chunks,
      uploadedBy,
    })

    return newDoc
  }

  private static splitTextIntoChunks(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
    const words = text.split(/\s+/)
    if (words.length <= chunkSize) return [text]

    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      chunks.push(chunk)
      i += chunkSize - overlap
    }
    return chunks
  }

  private static generateDeterministicVector(text: string): number[] {
    const vector = new Array(768).fill(0)
    const cleanText = text.toLowerCase()
    for (let i = 0; i < cleanText.length; i++) {
      const code = cleanText.charCodeAt(i)
      const idx = (code * 31 + i) % 768
      vector[idx] += 0.01
    }
    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1
    return vector.map(v => v / mag)
  }

  static async seedDefaultKnowledge() {
    try {
      const count = await EdenDocument.countDocuments()
      if (count > 0) return

      await RAGEngine.chunkAndEmbedDocument(
        'EduSphere Academic & Attendance Regulations 2026',
        'university_rules',
        'All Departments',
        'Attendance Rule 75%: Students must maintain a minimum of 75% attendance in each subject to be eligible for end-semester examinations. Medical leave requests must be submitted within 3 days of absence. A maximum of 10% condonation is allowed upon HoD approval.',
      )

      await RAGEngine.chunkAndEmbedDocument(
        'Computer Science & Engineering Syllabus 2026',
        'syllabus',
        'Computer Science & Engineering',
        'CSE Core Modules: Data Structures & Algorithms (Java/C), Database Management Systems (MongoDB/PostgreSQL), Systems Programming (C/POSIX), Web Engineering (React/Node.js), Machine Learning & AI.',
      )

      await RAGEngine.chunkAndEmbedDocument(
        'Campus Placement & Internship Policy 2026',
        'placement_policy',
        'Career & Placement',
        'Placement Eligibility: Minimum 6.5 CGPA with zero active backlogs. Students can hold up to 1 Dream Offer (> ₹10 LPA). ATS resume verification is mandatory prior to campus interviews.',
      )

      logger.info('[Vector RAGEngine] Institutional knowledge base seeded with vector embeddings')
    } catch (err: any) {
      logger.warn({ err: err.message }, '[Vector RAGEngine] Knowledge base seeding skipped')
    }
  }
}
