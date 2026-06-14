# Step 2: Creating Your First Express Server with TypeScript

## Introduction to Basic Type Annotations

Welcome to building your first TypeScript Express server! In this step, we'll learn how TypeScript types work in a real application. You'll see how *type annotations* help catch errors and provide autocomplete suggestions as you code.

This is your first practical application of TypeScript—we're building an **Express API** that manages users. Think of it as a digital phonebook that TypeScript will help us keep organized and error-free.

Throughout this step, every block of code is shown **twice, side by side**:

- 🟦 **TypeScript — what we write now** (with inline comments explaining the advantage TS gives us)
- ⬜ **JavaScript — what we wrote before** (gray background, the equivalent plain JS we used in the past)

This lets you see *exactly* what TypeScript adds on top of the JavaScript you already know.

---

## 📋 Concept Cheatsheet

A quick reference of every TypeScript concept used in this step:

| Concept | TypeScript Syntax | What It Does | The JS We Wrote Before |
|---------|-------------------|--------------|------------------------|
| **Type annotation** | `const port: number = 3000` | Declares the exact type a variable/parameter must hold | `const port = 3000` (type unknown) |
| **Interface** | `interface User { id: number }` | Defines the required *shape* of an object | A comment or mental note — nothing enforced |
| **Typed array** | `User[]` | An array where **every** element must be a `User` | A plain `[]` that can hold anything |
| **`import type`** | `import type { Request } from 'express'` | Imports types only; erased from compiled JS (zero runtime cost) | `const express = require('express')` |
| **Request / Response types** | `(req: Request, res: Response)` | Typed Express handler args → autocomplete + error checks | `(req, res)` — untyped `any` |
| **Type assertion** | `req.params.id as string` | Tells TS "trust me, treat this as type X" | No equivalent (JS has no types) |
| **Destructuring** | `const { username } = req.body` | Pulls properties out into variables | Same — this is a JS feature TS keeps |
| **Union type** | `User \| undefined` | A value that is one type **or** another | No equivalent — you just guessed |
| **Typed object literal** | `const u: User = { ... }` | Object is checked against the interface as you write it | `const u = { ... }` — no checking |

> 💡 Keep this table handy. Every section below is just one of these rows applied to real Express code.

---

## Building the Express User API — Step by Step

We'll construct the server one section at a time. For each section, compare the **TypeScript (left)** with the **old JavaScript (right)**.

---

### Section 1: Imports

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
import express from 'express';
// 'import type' pulls in ONLY type info — it is erased
// at compile time, so it adds ZERO bytes to the output JS.
// Advantage: we get Request/Response checking for free.
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
// Our OWN reusable types live in src/types/user.d.ts.
// We import the 'User' shape from there instead of
// re-declaring it in every file. Advantage: one source
// of truth — change the User shape once, every file updates.
import type { User } from './types/user';
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Old CommonJS require — no type information at all.
const express = require('express');
const { json } = require('body-parser');
// There is no Request/Response to import — in JS the
// req/res objects are just "whatever Express passes in."
```

</td>
</tr>
</table>

**Understanding the imports:**

- **`import express from 'express'`** — Imports the Express library so we can use `express()` to create our app.
- **`import type { Request, Response, NextFunction }`** — The `type` keyword tells TypeScript: "Import these only for types, don't include them in compiled JavaScript." Smaller output, full type safety.
- **`import { json } from 'body-parser'`** — Middleware that parses JSON request bodies.
- **`import type { User } from './types/user'`** — Pulls our **own** `User` interface from the shared declaration file [`src/types/user.d.ts`](../src/types/user.d.ts). Because every file imports from this one place, the `User` shape has a *single source of truth* — no copy-pasting interfaces around the codebase.

> 💡 **TS advantage:** `import type` gives you compile-time checking with **no runtime cost** — the line vanishes in the compiled `.js`.

---

### Section 2: The Reusable User Interface

Instead of re-declaring the `User` interface in every file, we define it **once** in a shared declaration file, `src/types/user.d.ts`, and `import type { User }` wherever we need it (we already did this in Section 1).

**`src/types/user.d.ts`** — the single source of truth for our types:

```typescript
// src/types/user.d.ts — all User-related types live here.
// 'export' makes each interface importable from other files.
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
```

Now compare *using* that shared type in our server file against the old JavaScript:

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
// No inline interface here! The 'User' contract is
// imported from src/types/user.d.ts (see Section 1).
// Advantage: typos and missing fields become COMPILE
// errors, AND the shape is reused across every file.
import type { User } from './types/user';

// ...later we just refer to 'User' as a type:
// const users: User[] = [...]
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// JavaScript has NO way to declare the shape of a user,
// and no way to share that shape between files. A "user"
// is just an object — nothing stops you from misspelling
// 'usrname' or forgetting 'email' entirely. You only
// discover the mistake when the app crashes at runtime
// in front of a real customer.
//
// (no code here — there is simply nothing to write)
```

