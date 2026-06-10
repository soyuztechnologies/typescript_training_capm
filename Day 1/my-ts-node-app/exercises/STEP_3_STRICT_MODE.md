# Step 3: Mastering TypeScript Strict Mode

## Introduction to Strict Mode

Welcome to Step 3! In the previous step, we built a working server, but it has hidden bugs waiting to happen. *Strict Mode* is TypeScript's way of being your paranoid safety inspector—it catches potential errors that would slip through in normal mode.

Think of it like the difference between a school with basic rules versus a school with strict security. The strict school catches more problems early, even if it feels restrictive at first.

---

## Enabling Strict Mode in tsconfig.json

To enable strict mode, update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "strictBindCallApply": true,
    "useUnknownInCatchVariables": true,
    
    // Additional helpful strict checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

<sub>code by anubhav trainings</sub>

> 💡 **Pro Tip:** Setting `"strict": true` automatically enables all strict checks below it. You can then selectively disable ones you don't want.

---

## Strict Mode in Action: 2_strictserver.ts

Now let's see what strict mode forces us to do. Here's the improved version of our server:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';

// ✅ STRICT: Interface is well-typed — no implicit 'any' fields allowed
interface User {
  id: number;
  username: string;
  email: string;
}

// ✅ STRICT: Explicit return type on the helper function
// Without strict: findUserById could silently return 'any'
// With strict: TypeScript forces you to handle the undefined case at call site
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

// ✅ STRICT: Explicit return type — noImplicitAny flags untyped params
// Without strict: (username, email) would be silently typed as 'any'
function createUser(username: string, email: string): User {
  const newUser: User = {
    id: users.length + 1,
    username,  // TypeScript knows these are strings — no 'any' slipping in
    email
  };
  return newUser;
}

const app = express();
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
//                                              ^^^^^^^^^^^
// ✅ STRICT: strictNullChecks flags that process.env.PORT can be undefined
// The nullish coalescing '??' operator safely provides a fallback string
// parseInt() ensures PORT is always a number, not string | undefined

app.use(json());

const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];

// GET all users
app.get('/api/users', (_req: Request, res: Response): void => {
  //                   ^^^^
  // ✅ STRICT: Prefix unused params with '_' to satisfy noUnusedParameters
  // ✅ STRICT: Explicit ': void' return type on route handlers
  res.json(users);
});

// GET user by ID
app.get('/api/users/:id', (req: Request, res: Response): void => {
  const rawId: string = String(req.params['id']) ?? '';
  const parsedId: number = parseInt(rawId, 10);

  // ✅ STRICT: NaN check required because parseInt() can return NaN
  // Without strict: you could skip this and pass NaN directly to findUserById
  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return; // ✅ STRICT: explicit return instead of chained return res.json()
  }

  const user: User | undefined = findUserById(parsedId);
  //           ^^^^^^^^^^^^^^^^
  // ✅ STRICT: strictNullChecks forces you to handle 'undefined' explicitly
  // Without strict: user could be undefined and you'd call user.id and crash

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json(user); // TypeScript now KNOWS user is User (not undefined)
});

// POST create user
app.post('/api/users', (req: Request, res: Response): void => {
  // ✅ STRICT: req.body is typed as 'any' by Express — we narrow it safely
  const body = req.body as { username?: unknown; email?: unknown };
  //                                  ^^^^^^^         ^^^^^^^
  // Use 'unknown' instead of 'any' for untrusted external input (req.body)
  // 'unknown' forces you to validate before use — 'any' lets you skip checks

  const { username, email } = body;

  // ✅ STRICT: Type guards validate unknown → string before using the values
  if (typeof username !== 'string' || typeof email !== 'string') {
    res.status(400).json({ message: 'Username and email must be strings' });
    return;
  }

  if (!username.trim() || !email.trim()) {
    res.status(400).json({ message: 'Username and email are required' });
    return;
  }

  const newUser: User = createUser(username, email);
  users.push(newUser);
  res.status(201).json(newUser);
});

// ✅ STRICT: Error handler — all 4 params explicitly typed
// Express detects error middleware by the 4-argument signature
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

<sub>code by anubhav trainings</sub>

---

## Strict Mode Rules Explained

### Rule 1: strictNullChecks

**What it does:** Forces you to explicitly handle `null` and `undefined` values.

```typescript
// ❌ WITHOUT strictNullChecks: No error
const port: number = process.env.PORT; // PORT could be undefined!
app.listen(port); // Crashes at runtime if PORT is undefined

// ✅ WITH strictNullChecks: Error caught
const port: number = process.env.PORT; // ❌ ERROR: PORT can be undefined
```

**The fix:**
```typescript
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
//                                                ^^
// The '??' (nullish coalescing) operator provides a default value
// If process.env.PORT is null/undefined, use '3000' instead
```

