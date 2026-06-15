# Step 4: Understanding TypeScript Decorators & Reflect-Metadata

## What Are Decorators?

Welcome to Step 4! Decorators are one of TypeScript's most powerful features. Imagine you want to add logging to every method without repeating the same code over and over. *Decorators* let you wrap methods with additional behavior—like a decorator on a picture frame adds beauty without changing the picture itself.

A *decorator* is a special function that modifies a class, method, property, or parameter. It runs when the code is defined, not when it's executed.

Throughout this step, each block is shown **side by side**:

- 🟦 **TypeScript with decorators — what we write now** (inline comments explain the advantage)
- ⬜ **JavaScript — what we wrote before** (gray background, the manual wrapping we did without decorators)

> **Note:** Decorators are largely a TypeScript feature (the JS version is still stabilizing). The gray column shows how we achieved the *same effect* in plain JS — usually by manually wrapping functions. That's exactly why decorators were created: to make this pattern clean and reusable.

---

## 📋 Decorator Concept Cheatsheet

| Concept | TypeScript Syntax | What It Does | How We Did It in JS Before |
|---------|-------------------|--------------|----------------------------|
| **Method decorator** | `@LogMethod` above a method | Wraps the method with extra behavior | Manually reassigned the function: `obj.fn = wrap(obj.fn)` |
| **Decorator function** | `function LogMethod(target, key, descriptor)` | Receives the method and returns a modified version | A higher-order function `withLogging(fn)` |
| **PropertyDescriptor** | `descriptor.value` | The actual method being decorated | `Object.getOwnPropertyDescriptor(...)` by hand |
| **`this` binding** | `ctrl.getAll.bind(ctrl)` | Keeps `this` pointing at the instance | Same `.bind()` — a shared JS concept |
| **reflect-metadata** | `Reflect.defineMetadata(...)` | Stores type info readable at runtime | No standard equivalent existed |
| **Enable in tsconfig** | `"experimentalDecorators": true` | Turns the `@` syntax on | n/a — JS had no `@` syntax |

> 💡 A decorator is just **syntactic sugar** over "take this function and replace it with a wrapped version." You did that by hand in JS; `@` makes it declarative and reusable.

---

## Enabling Decorators in tsconfig.json

<table>
<tr>
<th width="50%">🟦 TypeScript — enable decorators</th>
<th width="50%">⬜ JavaScript — nothing to enable</th>
</tr>
<tr>
<td>

```json
{
  "compilerOptions": {
    "experimentalDecorators": true, // turns on @Decorator syntax
    "emitDecoratorMetadata": true,  // needed for reflect-metadata
    "target": "esnext",
    "module": "nodenext",
    "lib": ["esnext"]
  }
}
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// No config. JavaScript has no '@' decorator syntax to enable,
// so wrapping behavior was always written out by hand.
```

</td>
</tr>
</table>

**What these settings do:**
- **`experimentalDecorators: true`** — Enables decorator syntax (`@DecoratorName`)
- **`emitDecoratorMetadata: true`** — Generates runtime metadata (needed for `reflect-metadata`)
- **`target: esnext`** — Modern JS version that supports decorators

---

## Installing Reflect-Metadata

```bash
npm install reflect-metadata
npm install -D @types/reflect-metadata
```

Then import it once at the very top of your entry file:

```typescript
import 'reflect-metadata';  // Must be at the very top!
```

> 💡 **Pro Tip:** Import `reflect-metadata` once at your application's entry point.

---

## The Core Idea: Wrapping a Method

Before the decorator syntax, here's the *same logging behavior* done both ways:

<table>
<tr>
<th width="50%">🟦 TypeScript — declarative decorator</th>
<th width="50%">⬜ JavaScript — manual wrapping</th>
</tr>
<tr>
<td>

```typescript
// Declare ONCE, reuse with @LogMethod everywhere.
class Calculator {
  @LogMethod                       // ← that's it
  add(a: number, b: number): number {
    return a + b;
  }
}
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// You had to wrap each method by hand, every time.
class Calculator {
  add(a, b) { return a + b; }
}
const calc = new Calculator();

const original = calc.add.bind(calc);
calc.add = (a, b) => {
  console.log('[LOG] Calling add with args:', [a, b]);
  const result = original(a, b);
  console.log('[LOG] add returned:', result);
  return result;
};
// Repetitive, error-prone, and clutters business logic.
```

