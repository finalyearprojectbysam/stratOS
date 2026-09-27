// Mutable per-run state container for an analysis.
export function createRunState({ analysisId } = {}) {
  return {
    analysisId: analysisId || null,
    startedAt: Date.now(),
    completedAt: null,
    results: [],           // AgentResult[]
    byAgent: {},           // agentId -> AgentResult
    errors: [],
    add(result) {
      this.results.push(result)
      if (result?.metadata?.agentId) this.byAgent[result.metadata.agentId] = result
      if (result?.status === 'failed') this.errors.push(result)
      return result
    },
    finish() { this.completedAt = Date.now(); return this },
    get durationMs() { return (this.completedAt || Date.now()) - this.startedAt },
  }
}

export default createRunState
