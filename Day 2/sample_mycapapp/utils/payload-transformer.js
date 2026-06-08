'use strict'

/**
 * payload-transformer.js
 *
 * Helpers to flatten and clean OData / CAP query responses before they are
 * returned to a consumer or written to a log. CAP/OData payloads frequently
 * arrive wrapped ({ value: [...] } or { d: { results: [...] } }), carry control
 * fields (@odata.*, __metadata, ...) and contain nested associations. These
 * utilities turn that into flat, predictable rows.
 */

// OData / CAP control fields we never want to leak to consumers or logs.
const CONTROL_PREFIXES = ['@', '__', '*']

function isControlKey (key) {
  return CONTROL_PREFIXES.some(prefix => key.startsWith(prefix))
}

function isPlainObject (value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Pull the actual rows out of whatever wrapper the payload uses.
 * Accepts an array, an OData V4 wrapper ({ value }), an OData V2 wrapper
 * ({ d: { results } }) or a single record.
 */
function extractRows (payload) {
  if (Array.isArray(payload)) return payload
  if (isPlainObject(payload)) {
    if (Array.isArray(payload.value)) return payload.value
    if (payload.d && Array.isArray(payload.d.results)) return payload.d.results
    return [payload]
  }
  return []
}

/**
 * Flatten a single record. Nested single-valued objects are merged into the
 * parent using `<parent><separator><child>` keys. Arrays of objects are
 * flattened element-by-element. Control fields are dropped by default.
 */
function flattenRecord (record, options = {}) {
  const { separator = '_', removeControl = true } = options
  if (!isPlainObject(record)) return record

  const out = {}
  for (const [key, value] of Object.entries(record)) {
    if (removeControl && isControlKey(key)) continue

    if (isPlainObject(value)) {
      const nested = flattenRecord(value, { separator, removeControl })
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        out[`${key}${separator}${nestedKey}`] = nestedValue
      }
    } else if (Array.isArray(value)) {
      out[key] = value.map(item => flattenRecord(item, { separator, removeControl }))
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Flatten a full payload (wrapper or array or single record) into a flat array
 * of cleaned rows.
 */
function flattenPayload (payload, options = {}) {
  return extractRows(payload).map(row => flattenRecord(row, options))
}

/**
 * Keep only the requested fields on each row. Missing fields are skipped so the
 * shape stays clean.
 */
function project (rows, fields) {
  const list = Array.isArray(fields) ? fields : [fields]
  return rows.map(row => {
    const picked = {}
    for (const field of list) {
      if (row && field in row) picked[field] = row[field]
    }
    return picked
  })
}

module.exports = {
  CONTROL_PREFIXES,
  isControlKey,
  isPlainObject,
  extractRows,
  flattenRecord,
  flattenPayload,
  project
}
