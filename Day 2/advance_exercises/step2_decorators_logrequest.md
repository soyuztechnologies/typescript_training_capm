# Step 2 — Decorators: A `@LogRequest` Method Decorator

> Writing a **reusable** decorator that wraps any method to log its **name**, its
> **arguments**, and its **execution time** — then applying it to a **mock CAP handler
> class** in `srv/exercises/cap-handler.ts`. CAP handlers are `async`, so the decorator
> must also time work that finishes *after* the function returns.
> This is cross-cutting behaviour (logging, timing) written **once** and reused **everywhere**.

---

## 🎯 What You Will Build

A single `@LogRequest` you can stack above any method. Decorate `boost` and `largestOrder`
on a mock handler, run them, and watch the console print the call, the args, and the elapsed
milliseconds — **without editing the method bodies**.

---

## 📋 Cheat Sheet

| # | Concept | Syntax | Why |
|---|---------|--------|-----|
| 1 | **Method decorator (Stage 3)** | `function LogRequest(method, context) { … }` | receives the *original method* + a context object |
| 2 | **Decorator context** | `ClassMethodDecoratorContext` | typed metadata: `.name`, `.kind`, `.addInitializer` |
| 3 | **Method name** | `String(context.name)` | `context.name` is `string \| symbol` — coerce it |
| 4 | **Replace the method** | `return function (…) { … }` | returning a function *swaps in* your wrapper |
| 5 | **Preserve `this`** | `function (this: This, …args) { … }` | the wrapped method still needs its instance |
| 6 | **Call through** | `originalMethod.apply(this, args)` | run the real logic you wrapped |
| 7 | **Async timing** | `result instanceof Promise ? result.finally(…)` | stop the clock *after* the promise settles |
| 8 | **Apply it** | `@LogRequest` above the method | the `@` attaches the decorator at class definition |
| 9 | **Native decorators** | *(no `experimentalDecorators`)* | this project uses **TC39 Stage 3**, not legacy |

---

## Step 2.1 — Confirm the Decorator Flavor

> [!CAUTION]
> **There are two incompatible decorator systems — use the right one.** This project's
> `tsconfig.json` has `target: ESNext` and does **not** set `experimentalDecorators`. That
> means TypeScript uses **native TC39 Stage 3** decorators. The *legacy* signature
> `(target, propertyKey, descriptor: PropertyDescriptor)` you'll find in older tutorials
> **will not type-check here** — it needs `experimentalDecorators: true`. Everything below
> uses the modern `(value, context)` signature, so it compiles with **zero config changes**.

No action needed — just know which world you are in (cheat-sheet row 9).

---

## Step 2.2 — The Decorator Signature