</td>
</tr>
</table>

> **Key Concept:** An *interface* is a contract that defines the shape of an object: "Any object of type `User` must have exactly these properties with these types." Putting it in a `.d.ts` file and `export`-ing it makes that contract **reusable** — import it anywhere with `import type { User } from './types/user'`.

**Why use interfaces?**
1. **Type Safety** — Prevents assigning wrong types.
2. **Autocomplete** — Your IDE knows what properties exist.
3. **Documentation** — Future readers see what a `User` contains.

**Example of the safety TypeScript adds (that JS never had):**
```typescript
// ❌ ERROR: Missing email property
const user: User = { id: 1, username: 'john' };

// ❌ ERROR: id should be number, not string
const user: User = { id: '1', username: 'john', email: 'john@mail.com' };

// ✅ OK: All properties with correct types
const user: User = { id: 1, username: 'john', email: 'john@mail.com' };
```

---

### Section 3: App Initialization & Middleware

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
const app = express();
// process.env.PORT is typed as string | undefined.
// The || gives a safe fallback. Advantage: the editor
// autocompletes every method on 'app' and flags typos.
const PORT = process.env.PORT || 3000;

app.use(json()); // parse JSON bodies into req.body
```

</td>
<td style="background-color:#f0f0f0">

```javascript
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
// Identical logic — but 'app' is untyped, so a typo like
// app.usse(json()) is NOT caught until the server crashes.
```

</td>
</tr>
</table>

- **`const app = express()`** — Creates an Express application instance.
- **`const PORT = process.env.PORT || 3000`** — Reads the port from the environment, defaulting to 3000.
- **`app.use(json())`** — Registers middleware that parses JSON bodies. Without it, `req.body` would be `undefined`.

> 💡 **TS advantage:** Even where the code looks identical, TypeScript knows the type of `app` and every Express method on it — so misspelled method names are caught instantly.

---

### Section 4: In-Memory Database

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
// 'User[]' = array of User. Every element is checked
// against the interface. Advantage: a malformed record
// is rejected by the compiler before the app ever runs.
const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Just a plain array. Nothing guarantees each item has
// id/username/email, or that id is a number. Bad data
// (a missing email, a numeric username) slips in silently
// and blows up somewhere far away from the real cause.
const users = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];
```

</td>
</tr>
</table>

> **Key Concept:** `User[]` means "an array of `User` objects." Each element must match the interface exactly.

**Type safety in action (TS catches what JS ignored):**
```typescript
// ❌ ERROR: Missing email in second object
const users: User[] = [
  { id: 1, username: 'john', email: 'john@mail.com' },
  { id: 2, username: 'jane' }  // ❌ email missing!
];

// ❌ ERROR: username is not a number
const users: User[] = [
  { id: 1, username: 123, email: 'john@mail.com' }  // ❌ username should be string!
];
```

---

