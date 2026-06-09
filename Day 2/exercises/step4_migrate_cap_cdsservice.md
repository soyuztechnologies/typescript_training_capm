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

## 4a. The Key Concept: What cds-typer Generated

Open `@cds-models/CDSService/index.ts`. For every entity, `cds-typer` produced **two types** — this naming rule is **the single most important thing** to learn:

| Generated Name | Meaning | Example Use |
|---|---|---|
| `ProductSet` | One row (singular) | A single product |
| `ProductSet_` (trailing `_`) | The collection — extends `Array<ProductSet>` | The array a READ returns |

**ProductSet** is the row type, **ProductSet_** is the array type. Each is both a type and a runtime value (it's a class), which is why you can use `ProductSet` directly as the handler target and as a type.

This **replaces your old `cds.entities('CDSService')` string-based lookup** with something fully typed.

### Optional & Nullable Fields

Notice the fields are all optional and nullable — e.g. `Price?: number | null`, `soldCount?: number | null`.

That's CAP being honest: **any field may be absent in a partial payload.** Strict mode will make you respect that.

---

## 4b. Rename and Convert

Rename the file:

```bash
Rename-Item d:\solution_mycapapp_ts\srv\CDSService.js CDSService.ts
```

<sub>**code by anubhav trainings**</sub>

Replace the entire contents with this fully-typed version:

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
      err.code = normalised.code
      err.message = normalised.message
    })

    return super.init()
  }
}
```

<sub>**code by anubhav trainings**</sub>

---

## 4c. The Concepts Behind Each Change

### 1. require → import (and module.exports → export default)

```typescript
import cds from '@sap/cds'
export default class CDSService extends cds.ApplicationService {
  // ...
}
```

<sub>**code by anubhav trainings**</sub>

`import cds from '@sap/cds'` works because of two things in your `tsconfig.json`:

- **`esModuleInterop: true`** — lets you default-import a CommonJS module
- **`paths` mapping** — points `@sap/cds` at SAP's type package `@cap-js/cds-types`

`export default class` is the **SAP-recommended shape** for a service implementation — CAP's loader knows how to pick up the default export.

---

### 2. Typed Entities Instead of cds.entities(...)

```typescript
import { ProductSet, ItemsSet } from '#cds-models/CDSService'
```

<sub>**code by anubhav trainings**</sub>

This replaces:

```typescript
const { ProductSet, ItemsSet } = cds.entities('CDSService')
```

<sub>**code by anubhav trainings**</sub>

The `#cds-models/...` is a Node subpath import (defined in your `package.json` `"imports"` field, which already exists).

Now when you write:

```typescript
this.after('READ', ProductSet, (productSet, req) => …)
```

<sub>**code by anubhav trainings**</sub>

CAP's types infer that `productSet` is a `ProductSet_` array — so `productSet.map(...)` and `p.soldCount` are type-checked against the real entity shape.

**That's the entire payoff of `cds-typer`.**

---

### 3. Optional Chaining (?.) and Nullish Coalescing (??)

```typescript
const query = req.http?.req?.query ?? {}
```

<sub>**code by anubhav trainings**</sub>

`req.http` can be undefined (not every request has an HTTP layer).

- **`?.`** safely short-circuits to `undefined` instead of throwing
- **`??`** supplies a fallback

This is the type-safe rewrite of your old:

```typescript
(req.http && req.http.req && req.http.req.query) || {}
```

<sub>**code by anubhav trainings**</sub>

---

### 4. as Record<string, unknown> on the query

```typescript
if ((query as Record<string, unknown>).simulateError === 'true') {
  throw new Error('Simulated runtime error while reading ProductSet')
}
```

<sub>**code by anubhav trainings**</sub>

The Express query type doesn't have a `simulateError` property, so reading it directly fails. We assert it to the familiar `Record<string, unknown>` (your Step 3 friend) to read an arbitrary key.

---

### 5. Double Assertion: as unknown as string (The Deliberate-Bug Line)

```typescript
if ((query as Record<string, unknown>).simulateError === 'type') {
  const broken = undefined as unknown as string
  return broken.toUpperCase()   // intentional runtime TypeError (the demo)
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Learning Pattern:</strong> Your demo intentionally throws a TypeError by calling .toUpperCase() on undefined. This is an escape hatch showing that double assertions are usually a code smell.
</div>

TypeScript would normally reject this at compile time. `undefined as unknown as string` is an **escape hatch** that tells TS "trust me."

Normally a double assertion is a **code smell** — here it's justified because the **runtime error is the whole point of the demo.**

Good to recognize the pattern and know it's **usually a red flag.**

---

### 6. as Array<{ ProductId: string; count: number }> on the Query Result

```typescript
const partnerCount = await SELECT.from(ItemsSet)
  .columns('ProductId', { func: 'count', as: 'count' })
  .where({ ProductId: { in: ids } })
  .groupBy('ProductId') as Array<{ ProductId: string; count: number }>
```

<sub>**code by anubhav trainings**</sub>

CDS Query Language (`SELECT ... .columns(...)`) builds columns dynamically, so the runtime can't give a precise type — it comes back loosely typed.

You assert the shape you **know you asked for**, so `partner.count` type-checks.

**This is the standard, accepted way to type a custom-projection query result.**

---

## 4d. Two Friction Points You Might Still Hit

### Issue 1: err.code Property Not Found

Depending on how `cds-types` types `err`, TypeScript may say:

```
Property 'code' does not exist
```

**Fix:**

```typescript
const e = err as { code?: string; message?: string }
e.code = normalised.code
e.message = normalised.message
```

<sub>**code by anubhav trainings**</sub>

---

### Issue 2: productSet Inferred as Single Row, Not Array

If inference gives you a single-row type instead of the array, annotate the parameter:

```typescript
this.after('READ', ProductSet, async (productSet: ProductSet_, req) => {
  // ...
})
```

<sub>**code by anubhav trainings**</sub>

Make sure you import `ProductSet_` alongside `ProductSet`:

```typescript
import { ProductSet, ProductSet_, ItemsSet } from '#cds-models/CDSService'
```

<sub>**code by anubhav trainings**</sub>

---

## 4e. Verify

Run the type checker and tests:

```bash
npx tsc --noEmit
```

<sub>**code by anubhav trainings**</sub>

```bash
npm test
```

<sub>**code by anubhav trainings**</sub>

The two `CatalogService` tests still exercise `CatalogService.js` (still plain JS, ignored by `tsc` since `allowJs: false`), and they should stay green.

`tsc --noEmit` should be clean for `CDSService.ts` + both util files.

---

## Checkpoint Questions

Do 4b–4e, then answer:

1. **Is `tsc --noEmit` clean for all files?**

2. **Do all tests pass?**

3. **Any TS errors you can't resolve?**

---

## Next Steps

Once `CDSService.ts` is clean, **Step 5** is `CatalogService.ts`:

- Actions and functions
- CDS transaction typing (`cds.tx`)
- More complex handler signatures

Then **Step 6** flips `allowJs: false` for the final fully TypeScript-compliant state.

---

<footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
<strong>code by anubhav trainings</strong> — CAP TypeScript Step 4: CDSService Migration with Generated Types
</footer>
