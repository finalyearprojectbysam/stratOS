// Centralized model/runtime parameters. Do not scatter these across agents.
export const GEMINI_MODEL = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  temperature: Number(process.env.GEMINI_TEMPERATURE ?? 0.4),
  maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 4096),
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 60000),
  retries: Number(process.env.GEMINI_RETRIES ?? 2),
  // Ask the model for JSON that matches each agent's zod schema.
  structuredOutput: true,
}

export default GEMINI_MODEL
