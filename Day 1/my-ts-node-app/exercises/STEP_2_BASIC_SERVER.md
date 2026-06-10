# Step 2: Creating Your First Express Server with TypeScript

## Introduction to Basic Type Annotations

Welcome to building your first TypeScript Express server! In this step, we'll learn how TypeScript types work in a real application. You'll see how *type annotations* help catch errors and provide autocomplete suggestions as you code.

This is your first practical application of TypeScript—we're building an **Express API** that manages users. Think of it as a digital phonebook that TypeScript will help us keep organized and error-free.

---

## Complete 1_server.ts Code

Let's examine the basic server implementation and break it down section by section:

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';

interface User {
  id: number;
  username: string;
  email: string;
}

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

## Deep Dive: Breaking Down the Code

### Section 1: Imports

```typescript
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
```

<sub>code by anubhav trainings</sub>

**Understanding the imports:**

- **`import express from 'express'`** — Imports the Express library so we can use `express()` to create our app.

- **`import type { Request, Response, NextFunction } from 'express'`** — The `type` keyword is important! It tells TypeScript: "Import these only for types, don't include them in compiled JavaScript." This keeps the final code smaller.
  - `Request` — Type for incoming HTTP requests
  - `Response` — Type for outgoing HTTP responses
  - `NextFunction` — Type for middleware that passes control to the next middleware

- **`import { json } from 'body-parser'`** — Imports middleware that automatically parses JSON request bodies.

> 💡 **Pro Tip:** Using `import type` prevents unnecessary code bloat in your compiled JavaScript file.

---

### Section 2: Defining the User Interface

```typescript
interface User {
  id: number;
  username: string;
  email: string;
}
```

<sub>code by anubhav trainings</sub>

**What is an *Interface*?**

> **Key Concept:** An interface is a contract that defines the shape of an object. It specifies: "Any object of type User must have exactly these properties with these types."

**Breaking it down:**
- `id: number` — A user must have an `id` property that is a number (like 1, 2, 3)
- `username: string` — Must have a `username` that is text
- `email: string` — Must have an `email` that is text

**Why use interfaces?**
1. **Type Safety** — Prevents assigning wrong types
2. **Autocomplete** — Your IDE knows what properties exist
3. **Documentation** — Future readers see what properties a User has

**Example of safety:**
```typescript
// ❌ ERROR: Missing email property
const user: User = { id: 1, username: 'john' };

// ❌ ERROR: id should be number, not string
const user: User = { id: '1', username: 'john', email: 'john@mail.com' };

// ✅ OK: All properties with correct types
const user: User = { id: 1, username: 'john', email: 'john@mail.com' };
```

---

### Section 3: App Initialization

```typescript
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
```

<sub>code by anubhav trainings</sub>

**Breaking it down:**

- **`const app = express()`** — Creates an Express application instance. Think of this as creating a new server.

- **`const PORT = process.env.PORT || 3000`** — Gets the port number from environment variable `PORT`, or defaults to 3000 if not set.
  - Environment variables are configuration values set outside the code
  - Example: In production, you might set `PORT=8080` when starting the app

- **`app.use(json())`** — Registers middleware that automatically parses JSON request bodies into JavaScript objects. Without this, `req.body` would be undefined.

---

### Section 4: In-Memory Database

```typescript
const users: User[] = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' }
];
```

<sub>code by anubhav trainings</sub>

**What is `User[]`?**

> **Key Concept:** `User[]` means "an array of User objects." Each element in this array must be a User with the exact properties we defined in the interface.

**Type safety in action:**
```typescript
// ✅ OK: This array contains User objects
const users: User[] = [
  { id: 1, username: 'john', email: 'john@mail.com' },
  { id: 2, username: 'jane', email: 'jane@mail.com' }
];

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

```typescript
app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});
```

<sub>code by anubhav trainings</sub>

**Understanding this route:**

- **`app.get()`** — Registers a handler for HTTP GET requests
- **`'/api/users'`** — The URL path for this route
- **`(req: Request, res: Response) => { }`** — The route handler function
  - `req` (Request) — Object containing the incoming HTTP request data (headers, query params, body, etc.)
  - `res` (Response) — Object used to send the HTTP response back to the client

**What happens when you visit `http://localhost:3000/api/users`:**
1. Express receives the GET request
2. Matches it to this route
3. Calls the callback function with request and response objects
4. `res.json(users)` — Converts the users array to JSON and sends it back to the client

---

### Section 6: GET User by ID Route

```typescript
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === parseInt(req.params.id as string));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});
```

<sub>code by anubhav trainings</sub>

**Breaking down each part:**

- **`'/api/users/:id'`** — The `:id` is a *route parameter*. When user visits `/api/users/1`, the `id` becomes "1".

- **`req.params.id`** — Retrieves the ID from the URL. Always a string (HTTP parameters are always strings).

- **`parseInt(req.params.id as string)`** — Converts the string "1" into the number 1.
  - `as string` is a *type assertion*—it tells TypeScript "trust me, this is a string." (More on this in Step 3!)

- **`users.find(u => u.id === parsedId)`** — Searches the users array for a user where `id` matches. Returns the user object or `undefined` if not found.

- **`if (!user)`** — If no user was found, return a 404 error response.

- **`res.status(404)`** — Sets HTTP status code to 404 (Not Found).

