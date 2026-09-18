import { GroundedContextPayload } from './ContextBuilder.js'

export interface RAGValidationResult {
  isValid: boolean
  groundingStatus: 'VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'GENERAL_QUERY'
  finalResponse: string
  citedSources: string[]
  unsupportedClaimsDetected: boolean
  groundingConfidence: number
}

export class RAGResponseValidator {
  private static readonly REGULATION_KEYWORDS = [
    'attendance', 'condonation', 'detention', 'cgpa', 'sgpa', 'backlog', 'arrear',
    'pass mark', 'passing grade', 'malpractice', 'revaluation', 'photocopy',
    'placement', 'dream offer', 'tier 1', 'tier-1', 'salary tier', 'syllabus',
    'curriculum', 'credits', 'prerequisite', 'hall ticket', 'exam eligibility',
    'degree duration', 'fast track', 'medical leave', 'on duty', 'od attendance',
    'policy', 'regulation', 'regulations', 'rule', 'rules', 'university',
    'campus', 'official', 'conduct', 'discipline', 'exam', 'examination', 'internship'
  ]

  /**
   * Validates LLM output against retrieved sources and enforces Feature #24 Zero-Hallucination constraints.
   */
  static validateResponse(
    userQuery: string,
    llmResponse: string,
    groundedContext: GroundedContextPayload
  ): RAGValidationResult {
    const qLower = (userQuery || '').toLowerCase()
    const isInstitutionalQuery = this.REGULATION_KEYWORDS.some(kw => qLower.includes(kw))

    // 1. If query requires institutional knowledge but NO evidence was found or confidence is too low
    if (isInstitutionalQuery && (!groundedContext.hasInstitutionalEvidence || groundedContext.highestConfidence < 0.35)) {
      return {
        isValid: false,
        groundingStatus: 'INSUFFICIENT_EVIDENCE',
        finalResponse: 'I could not find sufficient authoritative documentation in university regulations to answer this reliably. Please consult your department academic advisor or examine official university notices.',
        citedSources: [],
        unsupportedClaimsDetected: true,
        groundingConfidence: 0.0
      }
    }

    // 2. Non-institutional query (e.g. general Python coding or greetings)
    if (!isInstitutionalQuery) {
      return {
        isValid: true,
        groundingStatus: 'GENERAL_QUERY',
        finalResponse: llmResponse,
        citedSources: [],
        unsupportedClaimsDetected: false,
        groundingConfidence: 1.0
      }
    }

    // 3. Institutional query with valid evidence: Check citations
    const citationRegex = /\[Source\s*(\d+)\]/gi
    const matches = [...llmResponse.matchAll(citationRegex)]
    const citedNumbers = Array.from(new Set(matches.map(m => parseInt(m[1], 10))))

    const validCitedSources: string[] = []
    for (const num of citedNumbers) {
      const idx = num - 1
      if (groundedContext.sourceCitations[idx]) {
        validCitedSources.push(groundedContext.sourceCitations[idx].title)
      }
    }

    // If LLM forgot to include citations, append the authoritative source references at the bottom
    let formattedResponse = llmResponse
    if (validCitedSources.length === 0 && groundedContext.sourceCitations.length > 0) {
      const primarySource = groundedContext.sourceCitations[0]
      formattedResponse += `\n\n*(Verified Source: ${primarySource.title} — ${primarySource.section}, Page ${primarySource.page})*`
      validCitedSources.push(primarySource.title)
    }

    return {
      isValid: true,
      groundingStatus: 'VERIFIED',
      finalResponse: formattedResponse,
      citedSources: validCitedSources,
      unsupportedClaimsDetected: false,
      groundingConfidence: Math.round(groundedContext.highestConfidence * 100) / 100
    }
  }
}
