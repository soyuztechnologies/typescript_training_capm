# Step 2 — Generate Typed S/4HANA Client with the Cloud SDK

### Stop hand-writing TypeScript interfaces for SAP entities. Instead, point the SAP Cloud SDK generator at a service's EDMX metadata and let it produce typed API classes for you.

---

## 🧾 Cheat Sheet

| Task | Command / Value |
|------|-----------------|
| Remote service URL | `http://122.162.240.164:8010/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrder` |
| EDMX source | SAP Business Accelerator Hub → API → *Details* → Download specification (EDMX) |
| Install generator | `npm i -D @sap-cloud-sdk/generator` |
| Install OData V4 runtime | `npm i @sap-cloud-sdk/odata-v4` |
| Put EDMX here | `srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx` |
| Fix EDMX version | edit first line: `Version="4.01"` → `Version="4.0"` |
| Register service in CAP | `cds import srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx --as cds` |
| Generate client | `npx generate-odata-client --input srv/external --outputDir srv/src/generated --skipValidation` |
| Secrets live in | `.env` (git-ignored, host+port only) |

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>The big idea of Step 2:</strong> an SAP OData service publishes a machine-readable description of itself called <strong>EDMX</strong> (its "blueprint"). The Cloud SDK generator reads that blueprint and writes ready-to-use, fully typed TypeScript classes — one per entity, with methods for GET, POST, filter, etc.</em>
</div>

---

## 2.1 — The remote service we will consume

We connect to the S/4HANA **Sales Order** OData service:

