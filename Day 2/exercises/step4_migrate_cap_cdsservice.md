# Step 4 — Migrate CDSService.ts with SAP's Generated Types

# CAP TypeScript Journey: Prelude — Generate Entity Types with cds-typer

Before you can safely type your CAP service handlers, you need **generated TypeScript interfaces** for your entities. This is where `cds-typer` comes in.

---

## Prerequisites: Install cds-typer

First, add the code generator to your project as a dev dependency:

```bash
npm install --save-dev @cap-js/cds-typer
```

<sub>**code by anubhav trainings**</sub>

This installs the official SAP tool that generates TypeScript type definitions directly from your `.cds` data model.

---

## Generate Types from Your CDS Model

Run the generator on your CDS schema files:

```bash
cds-typer "*"
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 What This Does:</strong> Scans all .cds files in your project and generates TypeScript interfaces for every entity, type, and aspect defined in your data model.
</div>

### Generated Output Structure

This creates a folder (commonly at the project root):

```
@cds-models/
├── index.d.ts
├── CDSService/
│   ├── index.d.ts
│   ├── index.ts
│   └── types.ts
├── CatalogService/
│   ├── index.d.ts
│   ├── index.ts
│   └── types.ts
└── ...
```

<sub>**code by anubhav trainings**</sub>

Each service folder contains:

- **`index.d.ts`** — TypeScript type declaration files (pure types)
- **`index.ts`** — Runtime definitions for entities (classes/interfaces)
- **`types.ts`** — Helper type utilities

These are **auto-generated** — don't edit them. When you update your `.cds` files, re-run `cds-typer "*"` to regenerate.


---

## Quick Reference: JS → TS Syntax Cheat Sheet

| # | Plain JS | TypeScript | Why |
|---|----------|------------|-----|
| 1 | `const cds = require('m')` | `import cds from 'm'` | ES module import (default) |
| 2 | `const { a, b } = require('m')` | `import { a, b } from 'm'` | named imports |
| 3 | `module.exports = class X {}` | `export default class X {}` | default export |
| 4 | `cds.entities('Svc')` | `import { E } from '#cds-models/Svc'` | typed entities from cds-typer |
| 5 | `a && a.b && a.b.c` | `a?.b?.c` | optional chaining |
| 6 | `x \|\| {}` | `x ?? {}` | nullish coalescing (fallback only on null/undefined) |
| 7 | reading an unknown property | `(x as Record<string, unknown>).prop` | assert a "bag of unknown keys" |
| 8 | a query with custom columns | `await SELECT… as Array<{…}>` | assert the shape you asked for |
| 9 | force a type (escape hatch) | `value as unknown as T` | double assertion — use rarely |

> Keep this table handy — each step below is just one row of it applied.

---

## Step 4.1 — Rename the File

Simply rename your file from `.js` to `.ts`:

```bash
Rename-Item d:\solution_mycapapp_ts\srv\CDSService.js CDSService.ts
```

<sub>code by anubhav trainings</sub>

After renaming, run the TypeScript compiler:

```bash
npx tsc --noEmit
```

<sub>code by anubhav trainings</sub>

You'll see a wave of errors. We'll fix them top-to-bottom in the steps below.

---

## Step 4.2 — Convert the Imports (Cheat Sheet Rows 1 & 2)

### Before

```javascript
const cds = require('@sap/cds')
const { flattenPayload, project } = require('../utils/payload-transformer')
const { mapError } = require('../utils/error-mapper')
```

<sub>code by anubhav trainings</sub>

### After

```typescript
import cds from '@sap/cds'
import { flattenPayload, project } from '../utils/payload-transformer'
import { mapError } from '../utils/error-mapper'
```

<sub>code by anubhav trainings</sub>

### Key Concept

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`import cds from '@sap/cds'` is a default import. It works because your `tsconfig.json` has `esModuleInterop: true` (lets you default-import a CommonJS package) and a `paths` entry pointing `@sap/cds` → `@cap-js/cds-types` (SAP's official types). So `cds` is now fully typed, not `any`.*
</span>

---

## Step 4.3 — Convert the Export (Cheat Sheet Row 3)

### Before

```javascript
module.exports = class CDSService extends cds.ApplicationService { init() {
  // ...handlers...
  return super.init()
}}
```

<sub>code by anubhav trainings</sub>

### After

```typescript
export default class CDSService extends cds.ApplicationService {
  init() {
    // ...handlers...
    return super.init()
  }
}
```

<sub>code by anubhav trainings</sub>

### Key Concept

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`export default` is the SAP-recommended shape for a service implementation file — CAP's loader looks for the default export and instantiates it. Functionally identical to `module.exports =`, just typed module syntax.*
</span>

### What Does `init() { … return super.init() }` Actually Do?

This is a fundamental pattern in CAP services. Here's the mental model:

- **`cds.ApplicationService`** is the base class CAP provides. It has an `init()` method that does the framework's own setup (wiring the service to its model, the database, the protocol adapters, etc.).

- **You override `init()`** to add your logic — the `this.before(...)`, `this.after(...)`, `this.on(...)` handler registrations. This is the one official hook where you register handlers.

- **`this.before / after / on`** don't run your code now; they register callbacks that CAP will invoke later, when real requests arrive. `init()` runs once at startup.

- **`return super.init()`** calls the parent class's `init()` (the framework's original setup you overrode) and returns its result. `super` = "the class I extend." Because `super.init()` returns a `Promise`, returning it lets CAP await your service being fully ready before serving traffic.

<span style="background-color: #FFB6C1; padding: 10px; border-radius: 4px; display: block; margin-top: 12px;">
<strong>⚠️ Important:</strong> The pattern reads as: "register my handlers, then hand control back to the framework to finish booting, and report when that's done." If you forgot `return super.init()`, the base framework setup would never run and the service would be broken.
</span>

---

## Step 4.4 — Replace `cds.entities(...)` with Typed Entities (Cheat Sheet Row 4)

### Before (inside `init()`)

```javascript
const { ProductSet, ItemsSet } = cds.entities('CDSService')
```

<sub>code by anubhav trainings</sub>

### After (delete that line; add to the imports at the top)

```typescript
import { ProductSet, ItemsSet } from '#cds-models/CDSService'
```

<sub>code by anubhav trainings</sub>

### Key Concept: The cds-typer Naming Rule

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*For each entity, cds-typer generates two types:*
</span>

| Name | Meaning |
|------|---------|
| `ProductSet` | one row (singular) |
| `ProductSet_` | the collection — literally extends `Array<ProductSet>` |

Each is both a value and a type (it's a class), so `ProductSet` works as the handler target and as a type annotation. Now `this.after('READ', ProductSet, …)` lets CAP infer that the data is a `ProductSet_` array, type-checked against the real fields (`Price?: number | null`, `soldCount?: number | null`, …).

---

## Step 4.5 — Fix the `before('READ')` Handler (Cheat Sheet Rows 5, 6, 7, 9)

### Before

```javascript
this.before ('READ', ProductSet, (req) => {
  const query = (req.http && req.http.req && req.http.req.query) || {}
  if (query.simulateError === 'true') {
    throw new Error('Simulated runtime error while reading ProductSet')
  }
  if (query.simulateError === 'type') {
    const broken = undefined
    return broken.toUpperCase()
  }
})
```

<sub>code by anubhav trainings</sub>

### After

```typescript
this.before('READ', ProductSet, (req) => {
  const query = req.http?.req?.query ?? {}
  if ((query as Record<string, unknown>).simulateError === 'true') {
    throw new Error('Simulated runtime error while reading ProductSet')
  }
  if ((query as Record<string, unknown>).simulateError === 'type') {
    const broken = undefined as unknown as string
    return broken.toUpperCase()   // intentional runtime TypeError (the demo)
  }
})
```

<sub>code by anubhav trainings</sub>

### Key Concepts: Breaking It Down

**1. Optional Chaining with Nullish Coalescing**

```typescript
const query = req.http?.req?.query ?? {}
```

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`req.http` may be undefined; `?.` short-circuits safely and `?? {}` gives a fallback (rows 5 & 6).*
</span>

**2. Assert "Bag of Unknown Keys"**

```typescript
(query as Record<string, unknown>).simulateError
```

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*The Express query type has no `simulateError` key, so we assert "bag of unknown keys" to read it (row 7).*
</span>

**3. Double Assertion Escape Hatch**

```typescript
const broken = undefined as unknown as string
return broken.toUpperCase()   // intentional runtime TypeError (the demo)
```

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*Your demo deliberately crashes by calling `.toUpperCase()` on `undefined`. TS would block that, so the double assertion (row 9) is an intentional escape hatch here only. Normally it's a smell; recognise it as "I'm overriding the compiler on purpose."*
</span>

---

## Step 4.6 — Fix the `after('READ')` Handler (Cheat Sheet Row 8)

### Before

```javascript
this.after ('READ', ProductSet, async (productSet, req) => {
  const rows = project(flattenPayload(productSet), ['ProductId', 'Description', 'Price'])
  console.log('After READ ProductSet', rows)

  let ids = productSet.map(p => p.ProductId)

  const partnerCount = await SELECT.from(ItemsSet)
                               .columns('ProductId', {func: 'count', as: 'count'})
                               .where({'ProductId': {in: ids}})
                               .groupBy('ProductId');

  for (const p of productSet) {
    const partner = partnerCount.find(pc => pc.ProductId === p.ProductId)
    p.soldCount = partner ? partner.count : 0
  }
})
```

<sub>code by anubhav trainings</sub>

### After

```typescript
this.after('READ', ProductSet, async (productSet, req) => {
  const rows = project(flattenPayload(productSet), ['ProductId', 'Description', 'Price'])
  console.log('After READ ProductSet', rows)

  const ids = productSet.map(p => p.ProductId)

  const partnerCount = await SELECT.from(ItemsSet)
    .columns('ProductId', { func: 'count', as: 'count' })
    .where({ ProductId: { in: ids } })
    .groupBy('ProductId') as Array<{ ProductId: string; count: number }>

  for (const p of productSet) {
    const partner = partnerCount.find(pc => pc.ProductId === p.ProductId)
    p.soldCount = partner ? partner.count : 0
  }
})
```

<sub>code by anubhav trainings</sub>

### Key Concepts

**1. Type Inference from Typed Entities**

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`productSet` is inferred as a `ProductSet_` array (from the typed entity in Step 4.4), so `.map(p => p.ProductId)` is type-checked — `p` is a `ProductSet`.*
</span>

**2. Assert Custom Column Shape**

```typescript
const partnerCount = await SELECT.from(ItemsSet)
  .columns('ProductId', { func: 'count', as: 'count' })
  .where({ ProductId: { in: ids } })
  .groupBy('ProductId') as Array<{ ProductId: string; count: number }>
