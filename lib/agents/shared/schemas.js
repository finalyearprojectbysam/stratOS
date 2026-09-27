// Base, cross-agent runtime schemas (zod). Domain agents extend `baseDomain`.
import { z } from 'zod'

export const AgentStatus = z.enum(['completed', 'failed', 'skipped'])

// The universal agent result contract every agent returns.
export const AgentResultSchema = z.object({
  agentName: z.string(),
  status: AgentStatus,
  summary: z.string().default(''),
  findings: z.any().optional(),
  recommendations: z.any().optional(),
  metrics: z.any().optional(),
  metadata: z.record(z.any()).optional(),
})

// Fields common to most domain output schemas. Intentionally optional — this
// module defines STRUCTURE only; real values are produced by the AI provider.
export const baseDomain = {
  summary: z.string().optional(),
  findings: z.any().optional(),
  recommendations: z.array(z.any()).optional(),
  metrics: z.any().optional(),
}

export default { AgentStatus, AgentResultSchema, baseDomain }
