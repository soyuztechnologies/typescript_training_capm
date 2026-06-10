# TypeScript Foundation Series - Complete Learning Guide

Welcome to the **TypeScript Foundation Series**! This comprehensive guide takes you from complete beginner to intermediate TypeScript developer through a structured, hands-on approach.

---

## 📚 Course Overview

This series consists of **5 progressive steps**, each building upon the previous one. You'll learn TypeScript fundamentals while building a production-ready Express API.

### What You'll Learn

- ✅ TypeScript project setup and configuration
- ✅ Type annotations and interfaces
- ✅ Strict mode for maximum safety
- ✅ Decorators and metadata
- ✅ Utility types for advanced type manipulation
- ✅ Building a complete REST API
- ✅ Best practices and patterns

### What You'll Build

By the end, you'll have built a complete Express.js API with:
- Type-safe route handlers
- Strict mode enabled
- Decorators for cross-cutting concerns
- Flexible PATCH endpoints using utility types

---

## 📖 The 5 Steps

### **Step 1: TypeScript Project Setup & tsconfig.json**
- **File:** `STEP_1_PROJECT_SETUP.md`
- **Duration:** 30 minutes
- **What You'll Learn:**
  - Creating a TypeScript Node.js project
  - Understanding `tsconfig.json` configuration
  - Installing and configuring TypeScript compiler
  - Project structure best practices
  - npm scripts for development

**Key Concepts:**
- Project initialization
- Type definitions and .d.ts files
- Compiler options explained
- Module systems and targets

---

### **Step 2: Building Your First Express Server**
- **File:** `STEP_2_BASIC_SERVER.md`
- **Duration:** 45 minutes
- **What You'll Learn:**
  - Creating an Express application
  - Type annotations for variables
  - Interface definitions
  - Request/Response handling
  - Route handlers
  - Type inference vs explicit annotation

**Key Concepts:**
- Interfaces and contracts
- Type annotations (`variable: Type`)
- Express routing basics
- Request/Response types
- Destructuring patterns

**File Reference:** `1_server.ts`

---

### **Step 3: Understanding Strict Mode**
- **File:** `STEP_3_STRICT_MODE.md`
- **Duration:** 50 minutes
- **What You'll Learn:**
  - Enabling strict mode in tsconfig.json
  - strictNullChecks and handling undefined
  - noImplicitAny and explicit typing
  - noUnusedParameters and noUnusedLocals
  - Type guards for external input
  - Validation patterns

**Key Concepts:**
- Null/undefined handling
- Type guards
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Strict type checking rules

**File Reference:** `2_strictserver.ts`

---

### **Step 4: Decorators & Reflect-Metadata**
- **File:** `STEP_4_DECORATORS.md`
- **Duration:** 60 minutes
- **What You'll Learn:**
  - What decorators are and why they're useful
  - Creating method decorators
  - PropertyDescriptor and method wrapping
  - Using reflect-metadata for runtime metadata
  - Binding `this` context in class methods
  - Real-world decorator patterns

**Key Concepts:**
- Decorators as function wrappers
- PropertyDescriptor manipulation
- Metadata storage and retrieval
- Before/after patterns
- Cross-cutting concerns (logging, caching, auth)

**Files Reference:** `3_server.ts`, `logger.decorator.ts`

---

### **Step 5: Utility Types & Advanced Type Manipulation**
- **File:** `STEP_5_UTILITY_TYPES.md`
- **Duration:** 60 minutes
- **What You'll Learn:**
  - `Partial<T>` for optional properties
  - `Pick<T, K>` for selecting properties
  - `Required<T>` for mandatory properties
  - `Readonly<T>` for immutable types
  - `Omit<T, K>` for removing properties
  - `Record<K, V>` for typed objects
  - Composing utility types
  - Building flexible PATCH endpoints

**Key Concepts:**
- Type transformation
- Composing utility types
- PATCH request patterns
- Partial updates with validation
- Type-safe object merging

**File Reference:** `4_server.ts`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn
- Basic JavaScript knowledge
- A code editor (VS Code recommended)

