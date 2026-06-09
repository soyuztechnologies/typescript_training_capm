# Step 4 — Migrate CDSService.ts with SAP's Generated Types

Now that `cds-typer` has generated the entity types, you can migrate your main service handler with full type safety. This step ties everything together: you'll use the generated entity types, leverage your utility functions with proper typing, and navigate the most complex type scenarios in the CAP ecosystem.

---

## 4a. Understanding Generated Types: The Naming Rule

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Single Most Important Thing:</strong> cds-typer generates TWO types for every entity. The naming rule determines which one to use.
</div>

Open `@cds-models/CDSService/index.ts`. For every entity, you'll find two types:

| Generated Name | Meaning | Example Use |
|---|---|---|
| `ProductSet` | One row (singular) | A single product object |
| `ProductSet_` (trailing underscore) | The collection — extends `Array<ProductSet>` | The array a READ returns |

**This is crucial:**

```typescript
ProductSet    // The row type — one entity instance
ProductSet_   // The array type — the collection returned by queries
```

Each is **both a type AND a runtime value** (it's a class), which is why you can:

- Use `ProductSet` directly as the handler target
- Use `ProductSet` as a type annotation
- Use `ProductSet_` to type the array returned by READ operations

This **replaces your old `cds.entities('CDSService')` string-based lookup** with something fully typed.

### Optional & Nullable Fields

Notice the generated fields are **all optional and nullable**:

```typescript
interface ProductSet {
  ProductId?: string | null
  Price?: number | null
  soldCount?: number | null
  // ...
}
```

<span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Why nullable:*</span> CAP is being **honest** — any field may be absent in a partial payload. Strict mode will make you respect that.

---

## 4b. Rename and Convert CDSService.js

Rename the file:

```bash
Rename-Item d:\solution_mycapapp_ts\srv\CDSService.js CDSService.ts
```

<sub>**code by anubhav trainings**</sub>

Now replace the entire file with the fully-typed version:

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
// ✅ NEW
import cds from '@sap/cds'
export default class CDSService extends cds.ApplicationService {
  // ...
}

// ❌ OLD
// const cds = require('@sap/cds')
// module.exports = class CDSService ...
```

<sub>**code by anubhav trainings**</sub>

This works because of **two things in your `tsconfig.json`:**

- **`esModuleInterop: true`** — lets you default-import a CommonJS module (like `@sap/cds`)
- **`paths` mapping** — points `@sap/cds` at SAP's type package `@cap-js/cds-types`

`export default class` is the **SAP-recommended shape** for a service implementation — CAP's loader knows how to pick up the default export.

### 2. Typed Entities Instead of String-Based Lookup

```typescript
// ✅ NEW — Typed imports from generated models
import { ProductSet, ItemsSet } from '#cds-models/CDSService'

// ❌ OLD — String-based, untyped
// const { ProductSet, ItemsSet } = cds.entities('CDSService')
```

<sub>**code by anubhav trainings**</sub>

This replaces the string-based lookup with direct imports.

**The payoff:**

```typescript
this.after('READ', ProductSet, (productSet, req) => {
  // productSet is now inferred as ProductSet_ (the array type) ✅
  productSet.map(...)         // ✅ type-checked
  const p = productSet[0]     // p is typed as ProductSet (single row)
  p.ProductId                 // ✅ known field, type-safe
})
```

The `#cds-models/...` is a **Node subpath import** (defined in your package.json `"imports"` field, which already exists). Now CAP's types can infer that `productSet` is a `ProductSet_` array — so `productSet.map()`, array access, and field access are all **fully type-checked** against the real entity shape.

**That's the entire payoff of `cds-typer`.**

### 3. Optional Chaining (?.) and Nullish Coalescing (??)

```typescript
const query = req.http?.req?.query ?? {}
```

<sub>**code by anubhav trainings**</sub>

Replace your old conditional chaining:

```typescript
// ❌ OLD
(req.http && req.http.req && req.http.req.query) || {}

// ✅ NEW
req.http?.req?.query ?? {}
```

<sub>**code by anubhav trainings**</sub>

**How it works:**

- **`?.` (optional chaining)** — safely short-circuits to `undefined` if any step is undefined/null, instead of throwing
- **`?? {}` (nullish coalescing)** — supplies a fallback only if the left side is `null` or `undefined` (not falsy values like `0` or `''`)

This is the **type-safe rewrite** of the old nested conditionals.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*When to use ?? vs ||*</span>

```typescript
query ?? {}          // ✅ use ?? for null-coalescing (intended fallback)
query || {}          // ❌ would also trigger on query === 0, '', false
```

### 4. Type Assertion on Query Parameters

```typescript
const query = req.http?.req?.query ?? {}
if ((query as Record<string, unknown>).simulateError === 'true') {
  // ...
}
```

<sub>**code by anubhav trainings**</sub>

The Express query type doesn't have a `simulateError` property, so reading it directly fails type checking.

We assert it to the familiar `Record<string, unknown>` (your Step 3 friend) to read an arbitrary key:

```typescript
(query as Record<string, unknown>).simulateError
```

Now TypeScript allows the property access.

### 5. Double Assertion: Intentional Deliberate Bug

```typescript
if ((query as Record<string, unknown>).simulateError === 'type') {
  const broken = undefined as unknown as string
  return broken.toUpperCase()   // ← intentional runtime TypeError
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Learning Pattern:</strong> This is an escape hatch. Double assertion is usually a code smell — recognize it, and know it's a red flag.
</div>

**What's happening:**

- `undefined as unknown as string` is a **double assertion**
- TypeScript normally rejects assigning `undefined` to `string` at compile time
- The double assertion bypasses that check: `undefined` → (unknown) → `string`
- Then calling `.toUpperCase()` on `undefined` **throws a runtime TypeError** — the whole point of this demo

The reason: **to show error handling in action.** Good code never uses double assertions; this one deliberately violates type safety to demonstrate the error handler catching a real bug.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*When Double Assertions Are Legitimate*</span>

Almost never. Recognize the pattern, know it's usually a code smell, and refactor away from it. Here it's justified because the runtime error is the educational point.

### 6. Type Assertion on Query Result

```typescript
const partnerCount = await SELECT.from(ItemsSet)
  .columns('ProductId', { func: 'count', as: 'count' })
  .where({ ProductId: { in: ids } })
  .groupBy('ProductId') as Array<{ ProductId: string; count: number }>
```

<sub>**code by anubhav trainings**</sub>

**Why the assertion?**

The **CDS Query Language** (`SELECT ... .columns(...)`) builds columns dynamically at runtime, so the TypeScript compiler can't know the exact shape returned.

You assert the shape you **know you asked for**:

```typescript
as Array<{ ProductId: string; count: number }>
```

Now `partner.count` type-checks. This is the **standard, accepted way** to type a custom-projection query result.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Custom Projections Always Need as*</span>

When you use `SELECT ... .columns(custom, fields)`, TypeScript loses track of the exact return type. Assert the shape you intend.

---

## 4d. Two Friction Points You Might Still Hit

### Issue 1: err.code Property Not Found

Depending on how `cds-types` types `err`, TypeScript may say:

```
Property 'code' does not exist on type 'Error'
```

**Fix:**

```typescript
const e = err as { code?: string; message?: string }
e.code = normalised.code
e.message = normalised.message
```

<sub>**code by anubhav trainings**</sub>

This asserts `err` to a shape with optional `code` and `message` properties, so the assignment is type-safe.

### Issue 2: productSet Inferred as Single Row, Not Array

If type inference gives you a single-row type instead of the array, explicitly annotate the parameter:

```typescript
// ❌ Without annotation (might infer single ProductSet):
this.after('READ', ProductSet, async (productSet, req) => {

// ✅ With annotation (explicit ProductSet_):
this.after('READ', ProductSet, async (productSet: ProductSet_, req) => {
```

<sub>**code by anubhav trainings**</sub>

Make sure you import `ProductSet_` alongside `ProductSet`:

```typescript
import { ProductSet, ProductSet_, ItemsSet } from '#cds-models/CDSService'
```

<sub>**code by anubhav trainings**</sub>

---

## 4e. Verify Everything

Run the type checker and tests:

```bash
npx tsc --noEmit
npm test
```

<sub>**code by anubhav trainings**</sub>

**Expected results:**

- ✅ `tsc --noEmit` should be **clean** for:
  - `CDSService.ts` (newly migrated)
  - `utils/error-mapper.ts` (from Step 2)
  - `utils/payload-transformer.ts` (from Step 3)

- ✅ `npm test` should be **all green**:
  - The two `CatalogService` tests still exercise `CatalogService.js` (still plain JS)
  - They're ignored by `tsc` since `allowJs: false` by default
  - They should stay green — runtime logic is unchanged

---

## Troubleshooting

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Normal Friction Points:</strong> This file has the most type friction of anything so far. Expect to hit one or two of the spots in 4d — that's normal.
</div>

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Property 'code' does not exist on type...` | Error type doesn't have custom properties | Wrap with `as { code?: string; ... }` |
| `productSet is not an array` | Type inference inferred single row | Add explicit `: ProductSet_` annotation |
| `Property 'ProductId' does not exist` | Using single row type instead of array | Use `ProductSet_` instead of `ProductSet` |
| `Cannot read properties of undefined` | Optional field accessed without null-check | Use optional chaining: `p?.ProductId` |

### Debugging Type Inference

To see what TypeScript inferred as a type, **hover over the variable in VS Code** — the tooltip shows the inferred type.

If it says `ProductSet` instead of `ProductSet_`, that's the Issue #2 from 4d — add the explicit annotation.

---

## What You've Accomplished

After completing 4a–4e, you've:

✅ **Learned the naming rule** — `ProductSet` vs `ProductSet_`

✅ **Migrated to ES imports** — fully leveraging type inference

✅ **Typed entity handlers** — `this.after('READ', ProductSet, ...)` now type-checks the array

✅ **Used type assertions** — for dynamic queries and unsafe patterns

✅ **Navigated strict mode friction** — optional chaining, nullish coalescing, type guards

✅ **Integrated your utility functions** — `flattenPayload` and `project` work with typed data

---

## Next: Checkpoint Questions

After completing 4b–4e, answer these:

1. **Is `tsc --noEmit` clean for all three files?**
2. **Do all tests still pass?**
3. **Any TS errors you can't resolve?**

---

## What's Next

**Step 5 — CatalogService.ts** covers:

- Actions and functions (not just READ/CREATE/UPDATE)
- CDS transaction typing (`cds.tx`)
- More complex handler signatures

Once CatalogService.ts is clean, **Step 6** flips `allowJs: false` for the final strict TypeScript-only state.

---

<footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
<strong>code by anubhav trainings</strong> — CAP TypeScript Step 4: CDSService Migration with Generated Types
</footer>
