# Step 3: Mastering TypeScript Strict Mode

## Introduction to Strict Mode

Welcome to Step 3! In the previous step, we built a working server, but it has hidden bugs waiting to happen. *Strict Mode* is TypeScript's way of being your paranoid safety inspector—it catches potential errors that would slip through in normal mode (and would never even be noticed in plain JavaScript).

Think of it like the difference between a school with basic rules versus a school with strict security. The strict school catches more problems early, even if it feels restrictive at first.

Throughout this step, each block is shown **side by side**:

- 🟦 **TypeScript with strict mode — what we write now** (inline comments explain what strict mode forces)
- ⬜ **JavaScript / lenient — what we wrote before** (gray background, the unguarded code we used to ship)

---

## 📋 Strict Mode Concept Cheatsheet

| Strict Rule | What It Catches | The Bug It Prevents | In Plain JS Before |
|-------------|-----------------|---------------------|--------------------|
| **strictNullChecks** | Values that could be `null`/`undefined` | Calling `.x` on `undefined` → crash | Crashed at runtime, no warning |
| **noImplicitAny** | Untyped params/variables | Passing wrong types silently | Everything was implicitly `any` |
| **noUnusedParameters** | Declared-but-unused params | Dead code, leftover args | Tolerated forever |
| **noImplicitReturns** | A code path with no `return` | Function returns `undefined` unexpectedly | No check |
| **noUncheckedIndexedAccess** | `arr[i]` / `obj[key]` access | Reading past the end of an array | Returned `undefined`, crashed later |
| **exactOptionalPropertyTypes** | `field: undefined` vs absent | Confusing "set to undefined" with "missing" | No concept of it |
| **Type guards** | `typeof` / `instanceof` checks | Using untrusted input as the wrong type | You just hoped the data was right |
| **`??` nullish coalescing** | `null`/`undefined` fallbacks | Missing env vars / params | `||` (which also catches `0`/`''`) |

> 💡 Setting `"strict": true` turns on the first six rules at once. The last two are patterns strict mode *pushes you toward*.

---

## Enabling Strict Mode in tsconfig.json

<table>
<tr>
<th width="50%">🟦 TypeScript — strict config</th>
<th width="50%">⬜ JavaScript — no config at all</th>
</tr>
<tr>
<td>

```json
{
  "compilerOptions": {
    "strict": true,                 // master switch
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

</td>
<td style="background-color:#f0f0f0">

```javascript
// JavaScript has no compiler and no strictness setting.
// The ONLY runtime guard available was:
'use strict';
// ...which only affects a few runtime behaviors —
// it does NOTHING for types, null checks, or unused code.
```

</td>
</tr>
</table>

> 💡 **Pro Tip:** Setting `"strict": true` automatically enables all the strict checks below it. Note that TS's `"strict"` and JS's `'use strict'` are **completely different things** — one is compile-time type safety, the other is a small runtime behavior tweak.

---

## Building the Strict Server — Step by Step

### Section 1: Helper Functions with Explicit Types

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
interface User { id: number; username: string; email: string; }

// Return type 'User | undefined' FORCES every caller to
// handle the not-found case. noImplicitAny forces the
// 'id: number' annotation.
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

function createUser(username: string, email: string): User {
  const newUser: User = { id: users.length + 1, username, email };
  return newUser;
}
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// No interface, no parameter types, no return type.
// 'id' could be a string, number, object — anything.
function findUserById(id) {
  return users.find(u => u.id === id);
}

function createUser(username, email) {
  // Nothing stops a caller passing numbers or objects here.
  return { id: users.length + 1, username, email };
}
```

</td>
</tr>
</table>

> **Why it matters:** In JS, `findUserById('1')` (string) silently returns `undefined` because `u.id === '1'` is never true. TypeScript's `id: number` rejects the bad call at compile time.

---

### Section 2: Safely Reading Environment Variables

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
const app = express();

// strictNullChecks knows process.env.PORT is string|undefined.
// '??' supplies a fallback string; parseInt guarantees a number.
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);

app.use(json());
```

</td>
<td style="background-color:#f0f0f0">

```javascript
const app = express();

// PORT could be undefined and nobody warns you.
const PORT = process.env.PORT || 3000;

app.use(json());
// app.listen(PORT) might receive undefined → crash,
// discovered only when deployed without the env var set.
```

</td>
</tr>
</table>

> 💡 **TS advantage:** `strictNullChecks` makes "this might be undefined" a visible, compile-time fact instead of a production surprise.

---

### Section 3: GET All Users (Unused Params & Explicit Return)

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
// '_req' — the underscore satisfies noUnusedParameters.
// ': void' makes the return type explicit.
app.get('/api/users', (_req: Request, res: Response): void => {
  res.json(users);
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// 'req' is declared but never used — JS doesn't care.
// No return type, no signal about what this handler gives back.
app.get('/api/users', (req, res) => {
  res.json(users);
});
```

</td>
</tr>
</table>

---