### Setup (5 minutes)

```bash
# Create project directory
mkdir typescript-express-api
cd typescript-express-api

# Initialize npm project
npm init -y

# Install dependencies
npm install express body-parser
npm install -D typescript @types/node @types/express

# Create tsconfig.json
npx tsc --init

# Create source directory
mkdir src
mkdir src/types
mkdir src/decorators
```

<sub>code by anubhav trainings</sub>

---

## 📋 File Structure

After following all steps, your project will look like:

```
typescript-express-api/
├── src/
│   ├── types/
│   │   ├── user.d.ts          # User type definitions
│   │   └── index.d.ts         # Barrel file
│   ├── decorators/
│   │   └── logger.decorator.ts # Logging decorator
│   ├── 1_server.ts            # Basic server
│   ├── 2_strictserver.ts      # Strict mode server
│   ├── 3_server.ts            # Decorated server
│   └── 4_server.ts            # Complete server with PATCH
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── node_modules/
```

---

## 🎯 Learning Path

### Beginner (Steps 1-2)
- Understand TypeScript basics
- Get comfortable with types and interfaces
- Build a simple Express server

### Intermediate (Steps 3-4)
- Master strict mode and type safety
- Learn decorators for code organization
- Implement cross-cutting concerns

### Advanced (Step 5)
- Use utility types for flexibility
- Build complex type compositions
- Implement production patterns (PATCH, validation)

---

## 💡 Key Concepts Reference

### Type Annotation
```typescript
const name: string = 'John';      // Explicit type
const age: number = 25;           // Must be number
const users: User[] = [];         // Array of User
```

### Interface
```typescript
interface User {
  id: number;
  username: string;
  email: string;
}
```

### Strict Mode
Enables checks for:
- Null/undefined values
- Implicit any types
- Unused variables/parameters
- Missing return types
- Unchecked array access

### Decorators
```typescript
class UserController {
  @LogMethod
  getUser() { }  // Automatically logs calls
}
```

### Utility Types
```typescript
type Partial = Partial<User>;           // All properties optional
type Safe = Pick<User, 'id' | 'name'>   // Only these properties
type Update = Partial<Pick<User, 'name'>>;  // Optional name only
```

---

## 🔗 Dependencies

All dependencies installed during setup:

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `body-parser` | Parse JSON requests |
| `typescript` | TypeScript compiler |
| `@types/node` | Node.js type definitions |
| `@types/express` | Express type definitions |
| `reflect-metadata` | Runtime metadata (Step 4+) |

---

## 📝 Type Definition Files

### user.d.ts
Defines User-related types:
```typescript
export interface User { }
export interface CreateUserBody { }
export interface UserParams { }
export interface ApiResponse<T> { }
```

### index.d.ts
Barrel file for easy imports:
```typescript
export type { User, CreateUserBody, ... } from './user';
```

---

## 🔧 npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsc && npm start",
    "watch": "tsc --watch"
  }
}
```

<sub>code by anubhav trainings</sub>

---

## ✨ Best Practices

### 1. Always Use Strict Mode
```json
{ "compilerOptions": { "strict": true } }
```

### 2. Type External Input
```typescript
if (typeof username !== 'string') {
  return error('Invalid input');
}
```

### 3. Use Type Guards
```typescript
if (!user) {
  res.status(404).json({ error: 'Not found' });
  return;
}
```

### 4. Validate Before Use
```typescript
const id = parseInt(req.params.id ?? '');
if (isNaN(id)) return error('Invalid ID');
```

### 5. Keep Types Close to Usage
```typescript
// ✅ Good: Type where it's used
app.patch('/users/:id', (req: Request<UserParams, {}, UpdateBody>, res) => {});