```text
http://122.162.240.164:8010/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrder
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — OData V4:</strong> the URL above contains <code>odata4</code>, so this is an <strong>OData V4</strong> service. Everything in this guide uses <strong>V4</strong>: we install <code>@sap-cloud-sdk/odata-v4</code>, the generated client targets V4, dates are ISO strings, and child entities use V4 navigation (no <code>results</code> wrapper). The generator reads the EDMX and automatically emits V4-flavoured code.
</div>

---

## 2.2 — Keep secrets out of code with `.env`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — environment variables:</strong> a URL is harmless, but the username and password are secrets. We never type secrets into source code (they would end up on GitHub). Instead we put them in a <code>.env</code> file that is listed in <code>.gitignore</code>, and read them at runtime.</em>
</div>

Create `.env` in the project root:

```bash
# --- S/4HANA Sales Order service ---
# S4_URL is the HOST and PORT only — no service path.
S4_URL=http://122.162.240.164:8010
S4_USERNAME=YOUR_S4_USER
S4_PASSWORD=YOUR_S4_PASSWORD
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — host only, no path:</strong> <code>S4_URL</code> holds <strong>only</strong> the host and port (<code>http://122.162.240.164:8010</code>). The long service path (<code>/sap/opu/odata4/sap/api_salesorder/.../0001</code>) does <strong>not</strong> belong here — it comes from the imported service definition (<code>cds import</code>, section 2.4) and from the BTP Destination (Step 4). Keeping host and path separate is what lets the same credentials serve many paths on the same system.
</div>

Add it to `.gitignore`:

```bash
# secrets — never commit
.env
```

<sub>**code by anubhav trainings**</sub>

Install the loader so Node reads `.env` automatically:

```bash
npm install dotenv
```

<sub>**code by anubhav trainings**</sub>

A tiny snippet to read those values (we expand this in Step 3):

```typescript
import 'dotenv/config';

const s4Config = {
  url: process.env.S4_URL ?? '',
  username: process.env.S4_USERNAME ?? '',
  password: process.env.S4_PASSWORD ?? '',
};
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
require('dotenv/config');

const s4Config = {
  url: process.env.S4_URL || '',
  username: process.env.S4_USERNAME || '',
  password: process.env.S4_PASSWORD || '',
};
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> TypeScript's <code>process.env.X</code> is typed <code>string | undefined</code>. The <code>?? ''</code> ("nullish coalescing") gives a safe fallback, which is why TS forces us to handle the missing case — JavaScript would happily pass <code>undefined</code> and crash later.
</div>

---

## 2.3 — Download the EDMX from the SAP Business Accelerator Hub

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — EDMX:</strong> EDMX (Entity Data Model XML) is the formal description of an OData service — every entity, every field, every type, every relationship. It is the exact input the generator needs. Think of it as the "recipe card" for the service.</em>
</div>

1. Open the API page on the SAP Business Accelerator Hub:

```text
https://api.sap.com/api/sap-s4-OP_SALESORDER_0001-v1/overview
```

<sub>**code by anubhav trainings**</sub>

2. Go to the **API Specification** / **Details** tab.
3. Download the **EDMX** specification file.
4. Save it into a new folder so the generator can find it:

```text
srv/
└── external/
    └── sap-s4-OP_SALESORDER_0001-v1.edmx
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If you cannot reach the Hub, you can fetch the metadata directly from the live system by appending <code>/$metadata</code> to the service URL and saving the response as <code>sap-s4-OP_SALESORDER_0001-v1.edmx</code>. Either way, the file must be valid EDMX XML.
</div>

### Fix the downloaded EDMX (version 4.01 → 4.0)

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — EDMX version:</strong> the first line of the EDMX declares which OData version the document uses. The file from the Hub is marked <code>Version="4.01"</code>, but the CAP importer and the Cloud SDK generator expect plain <code>Version="4.0"</code>. The downloaded file therefore trips them up — we fix it with a one-character edit <strong>before</strong> running <code>cds import</code>.</em>
</div>

Open `srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx` and look at the very first line. You will see something like:

```xml
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.01">
```

<sub>**code by anubhav trainings**</sub>

Change `Version="4.01"` to `Version="4.0"`:

```xml
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — do this every time you re-download:</strong> the fix lives in the EDMX file, not in your code, so if you download a fresh copy of the metadata you must change <code>4.01</code> → <code>4.0</code> again before importing or generating. Save the file before moving on.
</div>

---

## 2.4 — Install the SAP Cloud SDK modules

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — two different SDK packages:</strong> the <strong>generator</strong> is a build-time tool (it writes code, so it is a <code>devDependency</code>). The <strong>odata-v4</strong> package is a runtime library that the generated code uses to actually send HTTP requests (so it is a normal <code>dependency</code>).</em>
</div>

Install the generator (dev-time):

```bash
npm install -D @sap-cloud-sdk/generator
```

<sub>**code by anubhav trainings**</sub>

Install the OData V4 runtime — our Sales Order service is V4 (the `odata4` URL in 2.1):

```bash
npm install @sap-cloud-sdk/odata-v4
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The generator inspects the EDMX and automatically emits code that imports from the matching runtime — here <code>@sap-cloud-sdk/odata-v4</code>. That runtime package must be installed, or the generated code will fail to import.
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — peer packages:</strong> the OData V4 runtime relies on three companion SAP Cloud SDK packages — <code>@sap-cloud-sdk/connectivity</code>, <code>@sap-cloud-sdk/http-client</code> and <code>@sap-cloud-sdk/resilience</code>. npm usually pulls them in automatically; if you hit a "cannot find module" at runtime, install them explicitly with <code>npm i @sap-cloud-sdk/connectivity @sap-cloud-sdk/http-client @sap-cloud-sdk/resilience</code>. (Likewise, <code>bignumber.js</code> used in Step 3 ships transitively with the SDK.)
</div>

Reference documentation:

```text
https://sap.github.io/cloud-sdk/docs/js/features/odata/generate-client
```

<sub>**code by anubhav trainings**</sub>

### Register the external service with `cds import`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `cds import`:</strong> downloading the EDMX (section 2.3) only gives you a file. <code>cds import</code> is the CAP command that <strong>registers</strong> that file as a known external service in your project. It copies the EDMX into <code>srv/external/</code>, creates a CAP-readable <code>.csn</code> next to it, and adds a <code>cds.requires</code> entry to <code>package.json</code> — so CAP knows the service's name, kind (<code>odata</code>) and model.</em>
</div>

Run it against the EDMX you downloaded (use your real file name):

```bash
cds import srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx --as cds
```

<sub>**code by anubhav trainings**</sub>

After it runs, two things change:

1. The model is registered under `srv/external/`:

```text
srv/
└── external/
    ├── sap-s4-OP_SALESORDER_0001-v1.edmx     # original metadata
    └── sap-s4-OP_SALESORDER_0001-v1.csn      # CAP's compiled view of it (created by cds import)
```

<sub>**code by anubhav trainings**</sub>

2. `package.json` gains a `cds.requires` entry so the service is known by name:

```json
{
  "cds": {
    "requires": {
      "sap_s4_OP_SALESORDER_0001_v1": {
        "kind": "odata",
        "model": "srv/external/sap-s4-OP_SALESORDER_0001-v1"
      }
    }
  }
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — import vs. generate:</strong> <code>cds import</code> derives the service name and the <code>.csn</code>/model path from the EDMX file name — so the entry is keyed <code>sap_s4_OP_SALESORDER_0001_v1</code> with <code>"kind": "odata"</code>, and the model points at <code>srv/external/sap-s4-OP_SALESORDER_0001-v1</code>. This registers the service for <strong>CAP</strong>; <code>generate-odata-client</code> (next section) produces the <strong>typed Cloud SDK client</strong> for fully type-safe calls. Run <code>cds import</code> first, then generate the typed client from the same folder. The <code>--as cds</code> flag asks for a <code>.csn</code> alongside the EDMX.
</div>

---

## 2.5 — Generate the boilerplate client

Run the generator, pointing `--input` at the folder with the EDMX and `--outputDir` at where the typed code should land:

```bash
npx generate-odata-client --input srv/external --outputDir srv/src/generated --skipValidation
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — what just happened:</strong> the generator read <code>sap-s4-OP_SALESORDER_0001-v1.edmx</code> and wrote a whole sub-project of TypeScript classes into <code>srv/src/generated</code>. This <strong>replaces</strong> the old, error-prone habit of hand-writing <code>interface SalesOrder { ... }</code> and keeping it in sync by hand.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — why <code>--skipValidation</code>:</strong> S/4HANA EDMX files often contain small quirks (vendor annotations, the <code>4.01</code>/<code>4.0</code> version detail) that make the generator's strict pre-check complain even though the metadata is perfectly usable. <code>--skipValidation</code> tells the generator to skip that pre-check and generate the client anyway. Use it for real SAP services like this one.
</div>

Useful flags you may add:

```bash
npx generate-odata-client \
  --input srv/external \
  --outputDir srv/src/generated \
  --skipValidation \
  --overwrite \
  --optionsPerService srv/external/options-per-service.json
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>--overwrite</code> lets you re-run generation after the service changes. Re-generate any time the EDMX is updated — never edit the generated files by hand, your edits would be wiped on the next run.
</div>

---

## 2.6 — Understand the generated folder

After generation you get a structure like this:

```text
srv/src/generated/
└── sap-s4-OP_SALESORDER_0001-v1/    # folder named after the EDMX service
    ├── index.ts                    # re-exports everything
    ├── service.ts                  # the service entry point + API container
    ├── SalesOrder.ts               # entity class for a Sales Order header
    ├── SalesOrder.requestBuilder.ts# builds GET/POST/PATCH/DELETE requests
    ├── SalesOrderApi.ts            # the API object: .requestBuilder(), .schema
    ├── SalesOrderItem.ts           # entity class for line items
    ├── SalesOrderItemApi.ts
    └── ... (one pair per entity)
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — the names come from the EDMX:</strong> the generator names the folder and the factory after the service id in the metadata. For this API that means the folder <code>sap-s4-OP_SALESORDER_0001-v1</code> and the factory function <code>sapS4OpSalesorder0001V1</code>. That is exactly the import you will write in Step 3.
</div>

### What `service.ts` gives you

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the service object:</strong> the generated <code>service.ts</code> exports a factory function (here <code>sapS4OpSalesorder0001V1()</code>) that hands you every entity's API in one place. Each entity API exposes a <strong>request builder</strong> with typed methods — <code>getAll()</code>, <code>getByKey()</code>, <code>create()</code>, <code>update()</code>, <code>delete()</code>.</em>
</div>

A peek at the kind of class the generator wrote (illustrative — do not edit):

```typescript
// srv/src/generated/sap-s4-OP_SALESORDER_0001-v1/service.ts  (generated)
export function sapS4OpSalesorder0001V1(): SapS4OpSalesorder0001V1<DefaultDeSerializers> {
  return new SapS4OpSalesorder0001V1(defaultDeSerializers);
}

export class SapS4OpSalesorder0001V1<DeSerializersT extends DeSerializers> {
  // one API per entity discovered in the EDMX
  get salesOrderApi() { /* returns SalesOrderApi */ }
  get salesOrderItemApi() { /* returns SalesOrderItemApi */ }
}
```

<sub>**code by anubhav trainings**</sub>

And the API container exposes the typed request builder:

```typescript
// srv/src/generated/sap-s4-OP_SALESORDER_0001-v1/SalesOrderApi.ts  (generated)
export class SalesOrderApi {
  requestBuilder(): SalesOrderRequestBuilder { /* ... */ }
  entityBuilder(): /* typed builder for new SalesOrder objects */;
  schema = { /* every field as a typed selectable, e.g. SALES_ORDER, SOLD_TO_PARTY */ };
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The two things you will use 95% of the time are: (1) <code>salesOrderApi.requestBuilder().getAll()</code> for reading, and (2) <code>salesOrderApi.requestBuilder().create(order)</code> for writing. Everything is typed, so a wrong field name will not compile.
</div>

---

## 2.7 — Define the CAP API surface for sales orders

Now we extend our `CatalogService.cds` so our own CAP service exposes sales-order operations. The handler (Step 3) will fill these with calls to the generated client.

```cds
using { anubhav.trainings as db } from '../db/schema';

service CatalogService {
  // local entities from Step 1
  entity Materials as projection on db.Material;
  entity Plants    as projection on db.Plant;

  // remote S/4HANA mashup surface
  function getSalesOrders() returns array of SalesOrder;

  action createSalesOrder(order: SalesOrderInput) returns SalesOrder;

  type SalesOrder {
    salesOrder         : String;
    salesOrderType     : String;
    soldToParty        : String;
    salesOrganization  : String;
    items              : array of SalesOrderItemView;
  }

  type SalesOrderItemView {
    salesOrderItem        : String;
    material              : String;
    requestedQuantity     : String;
    requestedQuantityUnit : String;
  }

  type SalesOrderItemInput {
    salesOrderItem        : String;
    material              : String;
    requestedQuantity     : String;
    requestedQuantityUnit : String;
  }

  type SalesOrderInput {
    salesOrderType        : String;
    salesOrganization     : String;
    distributionChannel   : String;
    organizationDivision  : String;
    salesDistrict         : String;
    soldToParty           : String;
    salesOrderDate        : String;
    items                 : array of SalesOrderItemInput;
  }
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — function vs action:</strong> in CAP a <code>function</code> is a read-only operation (maps to HTTP GET), and an <code>action</code> changes data (maps to HTTP POST). So <code>getSalesOrders()</code> reads from S/4HANA, and <code>createSalesOrder()</code> creates a sales order in S/4HANA.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> We deliberately keep our CAP types small and clean — only the fields we care about. The <em>full</em> typed S/4HANA model still lives in the generated client; this is just the public face of our mashup.
</div>

---

## 2.8 — Regenerate the model types

Since `CatalogService.cds` changed, refresh the CAP types so Step 3's handler is typed:

```bash
npx cds-typer "*"
```

<sub>**code by anubhav trainings**</sub>

---

## 2.9 — Final state after Step 2

```text
capm-s4-mashup/
├── .env                         # secrets (host+port + credentials, git-ignored)
├── srv/
│   ├── CatalogService.cds       # now includes SalesOrder function + action
│   ├── external/
│   │   ├── sap-s4-OP_SALESORDER_0001-v1.edmx      # downloaded blueprint (version 4.0)
│   │   └── sap-s4-OP_SALESORDER_0001-v1.csn       # registered by `cds import`
│   └── src/
│       └── generated/           # ← typed client written by the generator
│           └── sap-s4-OP_SALESORDER_0001-v1/   # folder named after the EDMX service
│               ├── service.ts
│               ├── SalesOrder.ts
│               ├── SalesOrderApi.ts
│               └── ...
└── package.json                 # cds.requires SalesOrder + depends on @sap-cloud-sdk/odata-v4
```

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 2 checklist

- [ ] `.env` created with `S4_URL` (host + port only), `S4_USERNAME`, `S4_PASSWORD` and added to `.gitignore`.
- [ ] EDMX downloaded into `srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx`.
- [ ] EDMX first line edited: `Version="4.01"` → `Version="4.0"`.
- [ ] `@sap-cloud-sdk/generator` (dev) and `@sap-cloud-sdk/odata-v4` (runtime) installed.
- [ ] `cds import srv/external/sap-s4-OP_SALESORDER_0001-v1.edmx --as cds` registered the service (`.csn` + `cds.requires` entry).
- [ ] `npx generate-odata-client ... --skipValidation` produced `srv/src/generated`.
- [ ] You can open `service.ts` and identify the entity APIs and request builders.
- [ ] `CatalogService.cds` extended with the SalesOrder function + action.

Continue to **`step3_service_consumption_typescript.md`** to write the consumption logic.

<sub>**code by anubhav trainings**</sub>
