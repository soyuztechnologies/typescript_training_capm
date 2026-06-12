# Step 1: TypeScript Project Setup & tsconfig.json Configuration

## Initializing a TypeScript Node.js Project

Welcome to your TypeScript journey! In this step, we'll set up a complete TypeScript Node.js project from scratch. Think of this as building the foundation for a house—we need a solid base before we add anything on top.

Throughout this step, each setup action is shown **side by side**:

- 🟦 **TypeScript — what we do now** (with comments explaining what each TS-specific piece adds)
- ⬜ **JavaScript — what we did before** (gray background, the plain Node.js setup we used in the past)

This makes it obvious which steps are *new* because of TypeScript, and which you already knew from plain Node.

---

## 📋 Concept Cheatsheet

A quick reference of every setup concept used in this step:

| Concept | TypeScript Setting / Command | What It Does | The JS We Did Before |
|---------|------------------------------|--------------|----------------------|
| **Compiler** | `npm i -D typescript` | Installs `tsc`, the TypeScript→JavaScript compiler | Not needed — Node runs `.js` directly |
| **Type packages** | `npm i -D @types/node @types/express` | Adds type definitions for libraries (autocomplete + checks) | No types existed; you read the docs and hoped |
| **Compiler config** | `tsconfig.json` | Tells `tsc` how to compile and how strict to be | No config — Node just executed the file |
| **Source vs output** | `"rootDir": "./src"`, `"outDir": "./dist"` | Separates source `.ts` from compiled `.js` | You wrote `.js` and ran it in place |
| **Master strict switch** | `"strict": true` | Turns on every strict type-check at once | No type checking at all |
| **Build step** | `tsc` | Compiles `.ts` → `.js` before running | None — edit `.js`, then `node file.js` |
| **Declaration files** | `.d.ts` | Type info with **no** runtime code | No equivalent |

> 💡 The whole of Step 1 is just installing a **compiler**, configuring it with **tsconfig.json**, and adding a **build step**. Everything else is the Node project you already know.

---

## Project Setup — Step by Step

### Step 1.1: Create the Project Directory

<table>
<tr>
<th width="50%">🟦 TypeScript — what we do now</th>
<th width="50%">⬜ JavaScript — what we did before</th>
</tr>
<tr>
<td>

```bash
mkdir typescript-express-api
cd typescript-express-api
# Identical — creating a folder is the same in both worlds.
```

</td>
<td style="background-color:#f0f0f0">

```bash
mkdir express-api
cd express-api
```

</td>
</tr>
</table>

---

### Step 1.2: Initialize npm & Install Dependencies

<table>
<tr>
<th width="50%">🟦 TypeScript — what we do now</th>
<th width="50%">⬜ JavaScript — what we did before</th>
</tr>
<tr>
<td>

```bash
npm init -y
npm install express body-parser

# TS-ONLY: the compiler + type definitions.
# These are devDependencies — they help you while coding
# but are NOT shipped to production (the compiled JS runs alone).
npm install -D typescript @types/node @types/express
```

</td>
<td style="background-color:#f0f0f0">

```bash
npm init -y
npm install express body-parser

# That's it. No compiler, no @types packages.
# Node runs your .js files directly with zero build step —
# faster to start, but nothing checks your code first.
```

</td>
</tr>
</table>

**What we installed:**
- `express` — Web framework for building APIs
- `body-parser` — Middleware to parse request bodies
- `typescript` — The TypeScript compiler *(new)*
- `@types/node` — Type definitions for Node.js built-ins *(new)*
- `@types/express` — Type definitions for Express.js *(new)*

> 💡 **TS advantage:** `@types/*` packages give you autocomplete and error-checking for libraries that were originally written in JavaScript — without changing those libraries at all.

---

### Step 1.3: Create the Compiler Config

<table>
<tr>
<th width="50%">🟦 TypeScript — what we do now</th>
<th width="50%">⬜ JavaScript — what we did before</th>
</tr>
<tr>
<td>

```bash
# Generates a tsconfig.json with every option documented.
npx tsc --init
```

</td>
<td style="background-color:#f0f0f0">

```bash
# Nothing to do here.
# JavaScript has no compiler and no compiler config.
# You created index.js and immediately ran: node index.js
```

</td>
</tr>
</table>

