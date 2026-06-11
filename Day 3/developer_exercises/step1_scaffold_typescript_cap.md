# Step 1 — Scaffold a TypeScript-First CAP Project

### Build the project skeleton, wire up every piece of tooling, and prove that BOTH local run and cloud deploy work — *before* writing a single line of business logic.

---

## 🧾 Cheat Sheet

| Task | Command |
|------|---------|
| Create project with TS | `cds init capm-s4-mashup --add typescript` |
| Add TS to existing project | `cds add typescript` |
| Generate seed-data CSVs | `cds add data` |
| Install CAP types | `npm i -D @cap-js/cds-types typescript ts-node` |
| Run locally (typed) | `cds watch` |
| Type-check only | `npx tsc --noEmit` |
| Compile to JS | `npx tsc` |
| Build for deploy | `npm run build` |
| Login to Cloud Foundry | `cf login -a <api-endpoint>` |
| Deploy | `cf push` (or `mbt build` + `cf deploy`) |
| Watch logs | `cf logs capm-s4-mashup --recent` |

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 The golden rule of this step: <strong>get the pipeline green first</strong>. A project that runs locally but cannot deploy (or vice-versa) will waste hours later. We prove both ends work with an almost-empty app, then add logic.</em>
</div>

---

## 1.1 — What we are about to build

Two database tables and one service with three rules:

- **Material** — `materialName`, `materialType`, `baseUnit`, `plant` (+ a `cuid` key).
- **Plant** — `plantName`, `storageLocation`, `country`, `city` (+ a `cuid` key).

Three handlers in `CatalogService.ts`:

1. **Before CREATE Material** → name must be exactly 40 chars and not start with a digit.
2. **Before UPDATE Material** → the referenced Plant must exist.
3. **Before CREATE Plant** → at most 2 Plants per storage location.

---

## 1.2 — Scaffold the project

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `cds init`:</strong> this is SAP's official project generator (part of <code>@sap/cds-dk</code>). The <code>--add typescript</code> flag means "set me up for TypeScript from the very first second", instead of converting a JavaScript project later.</em>
</div>

First make sure the developer kit is installed globally:

```bash
npm install -g @sap/cds-dk
cds --version
```

<sub>**code by anubhav trainings**</sub>

Now create the project:

```bash
cds init capm-s4-mashup --add typescript
cd capm-s4-mashup
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If you already created a plain JS project, do <strong>not</strong> recreate it. Just run <code>cds add typescript</code> inside it — that single command adds the <code>tsconfig.json</code>, installs <code>typescript</code> + <code>@cap-js/cds-types</code>, and rewrites the npm scripts.
</div>

After scaffolding you get this layout:

```text
capm-s4-mashup/
├── app/                # UI (empty for now)
├── db/                 # data model (.cds)
├── srv/                # services (.cds + .ts handlers)
├── package.json
├── tsconfig.json
└── .gitignore
```

<sub>**code by anubhav trainings**</sub>

---

## 1.3 — Install and understand the tooling

```bash
npm install -D typescript @cap-js/cds-types ts-node @types/node
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 Think of these four packages as a <strong>toolbelt</strong>: the compiler, the CAP type "dictionary", the local runner, and Node's own types.</em>
</div>

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*typescript*</span>

The compiler `tsc`. Turns `.ts` into `.js` and checks types. Always a **devDependency** — production runs the compiled JS.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*@cap-js/cds-types*</span>

The official, richer type definitions for `@sap/cds`. This is what makes `cds.connect`, `SELECT.from`, and `this.before(...)` fully typed instead of `any`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*ts-node*</span>

Runs `.ts` files directly without a separate compile step — perfect for local development with `cds watch`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*@types/node*</span>

Types for Node built-ins (`process`, `path`, `Buffer`). Needed so TypeScript understands the runtime around CAP.

---

## 1.4 — Configure `tsconfig.json`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — tsconfig.json:</strong> this is the rule-book that tells the compiler what JavaScript version to emit (<code>target</code>), how modules are wired (<code>module</code> / <code>moduleResolution</code>), and how strict to be. When you run <code>cds add typescript</code>, CAP generates this file for you — below is exactly what it produces.</em>
</div>

