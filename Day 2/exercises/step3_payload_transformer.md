# Step 3 — Migrate payload-transformer.js

This is the richest file for learning. You'll meet four new concepts:

- **Record&lt;string, unknown&gt;** — honest types for object bags
- **Union types** — accepting multiple shapes
- **Union return types** — returning different kinds of values
- **Generics** — reusable type templates
- **Type guards again** — the pattern from Step 2

---

## 3a. Rename and Look at the Damage

Rename the file and run the type checker:

```bash
Rename-Item d:\solution_mycapapp_ts\utils\payload-transformer.js payload-transformer.ts
npx tsc --noEmit
```

<sub>**code by anubhav trainings**</sub>

You'll get a cluster of TS7006 **"implicitly has an 'any' type"** errors — one for essentially every function parameter: `key`, `value`, `payload`, `record`, `options`, `fields`, `rows`.

Same as Step 2: that's your to-do list. Let's clear it function by function.

---

## 3b. The Two Small Functions

### isControlKey & CONTROL_PREFIXES

```typescript
const CONTROL_PREFIXES = ['@', '__', '*']   // TS infers string[] — no annotation needed

function isControlKey (key: string): boolean {
  return CONTROL_PREFIXES.some(prefix => key.startsWith(prefix))
}
```

<sub>**code by anubhav trainings**</sub>

**Explanation:**

- `CONTROL_PREFIXES` needs **no annotation** — TypeScript infers `string[]` from the literal array
  - *Annotate only when inference is wrong or too loose*
- `isControlKey` takes a `string` and returns a `boolean` — straightforward

### isPlainObject — Type Guard

```typescript
function isPlainObject (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
```

<sub>**code by anubhav trainings**</sub>

This is a **type guard again** — but notice the payoff type: `Record<string, unknown>`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Record&lt;string, unknown&gt; Type*</span>

Read it as: **"An object with string keys whose values are each `unknown`."**

This is the honest type for **"some object whose contents I haven't verified."**

- ✅ You **can** look up any key
- ✅ But each value is `unknown`, so TypeScript still forces you to check before trusting it
- ✅ You'll lean on this everywhere below

**Why this matters for type guards:**

```typescript
// Before the guard:
if (isPlainObject(value)) {
  // After the guard, TypeScript knows:
  value.someKey        // ✅ is allowed (value is now Record<string, unknown>)
  value.someKey.nested // ❌ error — .nested is unknown, must check first
}
```

---

## 3c. extractRows — Narrowing Nested Unknowns

```typescript
function extractRows (payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (isPlainObject(payload)) {
    if (Array.isArray(payload.value)) return payload.value
    const d = payload.d
    if (isPlainObject(d) && Array.isArray(d.results)) return d.results
    return [payload]
  }
  return []
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Key Change from Original:</strong> The V2 branch now uses nested type narrowing with isPlainObject(d) before accessing d.results.
</div>

**Why the change:**

Your original was:

```typescript
payload.d && Array.isArray(payload.d.results)
```

After `isPlainObject(payload)`, TypeScript knows `payload` is `Record<string, unknown>`, so `payload.d` is `unknown`.

You **cannot reach** into `payload.d.results` on an `unknown` — you must narrow `d` first.

```typescript
const d = payload.d                           // d is unknown
if (isPlainObject(d) && Array.isArray(d.results)) {
  // Now TS knows d is Record<string, unknown>
  // AND d.results is an array ✅
  return d.results
}
```

**Behavior is identical** for valid payloads (`{ d: { results: [...] } }` still works), but TypeScript is making you **prove** `d` is an object before you read `.results`.

That's the whole spirit of strict mode: **every property access is justified.**

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Array.isArray as a Type Guard*</span>

Notice `Array.isArray(payload.value)` lets you return `payload.value` even though it started as `unknown`.

**`Array.isArray` is a built-in type guard** — TypeScript narrows the value to an array inside the `if`.

---

## 3d. Define OData Payload Interfaces

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Task Deliverable:</strong> Add these interface definitions near the top of your file. They document the OData response shapes that extractRows handles.
</div>

Add these near the top of the file:

```typescript
// The two wrapper shapes CAP / OData responses arrive in.
interface ODataV4Payload<T = unknown> {
  value: T[]
}