</td>
</tr>
</table>

> 💡 **TS advantage:** The decorator moves all that wrapping boilerplate into one reusable function, and applying it is a single readable line: `@LogMethod`.

---

## Creating the LogMethod Decorator

> 📄 **Create a new file `src/decorators/logger.decorator.ts`** and add the code below. This is the single, reusable decorator we'll apply to our controller methods.

<table>
<tr>
<th width="50%">🟦 TypeScript — reusable decorator</th>
<th width="50%">⬜ JavaScript — reusable HOF equivalent</th>
</tr>
<tr>
<td>

```typescript
// logger.decorator.ts
import 'reflect-metadata';

// A method decorator receives the prototype, the method
// name, and the PropertyDescriptor that holds the method.
export function LogMethod(
  _target: object,                 // prototype of the class
  propertyKey: string,             // name of the method
  descriptor: PropertyDescriptor   // contains the original method
): PropertyDescriptor {

  const originalMethod = descriptor.value; // save the original

  descriptor.value = function (...args: unknown[]) {
    console.log(`[LOG] Calling ${propertyKey} with args:`, args);

    const start = Date.now();
    const result: unknown = originalMethod.apply(this, args);
    const duration = Date.now() - start;

    console.log(`[LOG] ${propertyKey} returned:`, result);
    console.log(`[LOG] ${propertyKey} took ${duration}ms`);

    return result;
  };

  return descriptor; // TS swaps the original method for our wrapper
}
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// The closest JS equivalent: a higher-order function you
// must remember to call on every method yourself.
function withLogging(fn, name) {
  return function (...args) {
    console.log('[LOG] Calling ' + name + ' with args:', args);
    const start = Date.now();
    const result = fn.apply(this, args);
    console.log('[LOG] ' + name + ' returned:', result);
    console.log('[LOG] ' + name + ' took ' + (Date.now() - start) + 'ms');
    return result;
  };
}
// Usage: obj.add = withLogging(obj.add, 'add');
// No '@' sugar — you wire it up manually at each call site.
```

</td>
</tr>
</table>

### Understanding the three decorator parameters

- **`target`** — The class prototype (parent object holding the method). `target.constructor.name` gives the class name.
- **`propertyKey`** — The name of the decorated method (e.g. `'getAll'`).
- **`descriptor`** — Describes the method:
  - `descriptor.value` — the actual function
  - `descriptor.writable` / `enumerable` / `configurable` — its flags

### How it works, step by step

1. **Save the original:** `const originalMethod = descriptor.value;`
2. **Replace with a wrapper:** `descriptor.value = function (...args) { ... }`
3. **Log before:** `console.log('[LOG] Calling ...')`
4. **Time the call:** `Date.now()` around `originalMethod.apply(this, args)`
5. **Log after & return:** print the result/duration, then `return result`
6. **Return the descriptor:** TS installs the wrapper in place of the original

---

## Using the Decorator: 3_server.ts

> 📄 We'll build **`src/3_server.ts`** in three small steps. Do them in order — each one sets up what the next needs.

### Step 1 — Define the shared types (`src/types/user.d.ts`)

Before writing the server, make sure our reusable type contracts exist. These describe the shape of a `User`, the request bodies, and a generic API response — so every handler can rely on them instead of re-checking shapes by hand.

> 📄 **Create (or confirm) `src/types/user.d.ts`:**

```typescript
// user.d.ts — all User related types live here
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface CreateUserBody {
  username: string;
  email: string;
}

export interface UserParams {
  id: string; // route params are always strings in HTTP
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}
```

> 📄 **Create `src/types/index.d.ts`** as a *barrel file* so the rest of the app can import every type from one place:

```typescript
// index.d.ts — re-exports everything so consumers import from one place
export type { User, CreateUserBody, UserParams, ApiResponse } from './user';
```