This is the `tsconfig.json` generated by `cds add typescript` — use it as-is:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noEmit": true,
    "allowJs": true,
    "paths": {
      "@sap/cds": [
        "./node_modules/@cap-js/cds-types"
      ],
      "#cds-models/*": [
        "./@cds-models/*"
      ]
    }
  },
  "exclude": [
    "node_modules",
    "gen",
    "eslint.config.mjs"
  ]
}
```

<sub>**code by anubhav trainings**</sub>

Let us read every setting, including the three the exercise asks about (`target`, `module`, and where output goes):

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*target: "ESNext"*</span>

The JavaScript version emitted. `"ESNext"` means "use the latest JS features, no down-leveling". The BTP Node.js runtime (18/20) supports them natively, so no polyfills are needed.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*module: "NodeNext"*</span>

The output module format. `"NodeNext"` follows modern Node.js rules and supports **both** CommonJS (`require`) and ES Modules (`import`) — Node decides per file based on extension and `package.json`. This is what lets CAP load your handlers correctly whichever style you write.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*moduleResolution: "NodeNext"*</span>

How TypeScript **finds** the modules you import. It must match `module`. `"NodeNext"` reads each package's `package.json` "exports" field and understands `.js`/`.mjs`/`.cjs` — required for `@sap/cds` and CAP packages to resolve correctly.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*noEmit: true (and no outDir)*</span>

`tsc` here is used **only to type-check**, not to produce `.js` — that is what `"noEmit": true` means. Locally `cds watch` runs your `.ts` directly (via `tsx`/`ts-node`), and for deployment `cds build --production` produces the deployable output. So TypeScript guards correctness while CAP owns the build — there is no `outDir` because `tsc` emits nothing.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*exclude*</span>

Keeps the type-checker focused on your source: it skips `node_modules`, the generated `gen/` build output, and the flat ESLint config (`eslint.config.mjs`).

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*allowJs: true*</span>

Lets TypeScript also process plain `.js` files. Important in CAP, where generated files and legacy handlers may still be JavaScript sitting next to your `.ts`.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*paths — the @sap/cds redirect*</span>

`"@sap/cds": ["./node_modules/@cap-js/cds-types"]` quietly redirects every `import cds from '@sap/cds'` to the richer `@cap-js/cds-types` definitions — same import line, far better types, zero code change. And `"#cds-models/*"` points at the auto-generated entity types (section 1.8).

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>"strict": true</code> turns on all of TypeScript's safety checks at once. Keep it on. It is the single biggest reason to use TypeScript in CAP — it forces you to handle <code>null</code> / <code>undefined</code> from the database explicitly.
</div>

---

## 1.5 — Define the data model

Create `db/schema.cds`:

```cds
using { cuid, managed } from '@sap/cds/common';

namespace anubhav.trainings;

entity Material : cuid, managed {
  materialName : String(40);
  materialType : String(20);
  baseUnit     : String(3);
  plant        : Association to Plant;
}

