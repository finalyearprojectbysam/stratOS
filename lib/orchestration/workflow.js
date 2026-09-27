// The orchestrator. Runs the 12-stage workflow using the model-provider
// abstraction, emits the SAME events as the mock engine, passes prior results
// downstream, runs the research layer in PARALLEL, and never aborts the whole
// analysis because one specialist failed.
import { EVENTS } from './events'
import { WORKFLOW_STAGES, TOTAL_STAGES } from './dependencies'
import { AGENT_REGISTRY, getAgent, isEnabled } from './registry'
import { createRunState } from './state'
import { makeSkipped } from '../agents/shared/base-agent'

export async function runWorkflow({ context, provider, onEvent = () => {}, analysisId } = {}) {
  const state = createRunState({ analysisId })
  const emit = (e) => onEvent({ ...e, timestamp: new Date().toISOString() })
  let done = 0

  emit({ type: EVENTS.ANALYSIS_STARTED, total: TOTAL_STAGES })

  for (const stage of WORKFLOW_STAGES) {
    const runOne = async (agentId) => {
      const agent = getAgent(agentId)
      const meta = agent?.meta || { id: agentId, name: agentId, displayName: agentId, version: '0.0.0' }
      emit({ type: EVENTS.AGENT_STARTED, stage: stage.stageId, agentId, message: `${meta.displayName} started` })

      let result
      if (!agent) {
        result = { agentName: agentId, status: 'failed', summary: 'Agent not found in registry.', findings: null, recommendations: [], metadata: { agentId, errorCode: 'NOT_FOUND' } }
      } else if (!isEnabled(agentId)) {
        result = makeSkipped(meta)
      } else {
        emit({ type: EVENTS.AGENT_PROGRESS, stage: stage.stageId, agentId, progress: 40, message: `${meta.displayName} analyzing` })
        // Pass ALL prior results downstream via the shared context.
        const ctx = { ...context, previousResults: [...state.results] }
        result = await agent.run(ctx, { provider })
      }

      state.add(result)
      done += 1
      const evType = result.status === 'failed' ? EVENTS.AGENT_FAILED : EVENTS.AGENT_COMPLETED
      emit({ type: evType, stage: stage.stageId, agentId, progress: Math.round((done / TOTAL_STAGES) * 100), message: result.summary, result })
      return result
    }

    if (stage.parallel) await Promise.all(stage.agents.map(runOne))
    else for (const id of stage.agents) await runOne(id) // eslint-disable-line no-await-in-loop
  }

  state.finish()
  emit({ type: EVENTS.ANALYSIS_COMPLETED, durationMs: state.durationMs, results: state.results })
  return state
}

export { AGENT_REGISTRY }
export default runWorkflow
