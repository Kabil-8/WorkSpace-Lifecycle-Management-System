import { ScoredChunk, StudentContext } from './RetrievalService.js'

export interface RerankedChunk extends ScoredChunk {
  finalScore: number
  lexicalScore: number
  profileScore: number
}

export class RerankingService {
  /**
   * Re-ranks candidate chunks using a hybrid scoring formula:
   * Final Score = 0.50 * DenseVectorSim + 0.30 * LexicalKeywordMatch + 0.20 * ProfileRelevance
   */
  static rerank(
    query: string,
    candidates: ScoredChunk[],
    studentContext?: StudentContext,
    topN: number = 4
  ): RerankedChunk[] {
    if (!candidates || candidates.length === 0) return []

    const queryTerms = (query || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)

    const reranked: RerankedChunk[] = []

    for (const chunk of candidates) {
      const textLower = (chunk.text || '').toLowerCase()
      const titleLower = (chunk.docTitle || '').toLowerCase()
      const sectionLower = (chunk.sectionTitle || '').toLowerCase()

      // 1. Lexical BM25-style keyword matching
      let matchCount = 0
      for (const term of queryTerms) {
        if (textLower.includes(term) || titleLower.includes(term) || sectionLower.includes(term)) {
          matchCount++
        }
      }
      const lexicalScore = queryTerms.length > 0 ? matchCount / queryTerms.length : 0.0

      // 2. Profile Relevance Score (only applies if chunk has topical relevance to query)
      const hasTopicalMatch = lexicalScore > 0.10 || chunk.similarity > 0.35
      let profileScore = 0.0
      if (hasTopicalMatch) {
        if (studentContext?.department && chunk.department) {
          if (chunk.department === 'All Departments' || chunk.department.toLowerCase() === studentContext.department.toLowerCase()) {
            profileScore += 0.5
          }
        }
        if (studentContext?.semester && chunk.semester && chunk.semester === studentContext.semester) {
          profileScore += 0.5
        }
      }

      // 3. Combined Final Score
      const vectorWeight = 0.45
      const lexicalWeight = 0.40
      const profileWeight = 0.15

      const finalScore =
        (chunk.similarity * vectorWeight) +
        (lexicalScore * lexicalWeight) +
        (profileScore * profileWeight)

      // Filter out low-relevance noise
      if (finalScore >= 0.25 || chunk.similarity >= 0.40) {
        reranked.push({
          ...chunk,
          finalScore: Math.round(finalScore * 10000) / 10000,
          lexicalScore: Math.round(lexicalScore * 10000) / 10000,
          profileScore: Math.round(profileScore * 10000) / 10000
        })
      }
    }

    // Sort by finalScore descending
    reranked.sort((a, b) => b.finalScore - a.finalScore)
    return reranked.slice(0, topN)
  }
}
