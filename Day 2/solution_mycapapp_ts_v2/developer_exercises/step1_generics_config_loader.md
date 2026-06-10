# Step 1 — Generics: Build a Typed `ConfigLoader<T>`

> Implementing a **reusable** helper that **reads**, **validates**, and **returns a typed**
> config object — then proving it works against **two different config shapes**
> (`DatabaseConfig` and `ServerConfig`) **without rewriting the loader**.
> This is the core promise of generics: *write the algorithm once, keep the types.*

---

## 🎯 What You Will Build

You will fill in the TODOs in **`srv/exercises/config-loader.ts`** so that one class
serves any config shape. The whole point: the **same** `ConfigLoader` returns a
`DatabaseConfig` for the DB loader and a `ServerConfig` for the server loader — and your
editor knows the difference at every call site.

---

## 📋 Cheat Sheet

| # | Concept | Syntax | Why |
|---|---------|--------|-----|
| 1 | **Type parameter** | `class ConfigLoader<T> { … }` | a placeholder type, chosen by the *caller*, not the author |
| 2 | **Generic type alias** | `type Validator<T> = (raw: unknown) => raw is T` | one reusable name for "a function that checks a `T`" |
| 3 | **Type guard / predicate** | `(raw: unknown): raw is T` | the `raw is T` return *narrows* `unknown` → `T` |
| 4 | **`unknown` (not `any`)** | `raw: unknown` | forces a validation gate before any property access |
| 5 | **Parameter property** | `constructor(private readonly validate: Validator<T>)` | declares + assigns the field in one line |
| 6 | **Generic method return** | `load(raw: unknown): T` | the method hands back the *caller's* `T` |
| 7 | **Type-argument inference** | `new ConfigLoader(isDatabaseConfig)` | `T` is inferred from the validator — no `<…>` needed |
| 8 | **Explicit type argument** | `new ConfigLoader<ServerConfig>(fn)` | pin `T` yourself when inference can't |

---

## 📋 Cheat Sheet - Utility Type

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
---

## Step 1.1 — Create the Exercise Files

Create the folder and the three files you will work in this session.

```powershell
New-Item -ItemType Directory -Force d:\solution_mycapapp_ts\srv\exercises
New-Item -ItemType File d:\solution_mycapapp_ts\srv\exercises\config-loader.ts
New-Item -ItemType File d:\solution_mycapapp_ts\srv\exercises\entity-types.ts
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `config-loader.ts` is today's file (generics). `cap-handler.ts` (decorators) and `entity-types.ts` (utility types) are the canvases for Step 2 and Step 3, so we create them now and leave them empty.*

---

## Step 1.2 — Define the Two Config Shapes

Two **deliberately different** interfaces. They share **no** properties — that is what
proves the generic is truly shape-agnostic.

```ts
// srv/exercises/config-loader.ts
export interface DatabaseConfig {
  host: string
  port: number
  ssl: boolean
}

export interface ServerConfig {
  name: string
  workers: number
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — these are the concrete types that will stand in for `T`. When you write `ConfigLoader<DatabaseConfig>`, every `T` inside the class becomes `DatabaseConfig` for that instance. The class never mentions these names — they are supplied from outside.*

---

## Step 1.3 — Declare the Generic `Validator<T>` Type

A validator is *"a function that takes something untrusted and tells you whether it is a `T`."*
Capture that contract once, generically.

```ts
export type Validator<T> = (raw: unknown) => raw is T
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — the magic is the return type `raw is T`, called a **type predicate**. A normal `=> boolean` only answers true/false; `=> raw is T` *also* teaches the compiler: "inside the `if (validate(raw))` branch, treat `raw` as a `T`." Cheat-sheet rows 2 + 3.*

> [!CAUTION]
> **Why the input is `unknown`, not `any`.** Config comes from `JSON.parse`, a file, or an
> env var — you cannot trust its shape. `unknown` (row 4) **blocks every property access
> until you narrow it**, which is exactly the gate the validator provides. If you typed it
> `any`, TypeScript would let `raw.host` through with zero checks and the whole exercise
> would be pointless.

---

## Step 1.4 — Build the `ConfigLoader<T>` Class

The reusable engine. One type parameter `T`, one injected validator, one `load` method.

```ts
export class ConfigLoader<T> {
  constructor(private readonly validate: Validator<T>) {}

