// AIModelProvider abstraction. Agents depend on THIS interface, never on the
// Gemini SDK directly — so the model can be swapped (Gemini/OpenAI/Claude)
// without touching a single agent.
//
//   AIModelProvider
//     ├── MockProvider   (Demo Mode / USE_MOCK_AGENTS=true)
//     └── GeminiProvider (server-side, real AI — TODO)
import { geminiConfig } from './config'
import { GEMINI_MODEL } from './model'

// ---- Mock provider ---------------------------------------------------------
// Returns schema-valid PLACEHOLDER output (no fake intelligence). Used for Demo
// Mode and for independently testing an agent's contract offline.
export class MockProvider {
  constructor() { this.name = 'mock' }
  async generateText({ system } = {}) {
    return `MOCK RESPONSE — provider not connected. (system prompt length: ${(system || '').length})`
  }
  async generateStructuredOutput({ agentId, config } = {}) {
    const label = (config && config.name) || agentId || 'agent'
    return {
      summary: `Mock output for ${label}. Connect Gemini (USE_MOCK_AGENTS=false) to generate real analysis.`,
      findings: {},
      recommendations: [],
      metrics: null,
    }
  }
}

// ---- Gemini provider (server-side, real AI) --------------------------------
// TODO: Implement real @google/generative-ai calls here. Must run server-side
// only. Keep the interface identical to MockProvider so agents never change.
export class GeminiProvider {
  constructor(config = geminiConfig, model = GEMINI_MODEL) {
    this.name = 'gemini'
    this.config = config
    this.model = model
    if (!config.apiKey) throw new Error('GEMINI_API_KEY is not configured (server-side).')
  }
  async generateText() {
    // TODO: call Gemini generateContent and return text.
    throw new Error('GeminiProvider.generateText not implemented yet.')
  }
  async generateStructuredOutput() {
    // TODO: call Gemini with responseMimeType application/json + schema,
    // then parse/validate against the agent zod schema.
    throw new Error('GeminiProvider.generateStructuredOutput not implemented yet.')
  }
}

// Provider selection: Mock unless real AI is explicitly enabled AND configured.
export function getProvider() {
  if (geminiConfig.useMock || !geminiConfig.apiKey) return new MockProvider()
  return new GeminiProvider()
}

export default { MockProvider, GeminiProvider, getProvider }
