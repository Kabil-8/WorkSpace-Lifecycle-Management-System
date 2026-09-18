import path from 'path'
import { fileURLToPath } from 'url'
import { EdenDocument, IRichChunk } from '../models/EdenDocument.js'
import { EmbeddingService } from './rag/EmbeddingService.js'
import { RetrievalService, StudentContext } from './rag/RetrievalService.js'
import { RerankingService, RerankedChunk } from './rag/RerankingService.js'
import { ContextBuilder, GroundedContextPayload } from './rag/ContextBuilder.js'
import { DocumentIngestionService } from './rag/DocumentIngestionService.js'
import { ChunkingService } from './rag/ChunkingService.js'
import { logger } from '../config/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class RAGEngine {
  /**
   * Generates a 768-dimensional dense vector embedding for text.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    return EmbeddingService.generateEmbedding(text)
  }

  /**
   * Cosine Similarity calculation between two dense vectors.
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    return EmbeddingService.cosineSimilarity(vecA, vecB)
  }

  /**
   * Backward-compatible chunk retrieval method returning formatted string excerpts.
   */
  static async retrieveChunks(query: string, department?: string): Promise<string[]> {
    const q = (query || '').toLowerCase().trim()
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|yo|sup)\b/i.test(q)
    const isCoding = /(write code|python function|implement in java|c\+\+ script|def solution|public class)/i.test(q)
    const isNavigation = /(open|go to|take me to)\b/i.test(q)

    if (isGreeting || isCoding || isNavigation) {
      return []
    }

    try {
      const studentContext: StudentContext = { department }
      const candidates = await RetrievalService.retrieveCandidateChunks(query, studentContext, 8)
      const reranked = RerankingService.rerank(query, candidates, studentContext, 4)

      return reranked.map(
        c => `[Doc: ${c.docTitle || c.documentTitle} | Section: ${c.sectionTitle} | Relevance: ${(c.finalScore * 100).toFixed(1)}%]\n${c.text}`
      )
    } catch (err: any) {
      logger.error({ err: err.message }, '[RAGEngine] Retrieval failed')
      return []
    }
  }

  /**
   * High-level context-aware retrieval returning structured prompt context and citations.
   */
  static async retrieveGroundedContext(
    query: string,
    studentContext?: StudentContext
  ): Promise<GroundedContextPayload> {
    try {
      const candidates = await RetrievalService.retrieveCandidateChunks(query, studentContext, 8)
      const reranked = RerankingService.rerank(query, candidates, studentContext, 4)
      return ContextBuilder.buildGroundedContext(reranked)
    } catch (err: any) {
      logger.error({ err: err.message }, '[RAGEngine] Grounded context retrieval error')
      return {
        contextText: '',
        sourceCitations: [],
        hasInstitutionalEvidence: false,
        highestConfidence: 0.0
      }
    }
  }

  /**
   * Chunks document and computes dense vector embeddings.
   */
  static async chunkAndEmbedDocument(
    title: string,
    category: any,
    department: string,
    content: string,
    uploadedBy?: any,
    semester?: number
  ) {
    const ingestedDoc = {
      documentId: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category: String(category),
      department,
      semester,
      content,
      fileSize: Buffer.byteLength(content, 'utf-8')
    }

    const rawChunks = ChunkingService.chunkDocument(ingestedDoc, 400, 60)
    const richChunks: IRichChunk[] = []

    for (const chunk of rawChunks) {
      const embedding = await EmbeddingService.generateEmbedding(chunk.text)
      richChunks.push({
        ...chunk,
        embedding
      })
    }

    const docEmbedding = await EmbeddingService.generateEmbedding(`${title} ${content.slice(0, 1000)}`)

    const newDoc = await EdenDocument.create({
      documentId: ingestedDoc.documentId,
      title,
      category: String(category),
      department,
      semester,
      content,
      embedding: docEmbedding,
      chunks: richChunks,
      uploadedBy,
    })

    return newDoc
  }

  /**
   * Seeds institutional knowledge base from rag_documents/ directory.
   */
  static async seedDefaultKnowledge() {
    try {
      const count = await EdenDocument.countDocuments()
      if (count >= 5) {
        logger.info({ count }, '[RAGEngine] Institutional knowledge base already populated')
        return
      }

      // Root of repository containing rag_documents/
      const workspaceRoot = path.resolve(__dirname, '../../..')
      const docsDir = path.join(workspaceRoot, 'rag_documents')

      const ingestedDocs = await DocumentIngestionService.ingestDirectory(docsDir)
      if (ingestedDocs.length === 0) {
        logger.warn('[RAGEngine] No files found in rag_documents, seeding baseline rules')
        await RAGEngine.chunkAndEmbedDocument(
          'EduSphere Academic & Attendance Regulations 2026',
          'attendance_policy',
          'All Departments',
          'Section 1. Mandatory Attendance: 75% minimum attendance required. Section 2. Medical Condonation: Shortage between 65% and 75% may be condoned on medical grounds with HoD approval within 3 working days.',
          null
        )
        return
      }

      for (const doc of ingestedDocs) {
        // Avoid duplicate by title
        const existing = await EdenDocument.findOne({ title: doc.title })
        if (existing) continue

        const rawChunks = ChunkingService.chunkDocument(doc, 400, 60)
        const richChunks: IRichChunk[] = []

        for (const chunk of rawChunks) {
          const emb = await EmbeddingService.generateEmbedding(chunk.text)
          richChunks.push({ ...chunk, embedding: emb })
        }

        const docEmb = await EmbeddingService.generateEmbedding(`${doc.title} ${doc.content.slice(0, 1000)}`)

        await EdenDocument.create({
          documentId: doc.documentId,
          title: doc.title,
          category: doc.category,
          department: doc.department,
          semester: doc.semester,
          content: doc.content,
          embedding: docEmb,
          chunks: richChunks,
          fileSize: doc.fileSize,
          metadata: doc.metadata
        })
        logger.info({ title: doc.title, chunks: richChunks.length }, '[RAGEngine] Indexed institutional document')
      }

      logger.info('[RAGEngine] Institutional knowledge base successfully seeded and indexed')
    } catch (err: any) {
      logger.warn({ err: err.message }, '[RAGEngine] Knowledge base seeding skipped')
    }
  }
}
