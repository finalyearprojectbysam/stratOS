import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'risk'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  risks: z.array(z.any()).optional(),
  severity: z.any().optional(),
  likelihood: z.any().optional(),
  mitigation: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
