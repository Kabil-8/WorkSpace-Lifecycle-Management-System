# EDEN AI — Current Architecture Audit

This document summarizes the audit of the existing EDEN AI implementation prior to the full LLM Gateway Architecture Refactor.

## 1. Request Flow
- **Frontend**: `AICopilotPage.tsx` and `EdenGlobalWidget.tsx` send POST requests to `/api/eden/stream` or `/api/eden/chat`.
- **Backend Controller**: `edenController.ts` handles requests, extracts user context from `req.user`, and invokes `OpenDomainAIEngine.ts` or `GeminiService.ts`.

## 2. AI Provider & Engine
- Previously relied on direct Google Gemini REST calls or hardcoded keyword branches inside `OpenDomainAIEngine.ts`.
- Lacked a generic provider abstraction for switching between OpenAI, Anthropic, DeepSeek, Google Gemini, and local LLMs (Ollama / vLLM).

## 3. Canned / Hardcoded Responses Identified
- Static keyword-based educational responses for Java ("what is java"), Python ("i need to learn python"), MERN stack ("i need to take studies on mern stack"), prime numbers ("sum of first n primenum"), reverse number, and HTML login page.
- Static fallback numbers (`7.0`, `85%`, `₹6.0L - ₹12.0L PA`) when database telemetry was missing.

## 4. Current Tools & DB Access
- `DynamicToolRegistry.ts` and `ActionExecutor.ts` provided basic database actions (`get_my_attendance`, `get_my_assignments`, `get_student_digital_twin`, `open_module`).
- Needed a centralized, security-hardened `ToolRegistry.ts` with strict JWT identity enforcement (`req.user.id`).

## 5. Web Search & RAG Capabilities
- Lacked real-time web search integration with source URL verification and citation formatting.
- Lacked modular RAG pipeline for PDF/document analysis with chunking and vector retrieval.

## 6. Target Architecture Overview
- **LLM Gateway**: Pluggable provider interface (`LLMProvider.ts`) with `OpenAIProvider`, `AnthropicProvider`, `DeepSeekProvider`, `GeminiProvider`, `LocalLLMProvider`.
- **Eden Orchestrator**: Central pipeline orchestrating User -> JWT Auth Context -> Intent -> Tool/Web/RAG Selection -> Evidence Collection -> LLM Reasoning -> Citation Validation -> Response.
- **Web Research Agent**: Real web search tool (`WebSearchTool.ts`) with configurable APIs, source fetcher, authority ranker, and `SourceManager.ts` citations.
- **Personal Data Security**: 100% JWT identity derivation (`req.user.id`). Zero dummy IDs (`std-101`) or fake metrics.
- **Zero Mock Policy**: Complete removal of static educational templates and dummy metric fallbacks.
