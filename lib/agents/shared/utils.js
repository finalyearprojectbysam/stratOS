// Small shared helpers for agents/orchestration.
export const nowIso = () => new Date().toISOString()
export const sinceMs = (start) => Date.now() - start

// Coerce empty values to null so agents can tell missing data from skipped.
export const nullIfEmpty = (v) => {
  if (v == null) return null
  if (Array.isArray(v)) return v.length ? v : null
  if (typeof v === 'string') return v.trim() ? v.trim() : null
  return v
}

// Index previous agent results by agentId for easy downstream lookup.
export const indexResults = (results = []) => {
  const map = {}
  for (const r of results) if (r?.metadata?.agentId) map[r.metadata.agentId] = r
  return map
}

export default { nowIso, sinceMs, nullIfEmpty, indexResults }
