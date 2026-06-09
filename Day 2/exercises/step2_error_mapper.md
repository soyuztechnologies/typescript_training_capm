## Step 2 — Rename error-mapper.js → .ts and Handle Type Errors

We start with the smaller file so the error list is digestible.

### 2a. Rename the File

```bash
Rename-Item d:\solution_mycapapp_ts\utils\error-mapper.js error-mapper.ts
```

<sub>**code by anubhav trainings**</sub>

---

### 2b. Run the Type Checker

```bash
npx tsc --noEmit
```

<sub>**code by anubhav trainings**</sub>

You should get exactly 5 errors:

```
utils/error-mapper.ts:15:18 - error TS7006: Parameter 'value' implicitly has an 'any' type.
utils/error-mapper.ts:21:24 - error TS7006: Parameter 'message' implicitly has an 'any' type.
utils/error-mapper.ts:31:18 - error TS7006: Parameter 'err' implicitly has an 'any' type.
utils/error-mapper.ts:47:33 - error TS2339: Property 'target' does not exist on type '{ code: string; message: any; status: number; }'.
utils/error-mapper.ts:51:1 - error TS2591: Cannot find name 'module'. Do you need to install type definitions for node?
```

<sub>**code by anubhav trainings**</sub>

---

### 2c. Understanding Error TS7006: Implicit Any

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Special Note:</strong> This is strict mode working correctly, not something broken. This is your type system doing its job!
</div>

**The concept:**

In plain JavaScript, a parameter with no type is silently `any` — TypeScript would let you do anything to it (`value.foo.bar.baz`) and never warn you. That defeats the purpose.

The `noImplicitAny` flag (part of `strict`) says: **"I refuse to guess. If a value is any, you must say so out loud."**

TS7006 literally means: **"You didn't annotate this parameter, and I won't assume any for you."**

These three errors point at exactly the three function parameters that need types: `toStatus(value)`, `extractMessage(message)`, and `mapError(err)`.

---

#### Fix: toStatus Function

The simplest fix — `value` can be anything, but we always return a number:

```typescript
function toStatus (value: unknown): number {
  const n = Number(value)
  return Number.isInteger(n) && n >= 400 && n <= 599 ? n : DEFAULT_STATUS
}
```

<sub>**code by anubhav trainings**</sub>

**Explanation:**
- `value: unknown` — input is anything
- `: number` — we always return a number
- `Number(unknown)` is allowed because `Number()` accepts anything — no narrowing needed here

---

#### Fix: extractMessage Function

This hits the first real wall. The line `message.value` won't compile because you can't read `.value` off `unknown` until you've proven it's an object with a `value` property.

Add a **type guard**:

```typescript
interface ODataMessage {
  value: string
}

function isODataMessage (val: unknown): val is ODataMessage {
  return (
    typeof val === 'object' &&
    val !== null &&
    'value' in val &&
    typeof (val as Record<string, unknown>).value === 'string'
  )
}

function extractMessage (message: unknown): string {
  if (message == null) return 'Unknown error'
  if (typeof message === 'string') return message
  if (isODataMessage(message)) return message.value   // ✅ now TS knows .value is a string
  return String(message)
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Type Guard Concept*</span>

A **type guard** is a function returning boolean, but with the special `val is ODataMessage` return type. This tells TypeScript:

*"If this returned `true`, treat the argument as an `ODataMessage` from now on."*

That's why `message.value` compiles on the next line — TypeScript narrowed the type for you.

This replaces your old `typeof message.value === 'string'` check with the same logic, just made type-safe.

---

#### Fix: mapError Function

This is where you'll learn the most important strict-mode concept: **unknown vs any**, and why `mapError(err: unknown)` is the correct, safe choice.

```typescript
interface NormalisedError {
  code: string
  message: string
  status: number
  target?: string   // the ? means optional — present only sometimes
}

