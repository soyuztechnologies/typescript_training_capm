# Step 3 — Utility Types: Derive Payloads From One Entity Interface

> Given **one** full BTP service entity interface, derive three related shapes —
> `ReadOnly`, `CreatePayload`, and `UpdatePayload` — using the built-in
> `Readonly`, `Omit`, `Partial` (and friends) **without repeating a single property**.
> One interface stays the **single source of truth**; the payload types follow it
> automatically when it changes. This is reuse at the **type** level — the type-system
> mirror of the generics (Step 1) and decorators (Step 2) you already wrote.

---

## 🎯 What You Will Build

In `srv/exercises/entity-types.ts`: a `PurchaseOrder` interface, then `ReadOnlyOrder`,
`CreateOrder`, and `UpdateOrder` — each *computed* from `PurchaseOrder`. Rename a field on
the entity once and all three payloads update themselves.

---

## 📋 Cheat Sheet

| # | Utility | Syntax | Why |
|---|---------|--------|-----|
| 1 | **`Readonly<T>`** | `Readonly<PurchaseOrder>` | every property becomes immutable — for query results you must not mutate |
| 2 | **`Omit<T, K>`** | `Omit<PurchaseOrder, 'ID' \| 'createdAt'>` | remove server-managed fields the client must not send |
| 3 | **`Partial<T>`** | `Partial<CreateOrder>` | make every field optional — *patch / PATCH* semantics |
| 4 | **`Pick<T, K>`** | `Pick<PurchaseOrder, 'ID'>` | keep **only** the named keys |
| 5 | **Key union** | `'createdAt' \| 'createdBy' \| 'modifiedAt'` | the `K` in `Omit`/`Pick` is a string-literal **union** |
| 6 | **Compose utilities** | `Partial<CreateOrder> & Pick<…, 'ID'>` | combine them for *required-key + optional-rest* shapes |
| 7 | **`satisfies`** | `const x = { … } satisfies CreateOrder` | validate a literal against a type **without widening** it |

---

## Step 3.1 — The Full Entity (Single Source of Truth)

Model a realistic BTP/CAP entity: **business fields** plus CAP's **server-managed** fields
(`ID` and the `@cds.on.insert/update` audit columns). Everything else is derived from this.

```ts
// srv/exercises/entity-types.ts
export interface PurchaseOrder {
  ID: string                 // server-generated key
  OrderNo: string
  GROSS_AMOUNT: number
  CURRENCY: string
  OVERALL_STATUS: string
  NOTE: string | null
  createdAt: string          // server-managed audit fields
  createdBy: string
  modifiedAt: string
  modifiedBy: string
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — this is the **one** place a property is ever declared. The three payload types below are **functions of this type**: each derives its shape from `PurchaseOrder` rather than re-listing fields. Change `OrderNo` to `orderNumber` here, and `CreateOrder`/`UpdateOrder` change with it — no edit, no drift.*

> [!CAUTION]
> **The fields you split on must be deliberate.** `ID`, `createdAt`, `createdBy`,
> `modifiedAt`, `modifiedBy` are set by the **server**, not the client. That grouping is
> exactly what `Omit` will strip for create payloads. Decide which fields are
> server-managed *now* — every derived type depends on that line being right.

---

## Step 3.2 — `ReadOnlyOrder` via `Readonly<T>`

A query returns rows you should **read, not mutate**. `Readonly<T>` freezes every property
at the type level.

```ts
export type ReadOnlyOrder = Readonly<PurchaseOrder>     // row 1
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `Readonly<T>` maps over every key and adds the `readonly` modifier. Now `order.GROSS_AMOUNT = 0` is a **compile error**, which is what you want for the result of a `tx.read(...)` — the row reflects the database and code shouldn't accidentally reassign it. Zero properties retyped; the whole shape comes from `PurchaseOrder`.*

> [!CAUTION]
> **`Readonly<T>` is shallow.** It freezes the top-level properties only. If a property were
> itself an object (e.g. `items: LineItem[]`), `order.items.push(...)` would still be allowed
> — the array reference is `readonly`, its contents are not. For deep immutability you'd need
> a recursive helper; for flat CAP entities like this one, shallow is exactly right.

---

## Step 3.3 — `CreateOrder` via `Omit<T, K>`

On **create**, the client supplies business data; the **server** generates the key and audit
columns. Remove those with `Omit`.

```ts
export type CreateOrder = Omit<
  PurchaseOrder,
  'ID' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy'    // rows 2, 5
>
// => { OrderNo; GROSS_AMOUNT; CURRENCY; OVERALL_STATUS; NOTE }
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `Omit<T, K>` returns `T` minus the keys in the union `K` (row 5). The result is exactly the fields a client is allowed to POST. Because it's derived, adding a new business field to `PurchaseOrder` automatically includes it in `CreateOrder` — you can't forget to update the payload type.*

> [!CAUTION]
> **`Omit` does NOT catch a misspelled key.** `Omit<PurchaseOrder, 'createdAtt'>` (typo)
> compiles **silently** — `Omit`'s second parameter accepts *any* string, not just
> `keyof PurchaseOrder`. So a typo means you *think* you removed a field but didn't. If you
> want misspellings to error, derive the key set with `Pick` (which **does** constrain to real
> keys) or define an explicit `type ServerManaged = 'ID' | 'createdAt' | …` and reuse it.

---

## Step 3.4 — `UpdateOrder` via `Partial` + `Omit` + `Pick`

An **update/PATCH** needs the **key** to find the row, plus **any subset** of the editable
fields. Compose three utilities — still no property names repeated.

```ts
export type UpdateOrder =
  & Pick<PurchaseOrder, 'ID'>        // ID stays required (rows 4, 6)
  & Partial<CreateOrder>             // every editable field optional (rows 3, 6)
