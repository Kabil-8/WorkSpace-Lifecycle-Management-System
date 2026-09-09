import { EmbeddingService } from './EmbeddingService.js';
export class VectorStore {
    static store = [];
    static addChunks(chunks) {
        for (const chunk of chunks) {
            const vector = EmbeddingService.generateEmbedding(chunk.text);
            this.store.push({ ...chunk, vector });
        }
    }
    static getStore() {
        return this.store;
    }
    static clear() {
        this.store = [];
    }
}
