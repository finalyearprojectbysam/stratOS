// Minimal structured logger for agents/orchestration. Console-based; safe to
// swap for a real transport later. NEVER log API keys, passwords or tokens.
const REDACT = /(api[_-]?key|authorization|password|secret|token)/i

function sanitize(meta = {}) {
  const out = {}
  for (const [k, v] of Object.entries(meta)) out[k] = REDACT.test(k) ? '[redacted]' : v
  return out
}

function emit(level, scope, msg, meta) {
  const line = `[STRATOS:${scope}] ${msg}`
  const payload = meta ? sanitize(meta) : undefined
  // eslint-disable-next-line no-console
  ;(console[level] || console.log)(line, payload || '')
}

export const logger = {
  child(scope = 'agent') {
    return {
      info: (m, meta) => emit('log', scope, m, meta),
      warn: (m, meta) => emit('warn', scope, m, meta),
      error: (m, meta) => emit('error', scope, m, meta),
    }
  },
}

export default logger
