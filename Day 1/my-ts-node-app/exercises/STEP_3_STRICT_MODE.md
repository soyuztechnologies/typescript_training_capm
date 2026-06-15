# Step 3: Mastering TypeScript Strict Mode

## Introduction to Strict Mode

Welcome to Step 3! In the previous step we built a working server. Now we'll turn on *Strict Mode* — TypeScript's paranoid safety inspector — and **apply a handful of focused changes** to the code Step 2 left us with.

This step is an **exercise**: start from your existing `1_server.ts`, then make each change below. Every code block is ready to **copy directly** — the new code is plain TypeScript, and any line being **replaced** is shown **commented out** (prefixed with `// BEFORE:`) right above its replacement, so you can see exactly what changed without breaking compilation if you paste the whole block.

---

## 📋 Strict Mode Concept Cheatsheet

| Strict Rule | What It Catches | The Bug It Prevents |
|-------------|-----------------|---------------------|
| **strictNullChecks** | Values that could be `null`/`undefined` | Calling `.x` on `undefined` → crash |
| **noImplicitAny** | Untyped params/variables | Passing wrong types silently |
| **noUnusedParameters** | Declared-but-unused params | Dead code, leftover args |
| **noImplicitReturns** | A code path with no `return` | Function returns `undefined` unexpectedly |
| **noUncheckedIndexedAccess** | `arr[i]` / `obj[key]` access | Reading past the end of an array |
| **exactOptionalPropertyTypes** | `field: undefined` vs absent | Confusing "set to undefined" with "missing" |
| **Type guards** | `typeof` / `instanceof` checks | Using untrusted input as the wrong type |
| **`??` nullish coalescing** | `null`/`undefined` fallbacks | Missing env vars / params |

> 💡 Setting `"strict": true` turns on the first six rules at once. The last two are patterns strict mode *pushes you toward*.

---

## Our Starting Point (the code Step 2 left us with)

This is the `1_server.ts` we finished Step 2 with. Every change in this step is applied **on top of this file**:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import type { User } from './types/user';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];

