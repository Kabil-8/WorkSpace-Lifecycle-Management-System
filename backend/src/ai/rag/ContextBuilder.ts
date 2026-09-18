import { RerankedChunk } from './RerankingService.js'

export interface GroundedContextPayload {
  contextText: string
  sourceCitations: {
    sourceId: string
    title: string
    section: string
    page: number
    category: string
    relevancePct: number
  }[]
  hasInstitutionalEvidence: boolean
  highestConfidence: number
}

export class ContextBuilder {
  /**
   * Assembles reranked evidence chunks into structured, tamper-proof prompt context.
   */
  static buildGroundedContext(chunks: RerankedChunk[]): GroundedContextPayload {
    if (!chunks || chunks.length === 0) {
      return {
        contextText: '',
        sourceCitations: [],
        hasInstitutionalEvidence: false,
        highestConfidence: 0.0
      }
    }

    let contextText = '### 🏛️ AUTHORITATIVE UNIVERSITY REGULATIONS & EVIDENCE:\n\n'
    contextText += 'The following excerpts are extracted from official EduSphere university policy documents. '
    contextText += 'You MUST base your response strictly on this evidence and explicitly cite sources using [Source 1], [Source 2], etc.\n\n'

    const sourceCitations: GroundedContextPayload['sourceCitations'] = []
    let highestConfidence = 0.0

    chunks.forEach((chunk, index) => {
      const sourceNum = index + 1
      const title = chunk.docTitle || chunk.documentTitle || 'University Policy'
      const section = chunk.sectionTitle || 'General Regulation'
      const page = chunk.sourcePage || 1
      const relevancePct = Math.round(chunk.finalScore * 100)

      if (chunk.finalScore > highestConfidence) {
        highestConfidence = chunk.finalScore
      }

      contextText += `[Source ${sourceNum}: ${title} | Section: ${section} | Page: ${page} | Relevance: ${relevancePct}%]\n`
      contextText += `"${chunk.text.trim()}"\n\n`

      sourceCitations.push({
        sourceId: `Source ${sourceNum}`,
        title,
        section,
        page,
        category: chunk.category || 'institutional_policy',
        relevancePct
      })
    })

    contextText += '---\n'
    contextText += '### ⚠️ GROUNDING DIRECTIVE:\n'
    contextText += '1. State facts directly backed by the sources above.\n'
    contextText += '2. Attribute every regulatory statement with its corresponding [Source X] anchor.\n'
    contextText += '3. Do NOT invent policies, numbers, or rules not present in the sources.\n'

    return {
      contextText,
      sourceCitations,
      hasInstitutionalEvidence: true,
      highestConfidence
    }
  }
}
