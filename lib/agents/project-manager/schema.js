import { z } from 'zod'
import { baseDomain } from '../shared/schemas'

export const AGENT_ID = 'project_manager'
export const OUTPUT_SCHEMA = z.object({
  ...baseDomain,
  projects: z.array(z.any()).optional(),
  tasks: z.array(z.any()).optional(),
  dependencies: z.array(z.any()).optional(),
  timeline: z.any().optional(),
  executionPlan: z.any().optional(),
})
export default OUTPUT_SCHEMA
