# CAP TypeScript Complete Setup Guide

---

## Step 1 — Install Tooling & Set Up Config

### 1a. Initialize TypeScript in Your CAP Project

Run the official CAP command:

```bash
cds add typescript
```

<sub>**code by anubhav trainings**</sub>

This single command handles everything you need:

- ✅ Adds `tsconfig.json` pre-configured for CAP (correct module, target, paths for @cds-models)
- ✅ Installs `typescript` and `@cap-js/cds-types` as dev dependencies  
- ✅ Updates `package.json` with the right build scripts

> **📌 Important:** You need `@sap/cds-dk` version 7.x or later for this command to be available.

---

### 1b. Understanding the Dependencies

#### Runtime Dependencies (Needed in Production)

These packages are required when your application runs:

```json
{
  "dependencies": {
    "reflect-metadata": "^0.2.2",
    "tslib": "^2.8.1"
  }
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*reflect-metadata*</span>

Provides runtime support for decorators and metadata. Required when using decorators like `@LogMethod`, `@Controller`, etc. Must be imported **FIRST** in your entry file:

```typescript
import 'reflect-metadata'  // ← top of server.ts
```

Used by NestJS, TypeORM, class-transformer, and class-validator. Without this, decorators silently fail at runtime.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*tslib*</span>

A runtime helper library for TypeScript compiled output. When TypeScript compiles decorators, async/await, and generators, it injects helper functions (`__awaiter`, `__decorate`, etc.).

`tslib` provides these helpers from ONE shared package instead of duplicating them in every compiled file.

Enable in tsconfig:

```json
{
  "compilerOptions": {
    "importHelpers": true
  }
}
```

**Result:**
- **Without tslib** → helpers copied into EVERY compiled `.js` file *(bloated)*
- **With tslib** → helpers imported from tslib once *(smaller output)* ✅

---

#### Development Dependencies (TypeScript & Tooling)

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*typescript*</span>

The TypeScript compiler itself (`tsc`). Compiles `.ts` → `.js` and performs type checking. Always install as `devDependency` — not needed at runtime.

```bash
# Key commands:
npx tsc                 # Compile project using tsconfig.json
npx tsc --noEmit        # Type check only, no output files
npx tsc --watch         # Watch mode, recompile on save
```

<sub>**code by anubhav trainings**</sub>

> **Version matters** — newer versions add new strict checks.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*TypeScript Runners*</span>

Choose one based on your workflow:

```bash
# ts-node - Runs TypeScript files directly (most widely used)
npx ts-node src/server.ts

# ts-node-dev - ts-node + auto-restart on file changes
npx ts-node-dev --respawn --transpile-only src/server.ts

# tsx - Modern, fastest TypeScript runner (uses esbuild)
npx tsx src/server.ts           # Run once
npx tsx watch src/server.ts     # Watch mode
```

<sub>**code by anubhav trainings**</sub>

- **ts-node** — widely used, slower than tsx
- **ts-node-dev** — adds auto-restart, faster iteration
- **tsx** — fastest startup, does NOT do type checking (use `tsc --noEmit` separately)

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Type Definitions Packages (@types/*)*</span>

These add TypeScript types to plain JavaScript packages. Always `devDependency` — only needed during development.

```bash
npm install --save-dev \
  @types/node \
  @types/express \
  @types/jest \
  @types/body-parser
```

<sub>**code by anubhav trainings**</sub>

| Package | Provides Types For |
|---------|-------------------|
| `@types/node` | Node.js built-ins (`fs`, `path`, `process`, `Buffer`) |
| `@types/express` | Express.js framework (`Request`, `Response`, `Router`) |
| `@types/jest` | Jest testing globals (`describe`, `it`, `expect`) |
| `@types/body-parser` | Body parser middleware (`json()`, `urlencoded()`) |

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*CAP-Specific Type Definitions*</span>

```bash
npm install --save-dev @cap-js/cds-types
```

<sub>**code by anubhav trainings**</sub>

Provides better type definitions than bundled `@sap/cds` types. Redirected via tsconfig paths alias for:

- `cds.serve()` — fully typed
- `cds.connect()` — parameter types known
- `SELECT.from()` — return values typed
- `this.on()` — event handler signatures typed

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Linting for TypeScript*</span>

```bash
npm install --save-dev \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

