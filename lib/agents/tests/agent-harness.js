// Independent agent test harness. Run agents/workflow WITHOUT the UI, using the
// MockProvider (offline) or a real provider. Designed to be called from a
// server context (e.g. the /api/agents route) since the modules use ESM `import`
// resolved by the Next bundler.
import { getAgent, listAgents } from '../../orchestration/registry'
import { runWorkflow } from '../../orchestration/workflow'
import { buildAnalysisContext } from '../shared/context'
import { MockProvider } from '../../gemini/client'

// Test a SINGLE agent in isolation.
export async function testAgent(agentId, { client, provider } = {}) {
  const agent = getAgent(agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)
  const context = buildAnalysisContext({ agency: { id: 'agency_demo' }, client: client || { business_name: 'Demo Co' }, analysis: { id: 'analysis_demo' } })
  return agent.run(context, { provider: provider || new MockProvider() })
}

// Test the FULL 12-stage workflow.
export async function testWorkflow({ client, provider, onEvent } = {}) {
  const context = buildAnalysisContext({ agency: { id: 'agency_demo' }, client: client || { business_name: 'Demo Co' }, analysis: { id: 'analysis_demo' } })
  return runWorkflow({ context, provider: provider || new MockProvider(), onEvent: onEvent || (() => {}) })
}

export { listAgents }
export default { testAgent, testWorkflow, listAgents }
