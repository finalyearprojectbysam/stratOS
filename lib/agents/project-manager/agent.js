import { OUTPUT_SCHEMA } from './schema'
import { SYSTEM_PROMPT } from './prompt'
import { CONFIG } from './config'
import { tools } from './tools'
import { runAgent } from '../shared/base-agent'

export const meta = {
  id: 'project_manager', name: 'ProjectManagerAgent', displayName: 'Project Manager Agent',
  description: 'Converts the strategy into projects, tasks, dependencies and a timeline.',
  version: CONFIG.version, enabled: CONFIG.enabled,
  capabilities: ['projects', 'tasks', 'timeline'],
}

export async function run(context, { provider } = {}) {
  return runAgent({ meta, systemPrompt: SYSTEM_PROMPT, schema: OUTPUT_SCHEMA, tools, config: CONFIG, context, provider })
}

export default { meta, run, config: CONFIG, schema: OUTPUT_SCHEMA, prompt: SYSTEM_PROMPT, tools }