```

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*CDS Query Language with custom columns (`{ func: 'count', as: 'count' }`) can't be precisely typed by the runtime, so you assert the exact shape you asked for. Now `partner.count` compiles (row 8).*
</span>

**3. Nullable Property Assignment**

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`p.soldCount = partner ? partner.count : 0` — `soldCount?: number | null` accepts a number, so this is valid.*
</span>

<span style="background-color: #FFB6C1; padding: 10px; border-radius: 4px; display: block; margin-top: 12px;">
<strong>Note:</strong> The ItemsSet handlers below this need no changes beyond being inside the typed class — `flattenPayload` already accepts unknown.
</span>

---

## Step 4.7 — Fix the Error Handler

### Before

```javascript
this.on('error', (err, req) => {
  const normalised = mapError(err)
  console.error('CDSService error', normalised)
  err.code = normalised.code
  err.message = normalised.message
})
```

<sub>code by anubhav trainings</sub>

### After

```typescript
this.on('error', (err, req) => {
  const normalised = mapError(err)
  console.error('CDSService error', normalised)
  const e = err as { code?: string; message?: string }
  e.code = normalised.code
  e.message = normalised.message
})
```

<sub>code by anubhav trainings</sub>

### Key Concept

<span style="background-color: #90EE90; padding: 8px; border-radius: 4px; display: inline-block;">
*`mapError(err)` already accepts unknown, so that line is fine. But assigning `err.code` can fail if TS types `err` as a plain `Error` (no `code`). Asserting `err as { code?: string; message?: string }` declares the two properties you intend to write. (If your `cds-types` version already types `err.code`, you can skip the `e` alias — try without it first.)*
</span>

---

## Step 4.8 — The Complete Converted File

Here's the full `CDSService.ts` after all steps above:

```typescript
import cds from '@sap/cds'
import { ProductSet, ItemsSet } from '#cds-models/CDSService'
import { flattenPayload, project } from '../utils/payload-transformer'
import { mapError } from '../utils/error-mapper'

