// Builds the shared AnalysisContext passed into every agent. Client info is
// mapped ONCE here (not duplicated per-agent).
import { mapClientToClientData } from '../data/client-context'

export function buildAnalysisContext({ agency, client, analysis, previousResults = [], metadata = {} }) {
  return {
    agencyId: agency?.id || agency?.agency_id || null,
    clientId: client?.id || null,
    analysisId: analysis?.id || null,
    clientData: mapClientToClientData(client || {}),
    previousResults,
    metadata: { createdAt: new Date().toISOString(), ...metadata },
  }
}

// Returns a shallow-cloned context with an extra prior result appended.
export function withResult(context, result) {
  return { ...context, previousResults: [...(context.previousResults || []), result] }
}

export default { buildAnalysisContext, withResult }