> 💡 This command generates a `tsconfig.json` file with all available options and their explanations. You then customize it for your project. This file is the single biggest difference between a TS and a JS project.

---

## Understanding tsconfig.json

The `tsconfig.json` file is your TypeScript configuration bible. It tells the compiler how to behave, what files to process, and what level of type safety to enforce. **JavaScript has no equivalent** — there was simply nothing to configure because there was no compile step.

Here's a comprehensive, production-ready configuration. Each option is annotated so you understand *why* it's there:

```json
{
  "compilerOptions": {
    // ═══════════════════════════════════════════════════════════
    // FILE LAYOUT & DIRECTORIES
    // ═══════════════════════════════════════════════════════════
    "rootDir": "./src",
    "outDir": "./dist",
    // rootDir: where your source .ts files live
    // outDir:  where compiled .js files are written
    // (In plain JS there was no split — source WAS the output.)

    // ═══════════════════════════════════════════════════════════
    // MODULE & TARGET SETTINGS
    // ═══════════════════════════════════════════════════════════
    "module": "nodenext",
    "target": "esnext",
    // module: which module system to emit (nodenext = native ESM)
    // target: which JS version to compile DOWN to
    //   This is a superpower JS never had — write modern syntax,
    //   ship code that runs on older runtimes.

    // ═══════════════════════════════════════════════════════════
    // TYPE DEFINITIONS & LIBRARIES
    // ═══════════════════════════════════════════════════════════
    "types": [],
    "typeRoots": [
      "./src/types",
      "./node_modules/@types"
    ],
    // typeRoots: where TS looks for .d.ts type definitions
    //   "./src/types"           = your own custom types
    //   "./node_modules/@types" = third-party library types

    // ═══════════════════════════════════════════════════════════
    // OUTPUT GENERATION OPTIONS
    // ═══════════════════════════════════════════════════════════
    "sourceMap": true,
    // Maps compiled JS back to your TS so you can debug the
    // original source even though Node runs the JS.

    "declaration": true,
    // Emits .d.ts files from your code — essential when
    // publishing a package so consumers get type hints.

    "declarationMap": true,
    // Lets "Go to Definition" jump to your .ts, not the .d.ts.

    // ═══════════════════════════════════════════════════════════
    // STRICT TYPE-CHECKING OPTIONS
    // ═══════════════════════════════════════════════════════════
    "noUncheckedIndexedAccess": true,
    // arr[0] / obj['key'] are typed as "value | undefined",
    // forcing you to handle the missing case. JS silently
    // returned undefined and let you crash later.

    "exactOptionalPropertyTypes": true,
    // An optional prop (?) must be present OR absent — not
    // explicitly set to undefined.

    // ═══════════════════════════════════════════════════════════
    // CODE STYLE & QUALITY OPTIONS
    // ═══════════════════════════════════════════════════════════
    "noImplicitReturns": true,
    // Every path in a non-void function must return a value.

    "noImplicitOverride": true,
    // Overriding a parent method requires the 'override' keyword.

    "noUnusedLocals": true,
    // Declared-but-never-read variables are errors.

    "noUnusedParameters": true,
    // Unused params are errors (prefix with _ to allow).

    "noFallthroughCasesInSwitch": true,
    // switch cases must break/return/throw — no accidental fallthrough.

    // ═══════════════════════════════════════════════════════════
    // MASTER STRICT MODE
    // ═══════════════════════════════════════════════════════════
    "strict": true,
    // 🎯 MASTER SWITCH — enables ALL of:
    //   strictNullChecks, strictFunctionTypes,
    //   strictPropertyInitialization, noImplicitAny,
    //   noImplicitThis, alwaysStrict, strictBindCallApply,
    //   useUnknownInCatchVariables
    // This single line is the heart of "TypeScript over JavaScript."

    // ═══════════════════════════════════════════════════════════
    // MODERN TYPESCRIPT FEATURES
    // ═══════════════════════════════════════════════════════════
    "isolatedModules": true,
    // Each file must be a valid standalone module.

    "moduleDetection": "force",
    // Treat every file as a module (no accidental globals).

    "skipLibCheck": true,
    // Skip type-checking .d.ts files — big compile speed-up.

    "jsx": "react-jsx"
    // How JSX compiles (react-jsx = no need to import React).
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

<table>
<tr>
<th width="50%">🟦 TypeScript — with type safety</th>
<th width="50%">⬜ JavaScript — without it</th>
</tr>
<tr>
<td>

```typescript
interface User { name: string; age: number; }
// ❌ Caught NOW, in the editor: age is missing
const user: User = { name: 'John' };
```

</td>
<td style="background-color:#f0f0f0">

```javascript
const user = { name: 'John' };
// Looks fine... runs fine...
console.log(user.age); // undefined — silent bug that
                       // surfaces far from its cause
