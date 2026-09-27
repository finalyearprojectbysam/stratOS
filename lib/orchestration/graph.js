// Human-readable dependency graph (for docs / future visualization).
import { WORKFLOW_STAGES, DEPENDENCIES } from './dependencies'

export function buildGraph() {
  const nodes = []
  const edges = []
  for (const stage of WORKFLOW_STAGES) {
    for (const agentId of stage.agents) {
      const nodeId = `${stage.stageId}:${agentId}`
      nodes.push({ id: nodeId, agentId, stage: stage.stageId, label: stage.label, parallel: stage.parallel })
      for (const dep of DEPENDENCIES[stage.stageId] || []) edges.push({ from: dep, to: agentId, stage: stage.stageId })
    }
  }
  return { nodes, edges }
}

export default buildGraph
