'use strict';

class DangerousAutomationError extends Error {
  constructor(message, cause) {
    super(`Dangerous automation error: ${message}`);
    this.name = 'DangerousAutomationError';
    this.cause = cause;
    this.isDangerousAutomationError = true;
  }
}

function dangerousError(message, cause) {
  if (cause instanceof DangerousAutomationError) return cause;
  return new DangerousAutomationError(message, cause);
}

module.exports = { DangerousAutomationError, dangerousError };