- **`res.json(user)`** — Sends the found user back as JSON.

**Example requests:**
```
GET /api/users/1 → Returns { id: 1, username: 'user1', email: 'user1@example.com' }
GET /api/users/2 → Returns { id: 2, username: 'user2', email: 'user2@example.com' }
GET /api/users/999 → Returns { message: 'User not found' } with status 404
```

---

### Section 7: POST Create User Route

```typescript
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
```

<sub>code by anubhav trainings</sub>

**Understanding POST requests:**

- **`app.post()`** — Registers a handler for HTTP POST requests. Used for creating new resources.

- **`const { username, email } = req.body`** — *Destructures* the request body. Extracts `username` and `email` from the JSON body sent by the client.

  **Example:** If client sends `{ username: 'alice', email: 'alice@mail.com' }`, destructuring extracts these values.

- **`if (!username || !email)`** — Validates that both fields are provided. If either is missing, return 400 (Bad Request).

- **`const newUser: User = { ... }`** — Creates a new User object:
  - `id: users.length + 1` — Auto-generates ID (if 2 users exist, new ID is 3)
  - `username` and `email` — Taken from request body

- **`users.push(newUser)`** — Adds the new user to the in-memory array.

- **`res.status(201).json(newUser)`** — Returns 201 (Created) status and the new user object.

**Example request and response:**
```
Request (POST to /api/users):
{
  "username": "alice",
  "email": "alice@mail.com"
}

Response (201 Created):
{
  "id": 3,
  "username": "alice",
  "email": "alice@mail.com"
}
```

---

### Section 8: Error Handling Middleware

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
```

<sub>code by anubhav trainings</sub>

**What is *Middleware*?**

> **Key Concept:** Middleware is a function that runs during request processing. It can inspect the request, modify it, or send a response. This error handler middleware catches any errors thrown by routes above it.

**Key characteristics:**
- **4 parameters** — `(err, req, res, next)` — This 4-parameter signature tells Express it's an error handler
- **`err: Error`** — The error object that was thrown
- **`err.stack`** — The full error traceback (useful for debugging)
- **Must be last** — Error middleware should be registered after all other routes

**How errors work:**
```typescript
// If any route throws an error, it's caught by this middleware
app.get('/api/risky', (req, res) => {
  throw new Error('Something went wrong!');  // Caught by error handler above
});
```

---

### Section 9: Starting the Server

```typescript
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

<sub>code by anubhav trainings</sub>

**Understanding server startup:**

- **`app.listen(PORT, callback)`** — Starts the Express server on the specified port
- The callback function runs once the server starts
- **`console.log(...)`** — Prints a message confirming the server is running

**To run this server:**
```bash
npm run dev
```

Then visit `http://localhost:3000/api/users` in your browser to see the response!

---

## Key Concepts Summary

### What is *Type Annotation*?

> **Key Concept:** Type annotation explicitly tells TypeScript what type a variable should be. It's like labeling a box: "This box contains numbers, not strings."

```typescript
const age: number = 25;           // ✅ Correct
const age: number = 'twenty-five'; // ❌ ERROR: String, not number
```

### What is *Type Inference*?

> **Key Concept:** Type inference means TypeScript automatically figures out the type based on the value assigned. You don't always need explicit type annotations.

```typescript
const name = 'John';  // TypeScript infers: name is string
const age = 25;       // TypeScript infers: age is number

// TypeScript knows you can't do this:
name = 123;  // ❌ ERROR: Can't assign number to string
```

### What is *Destructuring*?

> **Key Concept:** Destructuring extracts specific properties from an object into variables.

```typescript
const user = { id: 1, username: 'john', email: 'john@mail.com' };

// Instead of:
const username = user.username;
const email = user.email;

// You can write:
const { username, email } = user;  // Gets both in one line
```

---

## Running Your Server

### Step 1: Create the file

Create `src/1_server.ts` with the code from above.

### Step 2: Compile and Run

```bash
npm run build
npm start
```

<sub>code by anubhav trainings</sub>

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

## Common TypeScript Patterns in Express

### Pattern 1: Typed Route Parameters

```typescript
// For routes with parameters, type them explicitly
app.get('/api/users/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);  // Manual conversion
});
```

### Pattern 2: Typed Request Body

```typescript
// The request body is untyped by default
app.post('/api/users', (req: Request, res: Response) => {
  // req.body is type 'any' — we must validate manually
  const { username, email } = req.body;
  
  // Always validate external input
  if (typeof username !== 'string') {
    return res.status(400).json({ message: 'Invalid username' });
  }
});
```

### Pattern 3: Typed Response

```typescript
// Specify what type of data you're sending back
app.get('/api/users', (req: Request, res: Response) => {
  const users: User[] = getUsers();  // Typed as User[]
  res.json(users);  // Express knows users is User[]
});
```

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

</div>

---

## Next Steps

You've built your first TypeScript Express server! You now understand:
- ✅ How to define types with interfaces
- ✅ How to annotate variables with types
- ✅ How Express routes work
- ✅ How to handle requests and responses

**In Step 3**, we'll turn on **Strict Mode** in `tsconfig.json` and see how it forces us to write even safer code. You'll be amazed at what errors it catches!

---

*Code by Anubhav Trainings* | TypeScript Foundation Series
