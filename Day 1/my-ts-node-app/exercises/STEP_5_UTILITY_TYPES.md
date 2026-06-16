# Step 5: Mastering TypeScript Utility Types

## What Are Utility Types?

Welcome to the final step! *Utility Types* are built-in TypeScript types that transform other types. They're like type factories—you feed in a type, and out comes a new type with different properties.

Think of it like this: if you have a blueprint for a house, utility types let you create variations—a blueprint with fewer rooms, optional walls, readonly doors, etc.—without rewriting everything from scratch.

Throughout this step, each block is shown **side by side**:

- 🟦 **TypeScript with utility types — what we write now** (inline comments explain the advantage)
- ⬜ **JavaScript — what we wrote before** (gray background, the untyped objects + manual guards we relied on)

> **Note:** Utility types are a *compile-time* feature — they vanish in the output JavaScript. So the gray column doesn't show "different runtime code"; it shows what we **lost** in JS: there was no way to express "only these fields," "all optional," or "no password here." We just wrote comments and manual checks and hoped.

---

## 📋 Utility Types Concept Cheatsheet

| Utility Type | TypeScript Syntax | What It Produces | The JS We Wrote Before |
|--------------|-------------------|------------------|------------------------|
| **Partial<T>** | `Partial<User>` | All properties optional (`?`) | A plain object + comment "any field may be missing" |
| **Required<T>** | `Required<User>` | All properties mandatory | Manual `if (!x) throw` for every field |
| **Pick<T, K>** | `Pick<User, 'id' \| 'email'>` | Only the named properties | Manually building a new object, hoping you didn't leak fields |
| **Omit<T, K>** | `Omit<User, 'password'>` | Everything except named properties | `const { password, ...rest } = user` + discipline |
| **Readonly<T>** | `Readonly<User>` | All properties immutable | `Object.freeze()` (runtime only) or convention |
| **Record<K, V>** | `Record<'read' \| 'write', boolean>` | Object with fixed keys and value type | A plain object you hoped had the right keys |
| **Compose** | `Partial<Pick<User, 'username'>>` | Combine transforms | Not expressible — you described it in a comment |

> 💡 Every utility type replaces a **comment + manual check** you used to write in JavaScript with a guarantee the compiler enforces.

---

## Common Utility Types — Step by Step

### 1. Partial<T> — Make All Properties Optional

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
interface User { id: number; username: string; email: string; }

// Partial<User> = every field becomes optional.
// Perfect for PATCH: the client sends only what changed.
type UpdatedUser = Partial<User>;
// { id?: number; username?: string; email?: string }

const u1: Partial<User> = { username: 'newName' }; // ✅ only one field
const u2: Partial<User> = {};                       // ✅ empty is valid
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// No way to say "a user object, but every field optional."
// You wrote a comment and validated by hand:
// update = { ...maybe username, ...maybe email }
const u1 = { username: 'newName' };
const u2 = {};
// Nothing stops u3 = { usrname: 'oops' } — silent typo.
```

</td>
</tr>
</table>

**Why it's useful:** PATCH requests, optional updates, flexible objects.

---

### 2. Pick<T, K> — Select Specific Properties

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
interface User {
  id: number; username: string; email: string;
  password: string; createdAt: Date;
}

// Pick = keep ONLY these fields. The compiler GUARANTEES
// password can never appear in this type.
type PublicUserInfo = Pick<User, 'username' | 'email'>;

const safe: PublicUserInfo = {
  username: 'john',
  email: 'john@mail.com'
  // password: 'secret'  // ❌ compile error — not in the type
};
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// You built the "safe" object by hand and PRAYED you
// didn't accidentally spread the password in.
const full = { id: 1, username: 'john', email: 'john@mail.com',
               password: 'secret', createdAt: new Date() };

const safe = { username: full.username, email: full.email };
// One careless `...full` and the password leaks to the client.
```

</td>
</tr>
</table>

**Why it's useful:** Hide sensitive data, shape API responses, restrict accepted fields.

---

### 3. Partial + Pick — Combine for Maximum Flexibility

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
// Layered transform:
//   Pick    → only username & email are allowed
//   Partial → both are optional
// Result: a precise PATCH body type that can NEVER touch
// id or password.
type PatchUserBody = Partial<Pick<User, 'username' | 'email'>>;
// { username?: string; email?: string }
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Inexpressible in JS. The best you could do was a comment:
//   "PATCH body: optional username and/or email only;
//    ignore id and password if present"
// ...and then enforce it with a wall of manual if-checks.
```

</td>
</tr>
</table>

**Why it's useful:** PATCH endpoints that allow partial updates of *only* safe fields.

---

## Deep Dive: The PATCH Endpoint Type

`Partial<Pick<User, 'username' | 'email'>>` is built in layers:

```typescript
// Layer 1: Pick — select username and email only
Pick<User, 'username' | 'email'>
// → { username: string; email: string }

