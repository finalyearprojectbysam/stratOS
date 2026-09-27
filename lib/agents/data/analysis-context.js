// Analysis-level context (metadata about the run itself).
export function buildAnalysisMeta({ analysis = {}, requestedBy = null } = {}) {
  return {
    analysisId: analysis.id || null,
    status: analysis.status || 'pending',
    requestedBy,
    createdAt: analysis.created_at || new Date().toISOString(),
  }
}

export default buildAnalysisMeta
