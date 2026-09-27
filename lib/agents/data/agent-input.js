// Per-agent input contract. A teammate can prepare exactly what an agent needs
// without touching the frontend. Extend `select` per agent as requirements grow.
export function buildAgentInput(agentId, context) {
  return {
    agentId,
    client: context?.clientData || null,
    priorResults: context?.previousResults || [],
    metadata: context?.metadata || {},
  }
}

export default buildAgentInput
