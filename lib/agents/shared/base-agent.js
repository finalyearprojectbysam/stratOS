// Shared execution wrapper used by every agent's run(). Handles provider
// selection, structured-output validation, timing, error handling and the
// standardized AgentResult contract. Agents stay thin and consistent.
import { getProvider } from '../../gemini/client'
import { ErrorCodes } from './errors'
import { logger } from './logger'

export function makeFailure(meta, message, code = ErrorCodes.UNKNOWN, started = Date.now()) {
  return {
    agentName: meta.name,
    status: 'failed',
    summary: message,
    findings: null,
    recommendations: [],
    metrics: null,
    metadata: { agentId: meta.id, version: meta.version, errorCode: code, durationMs: Date.now() - started },
  }
}

export function makeSkipped(meta) {
  return {
    agentName: meta.name,
    status: 'skipped',
    summary: `${meta.displayName} is disabled and was skipped.`,
    findings: null,
    recommendations: [],
    metrics: null,
    metadata: { agentId: meta.id, version: meta.version, skipped: true },
  }
}

export async function runAgent({ meta, systemPrompt, schema, tools = [], config = {}, context, provider }) {
  const started = Date.now()
  const log = logger.child(meta.name)
  try {
    if (!context || !context.clientData) {
      return makeFailure(meta, 'Missing analysis context / client data.', ErrorCodes.MISSING_INPUT, started)
    }
    const prov = provider || getProvider()
    const raw = await prov.generateStructuredOutput({ system: systemPrompt, schema, context, tools, config, agentId: meta.id })
    const parsed = schema ? schema.safeParse(raw) : { success: true, data: raw }
    if (schema && !parsed.success) {
      log.warn('schema validation failed — returning raw mock/provider output', { agentId: meta.id })
    }
    const data = parsed.success ? parsed.data : raw
    const result = {
      agentName: meta.name,
      status: 'completed',
      summary: (raw && raw.summary) || `${meta.displayName} completed.`,
      findings: (data && data.findings) ?? data ?? null,
      recommendations: (data && data.recommendations) ?? [],
      metrics: (data && data.metrics) ?? null,
      metadata: {
        agentId: meta.id,
        version: meta.version,
        provider: prov.name,
        durationMs: Date.now() - started,
        schemaValid: !!parsed.success,
      },
    }
    log.info('completed', { durationMs: result.metadata.durationMs, provider: prov.name })
    return result
  } catch (err) {
    log.error('failed', { error: err && err.message })
    return makeFailure(meta, (err && err.message) || 'Agent execution failed.', (err && err.code) || ErrorCodes.MODEL_ERROR, started)
  }
}

export default { runAgent, makeFailure, makeSkipped }
