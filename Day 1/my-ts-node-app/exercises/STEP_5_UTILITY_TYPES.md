# Step 5: Mastering TypeScript Utility Types

## What Are Utility Types?

Welcome to the final step! *Utility Types* are built-in TypeScript types that transform other types. They're like type factories—you feed in a type, and out comes a new type with different properties.

Think of it like this: if you have a blueprint for a house, utility types let you create variations—a blueprint with fewer rooms, optional walls, readonly doors, etc.—without rewriting everything from scratch.

---

## Common Utility Types

TypeScript provides many utility types. Let's explore the most important ones for building APIs:

### 1. Partial<T> — Make All Properties Optional

**What it does:** Takes a type and makes every property optional (adds `?`).

```typescript
interface User {
  id: number;
  username: string;
  email: string;
}

// Without Partial:
type FullUser = User;
// {
//   id: number,
//   username: string,
//   email: string
// }

// With Partial:
type UpdatedUser = Partial<User>;
// {
//   id?: number | undefined,
//   username?: string | undefined,
//   email?: string | undefined
// }
```

<sub>code by anubhav trainings</sub>

**Why it's useful:**
- **PATCH requests** — Only sending fields that changed
- **Optional updates** — User can update just one field
- **Flexible objects** — Some properties might not be provided

**Real example:**
```typescript
const update1: Partial<User> = { username: 'newName' };      // ✅ Only username
const update2: Partial<User> = { email: 'new@mail.com' };    // ✅ Only email
const update3: Partial<User> = { id: 1, username: 'John' };  // ✅ Two fields
const update4: Partial<User> = {};                            // ✅ Empty is valid
```

---

### 2. Pick<T, K> — Select Specific Properties

**What it does:** Takes a type and picks only the specified properties.

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Pick only username and email
type PublicUserInfo = Pick<User, 'username' | 'email'>;
// {
//   username: string,
//   email: string
// }

// Pick only id
type UserId = Pick<User, 'id'>;
// {
//   id: number
// }
```

<sub>code by anubhav trainings</sub>

**Why it's useful:**
- **Hide sensitive data** — Pick only safe properties
- **API responses** — Return only relevant fields
- **Request validation** — Accept only certain fields

**Real example:**
```typescript
// Don't expose password in response
type SafeUser = Pick<User, 'id' | 'username' | 'email'>;

const response: SafeUser = {
  id: 1,
  username: 'john',
  email: 'john@mail.com',
  // password: 'secret123'  // ❌ Can't include this!
};
```

---

### 3. Partial + Pick — Combine for Maximum Flexibility

**What it does:** Combines both—select specific properties and make them optional.

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

// For PATCH requests: allow updating username and email only, both optional
type PatchUserBody = Partial<Pick<User, 'username' | 'email'>>;
// {
//   username?: string | undefined,
//   email?: string | undefined
// }
```

<sub>code by anubhav trainings</sub>

**Why it's useful:**
- **PATCH endpoints** — Allow partial updates of specific fields
- **Limit updatable fields** — Prevent updating sensitive fields like password
- **Type-safe updates** — TypeScript knows which fields can be updated

---

## Real-World Example: Building a PATCH Endpoint

Let's use utility types to build a safe PATCH endpoint in our server:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import 'reflect-metadata';

import type { User, CreateUserBody, UserParams, ApiResponse } from './types';
import { LogMethod } from './decorators/logger.decorator';

type UserUpdate = Partial<User>;

// ✅ All of these are valid — no field is required
const update1: UserUpdate = { username: 'newName' };         // only username
const update2: UserUpdate = { email: 'new@mail.com' };       // only email
const update3: UserUpdate = { id: 1, username: 'Anubhav' };   // two fields
const update4: UserUpdate = {};                               // empty is fine too


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

// ─────────────────────────────────────────────
// Partial<T>
// Converts every property to optional (adds ?)
// Perfect for PATCH/update endpoints where user
// sends only the fields they want to change
// ─────────────────────────────────────────────

