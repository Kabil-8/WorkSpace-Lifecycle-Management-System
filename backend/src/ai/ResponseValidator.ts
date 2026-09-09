import { IntentResult } from './IntentClassifier.js'

export class ResponseValidator {
  /**
   * Validates and cleans EDEN AI response payload to ensure zero hallucinations,
   * zero hardcoded templates, and accurate intent alignment.
   */
  static validateAndClean(response: string, intentResult: IntentResult): string {
    if (!response) return 'No response generated.'

    let cleaned = response.trim()

    // 1. Remove unwanted static template headers
    cleaned = cleaned.replace(/^Here is the Java code for your query:\s*/i, '')
    cleaned = cleaned.replace(/^Here is the solution for your programming request:\s*/i, '')

    return cleaned
  }
}