### Section 5: GET All Users Route

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
// req: Request, res: Response give us full autocomplete
// and checking on res.json()/res.status(). Advantage:
// res.jsom(users) (a typo) is a compile error, not a
// silent 500 in production.
app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// req and res are untyped 'any'. res.jsom(users) would
// pass review, deploy fine, and only fail when a user
// actually hits the endpoint.
app.get('/api/users', (req, res) => {
  res.json(users);
});
```

</td>
</tr>
</table>

- **`app.get()`** — Registers a handler for HTTP GET requests.
- **`'/api/users'`** — The URL path.
- **`(req: Request, res: Response) => { }`** — The handler. `req` holds incoming request data; `res` sends the response.
- **`res.json(users)`** — Serializes the array to JSON and sends it.

---

### Section 6: GET User by ID Route

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
app.get('/api/users/:id', (req: Request, res: Response) => {
  // 'as string' is a type assertion: we promise TS that
  // req.params.id is a string. Advantage: parseInt only
  // accepts a string, so TS verifies our intent.
  const user = users.find(u => u.id === parseInt(req.params.id as string));
  // 'user' is typed User | undefined — TS FORCES the
  // not-found check below before we can use it.
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
app.get('/api/users/:id', (req, res) => {
  // req.params.id is just "some value." No guarantee it
  // is a string; no warning if you forget the null check.
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});
```

</td>
</tr>
</table>

- **`:id`** — A *route parameter*. Visiting `/api/users/1` makes `req.params.id` equal to `"1"`.
- **`req.params.id`** — Always a string (HTTP params are strings).
- **`parseInt(req.params.id as string)`** — Converts `"1"` to `1`. The `as string` is a *type assertion* (more in Step 3).
- **`users.find(...)`** — Returns the matching `User`, or `undefined`. TypeScript types this as `User | undefined`, which is why the `if (!user)` check is required.

**Example requests:**
```
GET /api/users/1   → { id: 1, username: 'user1', email: 'user1@example.com' }
GET /api/users/999 → { message: 'User not found' } with status 404
```

---