### Section 4: GET User by ID (Null Checks & NaN Guards)

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
app.get('/api/users/:id', (req: Request, res: Response): void => {
  const rawId: string = String(req.params['id']) ?? '';
  const parsedId: number = parseInt(rawId, 10);

  // parseInt can return NaN — strict mode nudges you to handle it.
  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return; // explicit return, not "return res.json(...)"
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

</td>
<td style="background-color:#f0f0f0">

```javascript
app.get('/api/users/:id', (req, res) => {
  const parsedId = parseInt(req.params.id);
  // No NaN check, no undefined check — both are easy to forget.
  const user = users.find(u => u.id === parsedId);

  // If you forget this line, the next one crashes with
  // "Cannot read properties of undefined".
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user);
});
```

</td>
</tr>
</table>

---

### Section 5: POST Create User (Validating Untrusted Input)

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
app.post('/api/users', (req: Request, res: Response): void => {
  // Treat external input as 'unknown', NOT 'any'. 'unknown'
  // forces validation before use; 'any' would let you skip it.
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

</td>
<td style="background-color:#f0f0f0">

```javascript
app.post('/api/users', (req, res) => {
  // req.body is whatever the client sent — fully trusted.
  const { username, email } = req.body;

  // A loose truthy check. A number, an object, an array —
  // all pass this and get stored as a "username".
  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  const newUser = { id: users.length + 1, username, email };
  users.push(newUser);
  res.status(201).json(newUser);
});
```

</td>
</tr>
</table>

> **Key Concept — Type Guards:** `typeof username !== 'string'` is a *type guard*. After it, TypeScript *narrows* `username` from `unknown` to `string`, so `.trim()` is safe. JavaScript could run `.trim()` on anything and crash if it wasn't a string.

---

### Section 6: Error Middleware (Fully Typed)

<table>
<tr>
<th width="50%">🟦 TypeScript — strict</th>
<th width="50%">⬜ JavaScript — before</th>
</tr>
<tr>
<td>

```typescript
// All 4 params typed; unused ones prefixed with _.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack); // err.stack is type-checked
  res.status(500).json({ message: 'Something went wrong!' });
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack); // err.stak typo → silent undefined
  res.status(500).json({ message: 'Something went wrong!' });
});
```

</td>
</tr>
</table>

---

## Strict Mode Rules Explained (Deep Dive)

### Rule 1: strictNullChecks — forces handling of `null`/`undefined`

```typescript
// ❌ WITH strictNullChecks: Error caught at compile time
const port: number = process.env.PORT; // ❌ PORT can be undefined

// ✅ The fix:
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
```

### Rule 2: noImplicitAny — no silent `any`

```typescript
// ❌ ERROR: username has an implicit 'any' type
function createUser(username, email) { /* ... */ }

// ✅ The fix:
function createUser(username: string, email: string): User { /* ... */ }
```

### Rule 3: noUnusedParameters — flags unused params

```typescript
// ✅ Prefix intentionally-unused params with '_'
app.get('/api/users', (_req: Request, res: Response): void => {
  res.json(users);
});
```

### Rule 4: noImplicitReturns — every path must return

```typescript
// ✅ Return type includes 'undefined', so the implicit
//    "not found" path is valid.
function findUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
}
```

### Rule 5: noUncheckedIndexedAccess — `arr[i]` is `T | undefined`

```typescript
const firstUser = users[0]; // typed User | undefined
console.log(firstUser?.id); // optional chaining handles the gap

// With req.params:
const id = req.params['id'] ?? ''; // never undefined now
```

### Rule 6: exactOptionalPropertyTypes — absent ≠ `undefined`

```typescript
interface User { id: number; username: string; email?: string; }

const ok:  User = { id: 1, username: 'john' };                    // ✅ absent
const bad: User = { id: 1, username: 'john', email: undefined };  // ❌ explicit undefined
```

---

## Common Type Guards Reference

```typescript
typeof value === 'string'              // Is it a string?
typeof value === 'number'              // Is it a number?
typeof value === 'boolean'             // Is it a boolean?
Array.isArray(value)                   // Is it an array?
value !== null && value !== undefined  // Is it present?
value instanceof ClassName             // Is it an instance of a class?
```

---

## Strict Mode Checklist

- [ ] All function parameters have explicit types
- [ ] All function return types are explicit
- [ ] Nullable values (`undefined`/`null`) are handled
- [ ] No unused parameters (prefix with `_` if intentional)
- [ ] No unused local variables
- [ ] All error paths are handled
- [ ] External input (`req.body`, env vars) is validated before use

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
5. **Type guards are essential** — Use `typeof`, `instanceof`, `Array.isArray()` to narrow types
6. **Helper functions improve code** — Encapsulate logic with clear input/output types
7. **The JS we wrote before** had none of these guards — every gray block above was a latent production bug

</div>

---

## Migrating from Step 2 to Step 3

1. **Copy Step 2's code** — Start with your working `1_server.ts`
2. **Add explicit return types** — `: void` or `: ReturnType`
3. **Handle undefined values** — Add `if` null checks
4. **Validate external input** — Add `typeof` checks for `req.body`
5. **Prefix unused params** — Add `_`
6. **Enable strict mode** — Set `"strict": true`
7. **Fix errors** — Address every error TypeScript now reports

---

## Complete `2_strictserver.ts` Code

Now that you've seen each section and compared it to the unguarded JavaScript, here is the full strict server to create as `src/2_strictserver.ts`:

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

// ✅ STRICT: Explicit return type forces callers to handle 'undefined'
function findUserById(id: number): User | undefined {
  return users.find((u: User) => u.id === id);
}

// ✅ STRICT: Explicit param + return types — noImplicitAny satisfied
function createUser(username: string, email: string): User {
  const newUser: User = {
    id: users.length + 1,
    username,
    email
  };
  return newUser;
}

const app = express();
// ✅ STRICT: strictNullChecks — '??' + parseInt guarantee a number
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
  const rawId: string = String(req.params['id']) ?? '';
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

## Next Steps

You've learned strict mode! You now understand:
- ✅ How strict mode forces safer code
- ✅ How to handle null/undefined values
- ✅ How to validate external input
- ✅ How to write type-safe functions

**In Step 4**, we'll explore **Decorators**—a powerful TypeScript feature that lets you add behavior to classes and methods automatically. Get ready for some JavaScript magic!

---

*Code by Anubhav Trainings* | TypeScript Foundation Series