A Stage 3 method decorator is a plain function that receives **the method** and **a context**.
Type it with generics so the wrapper stays as type-safe as the method it wraps (a callback to
Step 1's generics).

```ts
// srv/exercises/cap-handler.ts
function LogRequest<This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name)        // row 3
  // … wrapper goes here …
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — the two parameters are the whole API (row 1): `originalMethod` is the function you are decorating; `context` is typed metadata (`ClassMethodDecoratorContext`, row 2). The three type parameters `This`, `Args`, `Return` are generics — they let one decorator wrap a method of **any** signature while remembering that signature. `context.name` is `string | symbol`, so wrap it in `String(...)` (row 3) before logging.*

---

## Step 2.3 — Log the Name and Arguments

Inside the decorator, **return a replacement function** that logs, then calls through.

```ts
  function replacement(this: This, ...args: Args): Return {
    console.log(`→ ${methodName}(${JSON.stringify(args)})`)     // name + args
    return originalMethod.apply(this, args)                     // rows 5, 6
  }

  return replacement                                            // row 4
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — returning a function from the decorator **replaces** the original method on the class (row 4). The replacement must keep the same shape: same `this: This`, same `...args: Args`, same `Return`. `originalMethod.apply(this, args)` (row 6) forwards the call to the real logic — `apply` is what re-binds the correct `this` (row 5) so the method still sees its instance fields.*

> [!CAUTION]
> **Never lose `this`.** If you write `originalMethod(...args)` instead of
> `originalMethod.apply(this, args)`, the method runs with `this === undefined` and any
> `this.someField` inside it throws at runtime. The `this: This` annotation + `.apply(this, …)`
> pair is mandatory for instance methods.

---

## Step 2.4 — Measure Execution Time

Bracket the call with `performance.now()`. For a **synchronous** method this is all you need.

```ts
  function replacement(this: This, ...args: Args): Return {
    const start = performance.now()
    console.log(`→ ${methodName}(${JSON.stringify(args)})`)

    const result = originalMethod.apply(this, args)

    const ms = (performance.now() - start).toFixed(2)
    console.log(`← ${methodName} finished in ${ms}ms`)
    return result
  }
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `performance.now()` returns a high-resolution millisecond timestamp. Subtract start from end and you have the duration. This is correct **only** while the method is synchronous — the next step fixes the async case, which is the one that matters for CAP.*

---

## Step 2.5 — Handle Async Handlers (the CAP-relevant fix)

CAP handlers are `async`, so `originalMethod.apply(...)` returns a **Promise** that is still
running when the line below it executes. Stop the clock *after* it settles.

```ts
  function replacement(this: This, ...args: Args): Return {
    const start = performance.now()
    console.log(`→ ${methodName}(${JSON.stringify(args)})`)

    const finish = () => {
      const ms = (performance.now() - start).toFixed(2)
      console.log(`← ${methodName} finished in ${ms}ms`)
    }

    const result = originalMethod.apply(this, args)
    if (result instanceof Promise) {
      return result.finally(finish) as Return            // row 7: time async work correctly
    }
    finish()                                             // sync path
    return result
  }
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **The classic async-timing bug.** Without the `instanceof Promise` branch, an `async`
> method reports **≈0ms every time** — you measured how long it took to *create* the promise,
> not to *resolve* it. Attaching `finish` via `.finally()` (row 7) runs the timer **after**
> the awaited work completes, on both success and error. The `as Return` cast keeps the
> signature intact — matching this project's convention of **casting at the call site** rather
> than loosening the generic.

> [!TIP]
> *Concept — `.finally(finish)` returns the same promise (so the caller still `await`s the real result) but guarantees `finish` runs once it settles. `instanceof Promise` is also the **type guard** that narrows `result`, the same narrowing idea you used for `Validator<T>` in Step 1.*

---

## Step 2.6 — Build the Mock CAP Handler and Apply `@LogRequest`

A small class that imitates the `CatalogService` actions — one `async`, one sync — each
decorated with `@LogRequest`.

```ts
class CatalogHandler {
  @LogRequest                                            // row 8
  async boost(orderId: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 50))   // pretend DB work
    return `Order ${orderId} boosted`
  }

  @LogRequest                                            // row 8
  largestOrder(): { ID: number; GROSS_AMOUNT: number } {
    return { ID: 1, GROSS_AMOUNT: 99999 }
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `@LogRequest` on the line above a method (row 8) attaches the decorator when the class is **defined**, not when the method is called. From then on every call to `boost` or `largestOrder` flows through your wrapper. The method bodies are untouched — that is the power of decorators: cross-cutting concerns (logging, timing, auth) added **without editing the logic**.*

> [!CAUTION]
> **`@LogRequest`, not `@LogRequest()`.** Because our decorator takes `(method, context)`
> directly, you apply it **bare**: `@LogRequest`. The `@LogRequest()` *call* form is only for
> **decorator factories** — functions that take options and *return* a decorator (e.g.
> `@LogRequest({ level: 'debug' })`). Mixing them up is a common first error.

---

## Step 2.7 — Run and Observe

```ts
const handler = new CatalogHandler()

void (async () => {
  await handler.boost('PO-1000')   // → boost("PO-1000")  … ← boost finished in ~50ms
  handler.largestOrder()           // → largestOrder()     … ← largestOrder finished in ~0ms
})()
```

```powershell
npx tsc --noEmit                              # type-clean with native decorators
npx tsx srv/exercises/cap-handler.ts          # run it and read the timing logs
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — watch the two timings differ: `boost` reports ~50ms because the async branch waited for the fake DB work; `largestOrder` reports ~0ms on the sync path. If `boost` ever prints ~0ms, your `instanceof Promise` branch isn't firing — re-check Step 2.5.*

---

## ✅ Outcome Check

- [ ] One `@LogRequest` decorates **both** methods — no duplicated logging code.
- [ ] Logs show the **method name** and **JSON-serialized arguments**.
- [ ] `boost` (async) reports its **real** elapsed time (~50ms), not ~0ms.
- [ ] Method **return types are preserved** — `await handler.boost(...)` is a `string`.
- [ ] Compiles with **no** `experimentalDecorators` flag.

---

## Final File — `srv/exercises/cap-handler.ts`

```ts
// ── Reusable method decorator: logs name, args, and execution time ────
function LogRequest<This, Args extends unknown[], Return>(            // rows 1, 2
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name)                            // row 3

  function replacement(this: This, ...args: Args): Return {          // rows 4, 5
    const start = performance.now()
    console.log(`→ ${methodName}(${JSON.stringify(args)})`)

    const finish = () => {
      const ms = (performance.now() - start).toFixed(2)
      console.log(`← ${methodName} finished in ${ms}ms`)
    }

    const result = originalMethod.apply(this, args)                 // row 6
    if (result instanceof Promise) {
      return result.finally(finish) as Return                       // row 7
    }
    finish()
    return result
  }

  return replacement
}

// ── Mock CAP handler decorated with @LogRequest ───────────────────────
class CatalogHandler {
  @LogRequest                                                       // row 8
  async boost(orderId: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 50))         // pretend DB work
    return `Order ${orderId} boosted`
  }

  @LogRequest                                                       // row 8
  largestOrder(): { ID: number; GROSS_AMOUNT: number } {
    return { ID: 1, GROSS_AMOUNT: 99999 }
  }
}

// ── Run it (async IIFE: top-level await isn't allowed under CommonJS) ──
const handler = new CatalogHandler()
void (async () => {
  await handler.boost('PO-1000')
  handler.largestOrder()
})()
```

<sub>code by anubhav trainings</sub>

---

> [!TIP]
> *Next — Step 3 (Utility types) uses `srv/exercises/entity-types.ts`: take a full BTP service entity interface and derive `ReadOnly`, `CreatePayload`, and `UpdatePayload` using `Readonly`, `Omit`, and `Partial` — without repeating a single property definition. Generics (Step 1) and decorators (Step 2) gave you reuse at the value level; utility types give you reuse at the **type** level.*

---

<sub>Document generated for the TypeScript decorators exercise · code by anubhav trainings</sub>