### Section 7: POST Create User Route

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
app.post('/api/users', (req: Request, res: Response) => {
  // Destructure the parsed JSON body.
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  // ': User' checks this object against the interface as
  // we build it. Advantage: forget a field or use a wrong
  // type here and it won't compile.
  const newUser: User = {
    id: users.length + 1,
    username,
    email
  };

  users.push(newUser); // TS guarantees only Users enter the array
  res.status(201).json(newUser);
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
app.post('/api/users', (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  // Plain object — nothing checks that it matches a user
  // shape. You could push { id, usrname, email } with a
  // typo and corrupt the array silently.
  const newUser = {
    id: users.length + 1,
    username,
    email
  };

  users.push(newUser);
  res.status(201).json(newUser);
});
```

</td>
</tr>
</table>

- **`app.post()`** — Handles HTTP POST (creating resources).
- **`const { username, email } = req.body`** — *Destructures* the request body.
- **`if (!username || !email)`** — Validates both fields; returns 400 if missing.
- **`const newUser: User = { ... }`** — The `: User` annotation makes TypeScript verify the new object matches the interface.
- **`res.status(201).json(newUser)`** — Returns 201 (Created) with the new user.

---

### Section 8: Error Handling Middleware

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
// All 4 params are typed. The (err, req, res, next)
// 4-argument shape is how Express recognizes an error
// handler. Advantage: TS confirms err is an Error, so
// err.stack autocompletes and is type-checked.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
// Same 4-argument shape — but err is untyped. If you
// write err.stak (typo) JS returns undefined and logs
// nothing, hiding the very error you were trying to see.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
```

</td>
</tr>
</table>

> **Key Concept:** *Middleware* runs during request processing. This 4-parameter `(err, req, res, next)` signature tells Express it's an **error handler**. It must be registered **after** all other routes.

---

### Section 9: Starting the Server

<table>
<tr>
<th width="50%">🟦 TypeScript — what we write now</th>
<th width="50%">⬜ JavaScript — what we wrote before</th>
</tr>
<tr>
<td>

```typescript
app.listen(PORT, () => {
  // Template literal with the typed PORT value.
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

</td>
<td style="background-color:#f0f0f0">

```javascript
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Functionally the same — TS just guarantees PORT is a
// valid value and that app.listen exists and is spelled right.
```

</td>
</tr>
</table>

- **`app.listen(PORT, callback)`** — Starts the server on the given port; the callback runs once it's up.

**To run this server:**
```bash
npm run dev
```
Then visit `http://localhost:3000/api/users` in your browser.

---

## Key Concepts Summary

### What is *Type Annotation*?

> **Key Concept:** Type annotation explicitly tells TypeScript what type a variable should be. It's like labeling a box: "This box contains numbers, not strings."

```typescript
const age: number = 25;            // ✅ Correct
const age: number = 'twenty-five'; // ❌ ERROR: String, not number
```

### What is *Type Inference*?

> **Key Concept:** Type inference means TypeScript figures out the type from the assigned value—you don't always need an explicit annotation.

```typescript
const name = 'John';  // TypeScript infers: name is string
name = 123;           // ❌ ERROR: Can't assign number to string
```

### What is *Destructuring*?

> **Key Concept:** Destructuring extracts specific properties from an object into variables.

```typescript
const user = { id: 1, username: 'john', email: 'john@mail.com' };
const { username, email } = user;  // Gets both in one line
```

---

## Common TypeScript Patterns in Express

### Pattern 1: Typed Route Parameters
```typescript
app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);  // Manual conversion
});
```

### Pattern 2: Typed Request Body
```typescript
app.post('/api/users', (req: Request, res: Response) => {
  // req.body is type 'any' — we must validate manually
  const { username, email } = req.body;
  if (typeof username !== 'string') {
    return res.status(400).json({ message: 'Invalid username' });
  }
});
```

### Pattern 3: Typed Response
```typescript
app.get('/api/users', (req: Request, res: Response) => {
  const users: User[] = getUsers();  // Typed as User[]
  res.json(users);
});
```

---

## Running Your Server

### Step 1: Create the file
Create `src/1_server.ts` with the complete code shown at the end of this document.

### Step 2: Compile and Run
```bash
npm run build
npm start
```

### Step 3: Test the API

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

**Get user by ID:**
```bash
curl http://localhost:3000/api/users/1
```

**Create a new user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@mail.com"}'
```

<sub>code by anubhav trainings</sub>

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **Interfaces** define the shape of objects (properties and their types)
2. **Type annotations** (`variable: Type`) tell TypeScript what type something should be
3. **Type inference** lets TypeScript figure out types automatically in many cases
4. **Request/Response** objects are Express types for handling HTTP
5. **Destructuring** cleanly extracts object properties into variables
6. **Express Routes** are registered with `app.get()`, `app.post()`, etc.
7. **Error middleware** (4 parameters) catches all errors in your app
8. **The big win over JS:** every red row in the cheatsheet is a class of bug that now fails at **compile time** instead of in front of a user

</div>

---

## Complete `1_server.ts` Code

Now that you've seen each section built up and compared against plain JavaScript, here is the full file to create as `src/1_server.ts`:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
// Reusable User type, defined once in src/types/user.d.ts
import type { User } from './types/user';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());

// In-memory database
const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];

// Routes
app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === parseInt(req.params.id as string));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req: Request, res: Response) => {
  const { username, email } = req.body;
 
  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }
 
  const newUser: User = {
    id: users.length + 1,
    username,
    email
  };
 
  users.push(newUser);
  res.status(201).json(newUser);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

<sub>code by anubhav trainings</sub>

---

## Next Steps

You've built your first TypeScript Express server! You now understand:
- ✅ How to define types with interfaces
- ✅ How to annotate variables with types
- ✅ How Express routes work
- ✅ How to handle requests and responses
- ✅ Exactly what TypeScript adds on top of the JavaScript you already knew

**In Step 3**, we'll turn on **Strict Mode** in `tsconfig.json` and see how it forces us to write even safer code. You'll be amazed at what errors it catches!

---

*Code by Anubhav Trainings* | TypeScript Foundation Series