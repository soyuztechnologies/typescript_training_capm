# Step 6 — Convert the Unit Tests (`*.test.js` → `*.test.ts`)

> Migrating the **Jest** suite to TypeScript. Both test files keep their assertions
> byte-for-byte — we only change *how the modules are imported* and add a few
> type annotations where strict mode demands them. The big lesson of this step is
> not in the test code at all: it is the **`CDS_TYPESCRIPT` flag** that lets CAP
> find your `.ts` service handlers at runtime.
>
> Every change below is shown as **Before (JS) → After (TS)**, and the complete
> converted files (fully commented) are listed at the end.

---

## 📋 Cheat Sheet (every move in this step)

| # | Before — Plain JS | After — TypeScript | Why |
|---|-------------------|--------------------|-----|
| 1 | `const { a } = require('m')` | `import { a } from 'm'` | named import |
| 2 | `const cds = require('@sap/cds')` | `import cds from '@sap/cds'` | ES default import |
| 3 | `'use strict'` | *(delete it)* | ES modules are strict by default |
| 4 | `let srv` | `let srv: Service` | type the connected service handle |
| 5 | `const asAdmin = fn => …` | `const asAdmin = (fn: () => any): Promise<any> => …` | a parameter with no type is an implicit `any` error under `strict` |
| 6 | `all.map(o => …)` | `all.map((o: any) => …)` | rows from a loosely-typed CAP query have no element type |
| 7 | `flattenPayload(payload)` | `flattenPayload(payload as any)` | **cast at the call site** — the util's parameter is typed `undefined` |
| 8 | handlers silently missing | set `CDS_TYPESCRIPT` | tell CAP to resolve `.ts` service implementations |

---

## Step 6.1 — Rename Both Test Files

```powershell
Rename-Item d:\solution_mycapapp_ts\test\utils.test.js          utils.test.ts
Rename-Item d:\solution_mycapapp_ts\test\CatalogService.test.js CatalogService.test.ts
npx tsc --noEmit
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — ts-jest is already wired: [jest.config.js](../jest.config.js) transforms every `^.+\.ts$` file with `ts-jest` (`isolatedModules`, `module: CommonJS`). So the moment a test file ends in `.ts`, Jest compiles it on the fly — no build step, no separate `outDir`. Renaming is genuinely the first move.*

---

## Step 6.2 — `utils.test.ts`: Imports and `'use strict'`

Cheat-sheet rows 1 and 3.

**Before — `utils.test.js`**

```js
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
```

<sub>code by anubhav trainings</sub>

**After — `utils.test.ts`**

```ts
import {
  isControlKey,
  isPlainObject,
  extractRows,
  flattenRecord,
  flattenPayload,
  project
} from '../utils/payload-transformer'

import {
  toStatus,
  extractMessage,
  mapError,
  DEFAULT_STATUS,
  DEFAULT_CODE
} from '../utils/error-mapper'
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — destructured `require` becomes a named `import`: because Step 2 and Step 3 ended each util with `export { … }`, the test can now pull those same names in with `import { … } from '…'`. Drop the leading `'use strict'` line entirely — every ES/TypeScript module already runs in strict mode, so the directive is redundant.*

---

## Step 6.3 — `utils.test.ts`: The One Call-Site Cast

Cheat-sheet row 7.

**Before — `utils.test.js`**

```js
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
```

<sub>code by anubhav trainings</sub>

**After — `utils.test.ts`**

