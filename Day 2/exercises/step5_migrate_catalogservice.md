# Step 5 — Convert `CatalogService.js` → `CatalogService.ts`

> Migrating a CAP service with **actions, functions, and transactions** to TypeScript.
> This file introduces the strict-mode rule that **caught errors are `unknown`**,
> plus `cds.tx` typing and numeric-field coercion.

---

## 📋 Cheat Sheet (new rows for this step)

| # | Plain JS | TypeScript | Why |
|---|----------|-----------|-----|
| 1 | `const cds = require('m')` | `import cds from 'm'` | ES default import |
| 2 | `cds.entities('Svc')` | `import { E_ } from '#cds-models/Svc'` | typed entities — **plural `_` class** |
| 3 | `module.exports = class X {}` | `export default class X {}` | default export |
| 4 | `catch (e) { e.toString() }` | `catch (e) { String(e) }` | under `strict`, a caught error is `unknown` |
| 5 | `parseFloat(numField)` | `parseFloat(String(numField))` | coerce a typed `number \| null` to the `string` `parseFloat` wants |
| 6 | `req.params[0].ID` | `(req.params[0] as { ID: string }).ID` | `req.params` entries are loosely typed |
| 7 | `async (req, res) => …` | `async (req) => …` | drop the unused legacy `res` param |

---

## Step 5.1 — Rename the File

```powershell
Rename-Item d:\solution_mycapapp_ts\srv\CatalogService.js CatalogService.ts
npx tsc --noEmit
```

<sub>code by anubhav trainings</sub>

---

## Step 5.2 — Imports, Export, Typed Entities

Cheat-sheet rows 1, 2, 3.

