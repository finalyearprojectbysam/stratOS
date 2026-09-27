import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'opportunity'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  opportunities: z.array(z.any()).optional(),
  impact: z.any().optional(),
  priority: z.any().optional(),
  recommendedActions: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