```ts
test('flattens a wrapped payload into clean rows', () => {
  const payload = {
    value: [
      { ProductId: 'P1', '@odata.etag': 'W/1', Supplier: { Country: 'DE' } },
      { ProductId: 'P2', Supplier: { Country: 'US' } }
    ]
  }
  expect(flattenPayload(payload as any)).toEqual([   // ← cast: param is typed `undefined`
    { ProductId: 'P1', Supplier_Country: 'DE' },
    { ProductId: 'P2', Supplier_Country: 'US' }
  ])
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — this is the only line in `utils.test.ts` that the compiler rejects. `flattenPayload` was migrated with the parameter typed `payload: undefined`, so handing it a real object is a type error. `payload as any` is the same **cast-at-the-call-site** convention used throughout Steps 4 and 5 — it keeps `payload-transformer.ts` untouched. Every other call (`extractRows(42)`, `mapError(null)`, `flattenRecord('hello')`, `toStatus('503')`…) already type-checks, because those functions take `unknown`.*

> [!CAUTION]
> **Special note:** the cleaner long-term fix is to widen the util's signature to `flattenPayload(payload: unknown, …)` so no cast is needed at all. We deliberately *do not* touch the util here — the migration rule for this exercise is "leave the tested code exactly as it was, adapt at the boundary." Recognise `as any` as a conscious boundary cast, not a habit to scatter through your tests.

---

## Step 6.4 — `CatalogService.test.ts`: Import `cds`, Type the Helpers

Cheat-sheet rows 2, 4, 5.

**Before — `CatalogService.test.js`**

```js
'use strict'

const cds = require('@sap/cds')

cds.test(__dirname + '/..')

const asAdmin = fn => cds.tx({ user: cds.User.privileged }, fn)

describe('CatalogService', () => {
  let srv

  beforeAll(async () => {
    srv = await cds.connect.to('CatalogService')
  })
  // …
})
```

<sub>code by anubhav trainings</sub>

**After — `CatalogService.test.ts`**

```ts
import cds, { Service } from '@sap/cds'

cds.test(__dirname + '/..')

const asAdmin = (fn: () => any): Promise<any> =>      // ← typed param + return
  cds.tx({ user: cds.User.privileged }, fn)

describe('CatalogService', () => {
  let srv: Service                                    // ← typed handle

  beforeAll(async () => {
    srv = await cds.connect.to('CatalogService')
  })
  // …
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — type the two things strict mode complains about. (1) `let srv: Service` gives the connected handle a type so `srv.send(…)` / `srv.read(…)` resolve. (2) `asAdmin` had a bare `fn` parameter — an **implicit `any`**, which `strict` forbids — so we annotate it `(fn: () => any): Promise<any>`. `any` is the honest type here: the callbacks return CDS query builders (`INSERT_3`, `SELECT_3`), which are **thenables, not real `Promise`s**, so a tighter `Promise<T>` signature would reject them.*

---

## Step 6.5 — `CatalogService.test.ts`: Annotate the Query Row

Cheat-sheet row 6.

**Before — `CatalogService.test.js`**

```js
const all = await srv.read('PurchaseOrderSet').columns('GROSS_AMOUNT')
const max = Math.max(...all.map(o => Number(o.GROSS_AMOUNT)))
```

<sub>code by anubhav trainings</sub>

**After — `CatalogService.test.ts`**

```ts
const all = await srv.read('PurchaseOrderSet').columns('GROSS_AMOUNT')
const max = Math.max(...all.map((o: any) => Number(o.GROSS_AMOUNT)))   // ← annotate row
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — a string-named read (`srv.read('PurchaseOrderSet')`) is untyped, so the rows have no element type and `o` would be an implicit `any`. Annotating `(o: any)` makes the intent explicit and clears the error. The assertions below it — `Number(reply[0].GROSS_AMOUNT)`, `o.OverallStatus` — flow from `asAdmin` returning `Promise<any>`, so they need no further changes.*

---

## Step 6.6 — A Type-Gate Side Effect in `CatalogService.ts`

Running the full `tsc --noEmit` for the test files also re-checks `srv/CatalogService.ts`, which surfaces the increment expression that **Step 5 flagged** in its CAUTION.

**Before**

```ts
await tx.update(PurchaseOrderSet_).with({
  GROSS_AMOUNT: { '+=': 20000 },
  NOTE: 'Boosted!!'
}).where(ID)
```

<sub>code by anubhav trainings</sub>

**After**

```ts
await tx.update(PurchaseOrderSet_).with({
  GROSS_AMOUNT: { '+=': 20000 },
  NOTE: 'Boosted!!'
} as any).where(ID)                       // ← increment object is not in the entity type
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Special note:** CDS Query Language is intentionally loosely typed at runtime, so the `{ '+=': 20000 }` increment object is not part of the generated entity type. Asserting the object literal `as any` is the targeted fix Step 5 anticipated — apply it now so the type gate is clean across the whole project, not just the test files.

---

## Step 6.7 — The Real Lesson: Let CAP Find `.ts` Handlers

Compile-clean tests still **failed at runtime** with *"Service CatalogService has no handler for largestOrder."* The cause is in CAP itself — [`@sap/cds/lib/srv/factory.js`](../node_modules/@sap/cds/lib/srv/factory.js):

```js
const exts = process.env.CDS_TYPESCRIPT ? ['.ts','.js','.mjs'] : ['.js','.mjs']
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Special note:** without `CDS_TYPESCRIPT` set, CAP only looks for `.js` / `.mjs` sibling implementations. It never sees `srv/CatalogService.ts`, silently falls back to the generic `app-service.js`, and your custom `before` / `on` handlers never register — so only the plain CRUD tests pass. This is the single most confusing failure of a JS→TS CAP migration.

Set the flag once, for every test run, via a Jest **setup file** — create `test/jest.setup.ts`:

```ts
// CAP only resolves `.ts` service implementations (e.g. srv/CatalogService.ts)
// when CDS_TYPESCRIPT is set — see @sap/cds/lib/srv/factory.js. ts-jest compiles
// the handlers, but cds.test() still has to *find* them, so we enable the flag
// before any test boots the service.
process.env.CDS_TYPESCRIPT = 'true'
```

<sub>code by anubhav trainings</sub>

…and register it in [jest.config.js](../jest.config.js):

**Before**

```js
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: { module: 'CommonJS' }
    }]
  }
}
```

<sub>code by anubhav trainings</sub>

**After**

```js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest.setup.ts'],   // ← runs before any test boots cds
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: { module: 'CommonJS' }
    }]
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `setupFiles` runs in each Jest worker **before** the test module is loaded, so the environment variable is in place by the time `cds.test()` boots the service. This beats prefixing `CDS_TYPESCRIPT=true` on the command line, which is not portable across PowerShell and bash. Configure it once; every `npm test` now resolves the TypeScript handlers automatically.*