```

</td>
</tr>
</table>

### What is *Strict Mode*?

> **Key Concept:** Strict mode enforces the strictest type-checking rules. It prevents common bugs like null/undefined errors, implicit type conversions, and unsafe casts by forcing you to handle edge cases explicitly.

Setting `"strict": true` is like having a very attentive code reviewer who catches every potential bug before it happens. (More in Step 3.)

### What is a *Type Definition File* (.d.ts)?

> **Key Concept:** A `.d.ts` file contains ONLY type information—no actual JavaScript code. It tells TypeScript what types exist in a library, enabling autocomplete and type checking.

```typescript
// user.d.ts — pure type info, compiles to nothing
export interface User {
  id: number;
  username: string;
  email: string;
}
```

---

## npm Scripts for Development

<table>
<tr>
<th width="50%">🟦 TypeScript — what we do now</th>
<th width="50%">⬜ JavaScript — what we did before</th>
</tr>
<tr>
<td>

```json
{
  "scripts": {
    "build": "tsc",                  // compile .ts -> .js (NEW step)
    "start": "node dist/1_server.js",// run the COMPILED output
    "dev": "tsc && npm start",       // build, then run
    "watch": "tsc --watch"           // recompile on every save
  }
}
```

</td>
<td style="background-color:#f0f0f0">

```json
{
  "scripts": {
    "start": "node src/1_server.js"
  }
}
// No build, no watch — you edit the .js and run it.
// Quicker to launch, but there is no compiler standing
// between your typo and your users.
```

</td>
</tr>
</table>

**Script explanations:**
- `npm run build` — Compiles TypeScript to JavaScript *(new step that JS never needed)*
- `npm start` — Runs the compiled application
- `npm run dev` — Compiles and runs in one command
- `npm run watch` — Watches for changes and recompiles automatically

---

## Core Concepts Summary

> The entire "cost" of TypeScript over JavaScript is the three new things in this step: a **compiler** (`typescript`), a **config file** (`tsconfig.json`), and a **build step** (`tsc`). In return you get every error in the cheatsheet caught *before* runtime.

---

<div style="background-color: #FFE4E1; padding: 15px; border-radius: 8px; margin-top: 20px;">

**📝 Key Takeaways:**

1. **tsconfig.json** is your TypeScript configuration blueprint — JavaScript had no equivalent
2. **Strict mode** (`"strict": true`) catches bugs early by enforcing type safety
3. **Type definitions** (.d.ts files) provide type information without executable code
4. **rootDir and outDir** separate source TypeScript from compiled JavaScript
5. **The build step (`tsc`)** is the one new habit to learn — edit, build, run
6. Run `npx tsc --init` to auto-generate a tsconfig with all options documented

</div>

---

## Complete Project Setup

Now that you understand each piece, here is everything together to set up the project from zero.

### Complete setup commands

```bash
mkdir typescript-express-api
cd typescript-express-api

npm init -y
npm install express body-parser
npm install -D typescript @types/node @types/express

npx tsc --init   # then replace the generated file with the tsconfig.json below

mkdir src
mkdir src/types
mkdir src/decorators
```

### Complete `tsconfig.json`

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    "typeRoots": ["./src/types", "./node_modules/@types"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "strict": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Final project directory structure

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

## Next Steps

You've successfully set up your TypeScript project! Your `tsconfig.json` is now configured for:
- ✅ Type safety with strict mode enabled
- ✅ Proper module system (ESM for Node.js)
- ✅ Clear source and output directories
- ✅ Type definition generation and organization

**Ready for Step 2?** We'll create your first Express server with basic TypeScript types!

---

*Code by Anubhav Trainings* | TypeScript Foundation Series