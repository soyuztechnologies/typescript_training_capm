# CAP TypeScript Journey: Prelude — Generate Entity Types with cds-typer

Before you can safely type your CAP service handlers, you need **generated TypeScript interfaces** for your entities. This is where `cds-typer` comes in.

---

## Prerequisites: Install cds-typer

First, add the code generator to your project as a dev dependency:

```bash
npm install --save-dev @cap-js/cds-typer
```

<sub>**code by anubhav trainings**</sub>

This installs the official SAP tool that generates TypeScript type definitions directly from your `.cds` data model.

---

## Generate Types from Your CDS Model

Run the generator on your CDS schema files:

```bash
cds-typer "*"
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 What This Does:</strong> Scans all .cds files in your project and generates TypeScript interfaces for every entity, type, and aspect defined in your data model.
</div>

### Generated Output Structure

This creates a folder (commonly at the project root):

```
@cds-models/
├── index.d.ts
├── CDSService/
│   ├── index.d.ts
│   ├── index.ts
│   └── types.ts
├── CatalogService/
│   ├── index.d.ts
│   ├── index.ts
│   └── types.ts
└── ...
```

<sub>**code by anubhav trainings**</sub>

Each service folder contains:

- **`index.d.ts`** — TypeScript type declaration files (pure types)
- **`index.ts`** — Runtime definitions for entities (classes/interfaces)
- **`types.ts`** — Helper type utilities

These are **auto-generated** — don't edit them. When you update your `.cds` files, re-run `cds-typer "*"` to regenerate.

---

## The Flow: From CDS Model to Type-Safe Code

<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background-color: #fafafa;">
  <defs>
    <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#1976d2"/>
    </marker>
    <marker id="arrow-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#7b1fa2"/>
    </marker>
    <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#388e3c"/>
    </marker>
    <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#f57c00"/>
    </marker>
    <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#bbdefb;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad-purple" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f3e5f5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e1bee7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e8f5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c8e6c9;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad-orange" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff3e0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffe0b2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="450" y="35" font-size="20" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    CAP TypeScript: cds-typer Pipeline
  </text>

  <!-- PHASE 1: CDS Model -->
  <rect x="20" y="70" width="160" height="110" fill="url(#grad-blue)" stroke="#1976d2" stroke-width="2" rx="6"/>
  <text x="100" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#0d47a1">📋 CDS Model</text>
  <line x1="30" y1="105" x2="170" y2="105" stroke="#1976d2" stroke-width="1"/>
  <text x="100" y="125" font-size="11" text-anchor="middle" fill="#1565c0">db/schema.cds</text>
  <text x="100" y="140" font-size="11" text-anchor="middle" fill="#1565c0">srv/**.cds</text>
  <text x="100" y="155" font-size="10" text-anchor="middle" fill="#1976d2" font-style="italic">Entity Definitions</text>

  <!-- Arrow: CDS → cds-typer -->
  <path d="M 180 125 L 220 125" stroke="#1976d2" stroke-width="3" fill="none" marker-end="url(#arrow-blue)"/>
  <text x="200" y="115" font-size="10" fill="#1976d2" font-weight="bold" text-anchor="middle">scan</text>

  <!-- PHASE 2: cds-typer -->
  <rect x="220" y="70" width="160" height="110" fill="url(#grad-purple)" stroke="#7b1fa2" stroke-width="2" rx="6"/>
  <text x="300" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#4a148c">⚙️ cds-typer</text>
  <line x1="230" y1="105" x2="410" y2="105" stroke="#7b1fa2" stroke-width="1"/>
  <text x="300" y="125" font-size="11" text-anchor="middle" fill="#6a1b9a">Code Generator</text>
  <text x="300" y="140" font-size="10" text-anchor="middle" fill="#7b1fa2">npm install</text>
  <text x="300" y="152" font-size="10" text-anchor="middle" fill="#7b1fa2">--save-dev</text>

  <!-- Arrow: cds-typer → Generated Types -->
  <path d="M 380 125 L 420 125" stroke="#7b1fa2" stroke-width="3" fill="none" marker-end="url(#arrow-purple)"/>
  <text x="400" y="115" font-size="10" fill="#7b1fa2" font-weight="bold" text-anchor="middle">generate</text>

  <!-- PHASE 3: Generated Types -->
  <rect x="420" y="70" width="160" height="110" fill="url(#grad-green)" stroke="#388e3c" stroke-width="2" rx="6"/>
  <text x="500" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#1b5e20">✨ Generated Types</text>
  <line x1="430" y1="105" x2="590" y2="105" stroke="#388e3c" stroke-width="1"/>
  <text x="500" y="125" font-size="11" text-anchor="middle" fill="#2e7d32">@cds-models/</text>
  <text x="500" y="140" font-size="10" text-anchor="middle" fill="#388e3c">.ts & .d.ts files</text>
  <text x="500" y="155" font-size="10" text-anchor="middle" fill="#388e3c" font-style="italic">ProductSet, Books_</text>

  <!-- Arrow: Generated Types → Type-Safe Code -->
  <path d="M 620 130 L 700 130 L 700 220" stroke="#388e3c" stroke-width="3" fill="none" marker-end="url(#arrow-green)"/>
  <text x="660" y="120" font-size="10" fill="#388e3c" font-weight="bold" text-anchor="middle">enable</text>

  <!-- PHASE 4: Type-Safe Service Code Container -->
  <rect x="20" y="220" width="820" height="340" fill="#fff9f5" stroke="#f57c00" stroke-width="3" rx="8" stroke-dasharray="5,5"/>
  <text x="430" y="245" font-size="15" font-weight="bold" text-anchor="middle" fill="#e65100">🔒 Type-Safe CAP Service Code</text>
  <text x="430" y="262" font-size="11" text-anchor="middle" fill="#bf360c" font-style="italic">Generated types feed into all migration steps</text>

  <!-- Connection lines from generated types to steps -->
  <path d="M 500 180 L 500 200" stroke="#388e3c" stroke-width="2" stroke-dasharray="3,3" fill="none"/>
  
  <!-- Step 1-2: Setup & Utils -->
  <rect x="40" y="280" width="140" height="90" fill="#fce4ec" stroke="#c2185b" stroke-width="2" rx="5"/>
  <text x="110" y="305" font-size="13" font-weight="bold" text-anchor="middle" fill="#880e4f">Step 1–2</text>
  <line x1="50" y1="315" x2="170" y2="315" stroke="#c2185b" stroke-width="1"/>
  <text x="110" y="335" font-size="11" text-anchor="middle" fill="#c2185b">TypeScript Setup</text>
  <text x="110" y="352" font-size="10" text-anchor="middle" fill="#ad1457">tsconfig.json</text>
  <text x="110" y="365" font-size="10" text-anchor="middle" fill="#ad1457">Dependencies</text>

  <!-- Step 3: Utility Handlers -->
  <rect x="210" y="280" width="140" height="90" fill="#e0f2f1" stroke="#00897b" stroke-width="2" rx="5"/>
  <text x="280" y="305" font-size="13" font-weight="bold" text-anchor="middle" fill="#004d40">Step 3</text>
  <line x1="220" y1="315" x2="340" y2="315" stroke="#00897b" stroke-width="1"/>
  <text x="280" y="335" font-size="11" text-anchor="middle" fill="#00897b">Utility Handlers</text>
  <text x="280" y="352" font-size="10" text-anchor="middle" fill="#00695c">error-mapper.ts</text>
  <text x="280" y="365" font-size="10" text-anchor="middle" fill="#00695c">payload-transformer.ts</text>

  <!-- Step 4: CDSService -->
  <rect x="380" y="280" width="140" height="90" fill="#ede7f6" stroke="#512da8" stroke-width="2" rx="5"/>
  <text x="450" y="305" font-size="13" font-weight="bold" text-anchor="middle" fill="#311b92">Step 4</text>
  <line x1="390" y1="315" x2="510" y2="315" stroke="#512da8" stroke-width="1"/>
  <text x="450" y="335" font-size="11" text-anchor="middle" fill="#512da8">CDSService</text>
  <text x="450" y="352" font-size="10" text-anchor="middle" fill="#4527a0">Uses: ProductSet</text>
  <text x="450" y="365" font-size="10" text-anchor="middle" fill="#4527a0">ProductSet_</text>

  <!-- Step 5: CatalogService -->
  <rect x="550" y="280" width="140" height="90" fill="#f1f8e9" stroke="#689f38" stroke-width="2" rx="5"/>
  <text x="620" y="305" font-size="13" font-weight="bold" text-anchor="middle" fill="#33691e">Step 5</text>
  <line x1="560" y1="315" x2="680" y2="315" stroke="#689f38" stroke-width="1"/>
  <text x="620" y="335" font-size="11" text-anchor="middle" fill="#689f38">CatalogService</text>
  <text x="620" y="352" font-size="10" text-anchor="middle" fill="#558b2f">Actions</text>
  <text x="620" y="365" font-size="10" text-anchor="middle" fill="#558b2f">Functions</text>

  <!-- Step 6: Final State -->
  <rect x="720" y="280" width="100" height="90" fill="#e8eaf6" stroke="#3949ab" stroke-width="2" rx="5"/>
  <text x="770" y="305" font-size="13" font-weight="bold" text-anchor="middle" fill="#1a237e">Step 6</text>
  <line x1="730" y1="315" x2="810" y2="315" stroke="#3949ab" stroke-width="1"/>
  <text x="770" y="335" font-size="11" text-anchor="middle" fill="#3949ab">Full TypeScript</text>
  <text x="770" y="352" font-size="10" text-anchor="middle" fill="#283593">allowJs:</text>
  <text x="770" y="365" font-size="10" text-anchor="middle" fill="#283593">false</text>

  <!-- Connection arrows between steps -->
  <path d="M 180 325 L 210 325" stroke="#9e9e9e" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>
  <path d="M 350 325 L 380 325" stroke="#9e9e9e" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>
  <path d="M 520 325 L 550 325" stroke="#9e9e9e" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>
  <path d="M 690 325 L 720 325" stroke="#9e9e9e" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>

  <!-- Bottom explanation box -->
  <rect x="40" y="400" width="740" height="130" fill="#f5f5f5" stroke="#757575" stroke-width="1" rx="4"/>
  <text x="410" y="425" font-size="12" font-weight="bold" text-anchor="middle" fill="#212121">✅ What Happens at Each Step</text>
  
  <text x="50" y="450" font-size="10" font-weight="bold" fill="#1565c0">Steps 1–2:</text>
  <text x="140" y="450" font-size="10" fill="#424242">Set up TypeScript tooling, tsconfig.json, dev dependencies</text>
  
  <text x="50" y="470" font-size="10" font-weight="bold" fill="#00695c">Step 3:</text>
  <text x="140" y="470" font-size="10" fill="#424242">Migrate utility functions with Record&lt;string, unknown&gt;, unions, generics</text>
  
  <text x="50" y="490" font-size="10" font-weight="bold" fill="#4527a0">Step 4:</text>
  <text x="140" y="490" font-size="10" fill="#424242">Use generated entity types (ProductSet, ProductSet_) in CDSService handlers</text>
  
  <text x="50" y="510" font-size="10" font-weight="bold" fill="#558b2f">Step 5:</text>
  <text x="140" y="510" font-size="10" fill="#424242">Type actions, functions, and CDS transactions (cds.tx)</text>
  
  <text x="50" y="530" font-size="10" font-weight="bold" fill="#283593">Step 6:</text>
  <text x="140" y="530" font-size="10" fill="#424242">Set allowJs: false for 100% TypeScript compliance</text>
</svg>

---

## What Gets Generated: Entity Interfaces

For every entity in your `.cds` schema, `cds-typer` creates **two types** — this naming rule is **the single most important thing** to understand:

| Generated Name | Meaning | Example Use |
|---|---|---|
| `ProductSet` | One row (singular) | A single product object |
| `ProductSet_` (trailing `_`) | The collection — extends `Array<ProductSet>` | The array a READ returns |

### Why Two Types?

Each is **both a type AND a runtime value** (it's a class), which is why you can:

- Use `ProductSet` directly as the handler target
- Use `ProductSet` as a type annotation
- Use `ProductSet_` to type the array returned by queries

This **replaces your old `cds.entities('CDSService')` string-based lookup** with something fully typed and type-checkable.

### Example: Your Books Entity

**CDS Model (db/schema.cds):**

```cds
namespace sap.capire.bookshop;

