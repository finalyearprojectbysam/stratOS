// JSDoc typedefs for the model-provider layer.

/**
 * @typedef {Object} GenerateTextInput
 * @property {string} system
 * @property {string} [prompt]
 * @property {Object} [context]
 */

/**
 * @typedef {Object} GenerateStructuredInput
 * @property {string} system
 * @property {import('zod').ZodTypeAny} [schema]
 * @property {Object} context
 * @property {Array} [tools]
 * @property {Object} [config]
 * @property {string} [agentId]
 */

export {}