---

## Step 6.8 — Verify

```powershell
npx tsc --noEmit   # type gate — clean across every .ts file
npm test           # behaviour gate — 32 tests green, no manual env var
```

<sub>code by anubhav trainings</sub>

```text
Test Suites: 2 passed, 2 total
Tests:       32 passed, 32 total
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — the green suite now proves three things at once: the utils still behave (Steps 2–3), the CatalogService TypeScript handlers run and enforce their rules (Step 5), and the tests themselves compile and execute as TypeScript (this step). Behaviour was preserved end-to-end while the entire authored codebase moved to `.ts`.*

---

# Entire Converted Code (fully commented)

The four files below are the complete result of this step. Comments marked `// ←`
flag the lines that changed during the JS→TS conversion.

---

## `test/jest.setup.ts`

```ts
// CAP only resolves `.ts` service implementations (e.g. srv/CatalogService.ts)
// when CDS_TYPESCRIPT is set — see @sap/cds/lib/srv/factory.js. ts-jest compiles
// the handlers, but cds.test() still has to *find* them, so we enable the flag
// before any test boots the service.
process.env.CDS_TYPESCRIPT = 'true'
```

<sub>code by anubhav trainings</sub>

---

## `jest.config.js`

```js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest.setup.ts'],   // ← NEW: sets CDS_TYPESCRIPT before tests
  transform: {
    '^.+\\.ts$': ['ts-jest', {                    // ts-jest compiles every .ts test on the fly
      isolatedModules: true,
      tsconfig: { module: 'CommonJS' }
    }]
  }
}
```

<sub>code by anubhav trainings</sub>

---

## `test/utils.test.ts`