interface ODataV2Payload<T = unknown> {
  d: { results: T[] }
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Generics (&lt;T&gt;)*</span>

The `<T = unknown>` makes the interface a **template**.

**Examples:**

```typescript
ODataV4Payload<Product>   // describes { value: Product[] }
ODataV4Payload<Item>      // describes { value: Item[] }
ODataV4Payload            // plain, with T = unknown (default)
```

One definition, **reused for every entity** — that's a generic. The `= unknown` is a default, so plain `ODataV4Payload` still works when you don't care about the row type.

**Why these interfaces exist:**

- They **document** the shapes that `extractRows` handles at runtime
- `extractRows` itself still uses runtime guards (it deals with truly untyped input)
- But these interfaces show how you'd **type a payload** you construct or receive with a known shape

---

## 3e. flattenRecord — Union Return Type

```typescript
interface FlattenOptions {
  separator?: string
  removeControl?: boolean
}

function flattenRecord (record: unknown, options: FlattenOptions = {}): unknown {
  const { separator = '_', removeControl = true } = options
  if (!isPlainObject(record)) return record

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (removeControl && isControlKey(key)) continue

    if (isPlainObject(value)) {
      const nested = flattenRecord(value, { separator, removeControl }) as Record<string, unknown>
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
```

<sub>**code by anubhav trainings**</sub>

Three important concepts here:

### FlattenOptions Interface with Optional Properties

```typescript
interface FlattenOptions {
  separator?: string      // optional (?)
  removeControl?: boolean // optional (?)
}
```

Both `separator` and `removeControl` are optional, which is why:

```typescript
options: FlattenOptions = {}  // empty object is valid
```

This types your destructuring with defaults:

```typescript
const { separator = '_', removeControl = true } = options
```

### Union Return Type: unknown

```typescript
function flattenRecord (record: unknown, options: FlattenOptions = {}): unknown
```

This function returns **either a flattened object OR the original primitive untouched:**

```typescript
flattenRecord({ name: 'alice' })  // → { name: 'alice' }
flattenRecord('hello')            // → 'hello'
flattenRecord(42)                 // → 42
```

When a function can **return fundamentally different kinds of things**, `unknown` is the **honest umbrella type**.

You *could* write the precise union:

```typescript
Record<string, unknown> | string | number | boolean | null
```

But `unknown` is cleaner and matches how the value is consumed.

### Type Assertion on Recursive Call

```typescript
const nested = flattenRecord(value, { separator, removeControl }) as Record<string, unknown>
```

Why the `as Record<string, unknown>` cast?

Because `flattenRecord` is declared to return `unknown`, TypeScript won't let you `Object.entries(nested)` directly.

**You know** it's an object here (you just passed in a plain object), so you assert it with `as`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Type Assertion (as)*</span>

This is a **legitimate use of `as`**: you have knowledge the compiler can't derive through recursion. You're saying:

*"I know this is an object; trust me here."*

---

## 3f. flattenPayload and project

### flattenPayload — Composing Functions

```typescript
function flattenPayload (payload: unknown, options: FlattenOptions = {}): unknown[] {
  return extractRows(payload).map(row => flattenRecord(row, options))
}
```

<sub>**code by anubhav trainings**</sub>

This is a straight composition:

1. `extractRows(payload)` returns `unknown[]`
2. `.map(row => flattenRecord(row, options))` applies `flattenRecord` to each row
3. Result is `unknown[]` (array of unknowns)

### project — Union Input Type

```typescript
function project (
  rows: Array<Record<string, unknown>>,
  fields: string | string[]
): Array<Record<string, unknown>> {
  const list = Array.isArray(fields) ? fields : [fields]
  return rows.map(row => {
    const picked: Record<string, unknown> = {}
    for (const field of list) {
      if (row && field in row) picked[field] = row[field]
    }
    return picked
  })
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Union Type: string | string[]*</span>

`project` accepts **either** a single field name **or** an array of them:

```typescript
project(rows, 'Country')               // string
project(rows, ['ProductId', 'Price'])  // string[]
```

The `|` means **"one type OR the other."**

The line:

```typescript
const list = Array.isArray(fields) ? fields : [fields]
```

**Normalizes** the union down to a single `string[]` so the rest of the function has one shape to deal with.

**Your test covers both cases** — both call patterns work.

---

## 3g. Convert the Exports

Replace `module.exports` with ES `export` syntax:

```typescript
export {
  CONTROL_PREFIXES,
  isControlKey,
  isPlainObject,
  extractRows,
  flattenRecord,
  flattenPayload,
  project
}

// Export the types too, so srv/CDSService.ts can import them later
export type { FlattenOptions, ODataV4Payload, ODataV2Payload }
```

<sub>**code by anubhav trainings**</sub>

**Same reasoning as Step 2:** `export {}` compiles to CommonJS, so your test's `require('../utils/payload-transformer')` keeps working unchanged.

The `export type { ... }` exports only the type definitions — useful when other modules want to reuse `FlattenOptions` without importing the runtime code.

---

## 3h. Verify Everything

Run the type checker and tests:

```bash
npx tsc --noEmit
npm test
```

<sub>**code by anubhav trainings**</sub>

**Expected results:**

- ✅ `tsc --noEmit` → clean for both util files now
- ✅ `npm test` → all `utils.test.js` cases green (runtime logic is unchanged; you only added types)

---

## Troubleshooting

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Common Issues:</strong>
<br/>
<strong>Flattening recursion sometimes surprises people.</strong> If you hit TS errors you can't resolve, paste them here — I'll help narrow it.
</div>

**Common error patterns:**

| Error | Cause | Fix |
|-------|-------|-----|
| TS2740: Type 'unknown' is missing properties... | Accessing properties on `unknown` | Add type guard: `if (isPlainObject(value))` |
| TS2322: Type 'unknown[]' is not assignable... | Return type mismatch in recursion | Use `as Record<string, unknown>` for known shapes |
| TS7006: Parameter implicitly has 'any' type | Function parameter not annotated | Add explicit type: `(param: RecordType)` |

---

## Next: Checkpoint Questions

After completing 3a–3h, answer these:

1. **Is `tsc --noEmit` clean?**
2. **Do all tests pass?**
3. **Any TS errors you can't resolve?**

Once these three are clear, you're ready for **Step 4 — the big one** — migrating your main service handler with everything you've learned so far.

---

<footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
<strong>code by anubhav trainings</strong> — CAP TypeScript Step 3: payload-transformer Migration
</footer>
