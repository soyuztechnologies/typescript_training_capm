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

<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; margin: 20px 0;">
  <!-- Title -->
  <text x="300" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#1a1a1a">
    CDS Model → Generated Types → Type-Safe Service Code
  </text>

  <!-- Step 1: CDS Model -->
  <rect x="50" y="70" width="140" height="80" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="4"/>
  <text x="120" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#1a1a1a">CDS Model</text>
  <text x="120" y="115" font-size="12" text-anchor="middle" fill="#424242">db/schema.cds</text>
  <text x="120" y="135" font-size="12" text-anchor="middle" fill="#424242">srv/**.cds</text>

  <!-- Arrow 1 -->
  <path d="M 190 110 L 230 110" stroke="#1976d2" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>

  <!-- Step 2: cds-typer -->
  <rect x="230" y="70" width="140" height="80" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="2" rx="4"/>
  <text x="300" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#1a1a1a">cds-typer</text>
  <text x="300" y="115" font-size="12" text-anchor="middle" fill="#424242">Code Generator</text>
  <text x="300" y="135" font-size="11" text-anchor="middle" fill="#666">npm install --save-dev</text>

  <!-- Arrow 2 -->
  <path d="M 370 110 L 410 110" stroke="#7b1fa2" stroke-width="3" fill="none" marker-end="url(#arrowhead2)"/>

  <!-- Step 3: Generated Types -->
  <rect x="410" y="70" width="140" height="80" fill="#e8f5e9" stroke="#388e3c" stroke-width="2" rx="4"/>
  <text x="480" y="95" font-size="14" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Generated Types</text>
  <text x="480" y="115" font-size="12" text-anchor="middle" fill="#424242">@cds-models/</text>
  <text x="480" y="135" font-size="11" text-anchor="middle" fill="#666">.ts & .d.ts files</text>

  <!-- Arrow 3 (down) -->
  <path d="M 480 150 L 480 190" stroke="#388e3c" stroke-width="3" fill="none" marker-end="url(#arrowhead3)"/>

  <!-- Step 4: Type-Safe Service Code -->
  <rect x="350" y="190" width="260" height="120" fill="#fff3e0" stroke="#f57c00" stroke-width="2" rx="4"/>
  <text x="480" y="220" font-size="14" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Type-Safe Service Code</text>
  
  <!-- Step 4a -->
  <rect x="370" y="240" width="100" height="50" fill="#fce4ec" stroke="#c2185b" stroke-width="1" rx="3"/>
  <text x="420" y="260" font-size="11" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Step 1–2</text>
  <text x="420" y="275" font-size="10" text-anchor="middle" fill="#666">Setup & Utils</text>

  <!-- Step 4b -->
  <rect x="490" y="240" width="100" height="50" fill="#e0f2f1" stroke="#00897b" stroke-width="1" rx="3"/>
  <text x="540" y="260" font-size="11" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Step 3</text>
  <text x="540" y="275" font-size="10" text-anchor="middle" fill="#666">Utility Handlers</text>

  <!-- Step 4c -->
  <rect x="370" y="310" width="100" height="50" fill="#ede7f6" stroke="#512da8" stroke-width="1" rx="3"/>
  <text x="420" y="330" font-size="11" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Step 4</text>
  <text x="420" y="345" font-size="10" text-anchor="middle" fill="#666">CDSService</text>

  <!-- Step 4d -->
  <rect x="490" y="310" width="100" height="50" fill="#f1f8e9" stroke="#689f38" stroke-width="1" rx="3"/>
  <text x="540" y="330" font-size="11" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Step 5</text>
  <text x="540" y="345" font-size="10" text-anchor="middle" fill="#666">CatalogService</text>

  <!-- Arrow definitions -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#1976d2"/>
    </marker>
    <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#7b1fa2"/>
    </marker>
    <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#388e3c"/>
    </marker>
  </defs>

  <!-- Bottom note -->
  <text x="300" y="420" font-size="13" text-anchor="middle" fill="#555" font-style="italic">
    Generated types feed into every CAP TypeScript migration step
  </text>
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