// => { ID: string; OrderNo?; GROSS_AMOUNT?; CURRENCY?; OVERALL_STATUS?; NOTE? }
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — read the intersection `&` as "and also": `Pick<PurchaseOrder, 'ID'>` keeps `ID` **required**, while `Partial<CreateOrder>` turns the editable fields **optional**. Reusing `CreateOrder` (already server-fields-free) means you don't re-list the `Omit` keys here — each utility builds on the last. This is the "required key + optional rest" pattern every PATCH endpoint wants.*

> [!CAUTION]
> **Order of composition matters.** Build `Partial` from `CreateOrder`, **not** from the raw
> `PurchaseOrder` — otherwise `createdBy?`, `modifiedAt?`, etc. would leak back in as optional
> fields a client could spoof. Derive payloads from the already-narrowed `CreateOrder` so the
> server-managed fields can never reappear.

---

## Step 3.5 — Prove the Types (Type-Level Tests)

No runtime needed — let the compiler grade you. Use `satisfies` to validate literals against
each derived shape.

```ts
// CreateOrder: server fields are forbidden, business fields required
const newOrder = {
  OrderNo: 'PO-1000',
  GROSS_AMOUNT: 5000,
  CURRENCY: 'EUR',
  OVERALL_STATUS: 'N',
  NOTE: null,
} satisfies CreateOrder                 // row 7 — ✅ compiles
// ID: 'x'                              // ❌ uncomment → error: ID is not in CreateOrder

// UpdateOrder: ID required, everything else optional
const patch = { ID: 'abc-123', OVERALL_STATUS: 'D' } satisfies UpdateOrder   // ✅
// const bad = { OVERALL_STATUS: 'D' } satisfies UpdateOrder                 // ❌ missing ID

// ReadOnlyOrder: cannot reassign
declare const fetched: ReadOnlyOrder
// fetched.GROSS_AMOUNT = 0             // ❌ error: read-only property
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `satisfies` (row 7) checks the literal **conforms** to the type while keeping its precise inferred type (unlike `: CreateOrder`, which would widen `NOTE: null` to `string | null`). Uncommenting any of the ❌ lines turns the compiler into your test suite — proving each derived type enforces exactly the rule you intended.*

---

## Step 3.6 — Verify

```powershell
npx tsc --noEmit        # the only check that matters — these are compile-time-only types
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — utility types are **erased**: they exist only during type-checking and produce **zero** JavaScript. So `tsc --noEmit` is the whole grade. If it's clean and the ❌ lines error when uncommented, every payload shape is correct and tied to the one source interface.*

---

## ✅ Outcome Check

- [ ] `PurchaseOrder` is declared **once**; no payload type repeats its properties.
- [ ] `CreateOrder` **excludes** `ID` and all audit fields.
- [ ] `UpdateOrder` has **`ID` required**, all editable fields **optional**.
- [ ] `ReadOnlyOrder` rejects reassignment.
- [ ] Renaming a field on `PurchaseOrder` updates all three derived types automatically.

---

## Final File — `srv/exercises/entity-types.ts`

```ts
// ── The full entity: the single source of truth ───────────────────────
export interface PurchaseOrder {
  ID: string                 // server-generated key
  OrderNo: string
  GROSS_AMOUNT: number
  CURRENCY: string
  OVERALL_STATUS: string
  NOTE: string | null
  createdAt: string          // server-managed audit fields
  createdBy: string
  modifiedAt: string
  modifiedBy: string
}

// ── Optional: name the server-managed keys once (Pick constrains typos) ─
type ServerManaged = 'ID' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy'

// ── Derived payload types — no property names repeated ────────────────
export type ReadOnlyOrder = Readonly<PurchaseOrder>           // row 1

export type CreateOrder = Omit<PurchaseOrder, ServerManaged>  // rows 2, 5

export type UpdateOrder =
  & Pick<PurchaseOrder, 'ID'>                                 // rows 4, 6
  & Partial<CreateOrder>                                      // rows 3, 6

// ── Type-level tests (compile-time only) ──────────────────────────────
const newOrder = {
  OrderNo: 'PO-1000',
  GROSS_AMOUNT: 5000,
  CURRENCY: 'EUR',
  OVERALL_STATUS: 'N',
  NOTE: null,
} satisfies CreateOrder                                       // row 7

const patch = { ID: 'abc-123', OVERALL_STATUS: 'D' } satisfies UpdateOrder

declare const fetched: ReadOnlyOrder
// Touch the values so the consts aren't flagged as unused:
console.log(newOrder.OrderNo, patch.ID, fetched.GROSS_AMOUNT)
```

<sub>code by anubhav trainings</sub>

---

> [!TIP]
> *Wrap-up — across the three steps you reused logic with **generics** (`ConfigLoader<T>`), reused behaviour with **decorators** (`@LogRequest`), and reused shapes with **utility types** (`Omit`/`Partial`/`Readonly`). All three eliminate duplication so one change propagates everywhere — the core discipline of a maintainable BTP TypeScript codebase.*

---

<sub>Document generated for the TypeScript utility-types exercise · code by anubhav trainings</sub>
