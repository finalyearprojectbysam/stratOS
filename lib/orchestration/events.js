// Canonical workflow event names. Identical string values to the existing
// mock engine (lib/mockAgents.js EVENTS) so the analysis UI stays compatible.
export const EVENTS = {
  ANALYSIS_STARTED: 'analysis_started',
  AGENT_STARTED: 'agent_started',
  AGENT_PROGRESS: 'agent_progress',
  AGENT_COMPLETED: 'agent_completed',
  AGENT_FAILED: 'agent_failed',
  ANALYSIS_COMPLETED: 'analysis_completed',
}

export default EVENTS