> 💡 **Concept:** A *barrel file* collects related exports behind a single module. Now any file can write `import type { User } from './types'` instead of reaching into individual files.

---

### Step 2 — Create `src/3_server.ts` and wire up the imports

Now create the server file. Notice we import **two kinds of things we already built**: the type definitions (`.d.ts`) from Step 1, and the `LogMethod` decorator (`logger.decorator.ts`) from the previous section.

> 📄 **Create `src/3_server.ts`** and start with the imports and app scaffold:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import 'reflect-metadata';                  // required once, for decorator metadata

// The shared types we defined in Step 1 (the .d.ts files)
import type { User, CreateUserBody, UserParams, ApiResponse } from './types';
// The decorator we built earlier in logger.decorator.ts
import { LogMethod } from './decorators/logger.decorator';

const app = express();
const PORT: number = parseInt(process.env['PORT'] ?? '3000', 10);
app.use(json());

// In-memory data, typed with our shared User interface
const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];
```

> 💡 **Concept:** `import 'reflect-metadata'` runs once for the whole app and must appear before any decorated class. The two lines below it pull in the *type contracts* and the *behavior* (`@LogMethod`) we built separately — keeping each concern in its own file.

---

### Step 3 — Move the handlers into a `UserController` class

Here's the key idea of this whole step: **decorators only work on class methods, not on standalone functions.** In earlier steps our handlers were plain functions like `app.get('/api/users', (req, res) => { ... })` — there is no method there for `@LogMethod` to attach to.

So we wrap the handlers inside a `UserController` class. Once each handler is a *class method*, we can decorate it with `@LogMethod` and get logging for free.

<table>
<tr>
<th width="50%">🟦 TypeScript — class + decorators</th>
<th width="50%">⬜ JavaScript — plain functions + manual logging</th>
</tr>
<tr>
<td>

```typescript
class UserController {
  @LogMethod                        // logging added declaratively
  getAll(_req: Request, res: Response): void {
    const response: ApiResponse<User[]> = { data: users, success: true };
    res.json(response);
  }
}

const ctrl = new UserController();
// .bind(ctrl) preserves 'this' when Express calls the handler.
app.get('/api/users', ctrl.getAll.bind(ctrl));
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// No decorators — logging is copy-pasted into each handler,
// or each handler is manually wrapped before registration.
function getAll(req, res) {
  console.log('[LOG] Calling getAll');   // repeated everywhere
  res.json({ data: users, success: true });
}

app.get('/api/users', getAll);
```

</td>
</tr>
</table>

Now add the **full `UserController`** with all three handlers, each decorated with `@LogMethod` (the complete `3_server.ts` is assembled at the end of this document):

```typescript
class UserController {

  @LogMethod  // ✅ valid — this is a class method
  getAll(_req: Request, res: Response): void {
    const response: ApiResponse<User[]> = { data: users, success: true };
    res.json(response);
  }

  @LogMethod
  getById(req: Request<UserParams>, res: Response): void {
    const rawId: string = req.params['id'] ?? '';
    const parsedId: number = parseInt(rawId, 10);

    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid ID', success: false });
      return;
    }

    const user = users.find((u: User) => u.id === parsedId);
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    res.json({ data: user, success: true });
  }

  @LogMethod
  create(req: Request<{}, {}, CreateUserBody>, res: Response): void {
    const { username, email } = req.body;

    if (!username?.trim() || !email?.trim()) {
      res.status(400).json({ message: 'Username and email are required', success: false });
      return;
    }

    const newUser: User = { id: users.length + 1, username, email };
    users.push(newUser);
    res.status(201).json({ data: newUser, success: true });
  }
}
```

---

## Important: Binding `this` Context

This is a shared JavaScript concept — but it bites hardest when passing class methods as handlers.

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript (same rule)</th>
</tr>
<tr>
<td>

```typescript
const ctrl = new UserController();

// ❌ WRONG: 'this' is lost
app.get('/api/users', ctrl.getAll);

// ✅ CORRECT: 'this' is preserved
app.get('/api/users', ctrl.getAll.bind(ctrl));
```

</td>
<td style="background-color:#f0f0f0">

```javascript
const ctrl = new UserController();

