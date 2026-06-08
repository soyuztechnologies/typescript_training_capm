'use strict'

const {
  isControlKey,
  isPlainObject,
  extractRows,
  flattenRecord,
  flattenPayload,
  project
} = require('../utils/payload-transformer')

const {
  toStatus,
  extractMessage,
  mapError,
  DEFAULT_STATUS,
  DEFAULT_CODE
} = require('../utils/error-mapper')

describe('payload-transformer', () => {
  describe('isControlKey', () => {
    test('flags OData / CAP control fields', () => {
      expect(isControlKey('@odata.context')).toBe(true)
      expect(isControlKey('__metadata')).toBe(true)
      expect(isControlKey('*')).toBe(true)
    })
    test('leaves regular fields alone', () => {
      expect(isControlKey('ProductId')).toBe(false)
      expect(isControlKey('soldCount')).toBe(false)
    })
  })

  describe('isPlainObject', () => {
    test('recognises plain objects only', () => {
      expect(isPlainObject({})).toBe(true)
      expect(isPlainObject({ a: 1 })).toBe(true)
      expect(isPlainObject([])).toBe(false)
      expect(isPlainObject(null)).toBe(false)
      expect(isPlainObject('x')).toBe(false)
    })
  })

  describe('extractRows', () => {
    test('returns arrays unchanged', () => {
      const rows = [{ a: 1 }, { a: 2 }]
      expect(extractRows(rows)).toBe(rows)
    })
    test('unwraps OData V4 { value: [] }', () => {
      expect(extractRows({ value: [{ a: 1 }] })).toEqual([{ a: 1 }])
    })
    test('unwraps OData V2 { d: { results: [] } }', () => {
      expect(extractRows({ d: { results: [{ a: 1 }] } })).toEqual([{ a: 1 }])
    })
    test('wraps a single record into an array', () => {
      expect(extractRows({ ProductId: 'P1' })).toEqual([{ ProductId: 'P1' }])
    })
    test('returns [] for primitives', () => {
      expect(extractRows(42)).toEqual([])
      expect(extractRows(null)).toEqual([])
    })
  })

  describe('flattenRecord', () => {
    test('drops control fields', () => {
      const out = flattenRecord({ ProductId: 'P1', '@odata.etag': 'W/1', __meta: 1 })
      expect(out).toEqual({ ProductId: 'P1' })
    })
    test('flattens nested objects with a separator', () => {
      const out = flattenRecord({
        ProductId: 'P1',
        Supplier: { SupplierId: 'S1', Country: 'DE' }
      })
      expect(out).toEqual({
        ProductId: 'P1',
        Supplier_SupplierId: 'S1',
        Supplier_Country: 'DE'
      })
    })
    test('honours a custom separator', () => {
      const out = flattenRecord(
        { a: { b: { c: 1 } } },
        { separator: '.' }
      )
      expect(out).toEqual({ 'a.b.c': 1 })
    })
    test('flattens arrays of nested records element-by-element', () => {
      const out = flattenRecord({
        ProductId: 'P1',
        To_Items: [
          { GrossAmount: 10, '@odata.type': 'x' },
          { GrossAmount: 20 }
        ]
      })
      expect(out).toEqual({
        ProductId: 'P1',
        To_Items: [{ GrossAmount: 10 }, { GrossAmount: 20 }]
      })
    })
    test('returns primitives untouched', () => {
      expect(flattenRecord('hello')).toBe('hello')
      expect(flattenRecord(5)).toBe(5)
    })
  })

  describe('flattenPayload', () => {
    test('flattens a wrapped payload into clean rows', () => {
      const payload = {
        value: [
          { ProductId: 'P1', '@odata.etag': 'W/1', Supplier: { Country: 'DE' } },
          { ProductId: 'P2', Supplier: { Country: 'US' } }
        ]
      }
      expect(flattenPayload(payload)).toEqual([
        { ProductId: 'P1', Supplier_Country: 'DE' },
        { ProductId: 'P2', Supplier_Country: 'US' }
      ])
    })
  })

  describe('project', () => {
    const rows = [
      { ProductId: 'P1', Price: 10, Country: 'DE' },
      { ProductId: 'P2', Price: 20, Country: 'US' }
    ]
    test('keeps only requested fields', () => {
      expect(project(rows, ['ProductId', 'Price'])).toEqual([
        { ProductId: 'P1', Price: 10 },
        { ProductId: 'P2', Price: 20 }
      ])
    })
    test('skips fields that are absent', () => {
      expect(project(rows, ['ProductId', 'Missing'])).toEqual([
        { ProductId: 'P1' },
        { ProductId: 'P2' }
      ])
    })
    test('accepts a single field name', () => {
      expect(project(rows, 'Country')).toEqual([
        { Country: 'DE' },
        { Country: 'US' }
      ])
    })
  })
})

describe('error-mapper', () => {
  describe('toStatus', () => {
    test('keeps valid HTTP error statuses', () => {
      expect(toStatus(404)).toBe(404)
      expect(toStatus('503')).toBe(503)
    })
    test('falls back to the default for invalid values', () => {
      expect(toStatus(200)).toBe(DEFAULT_STATUS)
      expect(toStatus('abc')).toBe(DEFAULT_STATUS)
      expect(toStatus(undefined)).toBe(DEFAULT_STATUS)
    })
  })

  describe('extractMessage', () => {
    test('passes strings through', () => {
      expect(extractMessage('boom')).toBe('boom')
    })
    test('unwraps OData V4 { value }', () => {
      expect(extractMessage({ value: 'boom' })).toBe('boom')
    })
    test('defaults when missing', () => {
      expect(extractMessage(null)).toBe('Unknown error')
    })
  })

  describe('mapError', () => {
    test('handles null / undefined', () => {
      expect(mapError(null)).toEqual({
        code: DEFAULT_CODE,
        message: 'Unknown error',
        status: DEFAULT_STATUS
      })
    })
    test('handles plain strings', () => {
      expect(mapError('something failed')).toEqual({
        code: DEFAULT_CODE,
        message: 'something failed',
        status: DEFAULT_STATUS
      })
    })
    test('normalises a CAP-style error', () => {
      const err = { code: 'NOT_FOUND', message: 'Product not found', status: 404, target: 'ProductId' }
      expect(mapError(err)).toEqual({
        code: 'NOT_FOUND',
        message: 'Product not found',
        status: 404,
        target: 'ProductId'
      })
    })
    test('unwraps an OData error payload', () => {
      const err = { error: { code: '409', message: { value: 'Conflict' }, status: 409 } }
      expect(mapError(err)).toEqual({
        code: '409',
        message: 'Conflict',
        status: 409
      })
    })
    test('falls back when fields are missing', () => {
      expect(mapError({})).toEqual({
        code: DEFAULT_CODE,
        message: 'Unknown error',
        status: DEFAULT_STATUS
      })
    })
  })
})