**Another example:**
```typescript
function findUser(id: number): User | undefined {
  return users.find(u => u.id === id);
}

// ❌ WITHOUT strictNullChecks: No error
const user = findUser(1);
console.log(user.email); // Could crash if user is undefined!

// ✅ WITH strictNullChecks: Error caught
const user: User | undefined = findUser(1);
console.log(user.email); // ❌ ERROR: user could be undefined
```

**The fix:**
```typescript
const user = findUser(1);

// Must check for undefined before using it
if (!user) {
  console.log('User not found');
  return;
}

console.log(user.email); // ✅ Safe: TypeScript knows user exists now
```

---

### Rule 2: noImplicitAny

**What it does:** Forces explicit type annotations. TypeScript won't silently treat something as `any`.

```typescript
// ❌ WITHOUT noImplicitAny: No error
function createUser(username, email) {
  // username and email are implicitly 'any'
  // Could be string, number, object, anything!
}

// ✅ WITH noImplicitAny: Error caught
function createUser(username, email) {
  // ❌ ERROR: username has implicit any type
}
```

**The fix:**
```typescript
function createUser(username: string, email: string): User {
  // Now TypeScript knows username and email are strings
  return {
    id: users.length + 1,
    username,
    email
  };
}
```

---

### Rule 3: noUnusedParameters

**What it does:** Flags function parameters that are declared but never used.

```typescript
// ❌ ERROR: '_req' parameter is declared but never used
app.get('/api/users', (req: Request, res: Response) => {
  // req is never used in this function
  res.json(users);
});
```

**The fix:**
```typescript
// ✅ Prefix unused parameters with '_'
app.get('/api/users', (_req: Request, res: Response): void => {
  // Now TypeScript knows the underscore means "intentionally unused"
  res.json(users);
});
```

---

### Rule 4: noImplicitReturns

**What it does:** Ensures all code paths in a non-void function return a value.

```typescript
// ❌ ERROR: Some paths don't return
function findUserById(id: number): User {
  const user = users.find(u => u.id === id);
  
  if (user) {
    return user;  // ✅ Returns here
  }
  // ❌ But what if user is not found? No return!
}
```

**The fix:**
```typescript
function findUserById(id: number): User | undefined {
  // Now the return type includes 'undefined'
  const user = users.find(u => u.id === id);
  
  if (user) {
    return user;
  }
  
  return undefined;  // ✅ Explicit return for all paths
}

// OR using implicit return:
function findUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
  // If user is found, returns User; if not, implicitly returns undefined
}
```

---

### Rule 5: noUncheckedIndexedAccess

**What it does:** When accessing array indexes or object keys, TypeScript includes `| undefined` in the type.

```typescript
// ❌ WITHOUT noUncheckedIndexedAccess
const users: User[] = [{ id: 1, username: 'john', email: 'john@mail.com' }];
const firstUser = users[0]; // TypeScript thinks this is definitely User
console.log(firstUser.id); // Could be undefined if array is empty!

// ✅ WITH noUncheckedIndexedAccess
const firstUser = users[0]; // TypeScript knows this is User | undefined
console.log(firstUser.id); // ❌ ERROR: firstUser could be undefined
```

**The fix:**
```typescript
const firstUser = users[0];

if (firstUser !== undefined) {
  console.log(firstUser.id); // ✅ Safe: TypeScript knows it exists
}

// OR using optional chaining
console.log(firstUser?.id); // Returns undefined if firstUser is undefined
```

**With req.params:**
```typescript
// ❌ ERROR: req.params['id'] could be undefined
const id = req.params['id'];
const parsedId = parseInt(id, 10);

// ✅ Fixed with nullish coalescing
const id = req.params['id'] ?? '';
const parsedId = parseInt(id, 10);
```

---

### Rule 6: exactOptionalPropertyTypes

**What it does:** Optional properties (`?`) must be either absent OR have the correct type—not explicitly `undefined`.

```typescript
interface User {
  id: number;
  username: string;
  email?: string;  // Optional: either absent or string
}

// ✅ OK: property is absent
const user1: User = { id: 1, username: 'john' };

// ✅ OK: property has correct type
const user2: User = { id: 1, username: 'john', email: 'john@mail.com' };

// ❌ ERROR: property is explicitly undefined (not absent)
const user3: User = { id: 1, username: 'john', email: undefined };
```

---

## Type Guards: Validating External Input

When data comes from the outside (HTTP requests, environment variables, file system), we must validate it:

