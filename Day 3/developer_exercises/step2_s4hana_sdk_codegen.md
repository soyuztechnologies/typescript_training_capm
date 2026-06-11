# Step 2 — Generate Typed S/4HANA Client with the Cloud SDK

### Stop hand-writing TypeScript interfaces for SAP entities. Instead, point the SAP Cloud SDK generator at a service's EDMX metadata and let it produce typed API classes for you.

---

## 🧾 Cheat Sheet

| Task | Command / Value |
|------|-----------------|
| Remote service URL | `https://s4hana10.saraswatitechnologies.in:44310/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrder` |
| EDMX source | SAP Business Accelerator Hub → API → *Details* → Download specification (EDMX) |
| Install generator | `npm i -D @sap-cloud-sdk/generator` |
| Install OData V2 runtime | `npm i @sap-cloud-sdk/odata-v2` |
| Install OData V4 runtime | `npm i @sap-cloud-sdk/odata-v4` |
| Put EDMX here | `srv/external/SalesOrder.edmx` |
| Generate client | `npx generate-odata-client --input srv/external --outputDir srv/src/generated` |
| Secrets live in | `.env` (git-ignored) |

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>The big idea of Step 2:</strong> an SAP OData service publishes a machine-readable description of itself called <strong>EDMX</strong> (its "blueprint"). The Cloud SDK generator reads that blueprint and writes ready-to-use, fully typed TypeScript classes — one per entity, with methods for GET, POST, filter, etc.</em>
</div>

---

## 2.1 — The remote service we will consume

We connect to the S/4HANA **Sales Order** OData service:

```text
https://s4hana10.saraswatitechnologies.in:44310/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001/SalesOrder
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — version check:</strong> the URL above contains <code>odata4</code>, so it is an <strong>OData V4</strong> service. The classic Sales Order API on the SAP Hub (<code>API_SALES_ORDER_SRV</code>) is <strong>OData V2</strong>. They are not interchangeable. Install the runtime that matches your real endpoint — <code>@sap-cloud-sdk/odata-v4</code> for the URL above, or <code>@sap-cloud-sdk/odata-v2</code> for the classic V2 API. We install V2 below because the exercise calls for it; switch the import to V4 if your endpoint is V4.
</div>

---

## 2.2 — Keep secrets out of code with `.env`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — environment variables:</strong> a URL is harmless, but the username and password are secrets. We never type secrets into source code (they would end up on GitHub). Instead we put them in a <code>.env</code> file that is listed in <code>.gitignore</code>, and read them at runtime.</em>
</div>

Create `.env` in the project root:

```bash
# --- S/4HANA Sales Order service ---
S4_URL=https://s4hana10.saraswatitechnologies.in:44310/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001
S4_USERNAME=YOUR_S4_USER
S4_PASSWORD=YOUR_S4_PASSWORD
```

<sub>**code by anubhav trainings**</sub>

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
    └── SalesOrder.edmx
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If you cannot reach the Hub, you can fetch the metadata directly from the live system by appending <code>/$metadata</code> to the service URL and saving the response as <code>SalesOrder.edmx</code>. Either way, the file must be valid EDMX XML.
</div>

---

## 2.4 — Install the SAP Cloud SDK modules

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — two different SDK packages:</strong> the <strong>generator</strong> is a build-time tool (it writes code, so it is a <code>devDependency</code>). The <strong>odata-v2 / odata-v4</strong> package is a runtime library that the generated code uses to actually send HTTP requests (so it is a normal <code>dependency</code>).</em>
</div>

Install the generator (dev-time):

```bash
npm install -D @sap-cloud-sdk/generator
```

<sub>**code by anubhav trainings**</sub>

Install the OData V2 runtime (the exercise's requirement to run OData V2 from the SDK):

```bash
npm install @sap-cloud-sdk/odata-v2
```

<sub>**code by anubhav trainings**</sub>

If your endpoint is V4 (like the `odata4` URL in 2.1), also install:

```bash
npm install @sap-cloud-sdk/odata-v4
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The generator inspects the EDMX and automatically emits code that imports from the matching runtime (<code>odata-v2</code> or <code>odata-v4</code>). You just need the matching runtime package installed, or the generated code will fail to import.
</div>

Reference documentation:

```text
https://sap.github.io/cloud-sdk/docs/js/features/odata/generate-client
```

<sub>**code by anubhav trainings**</sub>

---

## 2.5 — Generate the boilerplate client

Run the generator, pointing `--input` at the folder with the EDMX and `--outputDir` at where the typed code should land:

```bash
npx generate-odata-client --input srv/external --outputDir srv/src/generated
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — what just happened:</strong> the generator read <code>SalesOrder.edmx</code> and wrote a whole sub-project of TypeScript classes into <code>srv/src/generated</code>. This <strong>replaces</strong> the old, error-prone habit of hand-writing <code>interface SalesOrder { ... }</code> and keeping it in sync by hand.</em>
</div>

Useful flags you may add:

```bash
npx generate-odata-client \
  --input srv/external \
  --outputDir srv/src/generated \
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
└── sales-order-service/
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

### What `service.ts` gives you

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the service object:</strong> the generated <code>service.ts</code> exports a factory function (e.g. <code>salesOrderService()</code>) that hands you every entity's API in one place. Each entity API exposes a <strong>request builder</strong> with typed methods — <code>getAll()</code>, <code>getByKey()</code>, <code>create()</code>, <code>update()</code>, <code>delete()</code>.</em>
</div>

A peek at the kind of class the generator wrote (illustrative — do not edit):

```typescript
// srv/src/generated/sales-order-service/service.ts  (generated)
export function salesOrderService(): SalesOrderService<DefaultDeSerializers> {
  return new SalesOrderService(defaultDeSerializers);
}

export class SalesOrderService<DeSerializersT extends DeSerializers> {
  // one API per entity discovered in the EDMX
  get salesOrderApi() { /* returns SalesOrderApi */ }
  get salesOrderItemApi() { /* returns SalesOrderItemApi */ }
}
```

<sub>**code by anubhav trainings**</sub>

And the API container exposes the typed request builder:

```typescript
// srv/src/generated/sales-order-service/SalesOrderApi.ts  (generated)
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
├── .env                         # secrets (git-ignored)
├── srv/
│   ├── CatalogService.cds       # now includes SalesOrder function + action
│   ├── external/
│   │   └── SalesOrder.edmx      # downloaded blueprint
│   └── src/
│       └── generated/           # ← typed client written by the generator
│           └── sales-order-service/
│               ├── service.ts
│               ├── SalesOrder.ts
│               ├── SalesOrderApi.ts
│               └── ...
└── package.json                 # now depends on @sap-cloud-sdk/odata-v2
```

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 2 checklist

- [ ] `.env` created with `S4_URL`, `S4_USERNAME`, `S4_PASSWORD` and added to `.gitignore`.
- [ ] EDMX downloaded into `srv/external/SalesOrder.edmx`.
- [ ] `@sap-cloud-sdk/generator` (dev) and `@sap-cloud-sdk/odata-v2` (runtime) installed.
- [ ] `npx generate-odata-client ...` produced `srv/src/generated`.
- [ ] You can open `service.ts` and identify the entity APIs and request builders.
- [ ] `CatalogService.cds` extended with the SalesOrder function + action.

Continue to **`step3_service_consumption_typescript.md`** to write the consumption logic.

<sub>**code by anubhav trainings**</sub>
