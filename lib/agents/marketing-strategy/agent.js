import { OUTPUT_SCHEMA } from './schema'
import { SYSTEM_PROMPT } from './prompt'
import { CONFIG } from './config'
import { tools } from './tools'
import { runAgent } from '../shared/base-agent'

export const meta = {
  id: 'marketing', name: 'MarketingStrategyAgent', displayName: 'Marketing Strategy Agent',
  description: 'Builds the marketing strategy: segments, positioning, channels, funnel.',
  version: CONFIG.version, enabled: CONFIG.enabled,
  capabilities: ['strategy', 'positioning', 'funnel'],
}

export async function run(context, { provider } = {}) {
  return runAgent({ meta, systemPrompt: SYSTEM_PROMPT, schema: OUTPUT_SCHEMA, tools, config: CONFIG, context, provider })
}

export default { meta, run, config: CONFIG, schema: OUTPUT_SCHEMA, prompt: SYSTEM_PROMPT, tools }
