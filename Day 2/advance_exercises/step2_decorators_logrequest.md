# Step 2 — Decorators: A `@LogRequest` Method Decorator

> Writing a **reusable** decorator that wraps any method to log its **name**, its
> **arguments**, and its **execution time** — then applying it to the **real
> `srv/CatalogService.ts`** so its `boost` and `largestOrder` actions log automatically.
> CAP handlers are `async`, so the decorator must also time work that finishes *after* the
> function returns. This is cross-cutting behaviour (logging, timing) written **once** and
> reused **everywhere**.

---

## 🎯 What You Will Build

A single `@LogRequest` you can stack above any method. You'll keep the decorator in
`srv/exercises/cap-handler.ts`, then **import it into `srv/CatalogService.ts`** and decorate
the `boost` and `largestOrder` action handlers — so every time CAP runs them, the console
prints the call, the args, and the elapsed milliseconds, **without changing what they do**.

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
| 10 | **Decorate a method, register by reference** | `this.on('boost', (req) => this.onBoost(req))` | decorators attach to class **methods**, not inline arrow handlers — and the method name must **not** match the action (Step 2.11) |
| 11 | **Down-level the target for tests only** | `tsconfig: { target: 'ES2022' }` *(jest.config.js)* | keep project `ESNext`; let **`ts-jest`** down-level decorators so Node can load them |

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
// srv/exercises/cap-handler.ts — home of the reusable decorator
export function LogRequest<This, Args extends unknown[], Return>(
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

## Step 2.6 — Why You Can't Decorate the Inline Handlers

In `CatalogService`, the actions are registered as **inline arrow functions**:
`this.on('boost', async (req) => { … })`. A decorator has nothing to attach to there —
Stage 3 decorators only apply to **class members** (methods, fields, accessors), never to a
function passed as an argument. So the first move is to turn each handler into a **named
method**, then register that method.

> [!CAUTION]
> **`@LogRequest` above `this.on('boost', async (req) => …)` is a syntax error** — there is
> no method to decorate. The fix is a tiny, behaviour-preserving refactor: move the handler
> body into a method `boost(req)`, decorate the **method**, and register it **by reference**
> (row 10). You've only given the function a name and a home.

---

## Step 2.7 — Extract the Handlers Into Decorated Methods

Refactor `boost` and `largestOrder` from inline handlers into decorated class methods.

**Before — inline arrow handlers (inside `init()`):**
```ts
this.on('boost', async (req) => {
  try {
    const ID = req.params[0]
    // … boost logic …
  } catch (error) {
    return 'Error ' + String(error)
  }
})

this.on('largestOrder', async (req) => {
  // … largestOrder logic …
})
```

<sub>code by anubhav trainings</sub>

**After — register by reference, define decorated methods with `on`-prefixed names:**
```ts
import { LogRequest } from './exercises/cap-handler'          // at the top of CatalogService.ts

// inside init():
this.on('boost', (req) => this.onBoost(req))                  // row 10
this.on('largestOrder', (req) => this.onLargestOrder(req))    // row 10

// as class methods (siblings of init()) — names must NOT match the action/function:
@LogRequest                                                   // row 8
async onBoost(req: cds.Request) {
  try {
    const ID = req.params[0]
    // … same boost logic, unchanged …
  } catch (error) {
    return 'Error ' + String(error)
  }
}

@LogRequest                                                   // row 8
async onLargestOrder(req: cds.Request) {
  // … same largestOrder logic, unchanged …
}
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Do NOT name the method after the action (`boost`/`largestOrder`).** CAP auto-registers any
> service method whose name matches an action/function as a *convention-based handler* and
> calls it with the action's **unpacked arguments — not `req`**. That shadows your explicit
> `this.on(...)` and makes `req.params` undefined inside the method (`req.params[0]` →
> `Cannot read properties of undefined`). Naming the methods **`onBoost` / `onLargestOrder`**
> (anything that doesn't match an action name) avoids the auto-wiring, so your forwarding arrow
> is the only handler and `req` is the real request. See Step 2.11.

> [!TIP]
> *Concept — `this.on('boost', (req) => this.onBoost(req))` is a thin forwarding arrow: it keeps `this` bound to the service and calls `this.onBoost`, the **wrapped (logging)** version (rows 8, 10). The method bodies are copied **verbatim** from the old inline handlers — only their location and name changed, plus a `req: cds.Request` annotation (a standalone method must type its own parameters; an inline handler had it inferred).*

> [!CAUTION]
> **`@LogRequest`, not `@LogRequest()`.** Because our decorator takes `(method, context)`
> directly, apply it **bare**: `@LogRequest`. The `@LogRequest()` *call* form is only for
> **decorator factories** — functions that take options and *return* a decorator (e.g.
> `@LogRequest({ level: 'debug' })`). Mixing them up is a common first error.

---

## Step 2.8 — Make the Logging CAP-Safe

> [!CAUTION]
> **A CAP `req` is a circular object** (it references its own context and transaction), so
> the `JSON.stringify(args)` from Step 2.3 **throws** *"Converting circular structure to
> JSON"* the instant you log it — which would crash the handler. Guard the stringify so the
> decorator can never break the request it is only meant to observe.

```ts
// add to srv/exercises/cap-handler.ts
function safeArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args)
  } catch {
    return '[args not serializable]'        // CAP req is circular — don't crash on it
  }
}
```

<sub>code by anubhav trainings</sub>

Then use `safeArgs(args)` in place of `JSON.stringify(args)` inside the replacement function.

> [!TIP]
> *Concept — this keeps the decorator **generic** (it still knows nothing about CAP). For readable CAP output you could log the meaningful parts instead — e.g. the event name via `(args[0] as cds.Request)?.event`. For this exercise the safe fallback is enough: you still get the **method name** and the **timing**, which is the point.*

---

## Step 2.9 — Run and Observe

The project's Jest tests already call `boost` and `largestOrder`, so the decorator logs show
up in the test output — the simplest way to see it work:

```powershell
npx tsc --noEmit     # type-clean: decorated methods + the import resolve
npm test             # tests invoke boost/largestOrder → decorator logs print
```

<sub>code by anubhav trainings</sub>

Or run the live server and trigger the action over OData:

```powershell
cds watch            # then call the boost action; watch the terminal log the call + ms
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — in the output you'll see `→ boost(...)` and `← boost finished in N ms` wrapped around CAP's own `Hey Amigo …` line. That sandwich is proof the decorator runs **around** the real handler — same behaviour, now with logging and timing it never had to ask for.*

