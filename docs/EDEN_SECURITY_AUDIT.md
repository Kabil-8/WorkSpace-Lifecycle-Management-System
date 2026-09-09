# EDEN AI — Security & Isolation Audit

## Verified Controls

### 1. JWT User Isolation
- All student telemetry operations strictly derive identity from verified JWT token (`req.user._id`).
- Unauthenticated requests receive HTTP 401 response (`🔒 Authentication required`).

### 2. SSRF Protection (`WebSearchTool.ts`)
- Target URLs in `openWebPage` and search results are validated to prevent Server-Side Request Forgery.
- Rejects non-HTTP protocols, `localhost`, `127.0.0.1`, `0.0.0.0`, and private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).

### 3. Prompt Injection Defense
- System prompt instructs LLM that tool authorization is determined server-side by `ToolRegistry`.
- Tool execution verifies user permissions prior to running database operations.

### 4. API Key Protection
- API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `WEB_SEARCH_API_KEY`) remain strictly server-side in `backend/.env`.
- Never exposed to React client.