<sub>**code by anubhav trainings**</sub>

- **@typescript-eslint/parser** — allows ESLint to parse TypeScript syntax
- **@typescript-eslint/eslint-plugin** — TypeScript-specific ESLint rules like `no-explicit-any`, `explicit-return-type`, `no-floating-promises`

---

### 1c. Understanding tsconfig.json

The TypeScript configuration file controls how your code is compiled and type-checked.

#### Compiler Target & Module Format

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*target: "ESNext"*</span>

What JavaScript version the output compiles to. `"ESNext"` uses latest JS features with no down-leveling needed. CAP runs on Node.js 18/20 which support ESNext natively.

- **No polyfills needed** — BTP runtime handles modern syntax
- **Alternative:** `"ES2022"` (stable), `"ES2020"` (older Node)

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*module: "NodeNext"*</span>

Output module format — controls `require()` vs `import/export`. `"NodeNext"` supports both CommonJS and ESM:

- `.cjs` extension → CommonJS
- `.mjs` extension → ESM
- `"type": "module"` in package.json → ESM
- Default → CommonJS

**Must pair with `moduleResolution: "NodeNext"` — they must match.**

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*moduleResolution: "NodeNext"*</span>

How TypeScript finds imported modules. Must match `module` setting.

**Resolution strategy:**
- ✅ Reads `package.json` "exports" field (modern packages)
- ✅ Resolves `.js` extensions in imports (ESM requirement)
- ✅ Understands `"type": "module"` in package.json
- ✅ **Required for @sap/cds and CAP module resolution**

---

#### Compatibility & Consistency

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*esModuleInterop: true*</span>

Fixes compatibility between CommonJS and ES Module imports. Many SAP/CAP packages are CommonJS internally but you can use clean ESM syntax:

```typescript
// Without esModuleInterop:
import * as cds from '@sap/cds'  // ❌ verbose
cds.default.serve(...)           // must access via .default

// With esModuleInterop:
import cds from '@sap/cds'       // ✅ clean
cds.serve(...)                   // no .default needed
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*forceConsistentCasingInFileNames: true*</span>

Prevents import casing mismatches between Windows (case-insensitive) and Linux (case-sensitive) — **critical for BTP deployment**.

```typescript
// Windows (both work):
import { srv } from './BookService'    // ✅ works
import { srv } from './bookservice'    // ✅ also works (dangerous!)

