# Step 1: TypeScript Project Setup & tsconfig.json Configuration

## Initializing a TypeScript Node.js Project

Welcome to your TypeScript journey! In this step, we'll set up a complete TypeScript Node.js project from scratch. Think of this as building the foundation for a house—we need a solid base before we add anything on top.

### Creating the Project Directory

First, let's create a new directory for our project and navigate into it:

```bash
mkdir typescript-express-api
cd typescript-express-api
```

<sub>code by anubhav trainings</sub>

### Initialize npm and Install Dependencies

Now let's initialize a Node.js project and install the necessary packages:

```bash
npm init -y
npm install express body-parser
npm install -D typescript @types/node @types/express
```

<sub>code by anubhav trainings</sub>

**What we installed:**
- `express` — Web framework for building APIs
- `body-parser` — Middleware to parse request bodies
- `typescript` — The TypeScript compiler
- `@types/node` — Type definitions for Node.js built-in modules
- `@types/express` — Type definitions for Express.js

---

## Understanding tsconfig.json

The `tsconfig.json` file is your TypeScript configuration bible. It tells the TypeScript compiler how to behave, what files to process, and what level of type safety to enforce.

### Generating tsconfig.json

Create a basic tsconfig configuration file with this command:

```bash
npx tsc --init
```

<sub>code by anubhav trainings</sub>

> 💡 This command generates a `tsconfig.json` file with all available options and their explanations. You can then customize it based on your project needs.

---

## Detailed tsconfig.json Breakdown

Here's a comprehensive tsconfig.json configured for a production-ready Express API:

