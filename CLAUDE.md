# Pixan.ai - Project Instructions

## Overview

Pixan.ai is an enterprise-grade Collaborative GenAI Platform built with Next.js 14. It features multi-LLM collaboration, a WhatsApp bot with RAG capabilities, and comprehensive security measures.

**Version:** 2.5.0
**Language:** JavaScript (Next.js)
**Primary Language in UI:** Spanish/English (bilingual)

## Quick Reference

### Commands
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

### Key Files
- `lib/api-config.js` - Centralized model configuration and pricing
- `pages/api/` - All API endpoints
- `lib/wa/` - WhatsApp bot utilities
- `lib/secure-storage.js` - AES-GCM encryption utilities

## Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes |
| LLM APIs | Anthropic, OpenAI, Google, Perplexity, DeepSeek, Mistral |
| Messaging | Twilio WhatsApp API |
| Database | Upstash Redis, Upstash Vector DB, Vercel KV |
| Security | Web Crypto API (AES-GCM-256), JWT, bcryptjs |

### Directory Structure
```
pages/
  api/                 # REST API endpoints
    claude-chat.js     # Claude AI endpoint
    openai-chat.js     # GPT endpoint
    gemini-chat.js     # Gemini endpoint
    deepseek-chat.js   # DeepSeek endpoint
    mistral-chat.js    # Mistral endpoint
    perplexity-chat.js # Perplexity endpoint
    admin/             # Admin management APIs
    wa/                # WhatsApp integration APIs
      rag/             # RAG/File search endpoints
  llmC.js              # Main LLM Collaboration page
  WA.js                # WhatsApp bot admin interface
lib/
  api-config.js        # Model config & pricing (CENTRAL CONFIG)
  secure-storage.js    # Encryption/decryption
  rate-limiter.js      # Rate limiting
  wa/                  # WhatsApp utilities
    ai.js              # AI chat orchestration
    file-search.js     # RAG implementation
components/            # React components
contexts/              # React context providers
hooks/                 # Custom React hooks
```

## LLM Models (V2.2)

All models are configured in `lib/api-config.js`. Update versions there only.

| Provider | Model | Price (input/output per 1M tokens) |
|----------|-------|-----------------------------------|
| Claude | claude-opus-4-5-20251101 | $5 / $25 |
| Claude | claude-sonnet-4-5-20250929 | $3 / $15 |
| OpenAI | gpt-5.2 | $1.75 / $14 |
| Gemini | gemini-3-flash-preview | $0.50 / $3 |
| Gemini | gemini-2.0-flash-thinking-exp-1219 | $0.50 / $3 |
| Gemini | gemini-2.5-flash | $0.50 / $3 |
| Perplexity | sonar-pro | $2 / $2 |
| DeepSeek | deepseek-chat | $0.28 / $0.42 |
| Grok | grok-4.1-fast-reasoning | $0.20 / $0.50 |
| Kimi | kimi-k2-thinking | $0.60 / $2.50 |

## Development Guidelines

### API Endpoints
- All LLM chat endpoints follow the same pattern: `pages/api/{provider}-chat.js`
- Use `PRICING.{provider}.model` from `api-config.js` for model names
- Always implement rate limiting via `lib/rate-limiter.js`
- Use structured logging via `lib/logger.js`

### Security Requirements
- Never hardcode API keys - use environment variables
- All sensitive data must use AES-GCM encryption via `lib/secure-storage.js`
- Validate all inputs using schemas in `lib/validation.js`
- Apply rate limiting to all public endpoints

### Code Style
- Use ES6+ JavaScript (no TypeScript required)
- React functional components with hooks
- Tailwind CSS for styling
- Spanish comments are acceptable (bilingual codebase)

### Error Handling
- Use try/catch blocks in all API routes
- Return consistent error responses: `{ error: string, details?: string }`
- Log errors with appropriate severity levels
- Never expose internal errors to clients

## Environment Variables

Required variables (see `.env.example`):
```
JWT_SECRET=
ENCRYPTION_KEY=           # 32-character key for AES-GCM
CLAUDE_API_KEY_ENCODED=   # Base64 encoded
OPENAI_API_KEY_ENCODED=
GEMINI_API_KEY_ENCODED=
PERPLEXITY_API_KEY_ENCODED=
DEEPSEEK_API_KEY_ENCODED=
MISTRAL_API_KEY_ENCODED=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Testing

```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run test -- path/to/test  # Run specific test
```

Tests are located in `__tests__/` with subdirectories for:
- `integration/` - API integration tests
- `pages/` - Page component tests
- `utils/` - Utility function tests

## Key Features

### LLM Collaboration Flow
```
User Query -> Claude Analysis (assigns roles) ->
Parallel Execution (6 LLMs) ->
Claude Consolidation ->
Final Response
```

### WhatsApp Bot
- Multi-model support with model switching
- RAG/File Search for knowledge base
- Conversation memory management
- Image analysis (vision models)
- Balance tracking per user

### Security Features
- AES-GCM-256 encryption for stored keys
- PBKDF2 key derivation (100,000 iterations)
- Token bucket rate limiting
- Comprehensive security headers
- JWT authentication with HttpOnly cookies

## Deployment

Optimized for Vercel:
- Auto-deployment from main branch
- Security headers configured in `next.config.js`
- Vercel KV and Edge functions supported

## Documentation

| File | Purpose |
|------|---------|
| README.md | Main documentation |
| SECURITY.md | Security policy |
| CHANGELOG.md | Version history |
| UPDATE_NOTES_V2.2.md | Latest updates |
| FILE_SEARCH_README.md | RAG implementation |
