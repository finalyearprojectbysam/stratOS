import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'competitor'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  competitors: z.array(z.any()).optional(),
  positioning: z.any().optional(),
  strengths: z.array(z.any()).optional(),
  weaknesses: z.array(z.any()).optional(),
  opportunities: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
