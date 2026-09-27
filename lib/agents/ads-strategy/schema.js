import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'ads'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  platforms: z.array(z.any()).optional(),
  objectives: z.array(z.any()).optional(),
  audiences: z.array(z.any()).optional(),
  campaigns: z.array(z.any()).optional(),
  budgetConsiderations: z.any().optional(),
})
export default OUTPUT_SCHEMA
