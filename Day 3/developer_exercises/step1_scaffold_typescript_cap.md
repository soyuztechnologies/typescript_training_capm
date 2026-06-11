# Step 1 — Scaffold a TypeScript-First CAP Project

### Build the project skeleton, wire up every piece of tooling, and prove that BOTH local run and cloud deploy work — *before* writing a single line of business logic.

---

## 🧾 Cheat Sheet

| Task | Command |
|------|---------|
| Create project with TS | `cds init capm-s4-mashup --add typescript` |
| Add TS to existing project | `cds add typescript` |
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
<em>💡 <strong>Concept — tsconfig.json:</strong> this is the rule-book that tells the compiler what JavaScript version to emit (<code>target</code>), how modules are wired (<code>module</code>), where compiled files go (<code>outDir</code>), and how strict to be.</em>
</div>

Open `tsconfig.json` and use settings appropriate for a CAP project:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "gen/srv",
    "rootDir": ".",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "#cds-models/*": ["./@cds-models/*"]
    }
  },
  "include": ["srv", "@cds-models"],
  "exclude": ["node_modules", "gen"]
}
```

<sub>**code by anubhav trainings**</sub>

The three settings the exercise specifically asks about:

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*target: "es2022"*</span>

The JavaScript version emitted. The BTP Node.js runtime (18/20) supports ES2022 natively, so no down-level polyfills are needed.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*module: "commonjs"*</span>

CAP loads handlers with `require()` at runtime, which is CommonJS. Emitting `commonjs` keeps the compiled output 100% compatible with how `@sap/cds` loads files.

##### <span style="background-color: #c8e6c9; padding: 2px 6px; border-radius: 3px;">*outDir: "gen/srv"*</span>

Where compiled `.js` lands. We keep generated output in `gen/` so the source tree stays clean and `gen/` can be `.gitignore`d and rebuilt for deployment.

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

The `plant` field on `Material` is an **Association** — a foreign-key link to a `Plant` row. That is exactly what handler #2 ("the plant must exist") will check.

---

## 1.6 — Define the service

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

## 1.7 — Generate the model types

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

## 1.8 — Add a minimal typed handler (snippet by snippet)

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

## 1.9 — Handler #1: validate the material name

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

## 1.10 — Handler #2: the plant must exist before update

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

## 1.11 — Handler #3: max two plants per storage location

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

## 1.12 — Wire the tsc build step into `package.json`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — why compile for deploy:</strong> locally <code>ts-node</code> runs <code>.ts</code> on the fly. But Cloud Foundry should run plain, pre-compiled <code>.js</code> (faster startup, no dev tooling in production). So the build step runs <code>tsc</code> and the MTA build packs the compiled output.</em>
</div>

Add scripts to `package.json`:

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
📌 <strong>Note:</strong> <code>cds build --production</code> creates the deployable <code>gen/srv</code> and <code>gen/db</code> folders. Running <code>tsc</code> right after compiles your <code>.ts</code> handlers into that same output so Cloud Foundry runs pure JavaScript.
</div>

---

## 1.13 — Verify the FULL pipeline

### A) Local run

```bash
npx tsc --noEmit   # type-check, no output — must be clean
cds watch          # run locally with live reload
```

<sub>**code by anubhav trainings**</sub>

Test each rule at `http://localhost:4004`:

- Create a Material with a 10-char name → rejected (rule #1).
- Create a Material whose name starts with `7` → rejected (rule #1).
- Update a Material with a non-existent `plant_ID` → 404 (rule #2).
- Create a 3rd Plant in the same storage location → 409 (rule #3).

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

## 1.14 — Final, complete code

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
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "gen/srv",
    "rootDir": ".",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "#cds-models/*": ["./@cds-models/*"]
    }
  },
  "include": ["srv", "@cds-models"],
  "exclude": ["node_modules", "gen"]
}
```

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 1 checklist

- [ ] `cds init ... --add typescript` project created.
- [ ] `tsconfig.json` set with `target`, `module`, `outDir`.
- [ ] Material + Plant entities defined with `cuid` keys.
- [ ] Three typed handlers in `CatalogService.ts`.
- [ ] `npx tsc --noEmit` is clean.
- [ ] `cds watch` runs and rules fire correctly.
- [ ] `npm run build` produces compiled JS in `gen/srv`.
- [ ] `cf deploy` succeeds and `cf apps` shows the app running.

Continue to **`step2_s4hana_sdk_codegen.md`** to add the remote S/4HANA mashup.

<sub>**code by anubhav trainings**</sub>
