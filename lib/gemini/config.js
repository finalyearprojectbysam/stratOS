// Gemini configuration. Reads SERVER-SIDE env only — never NEXT_PUBLIC, so the
// key is never shipped to the browser bundle. Gemini calls must run server-side.
export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',            // set server-side only
  // USE_MOCK_AGENTS defaults to true (Demo Mode). Set to 'false' to use Gemini.
  useMock: (process.env.USE_MOCK_AGENTS ?? 'true') !== 'false',
}

export const isGeminiConfigured = Boolean(geminiConfig.apiKey)

export default geminiConfig