entity Books {
  key ID      : Integer;
      title   : String;
      author  : String;
      price   : Decimal;
      stock   : Integer;
      createdAt: Timestamp;
}
```

<sub>**code by anubhav trainings**</sub>

**Generated TypeScript (@cds-models/sap/capire/bookshop/index.ts):**

```typescript
// Single row type — one entity instance
export interface Books {
  ID: number
  title: string
  author: string
  price: number
  stock: number
  createdAt: Date
}

// Array type — the collection (extends Array<Books>)
export class Books_ extends Array<Books> {
  // runtime class for the collection
}
```

<sub>**code by anubhav trainings**</sub>

### Optional & Nullable Fields

Notice fields are **optional and nullable**:

```typescript
interface Books {
  ID?: number | null
  title?: string | null
  price?: number | null
  // ...
}
```

<span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*Why nullable:*</span> CAP is being **honest** — any field may be absent in a partial payload (e.g., during a CREATE that doesn't include all fields). **Strict mode will make you respect that.**

### How This Works in Service Handlers

Once you have these types, you can write type-safe handlers:

```typescript
import { Books, Books_ } from '#cds-models/sap/capire/bookshop'
import cds from '@sap/cds'

export default class BookService extends cds.ApplicationService {
  init() {
    // Handler receives Books_ (the array)
    this.after('READ', Books, async (books: Books_, req) => {
      // books is an array of Books ✅ type-checked
      books.map(book => {
        book.title        // ✅ known field
        book.price        // ✅ known field, number | null
        book.unknownField // ❌ ERROR — not in schema
      })
    })

    return super.init()
  }
}
```

<sub>**code by anubhav trainings**</sub>

---

## The Naming Rule: Critical for Success

<div style="background-color: #f8bbd0; padding: 12px; border-radius: 4px; margin: 16px 0;">
<strong>📍 CRITICAL:</strong> This is the single most important thing. Memorize it.
<br/>
<br/>
<strong>ProductSet</strong> = the row type (singular entity)
<br/>
<strong>ProductSet_</strong> = the array type (with trailing underscore)
<br/>
<br/>
When you see a compilation error about "not an array," you're probably using ProductSet instead of ProductSet_. Switch the underscore.
</div>

---

## From String-Based Lookups to Type-Safe Handlers

### Before: Plain JavaScript (Untyped)

```javascript
const cds = require('@sap/cds')

