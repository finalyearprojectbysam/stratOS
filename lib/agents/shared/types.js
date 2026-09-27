// Shared JSDoc typedefs for the STRATOS agent architecture.
// These are documentation-only (the codebase is JS + zod for runtime validation).

/**
 * @typedef {Object} ClientData
 * @property {string} businessName
 * @property {string|null} industry
 * @property {string|null} websiteUrl
 * @property {string|null} instagramUrl
 * @property {string|null} facebookUrl
 * @property {string|null} googleBusinessUrl
 * @property {string|null} targetLocation
 * @property {string|null} businessDescription
 * @property {string|null} targetAudience
 * @property {string[]|null} businessGoals
 * @property {string[]|null} currentChannels
 */

/**
 * @typedef {Object} AgentContext
 * @property {string} agencyId
 * @property {string} clientId
 * @property {string} analysisId
 * @property {ClientData} clientData
 * @property {AgentResult[]} [previousResults]
 * @property {Object} [metadata]
 */

/**
 * @typedef {'completed'|'failed'|'skipped'} AgentStatusValue
 */

/**
 * @typedef {Object} AgentResult
 * @property {string} agentName
 * @property {AgentStatusValue} status
 * @property {string} summary
 * @property {*} [findings]
 * @property {*} [recommendations]
 * @property {*} [metrics]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} AIModelProvider
 * @property {(input:Object)=>Promise<string>} generateText
 * @property {(input:Object)=>Promise<Object>} generateStructuredOutput
 */

export {}