```ts
// ← was `'use strict'` + two `require(...)` blocks; now ES `import`s of the
//   names each util `export {}`s (Steps 2 & 3).
import {
  isControlKey,
  isPlainObject,
  extractRows,
  flattenRecord,
  flattenPayload,
  project
} from '../utils/payload-transformer'

import {
  toStatus,
  extractMessage,
  mapError,
  DEFAULT_STATUS,
  DEFAULT_CODE
} from '../utils/error-mapper'

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
      // isPlainObject takes `unknown`, so primitives/null pass type-checking unchanged
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
      // 42 and null are fine: extractRows' parameter is `unknown`
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
      // strings and numbers accepted because the parameter is `unknown`
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
      expect(flattenPayload(payload as any)).toEqual([   // ← only cast in this file
        { ProductId: 'P1', Supplier_Country: 'DE' },
        { ProductId: 'P2', Supplier_Country: 'US' }
      ])
    })
  })

  describe('project', () => {
    // rows is Array<{...}>, assignable to project's Array<Record<string, unknown>> — no cast
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
      // toStatus takes `unknown`, so number and string args both type-check
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
      // mapError takes `unknown`; null/string/object args all type-check
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
```

<sub>code by anubhav trainings</sub>

---

## `test/CatalogService.test.ts`

```ts
// ← was `'use strict'` + `const cds = require('@sap/cds')`; now a default import
//   plus the named `Service` type for the connected handle.
import cds, { Service } from '@sap/cds'

// Boot the CAP service against an in-memory SQLite DB (seeded from db/data/*.csv).
// Points at the project root (one level up from /test).
cds.test(__dirname + '/..')

// CatalogService is annotated `requires: 'authenticated-user'`, so every call
// must run with a user. We run each operation inside a privileged transaction,
// which satisfies the auth check while still executing all custom handlers.
const asAdmin = (fn: () => any): Promise<any> =>          // ← typed param + return (was bare `fn`)
  cds.tx({ user: cds.User.privileged }, fn)

describe('CatalogService', () => {
  let srv: Service                                         // ← typed handle (was `let srv`)

  beforeAll(async () => {
    srv = await cds.connect.to('CatalogService')
  })

  describe('largestOrder() function', () => {
    test('returns exactly one order', async () => {
      const reply = await asAdmin(() => srv.send('largestOrder'))
      expect(Array.isArray(reply)).toBe(true)
      expect(reply).toHaveLength(1)
    })

    test('returns the order with the highest GROSS_AMOUNT', async () => {
      const { reply, max } = await asAdmin(async () => {
        const reply = await srv.send('largestOrder')
        const all = await srv.read('PurchaseOrderSet').columns('GROSS_AMOUNT')
        const max = Math.max(...all.map((o: any) => Number(o.GROSS_AMOUNT)))   // ← annotate row
        return { reply, max }
      })
      expect(Number(reply[0].GROSS_AMOUNT)).toBe(max)      // reply is `any` (from asAdmin) — indexes freely
    })
  })

  describe('EmployeeSet salary validation (before CREATE/UPDATE)', () => {
    test('rejects a salary >= 1,000,000', async () => {
      await expect(
        asAdmin(() =>
          srv.create('EmployeeSet').entries({
            nameFirst: 'Rich',
            nameLast: 'Banks',
            salaryAmount: 1500000
          })
        )
      ).rejects.toMatchObject({
        code: 500,
        message: 'Salary must be less than a million for employee'
      })
    })

    test('accepts a salary below the limit', async () => {
      const created = await asAdmin(() =>
        srv.create('EmployeeSet').entries({
          nameFirst: 'Modest',
          nameLast: 'Earner',
          salaryAmount: 50000
        })
      )
      expect(created).toMatchObject({ salaryAmount: 50000 })
      expect(created.ID).toBeDefined()                     // `created` is `any`, so `.ID` is fine
    })
  })

  describe('PurchaseOrderSet projection', () => {
    test('exposes the computed OverallStatus text for each row', async () => {
      const orders = await asAdmin(() => srv.read('PurchaseOrderSet').limit(5))
      expect(orders.length).toBeGreaterThan(0)
      const allowed = ['New', 'Pending', 'Approved', 'Rejected', 'Delivered']
      for (const o of orders) {                            // `orders` is `any` — iterating needs no cast
        expect(allowed).toContain(o.OverallStatus)
      }
    })
  })
})
```

<sub>code by anubhav trainings</sub>

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
