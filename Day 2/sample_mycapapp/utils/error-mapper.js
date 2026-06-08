'use strict'

/**
 * error-mapper.js
 *
 * Normalises heterogeneous errors (CAP req errors, OData error payloads, plain
 * JS Error instances, strings) into a single consistent shape:
 *   { code, message, status, target? }
 */

const DEFAULT_STATUS = 500
const DEFAULT_CODE = 'INTERNAL_SERVER_ERROR'

/** Coerce anything into a valid HTTP-ish status, falling back to 500. */
function toStatus (value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 400 && n <= 599 ? n : DEFAULT_STATUS
}

/** OData V4 messages can be a string or { value: '...' }. */
function extractMessage (message) {
  if (message == null) return 'Unknown error'
  if (typeof message === 'string') return message
  if (typeof message.value === 'string') return message.value
  return String(message)
}

/**
 * Normalise any error-like value into { code, message, status, target? }.
 */
function mapError (err) {
  if (err == null) {
    return { code: DEFAULT_CODE, message: 'Unknown error', status: DEFAULT_STATUS }
  }
  if (typeof err === 'string') {
    return { code: DEFAULT_CODE, message: err, status: DEFAULT_STATUS }
  }

  // OData payloads wrap the real error under `error`.
  const source = err.error && typeof err.error === 'object' ? err.error : err

  const normalised = {
    code: source.code != null ? String(source.code) : DEFAULT_CODE,
    message: extractMessage(source.message),
    status: toStatus(source.status != null ? source.status : source.statusCode)
  }
  if (source.target) normalised.target = source.target
  return normalised
}

module.exports = {
  DEFAULT_STATUS,
  DEFAULT_CODE,
  toStatus,
  extractMessage,
  mapError
}