app.get('/api/users', (_req: Request, res: Response) => {
  res.json(users);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === parseInt(req.params.id as string));
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

> 📌 Save this as `src/2_strictserver.ts` to keep Step 2 intact, then apply the changes below.

---

## The Changes

### Change 1 — Enable strict mode in `tsconfig.json`

Turn on the compiler checks. This is what makes every change below *required* rather than optional.

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

> 💡 TS's `"strict"` and JS's `'use strict'` are **completely different** — one is compile-time type safety, the other is a small runtime tweak.

---

### Change 2 — Safe `PORT` parsing (`strictNullChecks` + `??`)

`process.env.PORT` is typed `string | undefined`. `??` supplies a fallback string; `parseInt` guarantees a real `number`.

```typescript
const app = express();
// BEFORE: const PORT = process.env.PORT || 3000;
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
```

---

### Change 3 — Add helper functions with explicit types

`noImplicitAny` forces the parameter types; the explicit return types document exactly what each helper gives back. Add these just above `const app = express();`:

```typescript
// Return type 'User | undefined' forces every caller to handle "not found".
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

// Explicit param + return types satisfy noImplicitAny.
function createUser(username: string, email: string): User {
  return { id: users.length + 1, username, email };
}
```

---

### Change 4 — GET all users: explicit `: void` return type

The handler returns nothing, so say so. Making it explicit is what `noImplicitReturns` rewards.

```typescript
// BEFORE: app.get('/api/users', (_req: Request, res: Response) => {
app.get('/api/users', (_req: Request, res: Response): void => {
  res.json(users);
});
```

---

### Change 5 — GET user by ID: NaN guard, null check, explicit returns

This is the biggest change. `noUncheckedIndexedAccess` makes `req.params['id']` a `string | undefined`, so we supply a fallback; `parseInt` can return `NaN`, so we guard it; and each early exit becomes a bare `return` (the handler is now `: void`).

```typescript
// BEFORE (remove the whole old handler):
// app.get('/api/users/:id', (req: Request, res: Response) => {
//   const user = users.find(u => u.id === parseInt(req.params.id as string));
//   if (!user) return res.status(404).json({ message: 'User not found' });
//   return res.json(user);
// });

app.get('/api/users/:id', (req: Request, res: Response): void => {
  // noUncheckedIndexedAccess: req.params['id'] is string | undefined,
  // so '??' supplies a fallback before parseInt.
  const rawId: string = req.params['id'] ?? '';
  const parsedId: number = parseInt(rawId, 10);

  // parseInt can return NaN — strict mode nudges you to handle it.
  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return;
  }

  // 'User | undefined' — TS will NOT let you use 'user' until checked.
  const user: User | undefined = findUserById(parsedId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json(user); // here TS KNOWS user is a User, never undefined
});
```

---

### Change 6 — Add a POST route that validates untrusted input (type guards)

The base code had no POST route. Add one that treats `req.body` as `unknown` and proves the fields are strings with *type guards* before trusting them. Add this after the GET-by-ID route:

```typescript
app.post('/api/users', (req: Request, res: Response): void => {
  // Treat external input as 'unknown', NOT 'any' — forces validation.
  const body = req.body as { username?: unknown; email?: unknown };
  const { username, email } = body;

  // Type guards: prove these are strings before trusting them.
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
```

> **Key Concept — Type Guards:** `typeof username !== 'string'` is a *type guard*. After it, TypeScript *narrows* `username` from `unknown` to `string`, so `.trim()` is safe.

---

### Change 7 — Error middleware: explicit `: void`

The params already used the `_` prefix in Step 2 (satisfying `noUnusedParameters`). Just add the return type.

```typescript
// BEFORE: app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
```

---

### Change 8 — `app.listen` callback: explicit `: void`

```typescript
// BEFORE: app.listen(PORT, () => {
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

---

## Strict Mode Checklist

- [ ] `"strict": true` (and the related flags) enabled in `tsconfig.json`
- [ ] All function return types are explicit (`: void` / `: ReturnType`)
- [ ] Nullable values (`undefined`/`null`) are handled (`??`, `if` checks)
- [ ] Indexed access (`req.params['id']`) has a fallback
- [ ] `parseInt` results are NaN-checked
- [ ] External input (`req.body`) is validated with type guards before use
- [ ] Unused parameters are prefixed with `_`

---

## Complete `2_strictserver.ts` Code

After applying every change above, your file should look like this:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import type { User } from './types/user';

// Helpers — explicit param + return types (noImplicitAny satisfied)
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

function createUser(username: string, email: string): User {
  return { id: users.length + 1, username, email };
}

const app = express();
// strictNullChecks: '??' + parseInt guarantee a number
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);

app.use(json());

const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];

// GET all users
app.get('/api/users', (_req: Request, res: Response): void => {
  res.json(users);
});

// GET user by ID
app.get('/api/users/:id', (req: Request, res: Response): void => {
  const rawId: string = req.params['id'] ?? '';
  const parsedId: number = parseInt(rawId, 10);

  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return;
  }

  const user: User | undefined = findUserById(parsedId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json(user);
});

// POST create user
app.post('/api/users', (req: Request, res: Response): void => {
  const body = req.body as { username?: unknown; email?: unknown };
  const { username, email } = body;

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

// Error handler — 4-argument signature
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

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Strict mode is your safety net** — it catches errors before they crash your app
2. **Always handle undefined** — use `if` checks, optional chaining `?.`, or nullish coalescing `??`
3. **Validate external input** — check types of data from requests with type guards
4. **Return types matter** — make them explicit (`: void`) so callers know what to expect
5. **Each change above** turned a latent runtime bug into a compile-time error

</div>

---

## Next Steps

You've turned the Step 2 server into a strict, type-safe one. **In Step 4**, we'll explore **Decorators** — a powerful TypeScript feature that lets you add behavior to classes and methods automatically.

---

*Code by Anubhav Trainings* | TypeScript Foundation Series