---

## Step 2.10 — Troubleshooting: `SyntaxError` on `@LogRequest` (boost "stops working")

You add the decorator, `cds watch` is fine — but `npm test` (or anything that loads the
service through Node) fails, and the action you were testing appears broken:

```text
srv/CatalogService.ts:44
    @cap_handler_1.LogRequest // row 8
    ^
SyntaxError: Invalid or unexpected token
```

<sub>code by anubhav trainings</sub>

This is **not** a bug in `boost`. The `SyntaxError` means the **whole service file failed to
load**, so *every* handler (boost, largestOrder, the validations) goes dead at once — it just
looks like "boost stopped working" because that's what you were exercising.

> [!CAUTION]
> **Root cause — `"target": "ESNext"`.** With that target, TypeScript assumes the runtime has
> **native** decorator support and emits your `@LogRequest` **unchanged**. Node has no native
> decorators, so `require()`-ing the compiled file throws `SyntaxError`. `cds watch` dodges
> this because **tsx/esbuild always down-levels decorators**; **`ts-jest` (plain `tsc`) obeys
> `target: ESNext`** and leaves them raw — which is why the break only shows up under Jest.

The fix — **keep the project on `ESNext`**, and down-level the decorator for **`ts-jest`
only**, by overriding the target in the test transform. `ts-jest`'s inline `tsconfig` object
**merges onto** your real `tsconfig.json`, so this changes nothing outside the test run:

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: { module: 'CommonJS', target: 'ES2022' }   // ← add target: 'ES2022'
    }]
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — proof at the transpiler level: feed `class X { @Log foo(){} }` to TypeScript and the `@Log` text **survives** at `target: ESNext` but is **removed** (replaced by the decorator helper) at `target: ES2022` or lower. The override moves **only the Jest compile** to ES2022 — your `tsconfig.json` stays `ESNext`, so `cds watch` (tsx) and any production build are untouched. Node 24 runs every ES2022 feature natively, so nothing else changes.*

> [!CAUTION]
> **Do *not* "fix" it with `experimentalDecorators: true`.** That flips TypeScript to the
> **legacy** decorator system, whose signature is `(target, propertyKey, descriptor)` — which
> does **not** match our Stage 3 `(method, context)` decorator, so it would fail to compile.
> Keep Stage 3; the only change needed is the `target`.

---

## Step 2.11 — Troubleshooting: `req.params` is undefined inside the handler

You run the action and hit:

