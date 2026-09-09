import { Retriever } from './Retriever.js'
import { SourceManager } from '../SourceManager.js'

export class RAGContextBuilder {
  static buildRAGContext(query: string, authenticatedUserId: string, sourceManager?: SourceManager): string {
    const chunks = Retriever.retrieveRelevantChunks(query, authenticatedUserId)
    if (chunks.length === 0) return ''

    let ragContext = '### 📄 Uploaded & Course Document Context:\n\n'
    chunks.forEach((c, idx) => {
      ragContext += `Document Chunk [${idx + 1}] (${c.docTitle}):\n${c.text}\n\n`
      if (sourceManager) {
        sourceManager.addSource({
          title: c.docTitle,
          url: `file://${c.docTitle}`,
          snippet: c.text.slice(0, 200),
        })
      }
    })

    return ragContext
  }
}