// Identical pitfall in plain JS:
const handler = ctrl.getData;
handler();                 // ❌ 'this' is undefined

const bound = ctrl.getData.bind(ctrl);
bound();                   // ✅ 'this' is ctrl
```

</td>
</tr>
</table>

**Alternative: arrow functions capture `this` automatically:**
```typescript
const ctrl = new UserController();
app.get('/api/users', () => ctrl.getAll());  // ✅ Works
```

---

### Step 4 — Instantiate the controller, register the routes, and start the server

The `UserController` class only *defines* the handlers — nothing calls them yet. In this final step we create one instance, wire each method to a route (binding `this` as we just learned), add the error handler, and start listening.

> 📄 **Add this to the bottom of `src/3_server.ts`:**

```typescript
const ctrl = new UserController();

// Register each decorated method as a route handler.
// .bind(ctrl) preserves 'this' so the method still works when Express calls it.
app.get('/api/users',     ctrl.getAll.bind(ctrl));   // .bind() preserves 'this'
app.get('/api/users/:id', ctrl.getById.bind(ctrl));
app.post('/api/users',    ctrl.create.bind(ctrl));

// Error-handling middleware (4 args) — registered after the routes.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', success: false });
});

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

> 💡 **Concept:** Defining a class method doesn't run it — Express runs it later, when a request arrives. Because the method is detached from the instance at that point, `.bind(ctrl)` is what keeps `this` pointing at the controller. With the routes registered and `app.listen` called, every request now flows through `@LogMethod` automatically.

---

## Different Types of Decorators

```typescript
class UserController { @LogMethod getAll() {} }   // 1. Method
class User { @Validate username!: string; }        // 2. Property
class C { getUser(@ValidateId id: number) {} }     // 3. Parameter
@Injectable class Service {}                        // 4. Class
```

---

## Real-World Use Cases

```typescript
@LogMethod          getUser() {}              // logging
@RequireAuth        deleteUser() {}           // authentication
@ValidateInput      createUser(d: unknown) {} // validation
@Cacheable({ttl:60000}) getUser(id: number){} // caching
```

Each of these in plain JS meant manually wrapping the function or pasting boilerplate into every method.

---

## Decorator Metadata with Reflect-Metadata

```typescript
import 'reflect-metadata';

function StoreMetadata(metadata: string) {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata('custom', metadata, target, propertyKey);
  };
}

class UserController {
  @StoreMetadata('This method gets all users')
  getAll() {}
}

const meta = Reflect.getMetadata('custom', UserController.prototype, 'getAll');
console.log(meta);  // "This method gets all users"
```

> ⬜ **In JS before:** there was no standard way to attach and later read this kind of structured metadata — people abused property names or maintained separate lookup objects.

---

## Common Pattern: Before/After

```typescript
function BeforeAfter(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    console.log(`🔵 Before ${propertyKey}`);
    const result = originalMethod.apply(this, args);
    console.log(`🟢 After ${propertyKey}`);
    return result;
  };

  return descriptor;
}
```

---

## Testing Your Decorator

```typescript
import 'reflect-metadata';
import { LogMethod } from './decorators/logger.decorator';

class Calculator {
  @LogMethod
  add(a: number, b: number): number { return a + b; }

  @LogMethod
  multiply(a: number, b: number): number { return a * b; }
}

const calc = new Calculator();
console.log('Result:', calc.add(5, 3));
console.log('Result:', calc.multiply(4, 7));
```

**Expected output:**
```
[LOG] Calling add with args: [ 5, 3 ]
[LOG] add returned: 8
[LOG] add took 1ms
Result: 8
[LOG] Calling multiply with args: [ 4, 7 ]
[LOG] multiply returned: 28
[LOG] multiply took 0ms
Result: 28
```

---

<div style="background-color: #90EE90; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎯 Key Concepts:**

**Decorator** — A function that wraps a class, method, property, or parameter to add behavior

**@LogMethod** — Our custom decorator that logs calls, args, return values, and timing

**PropertyDescriptor** — Object containing the method and its configuration

