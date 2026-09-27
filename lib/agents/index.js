// Public entrypoint for the modular agent system. App code should import from
// here (or from the orchestration registry) — never reach into individual
// agent folders directly.
export { AGENT_REGISTRY, getAgent, listAgents, isEnabled } from '../orchestration/registry'
export { runWorkflow } from '../orchestration/workflow'
export { WORKFLOW_STAGES, DEPENDENCIES, TOTAL_STAGES } from '../orchestration/dependencies'
export { buildGraph } from '../orchestration/graph'
export { EVENTS } from '../orchestration/events'
export { getProvider, MockProvider, GeminiProvider } from '../gemini/client'
export { buildAnalysisContext, withResult } from './shared/context'
export { resultsToReport } from './shared/report-adapter'
