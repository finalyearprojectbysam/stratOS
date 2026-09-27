import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'seo'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  keywords: z.array(z.any()).optional(),
  searchIntent: z.any().optional(),
  technicalSEO: z.any().optional(),
  contentOpportunities: z.array(z.any()).optional(),
})
export default OUTPUT_SCHEMA
