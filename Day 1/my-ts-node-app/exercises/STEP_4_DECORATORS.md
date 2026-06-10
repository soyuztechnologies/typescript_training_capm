# Step 4: Understanding TypeScript Decorators & Reflect-Metadata

## What Are Decorators?

Welcome to Step 4! Decorators are one of TypeScript's most powerful features. Imagine you want to add logging to every method without repeating the same code over and over. *Decorators* let you wrap methods with additional behavior—like a decorator on a picture frame adds beauty without changing the picture itself.

A *decorator* is a special function that modifies a class, method, property, or parameter. It runs when the code is defined, not when it's executed.

---

## Enabling Decorators in tsconfig.json

First, we need to enable experimental decorators in our `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "esnext",
    "module": "nodenext",
    "lib": ["esnext"]
  }
}
```

<sub>code by anubhav trainings</sub>

**What these settings do:**

- **`experimentalDecorators: true`** — Enables decorator syntax (`@DecoratorName`)
- **`emitDecoratorMetadata: true`** — Generates metadata at runtime (needed for `reflect-metadata`)
- **`target: esnext`** — Modern JavaScript version that supports decorators

---

## Installing Reflect-Metadata

Decorators need runtime metadata support. Install the `reflect-metadata` library:

```bash
npm install reflect-metadata
npm install -D @types/reflect-metadata
```

<sub>code by anubhav trainings</sub>

Then import it at the top of your main file:

```typescript
import 'reflect-metadata';  // Must be at the very top!
```

<sub>code by anubhav trainings</sub>

> 💡 **Pro Tip:** Import `reflect-metadata` once at your application's entry point (your main server file).

---

## Creating Your First Decorator: LogMethod

Let's create a decorator that automatically logs when a method is called, what arguments it receives, what it returns, and how long it took:

```typescript
// logger.decorator.ts
import 'reflect-metadata';

// ─────────────────────────────────────────────
// METHOD DECORATOR
// Wraps a method to log its name, arguments, 
// return value, and execution time automatically
// ─────────────────────────────────────────────

export function LogMethod(
  _target: object,                    // prototype of the class
  propertyKey: string,               // name of the method
  descriptor: PropertyDescriptor     // contains the original method
): PropertyDescriptor {

  const originalMethod = descriptor.value; // save original method

  descriptor.value = function (...args: unknown[]) {
    console.log(`[LOG] Calling ${propertyKey} with args:`, args);

    const start = Date.now();
    const result: unknown = originalMethod.apply(this, args); // call original
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

## Understanding the Decorator Parameters

When you create a method decorator, it receives three parameters:

### Parameter 1: `target` (The Class Prototype)

```typescript
export function LogMethod(
  _target: object,  // ← This parameter
  propertyKey: string,
  descriptor: PropertyDescriptor
) { ... }
```

**What is it?** The prototype of the class (the parent object that contains the method).

**Example:**
```typescript
class User {
  @LogMethod
  getName() { return 'John'; }
}

// When @LogMethod runs:
// _target = User.prototype
// _target.constructor.name = 'User'
```

---

### Parameter 2: `propertyKey` (The Method Name)

```typescript
export function LogMethod(
  _target: object,
  propertyKey: string,  // ← This parameter
  descriptor: PropertyDescriptor
) { ... }
```

**What is it?** The name of the method being decorated.

**Example:**
```typescript
class User {
  @LogMethod
  getName() { return 'John'; }  // propertyKey = 'getName'
  
