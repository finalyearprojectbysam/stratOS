import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'analytics'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  trends: z.array(z.any()).optional(),
  anomalies: z.array(z.any()).optional(),
  insights: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
