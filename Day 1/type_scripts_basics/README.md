# TypeScript Basics Series - Complete Learning Guide

Welcome to the **TypeScript Basics Series**! This hands-on guide walks you through the core building blocks of the TypeScript type system, one topic at a time, from variables all the way to generics, classes, and converting existing JavaScript.

---

## 📚 Course Overview

This series consists of **8 progressive topics**, each pairing a runnable TypeScript source file with a detailed, annotated exercise walkthrough. You learn the concept, read the explanation, then run the code yourself.

### What You'll Learn

- ✅ Variables, primitives, and type annotations
- ✅ Special types: `any` vs `unknown`
- ✅ Arrays, tuples, and object types
- ✅ Type aliases, interfaces, unions, and intersections
- ✅ Advanced function parameters (optional, default, rest, destructured)
- ✅ Generic interfaces for reusable, type-safe code
- ✅ Classes combined with generics
- ✅ Converting plain JavaScript functions to TypeScript

### How It's Organized

Every topic has **two files**:
- A **source file** (`*.ts`) at the root — the runnable code.
- An **exercise walkthrough** (`exercises/*.md`) — the same code broken into numbered blocks with explanations, warnings, and best-practice callouts.

---

## 📖 The 8 Topics

### **Topic 1: Variables and Type Basics**
- **Exercise:** `exercises/1_variables.md`
- **Source:** `1_variables.ts`
- **What You'll Learn:**
  - Declaring variables with `let`, `const`, and `var`
  - Explicit type annotations vs type inference
  - Primitive types: `string`, `number`, `boolean`
  - Why TypeScript rejects mismatched assignments

**Key Concepts:**
- Type annotation syntax (`variable: Type`)
- Type inference
- Primitive types
- `const` vs `let`

---

### **Topic 2: Special Types — Any and Unknown**
- **Exercise:** `exercises/2_special_types.md`
- **Source:** `2_special_types.ts`
- **What You'll Learn:**
  - The `any` escape hatch and why it's risky
  - The safer `unknown` type
  - Narrowing `unknown` with type guards
  - Safely processing external/API data

**Key Concepts:**
- `any` vs `unknown`
- Type guards (`typeof`, `Array.isArray`, `instanceof`)
- Type narrowing
- Safe handling of untrusted input

---

### **Topic 3: Arrays and Objects**
- **Exercise:** `exercises/3_arrays_objects.md`
- **Source:** `3_arrays_objects.ts`
- **What You'll Learn:**
  - Typed arrays (`number[]`, `Array<T>`)
  - Tuples for fixed-length, mixed-type collections
  - Object type annotations
  - Nested object shapes

**Key Concepts:**
- Array typing syntax
- Tuples
- Object literal types
- Read-only collections

---

### **Topic 4: Types and Interfaces**
- **Exercise:** `exercises/4_types_interfaces.md`
- **Source:** `4_types_interfaces.ts`
- **What You'll Learn:**
  - Type aliases with the `type` keyword
  - `interface` declarations for object shapes
  - Union (`|`) and intersection (`&`) types
  - Extending interfaces (single and multiple)

**Key Concepts:**
- `type` vs `interface`
- Union and intersection types
- Interface inheritance (`extends`)
- When to use which

---

### **Topic 5: Functions — Advanced Parameter Handling**
- **Exercise:** `exercises/5_functions.md`
- **Source:** `5_functions.ts`
- **What You'll Learn:**
  - Required, optional (`?`), and default parameters
  - Destructured object parameters
  - Rest parameters (`...args`)
  - Typing parameters and return values

**Key Concepts:**
- Optional vs default parameters
- Destructuring in signatures
- Rest parameters
- Return type annotations

---

### **Topic 6: Generic Interfaces**
- **Exercise:** `exercises/6_generic_interface.md`
- **Source:** `6_generic_interface.ts`
- **What You'll Learn:**
  - Why generics exist (reusable, type-safe code)
  - Defining generic interfaces (`interface Box<T>`)
  - Using type parameters across properties and methods
  - Constraining generics

**Key Concepts:**
- Type parameters (`<T>`)
- Generic interfaces
- Reusability without losing type safety
- Generic constraints

---

### **Topic 7: Classes & Generics**
- **Exercise:** `exercises/7_classes.md`
- **Source:** `7_classes.ts`
- **What You'll Learn:**
  - Class fields, constructors, and methods
  - Access modifiers (`public`, `private`, `protected`)
  - Combining classes with generics
  - Implementing interfaces

**Key Concepts:**
- Class syntax and members
- Access modifiers
- Generic classes
- `implements` contracts

---

### **Topic 8: Converting JavaScript to TypeScript**
- **Exercise:** `exercises/8_conversion.md`
- **What You'll Learn:**
  - Converting simple and arrow functions to TS (side by side)
  - Adding an interface as a parameter
  - Typed return values with user-defined type guards (`x is T`)
  - Safe nested access with optional chaining (`mydata?.a?.b?.c`)

**Key Concepts:**
- "Add types, don't change logic"
- Type guards with `is`
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Incremental migration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn
- Basic JavaScript knowledge
- A code editor (VS Code recommended)

### Setup (5 minutes)

```bash
# From inside the type_scripts_basics folder

# Install TypeScript + ts-node globally (or as dev deps)
npm install -g typescript ts-node

# Verify the compiler is available
tsc --version
```

### Running a Topic

```bash
# Option A: run directly with ts-node (no build step)
ts-node 1_variables.ts

# Option B: compile to JavaScript, then run with node
tsc 1_variables.ts
node 1_variables.js
```