**Reflect-Metadata** — Library that stores/retrieves type information at runtime

**this binding** — Use `.bind(this)` when passing class methods as function arguments

</div>

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Enable decorators** in tsconfig.json with `"experimentalDecorators": true`
2. **Import reflect-metadata** at the very top of your main file
3. **Decorators modify behavior** without changing the original code
4. **Method decorators** receive `(target, propertyKey, descriptor)`
5. **Save the original method** with `const original = descriptor.value`
6. **Replace with a wrapper** that adds logging, validation, caching, etc.
7. **Binding matters** — Use `.bind(this)` when passing methods as handlers
8. **Class methods only** — Decorators work on class methods, not standalone functions
9. **The JS we wrote before** did all of this by hand — decorators just make the pattern declarative and reusable

</div>

---

## Running with Decorators

```bash
npm run build
npm start
```

When you make a request, you'll see decorator logs:
```
[LOG] Calling getAll with args: [Request, Response]
[LOG] getAll returned: {data: [...], success: true}
[LOG] getAll took 2ms
```

---

## Complete `3_server.ts` Code

Now that you've seen each piece and how it compares to plain JavaScript, here is the full file to create as `src/3_server.ts`:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import 'reflect-metadata';

import type { User, CreateUserBody, UserParams, ApiResponse } from './types';
import { LogMethod } from './decorators/logger.decorator';

const app = express();
const PORT: number = parseInt(process.env['PORT'] ?? '3000', 10);
app.use(json());

const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];

// ─────────────────────────────────────────────
// ✅ Move handlers into a class so @LogMethod works
// ─────────────────────────────────────────────
class UserController {

  @LogMethod  // ✅ valid — this is a class method
  getAll(_req: Request, res: Response): void {
    const response: ApiResponse<User[]> = { data: users, success: true };
    res.json(response);
  }

  @LogMethod
  getById(req: Request<UserParams>, res: Response): void {
    const rawId: string = req.params['id'] ?? '';
    const parsedId: number = parseInt(rawId, 10);

    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid ID', success: false });
      return;
    }

    const user = users.find((u: User) => u.id === parsedId);

    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    res.json({ data: user, success: true });
  }

  @LogMethod
  create(req: Request<{}, {}, CreateUserBody>, res: Response): void {
    const { username, email } = req.body;

    if (!username?.trim() || !email?.trim()) {
      res.status(400).json({ message: 'Username and email are required', success: false });
      return;
    }

    const newUser: User = { id: users.length + 1, username, email };
    users.push(newUser);
    res.status(201).json({ data: newUser, success: true });
  }
}

// ─────────────────────────────────────────────
// Instantiate and bind — 'this' must be bound or
// arrow functions used, otherwise 'this' is lost
// when Express calls the handler
// ─────────────────────────────────────────────
const ctrl = new UserController();

app.get('/api/users',     ctrl.getAll.bind(ctrl));   // .bind() preserves 'this'
app.get('/api/users/:id', ctrl.getById.bind(ctrl));
app.post('/api/users',    ctrl.create.bind(ctrl));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', success: false });
});

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

And the decorator itself, `src/decorators/logger.decorator.ts`:

```typescript
import 'reflect-metadata';

export function LogMethod(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    console.log(`[LOG] Calling ${propertyKey} with args:`, args);

    const start = Date.now();
    const result: unknown = originalMethod.apply(this, args);
    const duration = Date.now() - start;

    console.log(`[LOG] ${propertyKey} returned:`, result);
    console.log(`[LOG] ${propertyKey} took ${duration}ms`);

    return result;
  };

  return descriptor;
}
```

<sub>code by anubhav trainings</sub>

---

## Next Steps

You've learned decorators! You now understand:
- ✅ What decorators are and why they're useful
- ✅ How to create method decorators
- ✅ How to apply decorators to class methods
- ✅ How to preserve `this` context with `.bind()`
- ✅ How reflect-metadata works

**In Step 5**, we'll explore **Utility Types**—advanced type manipulation techniques that let you transform types in powerful ways. Ready to become a TypeScript wizard?

---

*Code by Anubhav Trainings* | TypeScript Foundation Series