// What TypeScript generates internally:
// type Partial<User> = {
//   id?:       number  | undefined
//   username?: string  | undefined
//   email?:    string  | undefined
//   age?:      number  | undefined
//   address?:  string  | undefined
// }

    @LogMethod
    patch(req: Request<UserParams, {}, Partial<Pick<User, 'username' | 'email'>>>, res: Response): void {
    
    // ── 1. Validate & parse ID from route param ───────────────────────────
    const rawId    = req.params['id'] ?? '';
    const parsedId = parseInt(rawId, 10);

    if (isNaN(parsedId)) {
        res.status(400).json({ message: 'Invalid ID format', success: false });
        return;
    }

    // ── 2. Find user in DB ────────────────────────────────────────────────
    const index = users.findIndex((u: User) => u.id === parsedId);

    if (index === -1) {
        res.status(404).json({ message: 'User not found', success: false });
        return;
    }

    // ── 3. Validate body — at least one field must be provided ────────────
    const { username, email } = req.body;
    // Partial<Pick<User, 'username' | 'email'>> means:
    //   username?: string | undefined
    //   email?:    string | undefined
    //   id, age, address → not accessible at all ✅

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

    // ── 4. Merge only provided fields — untouched fields stay as-is ───────
    const existingUser: User  = users[index] as User;
    const updatedUser:  User  = {
        ...existingUser,                          // keep all existing fields
        ...(username && { username }),            // override only if provided
        ...(email    && { email    })             // override only if provided
    };

    users[index] = updatedUser;

    // ── 5. Respond with updated user ──────────────────────────────────────
    const response: ApiResponse<User> = { data: updatedUser, success: true };
    res.json(response);
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

## Deep Dive: Understanding the PATCH Endpoint

### Understanding the Type: `Partial<Pick<User, 'username' | 'email'>>`

This complex type is built in layers. Let's break it down:

```typescript
// Layer 1: Pick — Select username and email only
Pick<User, 'username' | 'email'>
// Result: { username: string, email: string }

// Layer 2: Partial — Make them optional
Partial<Pick<User, 'username' | 'email'>>
// Result: { username?: string | undefined, email?: string | undefined }
```

**Why this design?**
- **`Pick<User, 'username' | 'email'>`** — Prevents users from updating `id` (would bypass auth)
- **`Partial<...>`** — Allows partial updates (only provide fields being changed)

**Example requests:**
```json
PATCH /api/users/1
{ "username": "newname" }
✅ OK — Can update just username

PATCH /api/users/1
{ "email": "new@mail.com" }
✅ OK — Can update just email

PATCH /api/users/1
{ "username": "newname", "email": "new@mail.com" }
✅ OK — Can update both

PATCH /api/users/1
{}
❌ ERROR — At least one field required

PATCH /api/users/1
{ "id": 999 }
❌ ERROR — Can't update id (not in Pick)

PATCH /api/users/1
{ "username": "" }
❌ ERROR — Empty string after trim
```

---

## Step-by-Step PATCH Logic

### Step 1: Validate the ID Parameter

```typescript
const rawId    = req.params['id'] ?? '';
const parsedId = parseInt(rawId, 10);

if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Invalid ID format', success: false });
    return;
}
```

**What's happening:**
- Extract `id` from URL (`/api/users/1` → `id: '1'`)
- Convert string to number
- Check if conversion resulted in a valid number (not NaN)

---

### Step 2: Find the User to Update

```typescript
const index = users.findIndex((u: User) => u.id === parsedId);

if (index === -1) {
    res.status(404).json({ message: 'User not found', success: false });
    return;
}
```

**Why `findIndex`?**
- Returns the array index (position)
- Needed to update the user in place later

---

### Step 3: Validate Request Body

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

**Validation rules:**
1. At least one field must be provided
2. If `username` is provided, it can't be empty
3. If `email` is provided, it can't be empty

**Key pattern:** `username !== undefined`
- Only validate if the field was actually provided
- Empty string after `.trim()` is considered invalid

---

### Step 4: Merge Update with Existing Data

```typescript
const existingUser: User  = users[index] as User;
const updatedUser:  User  = {
    ...existingUser,                          // keep all existing fields
    ...(username && { username }),            // override only if provided
    ...(email    && { email    })             // override only if provided
};
```

**How spread operator merging works:**

```typescript
// Start with existing user
const existingUser = { id: 1, username: 'john', email: 'john@mail.com' };

// Apply update: only username
const updatedUser = {
  ...existingUser,                    // { id: 1, username: 'john', email: 'john@mail.com' }
  ...(username && { username })       // { username: 'newname' }
};

// Result: { id: 1, username: 'newname', email: 'john@mail.com' }
//         id and email kept, username updated
```

**Conditional spread:**
```typescript
// This pattern: ...(condition && { field: value })
// Only includes the field if condition is true

const update1 = { ...(true && { name: 'alice' }) };
// Result: { name: 'alice' }

const update2 = { ...(false && { name: 'bob' }) };
// Result: {}
```

---

### Step 5: Save and Return

```typescript
users[index] = updatedUser;

const response: ApiResponse<User> = { data: updatedUser, success: true };
res.json(response);
```

---

## Other Useful Utility Types

### Required<T> — Opposite of Partial

```typescript
interface User {
  id: number;
  username?: string;
  email?: string;
}

// Make all properties required (removes ?)
type FullUser = Required<User>;
// {
//   id: number,
//   username: string,  // ← No ? anymore
//   email: string      // ← No ? anymore
// }

// Usage: When all fields MUST be provided
const user: FullUser = {
  id: 1,
  username: 'john',
  email: 'john@mail.com'
};
```

<sub>code by anubhav trainings</sub>

---

### Readonly<T> — Make All Properties Readonly

```typescript
interface User {
  id: number;
  username: string;
  email: string;
}

type ReadonlyUser = Readonly<User>;
// {
//   readonly id: number,
//   readonly username: string,
//   readonly email: string
// }

const user: ReadonlyUser = { id: 1, username: 'john', email: 'john@mail.com' };

user.username = 'jane';  // ❌ ERROR: Can't modify readonly property
```

<sub>code by anubhav trainings</sub>

---

### Record<K, V> — Create Object with Specific Keys

```typescript
// Create an object with specific keys and values of the same type
type Permissions = Record<'read' | 'write' | 'delete', boolean>;

const userPermissions: Permissions = {
  read: true,
  write: false,
  delete: false
};

// Accessing properties
console.log(userPermissions.read);   // true
console.log(userPermissions.write);  // false
```

<sub>code by anubhav trainings</sub>

---

### Omit<T, K> — Opposite of Pick

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

// Remove password from type
type SafeUser = Omit<User, 'password'>;
// {
//   id: number,
//   username: string,
//   email: string
// }

const safeUser: SafeUser = {
  id: 1,
  username: 'john',
  email: 'john@mail.com'
  // password: 'secret'  // ❌ Can't include
};
```

<sub>code by anubhav trainings</sub>

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

<sub>code by anubhav trainings</sub>

---

## Testing Your PATCH Endpoint

### Create a test file: test.ts

```typescript
import axios from 'axios';

const API = 'http://localhost:3000/api/users';

async function testPATCH() {
  try {
    // Test 1: Update only username
    console.log('\n=== Test 1: Update username only ===');
    const res1 = await axios.patch(`${API}/1`, { username: 'alice' });
    console.log('Response:', res1.data);

    // Test 2: Update only email
    console.log('\n=== Test 2: Update email only ===');
    const res2 = await axios.patch(`${API}/1`, { email: 'alice@mail.com' });
    console.log('Response:', res2.data);

    // Test 3: Update both
    console.log('\n=== Test 3: Update both ===');
    const res3 = await axios.patch(`${API}/1`, {
      username: 'alice_updated',
      email: 'alice_new@mail.com'
    });
    console.log('Response:', res3.data);

    // Test 4: Empty body (should fail)
    console.log('\n=== Test 4: Empty body ===');
    try {
      await axios.patch(`${API}/1`, {});
    } catch (error: any) {
      console.log('Error:', error.response.data);
    }

    // Test 5: Invalid ID (should fail)
    console.log('\n=== Test 5: Invalid ID ===');
    try {
      await axios.patch(`${API}/invalid`, { username: 'test' });
    } catch (error: any) {
      console.log('Error:', error.response.data);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPATCH();
```

<sub>code by anubhav trainings</sub>

Install axios first:
```bash
npm install axios
```

Then run tests:
```bash
npx ts-node test.ts
```

<sub>code by anubhav trainings</sub>

---

## Practical Patterns: When to Use Each Utility Type

### Pattern 1: API Responses — Use Pick

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Never expose password
type UserResponse = Pick<User, 'id' | 'username' | 'email'>;

app.get('/api/users/:id', (req, res) => {
  const user: UserResponse = {
    id: 1,
    username: 'john',
    email: 'john@mail.com'
    // password: 'secret'  // ❌ Can't include
  };
  res.json(user);
});
```

### Pattern 2: PATCH Requests — Use Partial + Pick

```typescript
// Allow updating only username and email, both optional
type UpdateUserBody = Partial<Pick<User, 'username' | 'email'>>;

app.patch('/api/users/:id', (req: Request<{}, {}, UpdateUserBody>, res) => {
  // Can only update username and email
  const { username, email } = req.body;
  // Other fields are inaccessible
});
```

### Pattern 3: Configuration — Use Record

```typescript
type Environment = Record<'development' | 'production' | 'test', {
  database: string;
  port: number;
}>;

const config: Environment = {
  development: { database: 'localhost', port: 3000 },
  production: { database: 'prod.db', port: 8000 },
  test: { database: ':memory:', port: 9000 }
};
```

### Pattern 4: DTOs — Use Omit

```typescript
// DTO (Data Transfer Object) — remove sensitive fields
type UserDTO = Omit<User, 'password' | 'createdAt'>;

function getUserDTO(user: User): UserDTO {
  const { password, createdAt, ...dto } = user;
  return dto;
}
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

**Compose** — Combine multiple utilities like `Partial<Pick<T, K>>`

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
7. **Conditional spread** — `...(condition && { field: value })` includes field only if condition is true
8. **Utility types are compile-time** — They don't affect runtime, only type checking

</div>

---

## Running Your Final Server

Your complete server with GET, POST, and PATCH is ready:

```bash
npm run build
npm start
```

<sub>code by anubhav trainings</sub>

**Try these requests:**

```bash
# Get all users
curl http://localhost:3000/api/users

# Get specific user
curl http://localhost:3000/api/users/1

# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@mail.com"}'

# Update user (PATCH)
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"alice_updated"}'
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

## Next Challenges

You're now ready for:
- ✅ Building type-safe Express APIs
- ✅ Using advanced TypeScript features
- ✅ Implementing decorators for cross-cutting concerns
- ✅ Creating flexible, reusable types
- ✅ Writing production-grade TypeScript code

**Advanced topics to explore next:**
- Generic types `<T>`
- Type guards and type predicates
- Conditional types
- Mapped types
- Module augmentation
- Creating your own decorators
- Building a validation library
- ORM integration with TypeScript

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**🎓 Final Thoughts:**

TypeScript isn't just about catching errors—it's about **thinking clearly** about your code. Type annotations and utility types force you to be explicit about what data flows through your application.

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

*Code by Anubhav Trainings* | TypeScript Foundation Series

**Congratulations on completing the TypeScript Foundation Series!** 🎉

You now have a solid understanding of TypeScript fundamentals and advanced concepts. Use this knowledge to build safer, more maintainable applications.

Keep coding. Keep learning. Keep improving.

---

*Last Updated: 2024* | *Version: 1.0*
