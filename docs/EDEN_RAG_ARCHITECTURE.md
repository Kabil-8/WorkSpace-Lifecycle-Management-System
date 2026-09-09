# EDEN AI — Retrieval Augmented Generation (RAG) Architecture

## Overview
EDEN AI's RAG pipeline parses, chunks, indexes, and retrieves course material, uploaded notes, and research documents under `backend/src/ai/rag/`.

## Modular Pipeline
- `DocumentLoader.ts`: Loads raw text/buffer from PDF, DOCX, TXT.
- `Chunker.ts`: Sliding-window text chunking (default 800 chars, 150 overlap).
- `EmbeddingService.ts`: Generates normalized term frequency vectors and cosine similarity scores.
- `VectorStore.ts`: In-memory and MongoDB vector chunk repository.
- `Retriever.ts`: Similarity ranking enforcing strict document ownership (`chunk.ownerId === userId`).
- `RAGContextBuilder.ts`: Assembles RAG evidence chunks and injects sources into `SourceManager`.
