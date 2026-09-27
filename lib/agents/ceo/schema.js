import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'ceo'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  executiveSummary: z.string().optional(),
  keyFindings: z.array(z.any()).optional(),
  strategicPriorities: z.array(z.any()).optional(),
  nextActions: z.array(z.any()).optional(),
  finalStrategy: z.any().optional(),
})
export default OUTPUT_SCHEMA
