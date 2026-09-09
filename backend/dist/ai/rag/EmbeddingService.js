export class EmbeddingService {
    /**
     * Generates lightweight normalized TF-IDF term frequency vector representation for text comparison.
     */
    static generateEmbedding(text) {
        const terms = (text || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        const freq = {};
        for (const term of terms) {
            if (term.length > 2) {
                freq[term] = (freq[term] || 0) + 1;
            }
        }
        // Normalize
        const total = terms.length || 1;
        for (const key in freq) {
            freq[key] = freq[key] / total;
        }
        return freq;
    }
    static computeSimilarity(vecA, vecB) {
        let dot = 0;
        let magA = 0;
        let magB = 0;
        for (const key in vecA) {
            magA += vecA[key] * vecA[key];
            if (vecB[key]) {
                dot += vecA[key] * vecB[key];
            }
        }
        for (const key in vecB) {
            magB += vecB[key] * vecB[key];
        }
        if (magA === 0 || magB === 0)
            return 0;
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }
}