export default class CDSService extends cds.ApplicationService {
  init() {

    this.before(['CREATE', 'UPDATE'], ProductSet, async (req) => {
      console.log('Before CREATE/UPDATE ProductSet', req.data)
    })

    this.before('READ', ProductSet, (req) => {
      const query = req.http?.req?.query ?? {}
      if ((query as Record<string, unknown>).simulateError === 'true') {
        throw new Error('Simulated runtime error while reading ProductSet')
      }
      if ((query as Record<string, unknown>).simulateError === 'type') {
        const broken = undefined as unknown as string
        return broken.toUpperCase()   // intentional runtime TypeError (the demo)
      }
    })

    this.after('READ', ProductSet, async (productSet, req) => {
      const rows = project(flattenPayload(productSet), ['ProductId', 'Description', 'Price'])
      console.log('After READ ProductSet', rows)

      const ids = productSet.map(p => p.ProductId)

      const partnerCount = await SELECT.from(ItemsSet)
        .columns('ProductId', { func: 'count', as: 'count' })
        .where({ ProductId: { in: ids } })
        .groupBy('ProductId') as Array<{ ProductId: string; count: number }>

      for (const p of productSet) {
        const partner = partnerCount.find(pc => pc.ProductId === p.ProductId)
        p.soldCount = partner ? partner.count : 0
      }
    })

    this.before(['CREATE', 'UPDATE'], ItemsSet, async (req) => {
      console.log('Before CREATE/UPDATE ItemsSet', req.data)
    })

    this.after('READ', ItemsSet, async (itemsSet, req) => {
      console.log('After READ ItemsSet', flattenPayload(itemsSet))
    })

    this.on('error', (err, req) => {
      const normalised = mapError(err)
      console.error('CDSService error', normalised)
      const e = err as { code?: string; message?: string }
      e.code = normalised.code
      e.message = normalised.message
    })

    return super.init()
  }
}
```

<sub>code by anubhav trainings</sub>

---

## Step 4.9 — Verify Your Work

Run the TypeScript compiler to check for errors:

```bash
npx tsc --noEmit
```

<sub>code by anubhav trainings</sub>

Then run your test suite:

```bash
npm test
```

<sub>code by anubhav trainings</sub>

### Expected Results

<span style="background-color: #FFB6C1; padding: 10px; border-radius: 4px; display: block;">
<strong>✓ Success:</strong> `tsc --noEmit` should be clean for `CDSService.ts` + both util files. The `CatalogService` tests still run against the plain-JS `CatalogService.js` (ignored by tsc under `allowJs: false`) and stay green.
</span>

---

## Next Steps

Once Steps 4.1–4.7 are complete and `tsc` is clean, proceed to **Step 5: Convert CatalogService.ts** — covering actions, functions, and `cds.tx` typing — in the same step-by-step format.

---

<div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">

**code by anubhav trainings**  
*Professional TypeScript & CAP Development Training*

</div>
