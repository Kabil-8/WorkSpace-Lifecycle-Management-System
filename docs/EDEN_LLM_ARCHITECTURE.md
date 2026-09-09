# EDEN AI — General Purpose LLM Architecture Specification

## Overview
EDEN AI is EduSphere's universal, web-aware, tool-calling AI companion built on a pluggable LLM Provider Gateway architecture.

## Component Pipeline

```
USER MESSAGE
      │
      ▼
JWT AUTHENTICATION (req.user.id)
      │
      ▼
INTENT CLASSIFIER (Metadata Only)
      │
      ▼
EDEN ORCHESTRATOR
      │
 ┌────┴─────────────────┬────────────────────┐
 ▼                      ▼                    ▼
Tool Registry        Web Research Agent    RAG Pipeline
(MongoDB Data)       (Tavily/Serper)       (Doc Chunks)
 │                      │                    │
 └────┬─────────────────┴────────────────────┘
      ▼
Evidence Assembly & System Prompt
      │
      ▼
LLM Gateway (OpenAI / Claude / DeepSeek / Gemini / Ollama)
      │
      ▼
Response Validator & Source Citation Formatting
      │
      ▼
EDEN Response + Clickable Citations
```

## Provider Abstraction (`LLMProvider.ts`)
Configurable via `LLM_PROVIDER` in `backend/.env`:
- `openai`: OpenAI REST API (`gpt-4o`, `gpt-4o-mini`)
- `anthropic`: Anthropic Claude REST API (`claude-3-5-sonnet`)
- `deepseek`: DeepSeek REST API (`deepseek-chat`)
- `gemini`: Google Gemini REST API (`gemini-1.5-flash`)
- `local`: Local/Self-hosted Ollama or vLLM endpoint (`http://localhost:11434`)
