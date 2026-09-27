// Standard error codes + error type for agents. Never carries secrets.
export const ErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_INPUT: 'MISSING_INPUT',
  MODEL_ERROR: 'MODEL_ERROR',
  TIMEOUT: 'TIMEOUT',
  SCHEMA_VALIDATION: 'SCHEMA_VALIDATION',
  DISABLED: 'DISABLED',
  UNKNOWN: 'UNKNOWN',
}

export class AgentError extends Error {
  constructor(message, code = ErrorCodes.UNKNOWN, details = null) {
    super(message)
    this.name = 'AgentError'
    this.code = code
    this.details = details
  }
}

export default { ErrorCodes, AgentError }