// ❌ Avoid: Generic types everywhere
app.patch('/users/:id', (req: Request, res: Response) => {});
```

---

## 🎓 Study Tips

1. **Read Step by Step** — Don't skip steps, they build on each other
2. **Type Along** — Don't just read code, write it yourself
3. **Run the Code** — Compile and test each example
4. **Experiment** — Try breaking the code to see error messages
5. **Refer Back** — Use this guide as a reference while coding

---

## 🐛 Common Issues & Solutions

### Issue: Decorators not working
**Solution:** Enable in tsconfig.json:
```json
{ "experimentalDecorators": true, "emitDecoratorMetadata": true }
```

### Issue: `req.params` errors in strict mode
**Solution:** Use nullish coalescing:
```typescript
const id = req.params['id'] ?? '';
```

### Issue: `this` is undefined in route handlers
**Solution:** Use `.bind(this)`:
```typescript
app.get('/users', ctrl.getAll.bind(ctrl));
```

### Issue: req.body has no type
**Solution:** Cast and validate:
```typescript
const body = req.body as { username?: unknown };
if (typeof body.username !== 'string') {
  return error('Invalid');
}
```

---

## 📚 Additional Resources

### Official Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [Reflect-Metadata](https://github.com/rbuckton/reflect-metadata)

### Topics to Explore Next
- Generic types `<T>`
- Conditional types
- Mapped types
- Type predicates and guards
- Module augmentation
- Creating validation libraries
- ORM integration (TypeORM, Prisma)

---

## 🎯 Success Metrics

After completing this series, you should be able to:

- [ ] Create a TypeScript project from scratch
- [ ] Write interfaces and type annotations confidently
- [ ] Enable and use strict mode
- [ ] Create and apply decorators
- [ ] Use utility types for flexible type definitions
- [ ] Build a type-safe Express API
- [ ] Handle edge cases with null/undefined checks
- [ ] Validate external input safely
- [ ] Understand when and how to use advanced TypeScript features

---

## 💬 Feedback & Questions

As you work through this series:

1. **Note difficult concepts** — These are good candidates for practice
2. **Experiment with variations** — Try changing types and see what breaks
3. **Apply to your own projects** — Real-world practice solidifies learning
4. **Discuss with peers** — Teaching others deepens your understanding

---

## 🚦 Next Steps After This Series

### Beginner Projects
- Build a complete REST API with CRUD operations
- Add authentication with JWT
- Implement error handling middleware
- Create a database layer

### Intermediate Projects
- Build a GraphQL API with TypeScript
- Create a real-time chat application
- Implement a caching layer
- Add API documentation (Swagger/OpenAPI)

### Advanced Topics
- Generic types and constraints
- Advanced type composition
- Custom type utilities
- Building a validation library
- Type-safe configuration management

---

## 📞 About This Series

**Course Name:** TypeScript Foundation Series

**Instructor:** Anubhav Trainings

**Level:** Beginner to Intermediate

**Total Duration:** ~4 hours

**Prerequisites:** Basic JavaScript knowledge

**Target Audience:** 
- JavaScript developers transitioning to TypeScript
- Node.js developers wanting type safety
- Express.js developers improving code quality

---

## ✅ Completion Checklist

Use this checklist to track your progress:

- [ ] Completed Step 1 — Project Setup
- [ ] Completed Step 2 — Basic Server
- [ ] Completed Step 3 — Strict Mode
- [ ] Completed Step 4 — Decorators
- [ ] Completed Step 5 — Utility Types
- [ ] Built all 4 server versions
- [ ] Created type definition files
- [ ] Created decorator implementation
- [ ] Tested all API endpoints
- [ ] Understand key concepts

---

## 📄 License & Attribution

This educational material is provided as-is for learning purposes.

**Code by Anubhav Trainings** | [Visit Website]

---

## 🙏 Final Words

TypeScript is a journey, not a destination. The concepts you've learned here—type safety, strict checking, utility types—are your foundation. Build upon this foundation with every project you create.

Remember:
- **Types are your friends** — They catch bugs before they happen
- **Explicit is better than implicit** — Clear types make clear code
- **Validate at boundaries** — External input is always untrusted
- **Compose over inheritance** — Utility types are powerful tools

Keep coding. Keep learning. Keep improving.

---

**Happy TypeScript Coding!** 🚀

*Code by Anubhav Trainings* | TypeScript Foundation Series

Version 1.0 | Last Updated: June 2024
