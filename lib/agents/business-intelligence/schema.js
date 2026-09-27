import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'business'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  kpis: z.array(z.any()).optional(),
  trends: z.array(z.any()).optional(),
  businessInsights: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