  @LogMethod
  getEmail() { return 'john@mail.com'; }  // propertyKey = 'getEmail'
}
```

---

### Parameter 3: `descriptor` (The Property Descriptor)

```typescript
export function LogMethod(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor  // ← This parameter
) { ... }
```

**What is it?** An object describing the method, including:
- `descriptor.value` — The actual method function
- `descriptor.writable` — Can it be overwritten?
- `descriptor.enumerable` — Does it show up in `for...in` loops?
- `descriptor.configurable` — Can its configuration be changed?

**Example:**
```typescript
// descriptor looks like:
{
  value: function() { ... },  // The actual method
  writable: true,             // Can be reassigned
  enumerable: false,
  configurable: true
}
```

---

## Step-by-Step: How the LogMethod Decorator Works

### Step 1: Save the Original Method

```typescript
const originalMethod = descriptor.value;
```

We store the original method so we can call it later.

### Step 2: Create a Wrapper Function

```typescript
descriptor.value = function (...args: unknown[]) {
  // This new function wraps the original
};
```

We replace the method with a wrapper function that will:
1. Log before calling the original
2. Call the original
3. Log after calling the original

### Step 3: Log Before Execution

```typescript
console.log(`[LOG] Calling ${propertyKey} with args:`, args);
```

This prints something like:
```
[LOG] Calling getAll with args: [Request, Response]
```

### Step 4: Track Execution Time

```typescript
const start = Date.now();
const result: unknown = originalMethod.apply(this, args);
const duration = Date.now() - start;
```

- `Date.now()` — Gets current millisecond timestamp
- `originalMethod.apply(this, args)` — Calls the original method
  - `this` — Preserves the method's context
  - `args` — Passes all arguments
- `duration` — How long the method took

### Step 5: Log After Execution

```typescript
console.log(`[LOG] ${propertyKey} returned:`, result);
console.log(`[LOG] ${propertyKey} took ${duration}ms`);
return result;
```

This prints something like:
```
[LOG] getAll returned: { data: [...], success: true }
[LOG] getAll took 2ms
```

### Step 6: Return the Modified Descriptor

```typescript
return descriptor;
```

JavaScript replaces the original method with our wrapper.

---

## Using the Decorator: 3_server.ts

Now let's use the `@LogMethod` decorator in our Express server. **Important:** Decorators only work on class methods, so we need to move our route handlers into a class:

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

  @LogMethod  // ✅ valid — this is a class method
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

  @LogMethod  // ✅ valid — this is a class method
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
// Instantiate and bind — 'this' must be bound
// or arrow functions used, otherwise 'this' is
// lost when Express calls the handler
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

<sub>code by anubhav trainings</sub>

---

## Important: Binding `this` Context

When you use class methods as route handlers, you must preserve the `this` context. Here's why:

```typescript
const ctrl = new UserController();

// ❌ WRONG: 'this' is lost
app.get('/api/users', ctrl.getAll);

// ✅ CORRECT: 'this' is preserved
app.get('/api/users', ctrl.getAll.bind(ctrl));
```

**What's happening:**

```typescript
class UserController {
  data = [1, 2, 3];
  
  @LogMethod
  getData(): void {
    console.log(this.data);  // Needs 'this' to access data
  }
}

const ctrl = new UserController();

// Without .bind():
const handler = ctrl.getData;
handler(); // ❌ ERROR: 'this' is undefined

// With .bind():
const handler = ctrl.getData.bind(ctrl);
handler(); // ✅ OK: 'this' is ctrl
```

**Alternative: Use arrow functions:**

```typescript
// Arrow functions capture 'this' automatically
const ctrl = new UserController();
app.get('/api/users', () => ctrl.getAll());  // ✅ Works
```

---

## Type Definitions for Our Types

We need to create type definition files. Create `src/types/user.d.ts`:

```typescript
// user.d.ts — all User related types live here
// No imports needed for primitive types in .d.ts files

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

<sub>code by anubhav trainings</sub>

And create `src/types/index.d.ts` as a barrel file:

```typescript
// index.d.ts — barrel file, re-exports everything from all type files
// Consumers import from one place: import type { User } from './types'

export type { User, CreateUserBody, UserParams, ApiResponse } from './user';
// Add more exports here as your app grows:
// export type { AuthToken, JwtPayload } from './auth';
// export type { ProductBody, ProductParams } from './product';
```

<sub>code by anubhav trainings</sub>

---

## How Decorators Work: The Process

Here's the complete flow of what happens when you use `@LogMethod`:

```typescript
class UserController {
  @LogMethod
  getAll(req: Request, res: Response): void {
    res.json(users);
  }
}
```

**At compile time:**
1. TypeScript sees `@LogMethod` above the `getAll` method
2. TypeScript calls `LogMethod` with the descriptor of `getAll`
3. `LogMethod` returns a modified descriptor
4. The modified descriptor replaces the original `getAll` method

**At runtime:**
1. When you call `controller.getAll()`, the wrapper function runs
2. Wrapper logs the call
3. Wrapper calls the original method
4. Wrapper logs the result
5. Wrapper returns the result

**Console output example:**
```
[LOG] Calling getAll with args: [Request, Response]
[LOG] getAll returned: {data: [...], success: true}
[LOG] getAll took 1ms
```

---

## Different Types of Decorators

TypeScript supports decorators on:

### 1. Methods (What we covered)
```typescript
class UserController {
  @LogMethod
  getAll() { }
}
```

### 2. Properties
```typescript
class User {
  @Validate
  username: string;
}
```

### 3. Parameters
```typescript
class UserController {
  getUser(@ValidateId id: number) { }
}
```

### 4. Class Decorators
```typescript
@Injectable
class UserController { }
```