// Layer 2: Partial — make them optional
Partial<Pick<User, 'username' | 'email'>>
// → { username?: string; email?: string }
```

**Why this design?**
- **`Pick`** prevents updating `id` (which could bypass auth)
- **`Partial`** allows sending only the fields that changed

**What the compiler enforces:**
```
PATCH /api/users/1  { "username": "newname" }              ✅ OK
PATCH /api/users/1  { "email": "new@mail.com" }            ✅ OK
PATCH /api/users/1  { "username": "x", "email": "y@z.io" } ✅ OK
PATCH /api/users/1  { "id": 999 }                          ❌ id not in the type
```

---

## Step-by-Step PATCH Logic

We'll build the `patch` handler one piece at a time. **Step 1 declares the method**; every step after it adds code **inside** that method body; the **final step wires it to a route**.

### Step 1: Define the `patch` Method Signature

Start by declaring the method on the `UserController` class. The important part is the request **body type**, `Partial<Pick<User, 'username' | 'email'>>` — the composed utility type from the previous section.

```typescript
// ─────────────────────────────────────────────
// Partial<Pick<User, 'username' | 'email'>>:
//   - Pick    → only username & email are allowed
//   - Partial → both optional
//   - id, password, etc. are NOT accessible at all
// ─────────────────────────────────────────────
@LogMethod
patch(req: Request<UserParams, {}, Partial<Pick<User, 'username' | 'email'>>>, res: Response): void {
  // Steps 2–6 below all go INSIDE this method body
}
```

> 💡 **Concept:** `Request<Params, ResBody, ReqBody>` takes three type arguments — the route params (`UserParams`), the response body (`{}`), and the **request body**. By passing `Partial<Pick<User, 'username' | 'email'>>` as the third, TypeScript guarantees `req.body` can only ever contain an optional `username` and/or `email` — never `id` or `password`.

### Step 2: Validate the ID Parameter
```typescript
const rawId    = req.params['id'] ?? '';
const parsedId = parseInt(rawId, 10);

if (isNaN(parsedId)) {
  res.status(400).json({ message: 'Invalid ID format', success: false });
  return;
}
```

### Step 3: Find the User to Update
```typescript
const index = users.findIndex((u: User) => u.id === parsedId);
if (index === -1) {
  res.status(404).json({ message: 'User not found', success: false });
  return;
}
```
`findIndex` gives the position so we can update in place.

### Step 4: Validate the Body
```typescript
const { username, email } = req.body;

if (!username && !email) {
  res.status(400).json({ message: 'Provide at least username or email', success: false });
  return;
}
if (username !== undefined && !username.trim()) {
  res.status(400).json({ message: 'Username cannot be empty', success: false });
  return;
}
if (email !== undefined && !email.trim()) {
  res.status(400).json({ message: 'Email cannot be empty', success: false });
  return;
}
```
Key pattern: `username !== undefined` — only validate fields that were actually sent.

### Step 5: Merge Update with Existing Data

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
const existingUser: User = users[index] as User;
const updatedUser: User = {
  ...existingUser,                  // keep all existing fields
  ...(username && { username }),    // override only if provided
  ...(email    && { email    })     // override only if provided
};
// ': User' guarantees the merged result is STILL a valid User.
users[index] = updatedUser;
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Same spread logic — but nothing verifies the result is
// still a valid user shape. A bad merge could drop a field
// or introduce a typo'd key and no one would notice.
const existingUser = users[index];
const updatedUser = {
  ...existingUser,
  ...(username && { username }),
  ...(email    && { email    })
};
users[index] = updatedUser;
```

</td>
</tr>
</table>

**How conditional spread works:**
```typescript
const update1 = { ...(true  && { name: 'alice' }) }; // { name: 'alice' }
const update2 = { ...(false && { name: 'bob'   }) }; // {}
```

### Step 6: Save and Return
```typescript
users[index] = updatedUser;
const response: ApiResponse<User> = { data: updatedUser, success: true };
res.json(response);
```
This closes the `patch` method body we opened in Step 1.

### Step 7: Register the Route — link `patch` to `app.patch`

The method is now complete, but Express won't call it until we connect it to a route. Add this alongside the other route registrations (right after `const ctrl = new UserController();`):

```typescript
app.patch('/api/users/:id', ctrl.patch.bind(ctrl));
```

> 💡 **Concept:** `PATCH` is the HTTP verb for *partial* updates — the perfect match for our `Partial<...>` body type. `.bind(ctrl)` preserves `this` so the decorated method still works when Express invokes it (same binding rule from Step 4).

---

## Testing Your PATCH Endpoint