// BTP Linux (only first works):
import { srv } from './BookService'    // ✅ works
import { srv } from './bookservice'    // ❌ CRASH — file not found
```

<sub>**code by anubhav trainings**</sub>

**With this flag:** TypeScript catches casing bugs at **compile time** on your Windows machine before deploying to BTP Linux.

---

#### Type Safety (The strict: true Switch)

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

<sub>**code by anubhav trainings**</sub>

This master switch enables **ALL 8 strict checks at once:**

<table style="border-collapse: collapse; width: 100%;">
<tr style="background-color: #f5f5f5;">
<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Check</th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">What It Does</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>noImplicitAny</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Every param/variable must have a known type</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 8px;"><strong>strictNullChecks</strong> ⭐</td>
<td style="border: 1px solid #ddd; padding: 8px;">Most impactful in CAP — null/undefined not silently allowed everywhere</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>strictFunctionTypes</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Event handler signatures checked</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 8px;"><strong>strictBindCallApply</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">.bind() .call() .apply() checked</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>strictPropertyInitialization</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Class props must be initialized in constructor</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 8px;"><strong>noImplicitThis</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">'this' must be explicitly typed</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>alwaysStrict</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">"use strict" in every .js output</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 8px;"><strong>useUnknownInCatchVariables</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">catch(e) types e as unknown</td>
</tr>
</table>

**Example — strictNullChecks in action:**

```typescript
const book = await SELECT.one.from(Books)
book.title        // ❌ book could be null/undefined
book?.title ?? '' // ✅ safe navigation required
```

<sub>**code by anubhav trainings**</sub>

---

#### Development & Debugging

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "sourceMap": true,
    "allowJs": true
  }
}
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*skipLibCheck: true*</span>

Skips type checking of ALL `.d.ts` files in `node_modules`. Critical for CAP because:

- `@sap/cds` → large type definitions, slow to check
- `@cap-js/*` → generated types may have minor conflicts
- Third-party → outdated or mismatched `.d.ts` files

**Trade-off:** type errors inside SAP libraries won't be caught. Acceptable — SAP maintains those.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*sourceMap: true*</span>

Generates `.js.map` files alongside compiled output. Maps compiled JS lines back to your original `.ts` source. **Essential for BTP debugging:**

- ✅ SAP BAS breakpoints work in original `.ts` files
- ✅ VS Code remote debug shows `.ts` line numbers
- ✅ BTP CF logs reference original `.ts` lines
- ✅ Error stack traces point to `.ts` source, not compiled JS

```
// Without sourceMap → Error at gen/srv/handlers/Books.js:142
// With sourceMap    → Error at srv/handlers/Books.ts:38
```

<sub>**code by anubhav trainings**</sub>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*allowJs: true*</span>

TypeScript also processes `.js` files alongside `.ts` files. Critical for CAP's gradual migration:

- ✅ `.js` handlers work with new `.ts` files
- ✅ CAP plugins and middleware are plain JS
- ✅ CDS generated files from 'cds build' output as `.js`
- ✅ Legacy service handlers (`.js`) alongside new ones (`.ts`)

```typescript
// Without allowJs:
import { helper } from './utils/legacy.js'  // ❌ not allowed

// With allowJs:
import { helper } from './utils/legacy.js'  // ✅ works
```

<sub>**code by anubhav trainings**</sub>

---

#### Path Aliases for Clean Imports

```json
{
  "compilerOptions": {
    "paths": {
      "@sap/cds": ["./node_modules/@cap-js/cds-types"],
      "#cds-models/*": ["./@cds-models/*"]
    }
  }
}
```

<sub>**code by anubhav trainings**</sub>

Path aliases are shortcuts — TypeScript resolves these **FIRST** before looking in `node_modules`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*@sap/cds redirect*</span>

Redirects ALL `'@sap/cds'` imports to better type definitions:

```typescript
// Without path alias:
import cds from '@sap/cds'
// → types from @sap/cds built-in .d.ts (limited, many 'any')

// With path alias:
import cds from '@sap/cds'
// → types from @cap-js/cds-types (full types, rich intellisense)
// → same import statement, better types, zero code change ✅
```

<sub>**code by anubhav trainings**</sub>

**Result in BAS/VS Code:**
- `cds.serve()` → full type hints
- `cds.connect()` → parameter types shown
- `cds.db.run()` → return types known

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*#cds-models prefix*</span>

Maps `'#cds-models'` to auto-generated entity types. The `@cds-models/` folder is **AUTO-GENERATED** by `'cds build'` or `'cds watch'` and contains TypeScript interfaces generated FROM your `.cds` schema.

**Example:**

Your CDS schema (`db/schema.cds`):

```cds
namespace sap.capire.bookshop;
entity Books {
  key ID    : Integer;
      title : String;
      price : Decimal;
      stock : Integer;
}
```

<sub>**code by anubhav trainings**</sub>

Auto-generated (`@cds-models/sap/capire/bookshop/index.ts`):

```typescript
export interface Books {
  ID:    number;
  title: string;
  price: number;
  stock: number;
}
```

<sub>**code by anubhav trainings**</sub>

Usage in CAP service handler:

```typescript
import { Books } from '#cds-models/sap/capire/bookshop'
// ↓ resolves to → ./@cds-models/sap/capire/bookshop

this.on('READ', Books, async (req) => {
  const books: Books[] = await SELECT.from(Books)
  books[0].title  // ✅ fully typed from .cds schema
  books[0].price  // ✅ number — not any
  books[0].xyz    // ❌ ERROR — field doesn't exist in schema
})
```

<sub>**code by anubhav trainings**</sub>

> **Note:** The `'#'` prefix signals this is an internal alias, not an npm package name (Node.js subpath import convention).

---

### 1d. Verify the Baseline

Your source files are still `.js` at this point, so this confirms the tooling didn't break anything:

```bash
npm test
```

<sub>**code by anubhav trainings**</sub>

All tests in `test/utils.test.js` and `test/CatalogService.test.js` should still pass exactly as before.