```ts
import cds from '@sap/cds'
import { EmployeeSet_, PurchaseOrderSet_, PurchaseItemsSet_ } from '#cds-models/CatalogService'

export default class CatalogService extends cds.ApplicationService {
  init() {
    // handlers…
    return super.init()
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — same three moves as Step 4: default-import `cds`, named-import the **plural `_`** entity classes (replacing the `cds.entities('CatalogService')` string lookup), and `export default class`. The `init() { … return super.init() }` skeleton is unchanged — register handlers, then hand control back to the framework to finish booting.*

---

## Step 5.3 — `EmployeeSet` Salary Validation

Cheat-sheet row 5.

```ts
this.before(['CREATE', 'UPDATE'], EmployeeSet_, async (req) => {
  console.log('Aa gaya ' + req.data.salaryAmount)
  if (parseFloat(String(req.data.salaryAmount)) >= 1000000) {
    req.error(500, 'Salary must be less than a million for employee')
  }
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — coerce before you call: because you passed the typed `EmployeeSet_`, CAP infers `req.data` as a single `EmployeeSet` row, so `req.data.salaryAmount` is `number | null | undefined` — not a `string`. `parseFloat` wants a `string`, so wrap it: `parseFloat(String(req.data.salaryAmount))`. Behaviour is identical; the types now line up.*

---

## Step 5.4 — The Plain Logging Handlers

These only log, so no edits are needed beyond the plural entity class.

```ts
this.after('READ', EmployeeSet_, async (employeeSet, req) => {
  console.log('After READ EmployeeSet', employeeSet)
})
this.before(['CREATE', 'UPDATE'], PurchaseOrderSet_, async (req) => {
  console.log('Before CREATE/UPDATE PurchaseOrderSet', req.data)
})
this.after('READ', PurchaseOrderSet_, async (purchaseOrderSet, req) => {
  console.log('After READ PurchaseOrderSet', purchaseOrderSet)
})
this.before(['CREATE', 'UPDATE'], PurchaseItemsSet_, async (req) => {
  console.log('Before CREATE/UPDATE PurchaseItemsSet', req.data)
})
this.after('READ', PurchaseItemsSet_, async (purchaseItemsSet, req) => {
  console.log('After READ PurchaseItemsSet', purchaseItemsSet)
})
```

<sub>code by anubhav trainings</sub>

---

## Step 5.5 — The `boost` Action

Cheat-sheet rows 4 and 7.

```ts
this.on('boost', async (req) => {
  try {
    const ID = req.params[0]
    console.log('Hey Amigo, Your purchase order with id ' + JSON.stringify(req.params[0]) + ' will be boosted')
    const tx = cds.tx(req)
    await tx.update(PurchaseOrderSet_).with({
      GROSS_AMOUNT: { '+=': 20000 },
      NOTE: 'Boosted!!'
    }).where(ID)
  } catch (error) {
    return 'Error ' + String(error)
  }
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — caught errors are `unknown`: one of the eight checks inside `strict` (`useUnknownInCatchVariables`) types the `catch` variable as `unknown`, so `error.toString()` is rejected. `String(error)` works on any value and produces the same `"Error: message"` text, preserving behaviour. Also drop the unused legacy `res` parameter — a 2-argument handler is not assignable to CAP's 1-argument handler type.*

> [!CAUTION]
> **Special note:** if TypeScript objects to the increment expression `{ '+=': 20000 }` in `.with(...)`, assert that object: `.with({ GROSS_AMOUNT: { '+=': 20000 }, NOTE: 'Boosted!!' } as any)`. CDS Query Language is intentionally loosely typed at runtime, so a targeted cast here is acceptable.

---

## Step 5.6 — The `largestOrder` Function

Cheat-sheet rows 4 and 7.

```ts
this.on('largestOrder', async (req) => {
  try {
    const tx = cds.tx(req)
    const reply = await tx.read(PurchaseOrderSet_).orderBy({ GROSS_AMOUNT: 'desc' }).limit(1)
    return reply
  } catch (error) {
    return 'Error ' + String(error)
  }
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — same two fixes as `boost`: drop `res`, and use `String(error)` in the catch. The `tx.read(PurchaseOrderSet_).orderBy(...).limit(1)` chain returns the array your `CatalogService.test.js` asserts on, so the test stays green.*

---

## Step 5.7 — `getOrderDefaults` (no change)

```ts
this.on('getOrderDefaults', async req => {
  return { OVERALL_STATUS: 'N' }
})
```

<sub>code by anubhav trainings</sub>

A plain object return — already type-clean.

---

## Step 5.8 — `setOrderProcessing`

Cheat-sheet row 6.

```ts
this.on('setOrderProcessing', PurchaseOrderSet_, async req => {
  const tx = cds.tx(req)
  await tx.update(PurchaseOrderSet_, (req.params[0] as { ID: string }).ID).set({ OVERALL_STATUS: 'D' })
})
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `req.params` is an array of loosely-typed key values, so `req.params[0]` is effectively `unknown` and you cannot read `.ID` off it directly. Assert the shape you know the key has: `(req.params[0] as { ID: string }).ID`. Same `as` pattern used throughout the migration.*

---

## Step 5.9 — Verify

```powershell
npx tsc --noEmit   # clean across all .ts files
npm test           # all 10 tests green — now exercising the TypeScript handler
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — this time `CatalogService.test.js` is exercising your **TypeScript** handler (compiled by ts-jest). Green tests here prove the migration preserved behaviour, not just that it compiles.*

---

## Final File — `srv/CatalogService.ts`

```ts
import cds from '@sap/cds'
import { EmployeeSet_, PurchaseOrderSet_, PurchaseItemsSet_ } from '#cds-models/CatalogService'

export default class CatalogService extends cds.ApplicationService {
  init() {

    this.before(['CREATE', 'UPDATE'], EmployeeSet_, async (req) => {
      console.log('Aa gaya ' + req.data.salaryAmount)
      if (parseFloat(String(req.data.salaryAmount)) >= 1000000) {
        req.error(500, 'Salary must be less than a million for employee')
      }
    })
    this.after('READ', EmployeeSet_, async (employeeSet, req) => {
      console.log('After READ EmployeeSet', employeeSet)
    })

    this.before(['CREATE', 'UPDATE'], PurchaseOrderSet_, async (req) => {
      console.log('Before CREATE/UPDATE PurchaseOrderSet', req.data)
    })
    this.after('READ', PurchaseOrderSet_, async (purchaseOrderSet, req) => {
      console.log('After READ PurchaseOrderSet', purchaseOrderSet)
    })

    this.before(['CREATE', 'UPDATE'], PurchaseItemsSet_, async (req) => {
      console.log('Before CREATE/UPDATE PurchaseItemsSet', req.data)
    })
    this.after('READ', PurchaseItemsSet_, async (purchaseItemsSet, req) => {
      console.log('After READ PurchaseItemsSet', purchaseItemsSet)
    })

    this.on('boost', async (req) => {
      try {
        const ID = req.params[0]
        console.log('Hey Amigo, Your purchase order with id ' + JSON.stringify(req.params[0]) + ' will be boosted')
        const tx = cds.tx(req)
        await tx.update(PurchaseOrderSet_).with({
          GROSS_AMOUNT: { '+=': 20000 },
          NOTE: 'Boosted!!'
        }).where(ID)
      } catch (error) {
        return 'Error ' + String(error)
      }
    })

    this.on('largestOrder', async (req) => {
      try {
        const tx = cds.tx(req)
        const reply = await tx.read(PurchaseOrderSet_).orderBy({ GROSS_AMOUNT: 'desc' }).limit(1)
        return reply
      } catch (error) {
        return 'Error ' + String(error)
      }
    })

    this.on('getOrderDefaults', async req => {
      return { OVERALL_STATUS: 'N' }
    })

    this.on('setOrderProcessing', PurchaseOrderSet_, async req => {
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_, (req.params[0] as { ID: string }).ID).set({ OVERALL_STATUS: 'D' })
    })

    return super.init()
  }
}
```

<sub>code by anubhav trainings</sub>

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