function mapError (err: unknown): NormalisedError {
  if (err == null) {
    return { code: DEFAULT_CODE, message: 'Unknown error', status: DEFAULT_STATUS }
  }
  if (typeof err === 'string') {
    return { code: DEFAULT_CODE, message: err, status: DEFAULT_STATUS }
  }

  // Past the guards, err is some object. Treat it as a bag of unknown props:
  const errObj = err as Record<string, unknown>
  const source = (errObj.error && typeof errObj.error === 'object'
    ? errObj.error
    : errObj) as Record<string, unknown>

  const normalised: NormalisedError = {
    code: source.code != null ? String(source.code) : DEFAULT_CODE,
    message: extractMessage(source.message),
    status: toStatus(source.status != null ? source.status : source.statusCode)
  }
  if (source.target) {
    normalised.target = String(source.target)
  }
  return normalised
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Record&lt;string, unknown&gt; Type*</span>

**What it means:** "an object with string keys whose values are unknown."

This is the honest type for an arbitrary error bag: you can read any property name, but each value is `unknown` so you're still forced to coerce (`String(...)`, `toStatus(...)`) before trusting it.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*as Type Assertion*</span>

The `as` keyword tells TypeScript: **"Trust me, treat this as that shape."**

```typescript
err as Record<string, unknown>  // "I know err is an object with unknown properties"
```

Use it sparingly. Here it's justified because we've already proven `err` is a non-null object via the guards above.

**Important detail:** I added `String(source.target)` to satisfy `target?: string`. Since `source.target` is `unknown`, the interface demands a `string`.

---

### 2d. Understanding Error TS2339: Property 'target' Does Not Exist

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Special Note:</strong> This happens when TypeScript infers a narrower type than you intend.
</div>

**Root cause:** You wrote `const normalised = {...}` **without** the `: NormalisedError` annotation.

TypeScript did **type inference** — it looked at the object literal and decided its type is exactly:

```typescript
{ code: string; message: any; status: number }
```

That inferred type has **no `target` property**, so the next line `normalised.target = ...` is rejected.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Inference vs. Explicit Annotation*</span>

When you don't annotate, TypeScript infers the **narrowest type** from the value. That's usually helpful, but here you intend to add `target` conditionally afterward.

**You must tell TypeScript up front:** *"This object is a `NormalisedError` (which allows an optional `target`)."*

**Fix** — add the explicit annotation:

```typescript
const normalised: NormalisedError = {
  code: source.code != null ? String(source.code) : DEFAULT_CODE,
  message: extractMessage(source.message),
  status: toStatus(source.status != null ? source.status : source.statusCode)
}
if (source.target) normalised.target = String(source.target)
```

<sub>**code by anubhav trainings**</sub>

As a bonus, the `message: any` error disappears too — annotating forces `message` to be the `string` that `extractMessage` returns.

---

### 2e. Understanding Error TS2591: Cannot Find Name 'module'

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 Special Note:</strong> Switch to ES export syntax for cleaner, more modern code.
</div>

`module` (as in `module.exports`) is a Node.js global. TypeScript only knows about it through `@types/node`.

The cleanest, most modern fix — and the one SAP recommends for CAP+TypeScript — is to **stop using `module.exports` and use ES `export` syntax instead.**

**Remove this:**

```javascript
module.exports = {
  DEFAULT_STATUS,
  DEFAULT_CODE,
  toStatus,
  extractMessage,
  mapError
}
```

**Replace with this:**

```typescript
export {
  DEFAULT_STATUS,
  DEFAULT_CODE,
  toStatus,
  extractMessage,
  mapError
}

// Optional: lets srv/CDSService.ts reuse the type later
export type { NormalisedError }
```

<sub>**code by anubhav trainings**</sub>

---

### 2f. Verify the Changes

After making those edits:

```bash
# Check type safety
npx tsc --noEmit

# Re-run tests to confirm behavior is unchanged
npm test
```

<sub>**code by anubhav trainings**</sub>

Both should pass cleanly. Your tests still use `require()` — that's fine! Your source is now TypeScript.

---

### 2g. Fix the Test Runner: Install ts-jest Bridge

Jest needs to know how to compile `.ts` files on the fly:

```bash
npm install --save-dev ts-jest @types/jest
```

<sub>**code by anubhav trainings**</sub>

- **ts-jest** — the transformer Jest uses to compile `.ts` on the fly (this was missing)
- **@types/jest** — types for `describe`/`test`/`expect`, needed once you write tests in `.ts`

---

### 2h. Create jest.config.js in Project Root

```javascript
/** @type {import('jest').Config} */
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

<sub>**code by anubhav trainings**</sub>

##### Configuration Breakdown

<table style="border-collapse: collapse; width: 100%;">
<tr style="background-color: #f5f5f5;">
<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Setting</th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">What It Does</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>transform: { '^.+\\.ts$': ... }</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">"Any file ending in .ts, run through ts-jest first." This was missing — Jest fell back to babel-jest, which choked on value: unknown.</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 8px;"><strong>isolatedModules: true</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Tells ts-jest "just strip the types and transpile, don't type-check." Keeps the two gates separate: npx tsc --noEmit is your type gate; npm test is your runtime/behavior gate.</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>tsconfig: { module: 'CommonJS' }</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Your tsconfig.json uses module: "NodeNext". For Jest, override to plain CommonJS so compiled code uses require/exports — what Jest expects. Source stays the same; only on-the-fly compile target changes.</td>
</tr>
</table>

##### Why Plain .js Files Still Work

Your plain `.js` files (like `CDSService.js`) keep using Jest's default handling — they keep working as before. Only `.ts` files trigger the ts-jest transformation.

---

### 2i. Re-run the Tests

```bash
npm test
```

<sub>**code by anubhav trainings**</sub>

All tests should pass.

---

### 2j. About CommonJS Compatibility

**Why this is safe for your tests:**

Your `tsconfig.json` has `"module": "CommonJS"`, so:

```typescript
export { toStatus, extractMessage, mapError }
```

Compiles down to:

```javascript
exports.toStatus = ...
exports.extractMessage = ...
exports.mapError = ...
```

Your test file keeps using `require()` and destructuring:

```javascript
const { toStatus, extractMessage, mapError } = require('../utils/error-mapper')
```

It still works. You get modern source syntax + backward-compatible output. ✅

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*ES Modules vs CommonJS*</span>

- **`import`/`export`** — the standard module syntax (modern)
- **`require`/`module.exports`** — Node's older CommonJS (legacy)

With `module: CommonJS` in tsconfig, you write the modern syntax and TypeScript emits the old syntax — **best of both worlds**.

---

## What Did NOT Error

Notice that `module.exports = { ... }` at the bottom did not complain — because `@types/node` tells TypeScript that `module.exports` exists and accepts anything.

That's why installing `@types/node` was necessary even for this tiny file. The switch to `export` is simply the cleaner, long-term answer.

---

## Next Steps: Step 3

In Step 3 we'll fix the remaining files — and that's where you'll deepen your understanding of the single most important strict-mode concept:

**`unknown` vs `any`, and why `mapError(err: unknown)` is the correct, safe choice for a function that receives "any kind of error."**

---

<footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
<strong>code by anubhav trainings</strong> — Complete CAP TypeScript Setup Guide
</footer>