```typescript
app.post('/api/users', (req: Request, res: Response): void => {
  const body = req.body as { username?: unknown; email?: unknown };

  const { username, email } = body;

  // ✅ STRICT: Type guards check that values are strings
  if (typeof username !== 'string') {
    res.status(400).json({ message: 'Username must be a string' });
    return;
  }

  if (typeof email !== 'string') {
    res.status(400).json({ message: 'Email must be a string' });
    return;
  }

  // After these checks, TypeScript KNOWS username and email are strings
  if (!username.trim() || !email.trim()) {
    res.status(400).json({ message: 'Fields cannot be empty' });
    return;
  }

  // ✅ Safe to use as strings now
  const newUser: User = createUser(username, email);
  users.push(newUser);
  res.status(201).json(newUser);
});
```

**Common type guards:**
```typescript
typeof value === 'string'     // Is it a string?
typeof value === 'number'     // Is it a number?
typeof value === 'boolean'    // Is it a boolean?
Array.isArray(value)          // Is it an array?
value !== null && value !== undefined  // Is it not null/undefined?
value instanceof ClassName    // Is it an instance of a class?
```

---

## Comparing: Before vs After Strict Mode

### Example: Finding a User

**Before (lenient mode):**
```typescript
function findUser(id) {  // ❌ Implicit any
  return users.find(u => u.id === parseInt(id)); // ❌ Could be undefined
}

const user = findUser(1);
console.log(user.email);  // ❌ Crashes if user is undefined!
```

**After (strict mode):**
```typescript
function findUser(id: number): User | undefined {
  return users.find(u => u.id === id);
}

const user = findUser(1);
if (!user) {
  console.log('Not found');
  return;
}
console.log(user.email);  // ✅ Safe: TypeScript guarantees user exists
```

### Example: Handling Environment Variables

**Before (lenient mode):**
```typescript
const PORT = process.env.PORT;  // ❌ Could be undefined
app.listen(PORT);  // ❌ Crashes if PORT is undefined
```

**After (strict mode):**
```typescript
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
// ✅ Always a number, never undefined
app.listen(PORT);  // ✅ Safe
```

---

## Helper Functions with Strict Mode

Notice the helper functions in our strict server:

```typescript
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

function createUser(username: string, email: string): User {
  const newUser: User = {
    id: users.length + 1,
    username,
    email
  };
  return newUser;
}
```

**Why these helper functions?**

1. **Encapsulation** — Logic is isolated and reusable
2. **Type Safety** — Clear input and output types
3. **Testability** — Easier to unit test
4. **Readability** — Route handlers become simpler

**Using them:**
```typescript
// Clear, self-documenting code
const user = findUserById(1);

if (!user) {
  res.status(404).json({ message: 'User not found' });
  return;
}

res.json(user);
```

---

## Strict Mode Checklist

When you enable strict mode, check these items:

- [ ] All function parameters have explicit types
- [ ] All function return types are explicit
- [ ] All variables are assigned types (either explicit or inferred)
- [ ] Nullable values (things that could be `undefined` or `null`) are handled
- [ ] No unused parameters (prefix with `_` if intentional)
- [ ] No unused local variables
- [ ] All error paths are handled
- [ ] External input (req.body, env vars) is validated before use

---

<div style="background-color: #90EE90; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎯 Key Concepts:**

**strictNullChecks** — Forces handling of null/undefined values

**noImplicitAny** — Requires explicit type annotations, no silent 'any'

**noUnusedParameters** — Catches unused function parameters

**noImplicitReturns** — Ensures all code paths return in non-void functions

**noUncheckedIndexedAccess** — Array/object access includes | undefined

**Type Guards** — Runtime checks (typeof, instanceof) to narrow types safely

</div>

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Strict mode is your safety net** — It catches errors before they crash your app
2. **Always handle undefined** — Use `if` checks, optional chaining `?.`, or nullish coalescing `??`
3. **Validate external input** — Always check types of data from requests, env vars, etc.
4. **Return types matter** — Make them explicit so callers know what to expect
5. **Type guards are essential** — Use `typeof`, `instanceof`, `Array.isArray()` to safely narrow types
6. **Helper functions improve code** — Encapsulate logic with clear input/output types

</div>

---

## Migrating from Step 2 to Step 3

To upgrade from the basic server to the strict server:

1. **Copy Step 2's code** — Start with your working `1_server.ts`

2. **Add explicit return types** — Add `: void` or `: ReturnType` to functions

3. **Handle undefined values** — Add null checks with `if` statements

4. **Validate external input** — Add `typeof` checks for `req.body`

5. **Prefix unused params** — Add `_` to unused parameters

6. **Enable strict mode** — Set `"strict": true` in tsconfig.json

7. **Fix errors** — Address every error TypeScript now reports

---

## Next Steps

You've learned strict mode! You now understand:
- ✅ How strict mode forces safer code
- ✅ How to handle null/undefined values
- ✅ How to validate external input
- ✅ How to write type-safe functions

**In Step 4**, we'll explore **Decorators**—a powerful TypeScript feature that lets you add behavior to classes and methods automatically. Get ready for some JavaScript magic!

---

*Code by Anubhav Trainings* | TypeScript Foundation Series
