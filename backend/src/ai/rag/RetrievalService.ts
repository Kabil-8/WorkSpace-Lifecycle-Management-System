import { EdenDocument, IRichChunk } from '../../models/EdenDocument.js'
import { EmbeddingService } from './EmbeddingService.js'
import { logger } from '../../config/logger.js'

export interface StudentContext {
  userId?: string
  name?: string
  department?: string
  semester?: number
  cgpa?: number
}

export interface ScoredChunk extends IRichChunk {
  similarity: number
  documentTitle: string
}

export class RetrievalService {
  /**
   * Two-stage hybrid vector retrieval:
   * 1. Vector Search: Dense cosine similarity or MongoDB Atlas $vectorSearch
   * 2. Context-Aware Metadata Filtering: Applies student's department, semester, and domain constraints
   */
  static async retrieveCandidateChunks(
    query: string,
    studentContext?: StudentContext,
    topK: number = 8
  ): Promise<ScoredChunk[]> {
    const cleanQuery = (query || '').trim()
    if (!cleanQuery) return []

    // 1. Compute query embedding vector
    const queryVector = await EmbeddingService.generateEmbedding(cleanQuery)

    // 2. Attempt MongoDB Atlas $vectorSearch if available
    try {
      const atlasResults = await EdenDocument.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector,
            numCandidates: 25,
            limit: topK,
          },
        },
      ])

      if (atlasResults && atlasResults.length > 0) {
        logger.info({ count: atlasResults.length }, '[RetrievalService] Retrieved via MongoDB Atlas Vector Search')
        return atlasResults.map((doc: any) => ({
          chunkId: `${doc._id}-0`,
          documentId: doc.documentId || String(doc._id),
          docTitle: doc.title,
          category: doc.category,
          department: doc.department,
          semester: doc.semester,
          sectionTitle: 'Main Overview',
          sourcePage: 1,
          chunkIndex: 0,
          text: doc.content.slice(0, 800),
          keywords: [],
          similarity: 0.85,
          documentTitle: doc.title
        }))
      }
    } catch {
      // Atlas $vectorSearch index not configured or in local mode — proceed to structured in-memory cosine search
    }

    // 3. In-memory / MongoDB collection retrieval with context-aware metadata filtering
    const docs = await EdenDocument.find().lean()
    if (!docs || docs.length === 0) {
      return []
    }

    const candidateChunks: ScoredChunk[] = []
    const studentDept = studentContext?.department?.toLowerCase() || ''
    const studentSem = studentContext?.semester

    for (const doc of docs) {
      // Check department compatibility
      const docDept = (doc.department || 'All Departments').toLowerCase()
      const isDeptCompatible =
        docDept === 'all departments' ||
        !studentDept ||
        studentDept === 'all departments' ||
        docDept.includes(studentDept) ||
        studentDept.includes(docDept)

      if (!isDeptCompatible) {
        continue
      }

      // Check chunks
      if (doc.chunks && doc.chunks.length > 0) {
        for (const chunk of doc.chunks) {
          // Check chunk-level department and semester if specified
          if (chunk.department && chunk.department !== 'All Departments') {
            const cDept = chunk.department.toLowerCase()
            if (studentDept && !cDept.includes(studentDept) && !studentDept.includes(cDept)) {
              continue
            }
          }

          let similarity = 0
          if (chunk.embedding && chunk.embedding.length > 0) {
            similarity = EmbeddingService.cosineSimilarity(queryVector, chunk.embedding)
          } else if (doc.embedding && doc.embedding.length > 0) {
            similarity = EmbeddingService.cosineSimilarity(queryVector, doc.embedding)
          } else {
            // Lexical fallback
            similarity = 0.20
          }

          // Semester match boost
          if (studentSem && chunk.semester && chunk.semester === studentSem) {
            similarity = Math.min(1.0, similarity + 0.10)
          }

          candidateChunks.push({
            ...chunk,
            similarity: roundTo(similarity, 4),
            documentTitle: chunk.docTitle || doc.title
          })
        }
      } else {
        // Full doc fallback
        let similarity = 0
        if (doc.embedding && doc.embedding.length > 0) {
          similarity = EmbeddingService.cosineSimilarity(queryVector, doc.embedding)
        }
        candidateChunks.push({
          chunkId: `${doc._id}-full`,
          documentId: doc.documentId || String(doc._id),
          docTitle: doc.title,
          category: doc.category,
          department: doc.department,
          semester: doc.semester,
          sectionTitle: 'General Excerpt',
          sourcePage: 1,
          chunkIndex: 0,
          text: doc.content.slice(0, 800),
          keywords: [],
          similarity: roundTo(similarity, 4),
          documentTitle: doc.title
        })
      }
    }

    // Sort by vector similarity descending
    candidateChunks.sort((a, b) => b.similarity - a.similarity)
    return candidateChunks.slice(0, topK * 2)
  }
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}