Now that the endpoint is wired up, test it. Each call exercises a different branch of the validation we just wrote:

```typescript
import axios from 'axios';
const API = 'http://localhost:3000/api/users';

async function testPATCH() {
  // Update only username
  console.log((await axios.patch(`${API}/1`, { username: 'alice' })).data);
  // Update only email
  console.log((await axios.patch(`${API}/1`, { email: 'alice@mail.com' })).data);
  // Empty body (should fail)
  try { await axios.patch(`${API}/1`, {}); }
  catch (e: any) { console.log('Error:', e.response.data); }
}
testPATCH();
```

```bash
npm install axios
npx ts-node test.ts
```

---

<div style="background-color: #90EE90; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎯 Key Concepts:**

**Utility Types** — Built-in TypeScript types that transform other types

**Partial<T>** — All properties become optional (`?`)

**Pick<T, K>** — Select specific properties to keep

**Required<T>** — All properties become required (opposite of Partial)

**Readonly<T>** — All properties become readonly

**Omit<T, K>** — Remove specific properties (opposite of Pick)

**Record<K, V>** — Create object with specific keys and value type

**Compose** — Combine utilities like `Partial<Pick<T, K>>`

</div>

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Partial<T>** for optional updates (PATCH requests)
2. **Pick<T>** to expose only safe properties (API responses)
3. **Combine them** — `Partial<Pick<T, 'field1' | 'field2'>>` for precise control
4. **Validate early** — Check that at least one field is provided
5. **Validate deeply** — Check field contents (not empty, correct format)
6. **Use spread operator** to merge partial updates with existing data
7. **Conditional spread** — `...(condition && { field: value })`
8. **Utility types are compile-time** — They don't affect runtime, only type checking
9. **The JS we wrote before** expressed all of this as comments + manual checks — utility types turn those promises into compiler guarantees

</div>

---

## Complete `4_server.ts` Code

Now that you've seen each utility type and how it replaces the manual JavaScript we used to write, here is the full final server with GET, POST, and PATCH to create as `src/4_server.ts`:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import 'reflect-metadata';

import type { User, CreateUserBody, UserParams, ApiResponse } from './types';
import { LogMethod } from './decorators/logger.decorator';

type UserUpdate = Partial<User>;

// ✅ All of these are valid — no field is required
const update1: UserUpdate = { username: 'newName' };        // only username
const update2: UserUpdate = { email: 'new@mail.com' };      // only email
const update3: UserUpdate = { id: 1, username: 'Anubhav' };  // two fields
const update4: UserUpdate = {};                              // empty is fine too

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

  @LogMethod
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

  // ─────────────────────────────────────────────
  // Partial<Pick<User, 'username' | 'email'>>:
  //   - Pick    → only username & email are allowed
  //   - Partial → both optional
  //   - id, password, etc. are NOT accessible at all
  // ─────────────────────────────────────────────
  @LogMethod
  patch(req: Request<UserParams, {}, Partial<Pick<User, 'username' | 'email'>>>, res: Response): void {

    // 1. Validate & parse ID
    const rawId    = req.params['id'] ?? '';
    const parsedId = parseInt(rawId, 10);

    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid ID format', success: false });
      return;
    }

    // 2. Find user
    const index = users.findIndex((u: User) => u.id === parsedId);

    if (index === -1) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }

    // 3. Validate body — at least one field required
    const { username, email } = req.body;

    if (!username && !email) {
      res.status(400).json({ message: 'Provide at least username or email', success: false });
      return;
    }

    if (username !== undefined && !username.trim()) {
      res.status(400).json({ message: 'Username cannot be empty', success: false });
      return;
    }

    if (email !== undefined && !email.trim()) {
      res.status(400).json({ message: 'Email cannot be empty', success: false });
      return;
    }

    // 4. Merge only provided fields
    const existingUser: User = users[index] as User;
    const updatedUser: User = {
      ...existingUser,
      ...(username && { username }),
      ...(email    && { email    })
    };

    users[index] = updatedUser;

    // 5. Respond
    const response: ApiResponse<User> = { data: updatedUser, success: true };
    res.json(response);
  }
}

// ─────────────────────────────────────────────
// Instantiate and bind — 'this' must be bound or
// arrow functions used, otherwise 'this' is lost
// ─────────────────────────────────────────────
const ctrl = new UserController();

app.get('/api/users',       ctrl.getAll.bind(ctrl));   // .bind() preserves 'this'
app.get('/api/users/:id',   ctrl.getById.bind(ctrl));
app.post('/api/users',      ctrl.create.bind(ctrl));
app.patch('/api/users/:id', ctrl.patch.bind(ctrl));

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

## Complete Learning Path Summary

You've completed all 5 steps! Here's what you've learned:

