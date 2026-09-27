import { OUTPUT_SCHEMA } from './schema'
import { SYSTEM_PROMPT } from './prompt'
import { CONFIG } from './config'
import { tools } from './tools'
import { runAgent } from '../shared/base-agent'

export const meta = {
  id: 'campaign', name: 'CampaignPlanningAgent', displayName: 'Campaign Planning Agent',
  description: 'Turns strategy into concrete campaigns, activities and a timeline.',
  version: CONFIG.version, enabled: CONFIG.enabled,
  capabilities: ['campaigns', 'timeline', 'execution-plan'],
}

export async function run(context, { provider } = {}) {
  return runAgent({ meta, systemPrompt: SYSTEM_PROMPT, schema: OUTPUT_SCHEMA, tools, config: CONFIG, context, provider })
}

export default { meta, run, config: CONFIG, schema: OUTPUT_SCHEMA, prompt: SYSTEM_PROMPT, tools }