---

## Real-World Use Cases for Decorators

### Use Case 1: Logging (What we built)
```typescript
@LogMethod
getUser() { }
// Automatically logs: method name, args, return value, execution time
```

### Use Case 2: Authentication
```typescript
@RequireAuth
deleteUser() { }
// Automatically checks if user is authenticated before running
```

### Use Case 3: Validation
```typescript
@ValidateInput
createUser(data: unknown) { }
// Automatically validates input before method runs
```

### Use Case 4: Caching
```typescript
@Cacheable({ ttl: 60000 })
getUser(id: number) { }
// Automatically caches result for 60 seconds
```

---

## Decorator Metadata with Reflect-Metadata

The `reflect-metadata` library lets decorators store and retrieve type information:

```typescript
import 'reflect-metadata';

function StoreMetadata(metadata: string) {
  return function(target: object, propertyKey: string) {
    Reflect.defineMetadata('custom', metadata, target, propertyKey);
  };
}

class UserController {
  @StoreMetadata('This method gets all users')
  getAll() { }
}

// Later, retrieve the metadata:
const meta = Reflect.getMetadata('custom', UserController.prototype, 'getAll');
console.log(meta);  // "This method gets all users"
```

<sub>code by anubhav trainings</sub>

---

## Common Decorator Pattern: Before/After

Here's a common pattern—wrapping method execution with before/after logic:

```typescript
function BeforeAfter(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    // BEFORE: Do something before the method runs
    console.log(`🔵 Before ${propertyKey}`);

    // EXECUTE: Call the original method
    const result = originalMethod.apply(this, args);

    // AFTER: Do something after the method runs
    console.log(`🟢 After ${propertyKey}`);

    return result;
  };

  return descriptor;
}

class UserController {
  @BeforeAfter
  deleteUser(id: number): void {
    console.log(`Deleting user ${id}`);
  }
}

// Output when calling deleteUser(1):
// 🔵 Before deleteUser
// Deleting user 1
// 🟢 After deleteUser
```

<sub>code by anubhav trainings</sub>

---

## Testing Your Decorator

Let's test the `@LogMethod` decorator:

```typescript
import 'reflect-metadata';
import { LogMethod } from './decorators/logger.decorator';

class Calculator {
  @LogMethod
  add(a: number, b: number): number {
    return a + b;
  }

  @LogMethod
  multiply(a: number, b: number): number {
    return a * b;
  }
}

const calc = new Calculator();

console.log('\n--- Testing add ---');
const sum = calc.add(5, 3);
console.log(`Result: ${sum}\n`);

console.log('--- Testing multiply ---');
const product = calc.multiply(4, 7);
console.log(`Result: ${product}`);
```

<sub>code by anubhav trainings</sub>

**Expected output:**
```
--- Testing add ---
[LOG] Calling add with args: [ 5, 3 ]
[LOG] add returned: 8
[LOG] add took 1ms
Result: 8

--- Testing multiply ---
[LOG] Calling multiply with args: [ 4, 7 ]
[LOG] multiply returned: 28
[LOG] multiply took 0ms
Result: 28
```

---

<div style="background-color: #90EE90; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎯 Key Concepts:**

**Decorator** — A function that wraps a class, method, property, or parameter to add behavior

**@LogMethod** — Our custom decorator that logs method calls, arguments, return values, and execution time

**PropertyDescriptor** — Object containing the method and its configuration properties

**Reflect-Metadata** — Library that enables storing and retrieving type information at runtime

**this binding** — Must use `.bind(this)` when passing class methods as function arguments

**Metadata** — Type information that decorators can store and retrieve at runtime

</div>

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Enable decorators** in tsconfig.json with `"experimentalDecorators": true`
2. **Import reflect-metadata** at the very top of your main file
3. **Decorators modify behavior** without changing the original code
4. **Method decorators** receive `(target, propertyKey, descriptor)` parameters
5. **Save the original method** with `const original = descriptor.value`
6. **Replace with a wrapper** that adds logging, validation, caching, etc.
7. **Binding matters** — Use `.bind(this)` when passing methods as handlers
8. **Class methods only** — Decorators work on class methods, not arrow functions or standalone functions

</div>

---

## Running with Decorators

To run your server with decorators:

```bash
# Build TypeScript
npm run build

# Start the server
npm start
```

<sub>code by anubhav trainings</sub>

When you make a request, you'll see decorator logs:

```
[LOG] Calling getAll with args: [Request, Response]
[LOG] getAll returned: {data: [...], success: true}
[LOG] getAll took 2ms
```

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
