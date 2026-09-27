import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'marketing'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  targetSegments: z.array(z.any()).optional(),
  positioning: z.any().optional(),
  messaging: z.any().optional(),
  channels: z.array(z.any()).optional(),
  funnel: z.any().optional(),
  priorities: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