<sub>code by anubhav trainings</sub>

---

## 📋 File Structure

```
type_scripts_basics/
├── README.md                    # This guide
├── 1_variables.ts               # Source: variables & primitives
├── 2_special_types.ts           # Source: any vs unknown
├── 3_arrays_objects.ts          # Source: arrays, tuples, objects
├── 4_types_interfaces.ts        # Source: types & interfaces
├── 5_functions.ts               # Source: function parameters
├── 6_generic_interface.ts       # Source: generic interfaces
├── 7_classes.ts                 # Source: classes & generics
└── exercises/                   # Annotated walkthroughs
    ├── 1_variables.md
    ├── 2_special_types.md
    ├── 3_arrays_objects.md
    ├── 4_types_interfaces.md
    ├── 5_functions.md
    ├── 6_generic_interface.md
    ├── 7_classes.md
    └── 8_conversion.md          # JS → TS conversion guide
```

---

## 🎯 Learning Path

### Beginner (Topics 1-3)
- Get comfortable with annotations and inference
- Understand `any` vs `unknown` and why safety matters
- Model data with arrays, tuples, and objects

### Intermediate (Topics 4-5)
- Define reusable shapes with types and interfaces
- Master flexible function signatures

### Advanced (Topics 6-8)
- Write reusable, type-safe code with generics
- Combine classes and generics
- Migrate real JavaScript to TypeScript safely

---

## 💡 Key Concepts Reference

### Type Annotation
```typescript
const name: string = 'John';      // Explicit type
const age: number = 25;           // Must be number
const scores: number[] = [];      // Array of numbers
```

### any vs unknown
```typescript
let a: any = 5;       a.foo();     // allowed (unsafe)
let u: unknown = 5;   // u.foo();  // error until narrowed
if (typeof u === 'number') u.toFixed();  // safe
```

### Interface
```typescript
interface User {
  id: number;
  username: string;
}
```

### Generics
```typescript
interface Box<T> {
  value: T;
}
const numBox: Box<number> = { value: 42 };
```

### Optional Chaining
```typescript
const city = data?.address?.city ?? 'Unknown';
```

---

## ✨ Best Practices

### 1. Prefer Inference, Annotate Boundaries
```typescript
const total = 5;                  // inferred number — fine
function add(a: number, b: number): number { return a + b; }  // annotate APIs
```

### 2. Avoid `any`, Reach for `unknown`
```typescript
function handle(input: unknown) {
  if (typeof input === 'string') { /* safe to use as string */ }
}
```

### 3. Use Type Guards
```typescript
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'id' in x;
}
```

### 4. Protect Nested Access
```typescript
const c = mydata?.a?.b?.c ?? 'default';
```

---

## 🎓 Study Tips

1. **Read the exercise, then run the source** — Each `exercises/*.md` explains the matching `*.ts` file block by block.
2. **Type Along** — Don't just read code, write it yourself.
3. **Break it on purpose** — Remove a type and read the compiler error; that's the lesson.
4. **Hover in VS Code** — Inspect inferred types to build intuition.
5. **Refer Back** — Use this guide as a reference while coding.

---

## 🐛 Common Issues & Solutions

### Issue: `Cannot find name 'ts-node'` / `tsc`
**Solution:** Install the tooling:
```bash
npm install -g typescript ts-node
```

### Issue: `Object is of type 'unknown'`
**Solution:** Narrow it with a type guard before use:
```typescript
if (typeof value === 'string') value.toUpperCase();
```

### Issue: `Cannot read property 'x' of undefined` at runtime
**Solution:** Use optional chaining:
```typescript
const x = obj?.nested?.x;
```

### Issue: Property does not exist on type `{}`
**Solution:** Describe the shape with an interface or `type`.

---

## 📚 Additional Resources

### Official Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

### Topics to Explore Next
- Utility types (`Partial`, `Pick`, `Omit`, `Record`)
- Decorators and metadata
- Conditional and mapped types
- Module systems and `tsconfig.json` tuning

> Ready for the next level? Continue with the **TypeScript Foundation Series** in the `my-ts-node-app` folder, which builds a complete type-safe Express API.

---

## ✅ Completion Checklist

- [ ] Topic 1 — Variables & Type Basics
- [ ] Topic 2 — Special Types (any/unknown)
- [ ] Topic 3 — Arrays & Objects
- [ ] Topic 4 — Types & Interfaces
- [ ] Topic 5 — Functions
- [ ] Topic 6 — Generic Interfaces
- [ ] Topic 7 — Classes & Generics
- [ ] Topic 8 — JS → TS Conversion
- [ ] Ran every source file
- [ ] Understand all key concepts

---

## 📞 About This Series

**Course Name:** TypeScript Basics Series

**Instructor:** Anubhav Trainings

**Level:** Beginner

**Prerequisites:** Basic JavaScript knowledge

**Target Audience:**
- JavaScript developers starting with TypeScript
- Anyone wanting a solid grounding in the type system before building apps

---

## 🙏 Final Words

Master these basics and everything that follows — strict mode, decorators, utility types, full APIs — becomes far easier.

Remember:
- **Types are your friends** — They catch bugs before they happen
- **Prefer `unknown` over `any`** — Flexibility without losing safety
- **Validate at boundaries** — External input is always untrusted

Keep coding. Keep learning. Keep improving.

---

**Happy TypeScript Coding!** 🚀

*Code by Anubhav Trainings* | TypeScript Basics Series

Version 1.0 | Last Updated: June 2026