module.exports = class CDSService extends cds.ApplicationService {
  init() {
    // String-based lookup — completely untyped
    const { ProductSet, ItemsSet } = cds.entities('CDSService')

    this.after('READ', ProductSet, async (productSet, req) => {
      // TypeScript doesn't know:
      // - Is productSet an array or a single object?
      // - What fields does ProductSet have?
      // - Is productSet.map() allowed?
      productSet.map(p => {
        p.ProductId  // Maybe exists, maybe not — no type checking
        p.unknown    // Typo? No way to know at compile time
      })
    })

    return super.init()
  }
}
```

<sub>**code by anubhav trainings**</sub>

### After: TypeScript with Generated Types (Fully Typed)

```typescript
import cds from '@sap/cds'
import { ProductSet, ProductSet_ } from '#cds-models/CDSService'

export default class CDSService extends cds.ApplicationService {
  init() {
    // Imported directly from generated models — fully typed
    this.after('READ', ProductSet, async (productSet: ProductSet_, req) => {
      // TypeScript now knows:
      // ✅ productSet is definitely ProductSet_ (an array)
      // ✅ I can call .map() on it
      // ✅ Each item is a ProductSet (single row)
      // ✅ Only known fields are accessible
      
      productSet.map(p => {
        p.ProductId       // ✅ Field exists in schema
        p.unknown         // ❌ ERROR — not in schema, caught at compile time
      })
    })

    return super.init()
  }
}
```

<sub>**code by anubhav trainings**</sub>

### The Transformation

| Aspect | Before (String-based) | After (Generated Types) |
|--------|---------------------|------------------------|
| **Lookup** | `cds.entities('CDSService')` | `import { ProductSet } from '#cds-models/CDSService'` |
| **Type Info** | None — runtime untyped | Complete — compile-time checked |
| **Field Access** | `p.anything` — no validation | `p.ProductId` — only schema fields allowed |
| **Array vs Single** | Unclear without docs | Clear: `ProductSet_` for arrays, `ProductSet` for rows |
| **Typos** | Only caught at runtime | Caught at compile time ✅ |
| **IDE Intellisense** | Limited or none | Full autocomplete with field names & types |

---

## How This Enables Step 4: CDSService Migration

Once generated types exist, Step 4 becomes possible:

1. **Handlers use generated entity types** — `import { ProductSet, ProductSet_ } from '#cds-models/CDSService'`
2. **Service methods receive typed parameters** — `async (productSet: ProductSet_, req) => { ... }`
3. **Field access is type-checked** — `p.ProductId` is validated against the schema
4. **CAP's query API becomes typed** — `SELECT.from(ProductSet)` returns `ProductSet_` array
5. **Your utility functions work with typed data** — `flattenPayload(productSet)` receives a properly typed array

**Without generated types, none of this is possible.** Generated types are the foundation.

---

The `@cds-models/` folder is **regenerated** every time you run `cds-typer`, so add it to your `.gitignore`:

```gitignore
@cds-models/
node_modules/
dist/
```

<sub>**code by anubhav trainings**</sub>

This prevents committing auto-generated files. Teammates run `cds-typer "*"` locally after pulling.

---

## When to Re-generate

Re-run `cds-typer "*"` whenever you:

- ✅ Add a new entity to your `.cds` files
- ✅ Add fields to an existing entity
- ✅ Change field types
- ✅ Modify service definitions
- ✅ Pull changes that modified `.cds` files

**Pro tip:** Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "build:types": "cds-typer \"*\"",
    "build": "npm run build:types && cds build",
    "watch": "npm run build:types && cds watch"
  }
}
```

<sub>**code by anubhav trainings**</sub>

Now `npm run build` and `npm run watch` will regenerate types first.

---

## How This Connects to Your Migration

Once types are generated, you can:

1. **Step 1–2** — Set up TypeScript tooling (tsconfig, typescript, dev dependencies)
2. **Step 3** — Migrate utility files (`error-mapper.ts`, `payload-transformer.ts`)
3. **Step 4** — Migrate `CDSService.ts` **using the generated entity types**
4. **Step 5** — Migrate `CatalogService.ts` **using the generated action/function types**

<span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*The generated types are the bridge:*</span> they translate your data model into TypeScript so your service handlers can be fully type-safe.

---

## Next Steps

Once `cds-typer` has generated your types:

1. ✅ Verify `@cds-models/` folder exists
2. ✅ Check that it contains `.ts` and `.d.ts` files for your services
3. ✅ Start **Step 1** of the main migration guide

You're now ready to begin the CAP TypeScript journey with complete type safety!

---

<footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
<strong>code by anubhav trainings</strong> — CAP TypeScript Prelude: cds-typer Setup & Generated Types
</footer>