  load(raw: unknown): T {
    if (!this.validate(raw)) {
      throw new Error('Invalid config: failed validation')
    }
    return raw            // raw is now narrowed to T — no cast needed
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — three generic moves in nine lines: (1) `class ConfigLoader<T>` declares the placeholder (row 1); (2) `constructor(private readonly validate: Validator<T>)` both declares the field and stores it — a **parameter property** (row 5); (3) `load(raw: unknown): T` accepts untrusted input but **returns the caller's `T`** (row 6). Notice `return raw` needs **no `as T`** — the `if (!this.validate(raw))` guard already narrowed `raw` from `unknown` to `T`. That is the type predicate paying off.*

> [!CAUTION]
> **Order matters: guard first, return second.** The narrowing only holds *after* the
> `validate` call. If you reorder and access `raw.host` *before* the `if`, TypeScript
> rejects it because `raw` is still `unknown` there. Keep the validation as the first
> statement.

---

## Step 1.5 — Write the Two Type-Guard Validators

One validator per shape. Each returns `raw is <Shape>`, so each *carries* the narrowing.

```ts
export const isDatabaseConfig: Validator<DatabaseConfig> = (raw): raw is DatabaseConfig => {
  const c = raw as Partial<DatabaseConfig>
  return typeof c?.host === 'string'
    && typeof c?.port === 'number'
    && typeof c?.ssl === 'boolean'
}

export const isServerConfig: Validator<ServerConfig> = (raw): raw is ServerConfig => {
  const c = raw as Partial<ServerConfig>
  return typeof c?.name === 'string'
    && typeof c?.workers === 'number'
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — inside a guard you must probe `unknown` safely. `raw as Partial<DatabaseConfig>` says "maybe-shaped, every field optional," so reading `c?.host` is legal but still nudges you to check each field. The `typeof … === 'string'` chain is the **runtime** proof; the `raw is DatabaseConfig` signature is the **compile-time** promise. Both must agree — that is the contract you are honouring.*

> [!CAUTION]
> **Annotating the const vs. annotating the return — pick one, know the difference.**
> Typing the constant `: Validator<DatabaseConfig>` makes the whole function conform to the
> generic shape. Writing `(raw): raw is DatabaseConfig` declares the predicate inline. Doing
> **both** (as above) is belt-and-braces and reads clearly for learners. Never let the two
> disagree — e.g. a body that only checks `host` but claims `raw is DatabaseConfig` is a
> silent lie the compiler will trust.

---

## Step 1.6 — Wire It Up and Test Two Shapes

Now spend the generic. Build one loader per shape and watch the **return types differ**
from the **same class**.

```ts
// --- Database config ---
const dbLoader = new ConfigLoader(isDatabaseConfig)        // T inferred = DatabaseConfig
const dbRaw = JSON.parse('{ "host": "localhost", "port": 5432, "ssl": true }')
const db = dbLoader.load(dbRaw)                            // db: DatabaseConfig
console.log(`DB on ${db.host}:${db.port} (ssl=${db.ssl})`)

// --- Server config ---
const serverLoader = new ConfigLoader(isServerConfig)     // T inferred = ServerConfig
const serverRaw = JSON.parse('{ "name": "api", "workers": 4 }')
const server = serverLoader.load(serverRaw)               // server: ServerConfig
console.log(`Server ${server.name} with ${server.workers} workers`)
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — **inference, not annotation** (row 7): you wrote `new ConfigLoader(isDatabaseConfig)` with no `<…>`. TypeScript reads the validator's `raw is DatabaseConfig` and fixes `T = DatabaseConfig` for you. From there `db.host` autocompletes and `db.port` is a `number` — all from one shared class.*

> [!CAUTION]
> **Prove the types are real — try to break them.** Add `db.naem` (typo) or
> `server.host` and TypeScript flags both *before you run*. If your editor stays silent,
> `T` collapsed to `any` somewhere — re-check that each validator's return is `raw is T`
> and not a plain `boolean`.

---

## Step 1.7 — When Inference Can't Help: Explicit `<T>`

Sometimes there is no validator argument to infer from (e.g. you pass a variable typed only
as `Validator<unknown>`). Then **pin `T` yourself**.

```ts
const serverLoader = new ConfigLoader<ServerConfig>(isServerConfig)   // T pinned explicitly
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `<ServerConfig>` is an **explicit type argument** (row 8). Inference is the default and the cleaner read; reach for the explicit form only when inference produces `unknown` or the wrong type. Knowing both is the difference between "uses generics" and "understands generics."*

---

## Step 1.8 — Verify

```powershell
npx tsc --noEmit        # the whole project, incl. srv/exercises, must be type-clean
npx tsx srv/exercises/config-loader.ts   # run it: two configs print, no throw
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `tsc --noEmit` is the real grader here: it proves the generic plumbing type-checks. Running with `tsx` (the same in-memory transpiler `cds watch` uses in this project) proves the runtime validation also passes for valid input. Feed it a bad object to watch `load` throw.*

---

## ✅ Outcome Check

- [ ] One `ConfigLoader<T>` class serves **both** shapes — no duplication.
- [ ] `db` is typed `DatabaseConfig`, `server` is typed `ServerConfig`, both **inferred**.
- [ ] `load` returns `T` with **no `as` cast** (the type guard narrowed it).
- [ ] A typo like `db.naem` is a **compile error**.

---

## Final File — `srv/exercises/config-loader.ts`

```ts
// ── Two config shapes (the concrete types that fill in T) ─────────────
export interface DatabaseConfig {
  host: string
  port: number
  ssl: boolean
}

export interface ServerConfig {
  name: string
  workers: number
}

// ── The generic validator contract ───────────────────────────────────
export type Validator<T> = (raw: unknown) => raw is T          // rows 2, 3

// ── The reusable, typed loader ────────────────────────────────────────
export class ConfigLoader<T> {                                  // row 1
  constructor(private readonly validate: Validator<T>) {}       // row 5

  load(raw: unknown): T {                                       // rows 4, 6
    if (!this.validate(raw)) {
      throw new Error('Invalid config: failed validation')
    }
    return raw                                                  // narrowed unknown → T
  }
}

// ── One type-guard validator per shape ────────────────────────────────
export const isDatabaseConfig: Validator<DatabaseConfig> = (raw): raw is DatabaseConfig => {
  const c = raw as Partial<DatabaseConfig>
  return typeof c?.host === 'string'
    && typeof c?.port === 'number'
    && typeof c?.ssl === 'boolean'
}

export const isServerConfig: Validator<ServerConfig> = (raw): raw is ServerConfig => {
  const c = raw as Partial<ServerConfig>
  return typeof c?.name === 'string'
    && typeof c?.workers === 'number'
}

// ── Test two different shapes through the SAME loader ─────────────────
const dbLoader = new ConfigLoader(isDatabaseConfig)             // row 7: T inferred = DatabaseConfig
const db = dbLoader.load(JSON.parse('{ "host": "localhost", "port": 5432, "ssl": true }'))
console.log(`DB on ${db.host}:${db.port} (ssl=${db.ssl})`)

const serverLoader = new ConfigLoader<ServerConfig>(isServerConfig)  // row 8: T pinned explicitly
const server = serverLoader.load(JSON.parse('{ "name": "api", "workers": 4 }'))
console.log(`Server ${server.name} with ${server.workers} workers`)
```

<sub>code by anubhav trainings</sub>

---

> [!TIP]
> *Next — Step 2 (Decorators) uses `srv/exercises/cap-handler.ts`: a `@LogRequest` decorator that logs method name, arguments, and execution time, applied to a mock CAP handler. Step 3 (Utility types) uses `srv/exercises/entity-types.ts` to derive `ReadOnly`, `CreatePayload`, and `UpdatePayload` with `Readonly`, `Omit`, and `Partial`.*

---

<sub>Document generated for the TypeScript generics exercise · code by anubhav trainings</sub>
