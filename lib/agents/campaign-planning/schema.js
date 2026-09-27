import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'campaign'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  objectives: z.array(z.any()).optional(),
  campaigns: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  timeline: z.any().optional(),
  executionPlan: z.any().optional(),
})
export default OUTPUT_SCHEMA
