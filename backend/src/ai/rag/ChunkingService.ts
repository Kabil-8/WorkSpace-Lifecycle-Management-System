import { IngestedDocument } from './DocumentIngestionService.js'
import { IRichChunk } from '../../models/EdenDocument.js'

export class ChunkingService {
  /**
   * Semantically chunks an IngestedDocument preserving section headers and paragraph context.
   * Target chunk size: 400 - 800 words with small overlap.
   */
  static chunkDocument(doc: IngestedDocument, maxChunkSize: number = 400, overlap: number = 60): IRichChunk[] {
    const rawContent = doc.content || ''
    if (!rawContent.trim()) return []

    // 1. Split into major sections based on markdown ## or # headers
    const sectionRegex = /(?:^|\n)(?=##?\s+)/g
    const rawSections = rawContent.split(sectionRegex).filter(s => s.trim().length > 0)

    const chunks: IRichChunk[] = []
    let globalIndex = 0

    for (let sIdx = 0; sIdx < rawSections.length; sIdx++) {
      const sectionText = rawSections[sIdx].trim()
      
      // Extract section title if present
      let sectionTitle = `Section ${sIdx + 1}`
      const headerMatch = sectionText.match(/^##?\s+(.+)$/m)
      if (headerMatch) {
        sectionTitle = headerMatch[1].trim()
      }

      // 2. Tokenize section by paragraphs or words
      const words = sectionText.split(/\s+/)

      if (words.length <= maxChunkSize) {
        // Entire section fits in one chunk
        const pageEstimated = Math.max(1, Math.ceil((globalIndex + 1) / 2))
        const keywords = ChunkingService.extractKeywords(sectionText)

        chunks.push({
          chunkId: `${doc.documentId}-chunk-${globalIndex}`,
          documentId: doc.documentId,
          docTitle: doc.title,
          category: doc.category,
          department: doc.department,
          semester: doc.semester,
          sectionTitle,
          sourcePage: pageEstimated,
          chunkIndex: globalIndex,
          text: sectionText,
          keywords
        })
        globalIndex++
      } else {
        // Section is longer than maxChunkSize, sliding window with overlap
        let wStart = 0
        while (wStart < words.length) {
          const wEnd = Math.min(wStart + maxChunkSize, words.length)
          const chunkSnippet = words.slice(wStart, wEnd).join(' ')
          
          // Prepend section title context if not in first window
          const textWithContext = wStart > 0 && !chunkSnippet.startsWith('#')
            ? `[${sectionTitle} (Cont.)]\n${chunkSnippet}`
            : chunkSnippet

          const pageEstimated = Math.max(1, Math.ceil((globalIndex + 1) / 2))
          const keywords = ChunkingService.extractKeywords(textWithContext)

          chunks.push({
            chunkId: `${doc.documentId}-chunk-${globalIndex}`,
            documentId: doc.documentId,
            docTitle: doc.title,
            category: doc.category,
            department: doc.department,
            semester: doc.semester,
            sectionTitle,
            sourcePage: pageEstimated,
            chunkIndex: globalIndex,
            text: textWithContext,
            keywords
          })
          globalIndex++

          if (wEnd >= words.length) break
          wStart += (maxChunkSize - overlap)
        }
      }
    }

    return chunks
  }

  /**
   * Extracts salient keywords for lexical BM25 matching.
   */
  static extractKeywords(text: string): string[] {
    const clean = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    const tokens = clean.split(/\s+/).filter(t => t.length > 3)
    
    // Stopwords filter
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'were', 'been', 'which', 'their', 'there',
      'about', 'would', 'could', 'should', 'under', 'these', 'those', 'after', 'before'
    ])

    const freq: Record<string, number> = {}
    for (const t of tokens) {
      if (!stopWords.has(t)) {
        freq[t] = (freq[t] || 0) + 1
      }
    }

    // Sort by frequency
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0])
  }
}
