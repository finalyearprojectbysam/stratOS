# Gemini Provider

Server-side AI model provider for the agent system.

## Architecture
Agents depend on the **`AIModelProvider`** interface, never on the Gemini SDK:
```
AIModelProvider
  ├── MockProvider    (Demo Mode / USE_MOCK_AGENTS=true)  — implemented
  └── GeminiProvider  (real AI, server-side)             — TODO stub
```
Swapping to OpenAI/Claude later = add another provider; agents don't change.

## Files
- `client.js` — `MockProvider`, `GeminiProvider` (stub), `getProvider()`.
- `config.js` — reads `GEMINI_API_KEY` + `USE_MOCK_AGENTS` (server-side only).
- `model.js` — model name, temperature, tokens, timeout, retries.
- `types.js` — provider JSDoc typedefs.

## Environment variables (server-side — never NEXT_PUBLIC)
```
GEMINI_API_KEY=            # required to enable real AI
USE_MOCK_AGENTS=true       # 'false' to use Gemini
GEMINI_MODEL=gemini-2.5-flash
```

## Security
- The key is read only via `process.env` on the server. It is **never** exposed
  to the browser bundle (no `NEXT_PUBLIC_` prefix).
- All Gemini calls must originate server-side (API route / server action).

## Enabling Gemini later
1. Implement `GeminiProvider.generateStructuredOutput()` in `client.js`
   (call Gemini with JSON response + validate against each agent's zod schema).
2. Set `GEMINI_API_KEY` and `USE_MOCK_AGENTS=false` in server env.
3. No agent code changes required.