| Step | Topic | Key Learning |
|------|-------|--------------|
| 1 | Project Setup & tsconfig.json | Configuring TypeScript compilation |
| 2 | Basic Server | Type annotations, interfaces, Express basics |
| 3 | Strict Mode | Type safety, null checks, validation |
| 4 | Decorators | Method wrapping, metadata, logging |
| 5 | Utility Types | Type transformation, composing types |

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎓 Final Thoughts:**

TypeScript isn't just about catching errors—it's about **thinking clearly** about your code. Every side-by-side comparison in this series showed the same thing: the JavaScript still works, but TypeScript turns the promises you *used to keep in your head* into guarantees the compiler keeps for you.

Start with strict mode. Use utility types liberally. Validate external input. And always ask: "What type is this value, and what should it be?"

The time you invest in types now saves debugging time later. That's the TypeScript promise.

</div>

---

## Resources

- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Express TypeScript Guide](https://expressjs.com/)
- [Reflect-Metadata Documentation](https://github.com/rbuckton/reflect-metadata)

---

## Other Useful Utility Types

### Required<T> — Opposite of Partial

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
interface User { id: number; username?: string; email?: string; }

// Removes every '?' — all fields now mandatory.
type FullUser = Required<User>;

const user: FullUser = { id: 1, username: 'john', email: 'john@mail.com' };
// Missing any field → compile error.
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Enforced by hand, field by field:
function assertFullUser(u) {
  if (u.id == null)       throw new Error('id required');
  if (u.username == null) throw new Error('username required');
  if (u.email == null)    throw new Error('email required');
}
```

</td>
</tr>
</table>

### Readonly<T> — Make All Properties Readonly

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
type ReadonlyUser = Readonly<User>;

const user: ReadonlyUser = { id: 1, username: 'john', email: 'john@mail.com' };
user.username = 'jane'; // ❌ compile error — readonly
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Only a RUNTIME freeze, and it fails silently (or throws
// only in strict mode) instead of at compile time.
const user = Object.freeze({ id: 1, username: 'john', email: 'john@mail.com' });
user.username = 'jane'; // silently ignored in non-strict JS
```

</td>
</tr>
</table>

### Record<K, V> — Object with Specific Keys

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
// Exactly these three keys, each a boolean.
type Permissions = Record<'read' | 'write' | 'delete', boolean>;

const perms: Permissions = { read: true, write: false, delete: false };
// Missing 'delete' or a typo'd key → compile error.
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Just an object literal — no guarantee the keys are right.
const perms = { read: true, write: false, delete: false };
perms.detele; // typo → undefined, no warning
```

</td>
</tr>
</table>

### Omit<T, K> — Opposite of Pick

<table>
<tr>
<th width="50%">🟦 TypeScript</th>
<th width="50%">⬜ JavaScript before</th>
</tr>
<tr>
<td>

```typescript
// Everything EXCEPT password.
type SafeUser = Omit<User, 'password'>;

const safe: SafeUser = { id: 1, username: 'john', email: 'john@mail.com' };
// password is not assignable here — guaranteed.
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Destructure-and-discard, relying on the dev to remember:
const { password, ...safe } = user;
// If someone later does res.json(user) instead of res.json(safe),
// the password leaks and nothing warns them.
```

</td>
</tr>
</table>

---

## Utility Types Comparison

| Type | Purpose | Example |
|------|---------|---------|
| `Partial<T>` | Make all properties optional | PATCH requests |
| `Required<T>` | Make all properties required | Form validation |
| `Pick<T, K>` | Select specific properties | API responses, safe data |
| `Omit<T, K>` | Remove specific properties | Hide sensitive fields |
| `Readonly<T>` | Make all properties readonly | Immutable data |
| `Record<K, V>` | Create object with specific keys | Configuration objects |

---

## Practical Patterns: When to Use Each

```typescript
// API responses — Pick (never expose password)
type UserResponse = Pick<User, 'id' | 'username' | 'email'>;

// PATCH requests — Partial + Pick
type UpdateUserBody = Partial<Pick<User, 'username' | 'email'>>;

// Configuration — Record
type Environment = Record<'development' | 'production' | 'test', {
  database: string; port: number;
}>;

// DTOs — Omit
type UserDTO = Omit<User, 'password' | 'createdAt'>;
```

---

## Running Your Final Server

```bash
npm run build
npm start
```

```bash
# Get all users
curl http://localhost:3000/api/users
# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@mail.com"}'
# Update user (PATCH)
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"alice_updated"}'
```

---

*Code by Anubhav Trainings* | TypeScript Foundation Series

**Congratulations on completing the TypeScript Foundation Series!** 🎉

Keep coding. Keep learning. Keep improving.

---

*Last Updated: June 2026* | *Version: 2.0*