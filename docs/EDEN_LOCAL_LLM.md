# EDEN AI — Local LLM Integration Guide (Ollama / vLLM)

## Overview
EDEN AI supports self-hosted local LLMs via OpenAI-compatible endpoints or Ollama native API.

## Setup Instructions

### 1. Install Ollama
Download and install Ollama from [https://ollama.com](https://ollama.com).

### 2. Download Model
```bash
ollama pull llama3:latest
# or
ollama pull deepseek-r1:latest
```

### 3. Configure EduSphere Backend `.env`
Update `backend/.env`:
```env
LLM_PROVIDER=local
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llama3:latest
```

### 4. Start Services
```bash
cd backend
npm run dev
```

### 5. Verification
EDEN will automatically send requests to `http://localhost:11434/v1/chat/completions` or `http://localhost:11434/api/chat`.