```text
TypeError: Cannot read properties of undefined (reading '0')
    at CatalogService.boost (srv/CatalogService.ts:47:22)            ← const ID = req.params[0]
    at CatalogService.replacement (srv/exercises/cap-handler.ts:17)  ← originalMethod.apply(this, args)
    at <anonymous> (node_modules/@sap/cds/lib/srv/srv-methods.js:45)  ← CAP called the method
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Root cause — the method name matches the action name.** CAP scans your service for
> methods named after each action/function (`srv-methods.js → add_handler_for`). If it finds
> `srv.boost`, it **auto-registers it** as a *convention-based handler* and calls it with the
> action's **unpacked arguments — not `req`**:
> ```js
> srv.on(event, function ({ params, data }) {
>   const args = []; if (def.parent) args.push(def.parent)
>   for (let p in params) args.push(params[p])
>   for (let p in data)   args.push(data[p])
>   return method.apply(this, args)   // boost(parentEntity) — there is no req here
> })
> ```
> So your `req` parameter is actually the bound entity (or `undefined`), `req.params` is
> undefined, and `req.params[0]` throws. This auto-handler **shadows** your explicit
> `this.on('boost', (req) => this.boost(req))` — the stack proves it: `replacement` is called
> straight from `srv-methods.js:45`, not from your arrow.

> [!TIP]
> *Concept — the giveaway is in the decorator's own log: a real request prints `→ boost([args not serializable])` (the circular `req`), but the broken path prints `→ boost([])` or `→ largestOrder([])` — the empty/unpacked args from CAP's convention handler. `largestOrder` even appears to "work" because it never reads `req.params`; only `boost` crashes.*

The fix — **rename the methods so they don't collide with action/function names** (e.g.
`onBoost`, `onLargestOrder`), keeping the explicit registration:

```ts
this.on('boost', (req) => this.onBoost(req))               // explicit handler stays
this.on('largestOrder', (req) => this.onLargestOrder(req))

@LogRequest async onBoost(req: cds.Request) { /* req.params[0] now works */ }
@LogRequest async onLargestOrder(req: cds.Request) { /* … */ }
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — once no method is named `boost`, `add_handler_for`'s `if (method)` check is false, CAP skips the auto-wiring, and your forwarding arrow is the **only** handler — so `req` is the genuine `cds.Request` with a populated `params` getter. This is why the original inline handler never had the problem: there was no method named `boost` to auto-bind.*

---

## ✅ Outcome Check

- [ ] `LogRequest` lives in `srv/exercises/cap-handler.ts` and is **imported** into `CatalogService`.
- [ ] The decorated methods are named **`onBoost` / `onLargestOrder`** — *not* `boost` / `largestOrder` (Step 2.11).
- [ ] They are registered by reference: `this.on('boost', (req) => this.onBoost(req))`.
- [ ] `npm test` prints the **method name** and **execution time** around each action.
- [ ] `req.params[0]` resolves correctly inside `onBoost` (no `TypeError`).
- [ ] `JSON.stringify` is **guarded** so the circular `req` can't crash the handler.
- [ ] `jest.config.js` overrides **`target: 'ES2022'`** for `ts-jest` so Node can load the decorated service — project `tsconfig.json` stays `ESNext` (Step 2.10).
- [ ] Behaviour is unchanged — every existing test still passes.

---

## Final Files

### `srv/exercises/cap-handler.ts` — the reusable decorator

```ts
// ── Reusable method decorator: logs name, args, and execution time ────
export function LogRequest<This, Args extends unknown[], Return>(     // rows 1, 2
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name)                            // row 3

  function replacement(this: This, ...args: Args): Return {          // rows 4, 5
    const start = performance.now()
    console.log(`→ ${methodName}(${safeArgs(args)})`)

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

// CAP request objects are circular — guard the stringify
function safeArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args)
  } catch {
    return '[args not serializable]'
  }
}
```

<sub>code by anubhav trainings</sub>

### `srv/CatalogService.ts` — decorator applied

```ts
import cds from '@sap/cds'
import { EmployeeSet_, PurchaseOrderSet_, PurchaseItemsSet_ } from '#cds-models/CatalogService'
import { LogRequest } from './exercises/cap-handler'                 // import the decorator

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

    this.on('boost', (req) => this.onBoost(req))                     // row 10: register by reference
    this.on('largestOrder', (req) => this.onLargestOrder(req))       // row 10

    this.on('getOrderDefaults', async req => {
      return { OVERALL_STATUS: 'N' }
    })
    this.on('setOrderProcessing', PurchaseOrderSet_, async req => {
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_, (req.params[0] as { ID: string }).ID)
        .set({ OVERALL_STATUS: 'D' } as any)
    })

    return super.init()
  }

  // NOTE: method names are onBoost / onLargestOrder — they must NOT match the
  // action names 'boost' / 'largestOrder', or CAP auto-calls them without `req` (Step 2.11).
  @LogRequest                                                        // row 8
  async onBoost(req: cds.Request) {
    try {
      const ID = req.params[0]
      console.log('Hey Amigo, Your purchase order with id ' + JSON.stringify(req.params[0]) + ' will be boosted')
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_).with({
        GROSS_AMOUNT: { '+=': 20000 },
        NOTE: 'Boosted!!'
      } as any).where(ID)
    } catch (error) {
      return 'Error ' + String(error)
    }
  }

  @LogRequest                                                        // row 8
  async onLargestOrder(req: cds.Request) {
    try {
      const tx = cds.tx(req)
      const reply = await tx.read(PurchaseOrderSet_)
        .orderBy({ GROSS_AMOUNT: 'desc' } as any).limit(1)
      return reply
    } catch (error) {
      return 'Error ' + String(error)
    }
  }
}
```

<sub>code by anubhav trainings</sub>

<sub>Document generated for the TypeScript decorators exercise · code by anubhav trainings</sub>
