// JSDoc typedefs for the orchestration layer.
/**
 * @typedef {Object} WorkflowStage
 * @property {number} group
 * @property {string} stageId
 * @property {string} label
 * @property {boolean} parallel
 * @property {string[]} agents  agent ids
 */
/**
 * @typedef {Object} WorkflowEvent
 * @property {string} type
 * @property {string} [stage]
 * @property {string} [agentId]
 * @property {number} [progress]
 * @property {string} [message]
 * @property {Object} [result]
 * @property {string} timestamp
 */
export {}