```json
{
  "compilerOptions": {
    // ═══════════════════════════════════════════════════════════
    // FILE LAYOUT & DIRECTORIES
    // ═══════════════════════════════════════════════════════════
    "rootDir": "./src",
    "outDir": "./dist",
    
    // rootDir: Tells TS where your source files are located
    // outDir: Where compiled JavaScript files will be output
    
    // ═══════════════════════════════════════════════════════════
    // MODULE & TARGET SETTINGS
    // ═══════════════════════════════════════════════════════════
    "module": "nodenext",
    "target": "esnext",
    
    // module: Which JavaScript module system to use
    //   "nodenext" = Uses Node.js's native ESM support
    //   "commonjs"  = Uses older CommonJS (require/module.exports)
    //
    // target: Which JavaScript version to compile down to
    //   "esnext"   = Uses latest features available
    //   "es2020"   = Compiles to ES2020 standard
    //   "es2015"   = Compiles to older ES6 standard
    
    // ═══════════════════════════════════════════════════════════
    // TYPE DEFINITIONS & LIBRARIES
    // ═══════════════════════════════════════════════════════════
    "types": [],
    "typeRoots": [
      "./src/types",
      "./node_modules/@types"
    ],
    
    // types: Explicitly list type definitions to include
    //        Empty array means include none (you specify them explicitly)
    //
    // typeRoots: Where TS looks for type definition files (.d.ts)
    //   "./src/types" = Your custom type definitions
    //   "./node_modules/@types" = Third-party packages' types
    
    // ═══════════════════════════════════════════════════════════
    // OUTPUT GENERATION OPTIONS
    // ═══════════════════════════════════════════════════════════
    "sourceMap": true,
    // Generates .map files that map compiled JS back to original TS
    // Allows debugging at TypeScript level even though browser runs JS
    
    "declaration": true,
    // Generates .d.ts files from your .ts source code
    // Essential when publishing npm packages—consumers get type hints
    
    "declarationMap": true,
    // Generates .d.ts.map files linking .d.ts back to original .ts
    // Allows "Go to Definition" to jump to .ts source, not generated .d.ts
    // Requires "declaration": true
    
    // ═══════════════════════════════════════════════════════════
    // STRICT TYPE-CHECKING OPTIONS
    // ═══════════════════════════════════════════════════════════
    "noUncheckedIndexedAccess": true,
    // When you access arr[0] or obj['key'], TypeScript includes | undefined
    // Ensures you handle cases where the key/index doesn't exist
    
    "exactOptionalPropertyTypes": true,
    // Optional properties (?) must be either present OR absent—not undefined
    // interface User { bio?: string }
    // { bio: undefined } ❌ ERROR
    // { bio: 'hello' }   ✅ OK
    // { }                ✅ OK (absent is allowed)
    
    // ═══════════════════════════════════════════════════════════
    // CODE STYLE & QUALITY OPTIONS
    // ═══════════════════════════════════════════════════════════
    "noImplicitReturns": true,
    // Every code path in a non-void function must return a value
    // Prevents accidentally missing a return statement
    
    "noImplicitOverride": true,
    // Methods overriding parent class methods MUST use 'override' keyword
    // Catches bugs when parent method is renamed
    
    "noUnusedLocals": true,
    // Variables declared but never read are errors
    // Keeps code clean and free of dead code
    
    "noUnusedParameters": true,
    // Function parameters declared but never used are errors
    // Prefix with _ to suppress: function fn(_unused) {}
    
    "noFallthroughCasesInSwitch": true,
    // Switch cases must explicitly break/return/throw
    // Prevents accidental execution flow into next case
    
    // ═══════════════════════════════════════════════════════════
    // MASTER STRICT MODE
    // ═══════════════════════════════════════════════════════════
    "strict": true,
    // 🎯 MASTER SWITCH — Enables ALL strict checks below:
    //   ✓ strictNullChecks
    //   ✓ strictFunctionTypes
    //   ✓ strictPropertyInitialization
    //   ✓ noImplicitAny
    //   ✓ noImplicitThis
    //   ✓ alwaysStrict
    //   ✓ strictBindCallApply
    //   ✓ useUnknownInCatchVariables
    
    // ═══════════════════════════════════════════════════════════
    // MODERN TYPESCRIPT FEATURES
    // ═══════════════════════════════════════════════════════════
    "isolatedModules": true,
    // Each file must be a valid standalone module
    // Required by transpilers like Babel/esbuild that process files one at a time
    // Disallows const enums and namespaces
    
    "moduleDetection": "force",
    // "force" treats every file as a module regardless of imports/exports
    // Prevents accidental global script files in modern projects
    
    "skipLibCheck": true,
    // Skips type checking of .d.ts files (including node_modules/@types)
    // Significantly speeds up compilation in large projects
    // Safe to use—third-party type errors rarely affect you
    
    "jsx": "react-jsx"
    // Controls how JSX syntax is compiled
    // "react-jsx" = React 17+ automatic runtime (no need to import React)
    // "react"     = Classic runtime (must import React in every .tsx)
  },
  
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

<sub>code by anubhav trainings</sub>

---

## Core Concepts Explained

### What is *Type Safety*?

> **Key Concept:** Type safety means TypeScript catches errors at compile-time (before running your code) by checking that data types match expectations. Instead of discovering errors at runtime when they crash your app, you find them immediately while coding.

**Without Type Safety:**
```javascript
const user = { name: 'John' };
console.log(user.age); // ❌ Returns undefined (silent error!)
```

**With Type Safety:**
```typescript
interface User { name: string; age: number; }
const user: User = { name: 'John' }; // ❌ ERROR: age property missing
```

### What is *Strict Mode*?

> **Key Concept:** Strict mode enforces the strictest type-checking rules. It prevents common bugs like null/undefined errors, implicit type conversions, and unsafe casts by forcing you to handle edge cases explicitly.

Setting `"strict": true` is like having a very attentive code reviewer who catches every potential bug before they happen.

### What is a *Type Definition File* (.d.ts)?

> **Key Concept:** A .d.ts file contains ONLY type information—no actual JavaScript code. It tells TypeScript what types exist in a library, enabling autocomplete and type checking when using that library.

```typescript
// user.d.ts
export interface User {
  id: number;
  username: string;
  email: string;
}
```

This file tells TypeScript: "When someone imports User, it has these three properties with these types."

---

## Project Directory Structure

After setup, your project should look like this:

```
typescript-express-api/
├── src/
│   ├── types/
│   │   ├── user.d.ts
│   │   └── index.d.ts
│   ├── decorators/
│   │   └── logger.decorator.ts
│   └── 1_server.ts
├── dist/
│   └── (compiled JavaScript files)
├── package.json
├── tsconfig.json
└── node_modules/
```

<sub>code by anubhav trainings</sub>

---

## npm Scripts for Development

Add these scripts to your `package.json` for easy development:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/1_server.js",
    "dev": "tsc && npm start",
    "watch": "tsc --watch"
  }
}
```

<sub>code by anubhav trainings</sub>

**Script explanations:**
- `npm run build` — Compiles TypeScript to JavaScript
- `npm start` — Runs the compiled application
- `npm run dev` — Compiles and runs in one command
- `npm run watch` — Watches for file changes and recompiles automatically

---

## Next Steps

You've successfully set up your TypeScript project! Your `tsconfig.json` is now configured for:
- ✅ Type safety with strict mode enabled
- ✅ Proper module system (ESM for Node.js)
- ✅ Clear source and output directories
- ✅ Type definition generation and organization

**Ready for Step 2?** We'll create your first Express server with basic TypeScript types!

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **tsconfig.json** is your TypeScript configuration blueprint
2. **Strict mode** (`"strict": true`) catches bugs early by enforcing type safety
3. **Type definitions** (.d.ts files) provide type information without executable code
4. **rootDir and outDir** separate source TypeScript from compiled JavaScript
5. Run `npx tsc --init` to auto-generate a tsconfig with all options documented

</div>

---

*Code by Anubhav Trainings* | TypeScript Foundation Series