entity Plant : cuid, managed {
  plantName       : String(40);
  storageLocation : String(10);
  country         : String(3);
  city            : String(40);
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `cuid`:</strong> an aspect from <code>@sap/cds/common</code> that adds a <code>key ID : UUID</code> field. So each entity has its 4 business fields <strong>plus</strong> an auto-generated unique ID — we never have to invent primary keys ourselves.</em>
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the Material → Plant association:</strong> an <strong>Association</strong> is a typed link between two entities, just like a foreign key joins two tables. <code>Material.plant</code> ("each material belongs to one plant") is stored in the database as a column <code>plant_ID</code>. That single column is enough for our use case — a Material points to exactly one Plant.</em>
</div>

This `plant_ID` column is exactly what handler #2 ("the plant must exist") will check, and it is what our seed data in the next section fills in.

---

## 1.6 — Generate sample data with `cds add data`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — seed data:</strong> an empty database is hard to test. <code>cds add data</code> creates empty <strong>CSV template files</strong> — one per entity, with the column headers already filled in from your model. You then paste rows into them, and CAP automatically loads those rows into the database every time it deploys (locally to SQLite, or to HANA in the cloud).</em>
</div>

Run the command:

```bash
cds add data
```

<sub>**code by anubhav trainings**</sub>

This creates a `db/data/` folder with one CSV per entity, named `namespace-Entity.csv`:

```text
db/
└── data/
    ├── anubhav.trainings-Material.csv
    └── anubhav.trainings-Plant.csv
```

<sub>**code by anubhav trainings**</sub>

### Fill the Plant CSV — 10 plants

Open `db/data/anubhav.trainings-Plant.csv` and add **10** rows. We deliberately keep **at most 2 plants per `storageLocation`** so the seed data already respects handler #3's rule:

```csv
ID;plantName;storageLocation;country;city
a1000000-0000-0000-0000-000000000001;Mumbai Manufacturing Plant;SL001;IN;Mumbai
a1000000-0000-0000-0000-000000000002;Pune Assembly Plant;SL001;IN;Pune
a1000000-0000-0000-0000-000000000003;Berlin Production Plant;SL002;DE;Berlin
a1000000-0000-0000-0000-000000000004;Munich Components Plant;SL002;DE;Munich
a1000000-0000-0000-0000-000000000005;Chicago Distribution Plant;SL003;US;Chicago
a1000000-0000-0000-0000-000000000006;Dallas Warehouse Plant;SL003;US;Dallas
a1000000-0000-0000-0000-000000000007;Tokyo Electronics Plant;SL004;JP;Tokyo
a1000000-0000-0000-0000-000000000008;Osaka Robotics Plant;SL004;JP;Osaka
a1000000-0000-0000-0000-000000000009;Paris Packaging Plant;SL005;FR;Paris
a1000000-0000-0000-0000-000000000010;Lyon Logistics Plant;SL005;FR;Lyon
```

<sub>**code by anubhav trainings**</sub>

### Fill the Material CSV — 20 materials

Open `db/data/anubhav.trainings-Material.csv` and add **20** rows. Note the last column is **`plant_ID`** — the foreign key from the association — and each value matches one of the Plant `ID`s above:

```csv
ID;materialName;materialType;baseUnit;plant_ID
b2000000-0000-0000-0000-000000000001;Steel Rod 12mm;RAW;PC;a1000000-0000-0000-0000-000000000001
b2000000-0000-0000-0000-000000000002;Copper Wire Spool;RAW;M;a1000000-0000-0000-0000-000000000002
b2000000-0000-0000-0000-000000000003;Aluminium Sheet;RAW;KG;a1000000-0000-0000-0000-000000000003
b2000000-0000-0000-0000-000000000004;Plastic Granules;RAW;KG;a1000000-0000-0000-0000-000000000004
b2000000-0000-0000-0000-000000000005;Rubber Gasket;SEMI;PC;a1000000-0000-0000-0000-000000000005
b2000000-0000-0000-0000-000000000006;Circuit Board;SEMI;PC;a1000000-0000-0000-0000-000000000006
b2000000-0000-0000-0000-000000000007;Electric Motor;FIN;PC;a1000000-0000-0000-0000-000000000007
b2000000-0000-0000-0000-000000000008;Gear Box Unit;FIN;PC;a1000000-0000-0000-0000-000000000008
b2000000-0000-0000-0000-000000000009;Hydraulic Pump;FIN;PC;a1000000-0000-0000-0000-000000000009
b2000000-0000-0000-0000-000000000010;Control Valve;FIN;PC;a1000000-0000-0000-0000-000000000010
b2000000-0000-0000-0000-000000000011;Bearing 6204;SPARE;PC;a1000000-0000-0000-0000-000000000001
b2000000-0000-0000-0000-000000000012;Drive Belt;SPARE;PC;a1000000-0000-0000-0000-000000000002
b2000000-0000-0000-0000-000000000013;Cooling Fan;SPARE;PC;a1000000-0000-0000-0000-000000000003
b2000000-0000-0000-0000-000000000014;Power Supply Unit;SEMI;PC;a1000000-0000-0000-0000-000000000004
b2000000-0000-0000-0000-000000000015;Sensor Module;SEMI;PC;a1000000-0000-0000-0000-000000000005
b2000000-0000-0000-0000-000000000016;LED Panel;FIN;PC;a1000000-0000-0000-0000-000000000006
b2000000-0000-0000-0000-000000000017;Battery Pack;FIN;PC;a1000000-0000-0000-0000-000000000007
b2000000-0000-0000-0000-000000000018;Cable Harness;SEMI;M;a1000000-0000-0000-0000-000000000008
b2000000-0000-0000-0000-000000000019;Mounting Bracket;RAW;PC;a1000000-0000-0000-0000-000000000009
b2000000-0000-0000-0000-000000000020;Touch Display;FIN;PC;a1000000-0000-0000-0000-000000000010
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — CSV rules:</strong> CAP CSV files use a <strong>semicolon</strong> (<code>;</code>) separator, the first line is the header, and the column for an association is the foreign key <code>plant_ID</code> (association name + <code>_ID</code>). Every <code>plant_ID</code> must exist in the Plant file or the load fails.
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — seed data skips handlers:</strong> rows loaded from CSV go <strong>straight into the database</strong> and do <strong>not</strong> pass through your <code>before</code> handlers. That is why these material names are short and readable even though handler #1 will later demand 40-character names for data created <em>through the API</em>.
</div>

When you next run `cds watch`, CAP loads all 10 plants and 20 materials automatically. You will see a log line like `> filling anubhav.trainings.Material from db/data/...csv`.

---

## 1.7 — Define the service

Create `srv/CatalogService.cds`:

```cds
using { anubhav.trainings as db } from '../db/schema';

service CatalogService {
  entity Materials as projection on db.Material;
  entity Plants    as projection on db.Plant;
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — projection:</strong> a service entity is a "window" onto a database entity. <code>Materials</code> is the public, API-facing name; <code>db.Material</code> is the private table. Handlers attach to the service names.</em>
</div>

---

## 1.8 — Generate the model types

Run the typer once so TypeScript knows the shape of your entities:

```bash
npx cds-typer "*"
```

<sub>**code by anubhav trainings**</sub>

This creates a `@cds-models/` folder. Now `Material` and `Plant` are importable, fully typed interfaces — generated **from** the `.cds` file, so they can never drift out of sync.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>cds watch</code> runs the typer automatically on every change. You only run it by hand the first time, or in CI before <code>tsc</code>.
</div>

---

## 1.9 — Add a minimal typed handler (snippet by snippet)

We will build `srv/CatalogService.ts` one piece at a time. Start with the skeleton and verify it runs, *then* add the three rules.

### Snippet 1 — the class skeleton

```typescript
import cds from '@sap/cds';

export class CatalogService extends cds.ApplicationService {
  async init(): Promise<void> {
    // handlers will be registered here
    return super.init();
  }
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
const cds = require('@sap/cds');

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {
    // handlers will be registered here
    return super.init();
  }
};
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — class-based service:</strong> we extend <code>cds.ApplicationService</code> and put all registrations inside <code>init()</code>. The TS version <code>export class</code> + the JS version <code>module.exports = class</code> do the same thing — CAP just needs a class it can instantiate.</em>
</div>

### Snippet 2 — import the generated types

```typescript
import cds from '@sap/cds';
import { Material, Plant } from '#cds-models/CatalogService';
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>#cds-models/...</code> is a path alias defined in <code>tsconfig.json</code> (section 1.4). It points at the auto-generated <code>@cds-models</code> folder. JavaScript has no equivalent — this typing is exactly what we gain by moving to TypeScript.
</div>

### Snippet 3 — register an empty handler and run

```typescript
async init(): Promise<void> {
  this.before('CREATE', 'Materials', (req) => {
    console.log('A Material is about to be created');
  });
  return super.init();
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
async init() {
  this.before('CREATE', 'Materials', (req) => {
    console.log('A Material is about to be created');
  });
  return super.init();
}
```

</div>

<sub>**code by anubhav trainings**</sub>

Now verify the app runs:

```bash
cds watch
```

<sub>**code by anubhav trainings**</sub>

Open `http://localhost:4004`, create a Material, and watch the log line print. If you see it, **the TypeScript pipeline works**. Now we add real logic.

---

## 1.10 — Handler #1: validate the material name

> **Rule:** before CREATE, `materialName` must be exactly 40 characters and must not start with a digit.

```typescript
private validateMaterialName = (req: cds.Request): void => {
  const { materialName } = req.data as Material;

  if (!materialName || materialName.length !== 40) {
    req.reject(400, 'Material name must be exactly 40 characters long.');
    return;
  }
  if (/^[0-9]/.test(materialName)) {
    req.reject(400, 'Material name must not start with a number.');
  }
};
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
validateMaterialName = (req) => {
  const { materialName } = req.data;

  if (!materialName || materialName.length !== 40) {
    req.reject(400, 'Material name must be exactly 40 characters long.');
    return;
  }
  if (/^[0-9]/.test(materialName)) {
    req.reject(400, 'Material name must not start with a number.');
  }
};
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `req.reject`:</strong> calling reject stops the request, rolls back, and returns an HTTP error (here 400 = Bad Request). The regex <code>/^[0-9]/</code> means "starts with a digit"; <code>.test()</code> returns true/false.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> In TypeScript we annotate <code>req: cds.Request</code> and cast <code>req.data as Material</code>. This is what lets the editor autocomplete <code>materialName</code> and catch a typo like <code>materilName</code> immediately.
</div>

---

## 1.11 — Handler #2: the plant must exist before update

> **Rule:** before UPDATE Material, the referenced Plant must already exist in the database.

```typescript
private checkPlantExists = async (req: cds.Request): Promise<void> => {
  const data = req.data as Material;
  const plantId = data.plant_ID;

  if (!plantId) return; // plant not being changed — nothing to check

  const found = await SELECT.one.from(Plant).where({ ID: plantId });
  if (!found) {
    req.reject(404, `Plant ${plantId} does not exist.`);
  }
};
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
checkPlantExists = async (req) => {
  const plantId = req.data.plant_ID;

  if (!plantId) return; // plant not being changed — nothing to check

  const found = await SELECT.one.from('CatalogService.Plants').where({ ID: plantId });
  if (!found) {
    req.reject(404, `Plant ${plantId} does not exist.`);
  }
};
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — Association = `_ID` column:</strong> the <code>plant</code> association is stored in the database as a foreign-key column <code>plant_ID</code>. So in the handler we read <code>req.data.plant_ID</code> and look up that Plant. <code>SELECT.one</code> returns the row or <code>undefined</code>.</em>
</div>

---

## 1.12 — Handler #3: max two plants per storage location

> **Rule:** before CREATE Plant, refuse if 2 plants already share the same storage location.

```typescript
private checkStorageLocationLimit = async (req: cds.Request): Promise<void> => {
  const { storageLocation } = req.data as Plant;
  if (!storageLocation) return;

  const existing = await SELECT.from(Plant).where({ storageLocation });
  if (existing.length >= 2) {
    req.reject(
      409,
      `Storage location ${storageLocation} already has 2 plants. No more allowed.`
    );
  }
};
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
checkStorageLocationLimit = async (req) => {
  const { storageLocation } = req.data;
  if (!storageLocation) return;

  const existing = await SELECT.from('CatalogService.Plants').where({ storageLocation });
  if (existing.length >= 2) {
    req.reject(
      409,
      `Storage location ${storageLocation} already has 2 plants. No more allowed.`
    );
  }
};
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — counting rows:</strong> we read all plants with the same <code>storageLocation</code> and check <code>length >= 2</code>. HTTP 409 = "Conflict", the right status when a request clashes with existing data.</em>
</div>

---

## 1.13 — Wire the tsc build step into `package.json`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — build = transpile + type-check:</strong> locally CAP runs <code>.ts</code> on the fly. For deployment, <code>cds build --production</code> transpiles the project into <code>gen/</code>, and the <code>tsc</code> step (remember: <code>noEmit</code>) acts as a <strong>type-check gate</strong> — if the types do not compile, the build fails before anything ships.</em>
</div>

Add scripts to `package.json` (exactly as the project uses them):

```json
{
  "scripts": {
    "start": "cds-serve",
    "watch": "cds watch",
    "build:ts": "tsc",
    "build": "cds build --production && tsc",
    "test": "npx jest"
  }
}
```

<sub>**code by anubhav trainings**</sub>

To make Cloud Foundry start the **compiled** service, point the start command at the generated JS. In `package.json`:

```json
{
  "cds": {
    "requires": {
      "db": { "kind": "sql" }
    }
  }
}
```

<sub>**code by anubhav trainings**</sub>

Add an `mta.yaml` so the MTA build invokes `npm run build` (which now includes `tsc`):

```yaml
ID: capm-s4-mashup
_schema-version: '3.1'
version: 1.0.0

modules:
  - name: capm-s4-mashup-srv
    type: nodejs
    path: gen/srv
    parameters:
      buildpack: nodejs_buildpack
    build-parameters:
      builder: npm
      build-result: .
    requires:
      - name: capm-s4-mashup-db

resources:
  - name: capm-s4-mashup-db
    type: org.cloudfoundry.managed-service
    parameters:
      service: hana
      service-plan: hdi-shared
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>cds build --production</code> creates the deployable <code>gen/srv</code> and <code>gen/db</code> folders (it transpiles your TypeScript as part of the build). The following <code>&amp;&amp; tsc</code> does <strong>not</strong> emit anything (<code>noEmit</code>) — it just type-checks, so a type error stops the deploy early.
</div>

---

## 1.14 — Verify the FULL pipeline

### A) Local run

```bash
npx tsc --noEmit   # type-check, no output — must be clean
cds watch          # run locally with live reload
```

<sub>**code by anubhav trainings**</sub>

First confirm the **seed data loaded**: open `http://localhost:4004`, then check `Plants` shows 10 rows and `Materials` shows 20 rows. The CAP log should print `> filling anubhav.trainings.Plant from ...` and the same for Material.

Now test each rule at `http://localhost:4004`:

- Create a Material with a 10-char name → rejected (rule #1).
- Create a Material whose name starts with `7` → rejected (rule #1).
- Update a Material with a non-existent `plant_ID` → 404 (rule #2).
- Create a 3rd Plant in the same storage location (e.g. another `SL001`) → 409 (rule #3).

### B) Cloud deploy

```bash
npm install -g mbt
mbt build                       # produces mta_archives/*.mtar
cf login -a <your-api-endpoint>
cf deploy mta_archives/capm-s4-mashup_1.0.0.mtar
```

<sub>**code by anubhav trainings**</sub>

Confirm it is running:

```bash
cf apps
cf logs capm-s4-mashup-srv --recent
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If <code>cf deploy</code> fails but <code>cds watch</code> worked, 9 times out of 10 the cause is the build step — the compiled JS was not in <code>gen/srv</code>. Re-run <code>npm run build</code> and confirm <code>gen/srv/srv/CatalogService.js</code> exists before <code>mbt build</code>.
</div>

---

## 1.15 — Final, complete code

### `db/schema.cds`

```cds
using { cuid, managed } from '@sap/cds/common';

namespace anubhav.trainings;

entity Material : cuid, managed {
  materialName : String(40);
  materialType : String(20);
  baseUnit     : String(3);
  plant        : Association to Plant;
}

entity Plant : cuid, managed {
  plantName       : String(40);
  storageLocation : String(10);
  country         : String(3);
  city            : String(40);
}
```

<sub>**code by anubhav trainings**</sub>

### `db/data/anubhav.trainings-Plant.csv` (10 plants)

```csv
ID;plantName;storageLocation;country;city
a1000000-0000-0000-0000-000000000001;Mumbai Manufacturing Plant;SL001;IN;Mumbai
a1000000-0000-0000-0000-000000000002;Pune Assembly Plant;SL001;IN;Pune
a1000000-0000-0000-0000-000000000003;Berlin Production Plant;SL002;DE;Berlin
a1000000-0000-0000-0000-000000000004;Munich Components Plant;SL002;DE;Munich
a1000000-0000-0000-0000-000000000005;Chicago Distribution Plant;SL003;US;Chicago
a1000000-0000-0000-0000-000000000006;Dallas Warehouse Plant;SL003;US;Dallas
a1000000-0000-0000-0000-000000000007;Tokyo Electronics Plant;SL004;JP;Tokyo
a1000000-0000-0000-0000-000000000008;Osaka Robotics Plant;SL004;JP;Osaka
a1000000-0000-0000-0000-000000000009;Paris Packaging Plant;SL005;FR;Paris
a1000000-0000-0000-0000-000000000010;Lyon Logistics Plant;SL005;FR;Lyon
```

<sub>**code by anubhav trainings**</sub>

### `db/data/anubhav.trainings-Material.csv` (20 materials)

```csv
ID;materialName;materialType;baseUnit;plant_ID
b2000000-0000-0000-0000-000000000001;Steel Rod 12mm;RAW;PC;a1000000-0000-0000-0000-000000000001
b2000000-0000-0000-0000-000000000002;Copper Wire Spool;RAW;M;a1000000-0000-0000-0000-000000000002
b2000000-0000-0000-0000-000000000003;Aluminium Sheet;RAW;KG;a1000000-0000-0000-0000-000000000003
b2000000-0000-0000-0000-000000000004;Plastic Granules;RAW;KG;a1000000-0000-0000-0000-000000000004
b2000000-0000-0000-0000-000000000005;Rubber Gasket;SEMI;PC;a1000000-0000-0000-0000-000000000005
b2000000-0000-0000-0000-000000000006;Circuit Board;SEMI;PC;a1000000-0000-0000-0000-000000000006
b2000000-0000-0000-0000-000000000007;Electric Motor;FIN;PC;a1000000-0000-0000-0000-000000000007
b2000000-0000-0000-0000-000000000008;Gear Box Unit;FIN;PC;a1000000-0000-0000-0000-000000000008
b2000000-0000-0000-0000-000000000009;Hydraulic Pump;FIN;PC;a1000000-0000-0000-0000-000000000009
b2000000-0000-0000-0000-000000000010;Control Valve;FIN;PC;a1000000-0000-0000-0000-000000000010
b2000000-0000-0000-0000-000000000011;Bearing 6204;SPARE;PC;a1000000-0000-0000-0000-000000000001
b2000000-0000-0000-0000-000000000012;Drive Belt;SPARE;PC;a1000000-0000-0000-0000-000000000002
b2000000-0000-0000-0000-000000000013;Cooling Fan;SPARE;PC;a1000000-0000-0000-0000-000000000003
b2000000-0000-0000-0000-000000000014;Power Supply Unit;SEMI;PC;a1000000-0000-0000-0000-000000000004
b2000000-0000-0000-0000-000000000015;Sensor Module;SEMI;PC;a1000000-0000-0000-0000-000000000005
b2000000-0000-0000-0000-000000000016;LED Panel;FIN;PC;a1000000-0000-0000-0000-000000000006
b2000000-0000-0000-0000-000000000017;Battery Pack;FIN;PC;a1000000-0000-0000-0000-000000000007
b2000000-0000-0000-0000-000000000018;Cable Harness;SEMI;M;a1000000-0000-0000-0000-000000000008
b2000000-0000-0000-0000-000000000019;Mounting Bracket;RAW;PC;a1000000-0000-0000-0000-000000000009
b2000000-0000-0000-0000-000000000020;Touch Display;FIN;PC;a1000000-0000-0000-0000-000000000010
```

<sub>**code by anubhav trainings**</sub>

### `srv/CatalogService.cds`

```cds
using { anubhav.trainings as db } from '../db/schema';

service CatalogService {
  entity Materials as projection on db.Material;
  entity Plants    as projection on db.Plant;
}
```

<sub>**code by anubhav trainings**</sub>

### `srv/CatalogService.ts` (the final TypeScript handler)

```typescript
import cds from '@sap/cds';
import { Material, Plant } from '#cds-models/CatalogService';

export class CatalogService extends cds.ApplicationService {
  async init(): Promise<void> {
    this.before('CREATE', 'Materials', this.validateMaterialName);
    this.before('UPDATE', 'Materials', this.checkPlantExists);
    this.before('CREATE', 'Plants', this.checkStorageLocationLimit);
    return super.init();
  }

  // Rule 1: name exactly 40 chars and not starting with a digit
  private validateMaterialName = (req: cds.Request): void => {
    const { materialName } = req.data as Material;

    if (!materialName || materialName.length !== 40) {
      req.reject(400, 'Material name must be exactly 40 characters long.');
      return;
    }
    if (/^[0-9]/.test(materialName)) {
      req.reject(400, 'Material name must not start with a number.');
    }
  };

  // Rule 2: referenced Plant must exist before updating a Material
  private checkPlantExists = async (req: cds.Request): Promise<void> => {
    const data = req.data as Material;
    const plantId = data.plant_ID;
    if (!plantId) return;

    const found = await SELECT.one.from(Plant).where({ ID: plantId });
    if (!found) {
      req.reject(404, `Plant ${plantId} does not exist.`);
    }
  };

  // Rule 3: at most 2 Plants per storage location
  private checkStorageLocationLimit = async (req: cds.Request): Promise<void> => {
    const { storageLocation } = req.data as Plant;
    if (!storageLocation) return;

    const existing = await SELECT.from(Plant).where({ storageLocation });
    if (existing.length >= 2) {
      req.reject(
        409,
        `Storage location ${storageLocation} already has 2 plants. No more allowed.`
      );
    }
  };
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent — `srv/CatalogService.js`</strong></sub>

```javascript
const cds = require('@sap/cds');

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {
    this.before('CREATE', 'Materials', this.validateMaterialName);
    this.before('UPDATE', 'Materials', this.checkPlantExists);
    this.before('CREATE', 'Plants', this.checkStorageLocationLimit);
    return super.init();
  }

  // Rule 1: name exactly 40 chars and not starting with a digit
  validateMaterialName = (req) => {
    const { materialName } = req.data;
    if (!materialName || materialName.length !== 40) {
      req.reject(400, 'Material name must be exactly 40 characters long.');
      return;
    }
    if (/^[0-9]/.test(materialName)) {
      req.reject(400, 'Material name must not start with a number.');
    }
  };

  // Rule 2: referenced Plant must exist before updating a Material
  checkPlantExists = async (req) => {
    const plantId = req.data.plant_ID;
    if (!plantId) return;
    const found = await SELECT.one.from('CatalogService.Plants').where({ ID: plantId });
    if (!found) {
      req.reject(404, `Plant ${plantId} does not exist.`);
    }
  };

  // Rule 3: at most 2 Plants per storage location
  checkStorageLocationLimit = async (req) => {
    const { storageLocation } = req.data;
    if (!storageLocation) return;
    const existing = await SELECT.from('CatalogService.Plants').where({ storageLocation });
    if (existing.length >= 2) {
      req.reject(
        409,
        `Storage location ${storageLocation} already has 2 plants. No more allowed.`
      );
    }
  };
};
```

</div>

<sub>**code by anubhav trainings**</sub>

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noEmit": true,
    "allowJs": true,
    "paths": {
      "@sap/cds": [
        "./node_modules/@cap-js/cds-types"
      ],
      "#cds-models/*": [
        "./@cds-models/*"
      ]
    }
  },
  "exclude": [
    "node_modules",
    "gen",
    "eslint.config.mjs"
  ]
}
```

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 1 checklist

- [ ] `cds init ... --add typescript` project created.
- [ ] `tsconfig.json` generated by `cds add typescript` (`target: ESNext`, `module/moduleResolution: NodeNext`).
- [ ] Material + Plant entities defined with `cuid` keys and a Material → Plant association.
- [ ] `cds add data` run; `db/data` filled with 10 plants and 20 materials.
- [ ] `cds watch` log shows the CSVs loaded (10 Plants, 20 Materials visible at `/odata/v4/catalog`).
- [ ] Three typed handlers in `CatalogService.ts`.
- [ ] `npx tsc --noEmit` is clean.
- [ ] `cds watch` runs and rules fire correctly.
- [ ] `npm run build` produces compiled JS in `gen/srv`.
- [ ] `cf deploy` succeeds and `cf apps` shows the app running.

Continue to **`step2_s4hana_sdk_codegen.md`** to add the remote S/4HANA mashup.

<sub>**code by anubhav trainings**</sub>
