# Step 3 — Consume the S/4HANA Service in TypeScript

### Write the mashup handler that calls GET and POST on the remote Sales Order service using the generated types, plus reusable parsers, type guards and `.d.ts` definitions.

---

## 🧾 Cheat Sheet

| Piece | File | Purpose |
|-------|------|---------|
| Service handler | `srv/CatalogService.ts` | wires the function/action to the SDK calls |
| Config loader | `srv/lib/config-loader.ts` | reads `.env`, V2/V4 type guards |
| Payload parser | `srv/lib/payload-parser.ts` | validates + maps incoming JSON |
| Shared types | `srv/types/sales-order.d.ts` | reusable interfaces & contracts |
| Generated client | `srv/src/generated/sap-s4-OP_SALESORDER_0001-v1` | typed S/4HANA API (factory `sapS4OpSalesorder0001V1`, from Step 2) |
| Read sales orders | `salesOrderApi.requestBuilder().getAll().execute(dest)` | GET |
| Create sales order | `salesOrderApi.requestBuilder().create(order).execute(dest)` | POST |

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>The big idea of Step 3:</strong> keep the handler thin. Validation goes in a parser, configuration goes in a loader, shared shapes go in <code>.d.ts</code> files. The handler just orchestrates: parse → call SDK → return.</em>
</div>

---

## 3.1 — Reusable types in a `.d.ts` file

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `.d.ts` (declaration file):</strong> a file that contains <strong>only types</strong>, no runnable code. It is a shared "vocabulary" that many files can import, so we describe a shape once and reuse it everywhere.</em>
</div>

Create `srv/types/sales-order.d.ts`:

```typescript
// Incoming line item from the API consumer
export interface SalesOrderItemInput {
  salesOrderItem: string;
  material: string;
  requestedQuantity: string;
  requestedQuantityUnit: string;
}

// Incoming sales order from the API consumer (our CAP action payload)
export interface SalesOrderInput {
  salesOrderType: string;
  salesOrganization: string;
  distributionChannel: string;
  organizationDivision: string;
  salesDistrict: string;
  soldToParty: string;
  salesOrderDate: string;
  items: SalesOrderItemInput[];
}

// Slim view we return to the consumer
export interface SalesOrderView {
  salesOrder: string;
  salesOrderType: string;
  soldToParty: string;
  salesOrganization: string;
}

// Which OData protocol a given config speaks
export type ODataVersion = 'v2' | 'v4';

export interface S4Config {
  url: string;
  username: string;
  password: string;
  odataVersion: ODataVersion;
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> There is no JavaScript equivalent for a <code>.d.ts</code> file — types vanish entirely once compiled. That is the point: types help you while writing, and cost nothing at runtime.
</div>

---

## 3.2 — `config-loader.ts` with V2/V4 type guards

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — type guard:</strong> a small function that returns <code>true/false</code> AND tells TypeScript "if this is true, the value is definitely of type X". It lets us branch safely on whether we are talking to a V2 or V4 service.</em>
</div>

Create `srv/lib/config-loader.ts`:

```typescript
import 'dotenv/config';
import type { S4Config, ODataVersion } from '../types/sales-order';

// Read and validate the S/4HANA configuration from .env
export function loadS4Config(): S4Config {
  const url = process.env.S4_URL ?? '';
  const username = process.env.S4_USERNAME ?? '';
  const password = process.env.S4_PASSWORD ?? '';

  if (!url || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }

  return { url, username, password, odataVersion: detectVersion(url) };
}

// Decide the protocol by inspecting the URL
export function detectVersion(url: string): ODataVersion {
  return url.includes('/odata4/') ? 'v4' : 'v2';
}

// Type guard: is this a V2 config?
export function isODataV2(config: S4Config): config is S4Config & { odataVersion: 'v2' } {
  return config.odataVersion === 'v2';
}

// Type guard: is this a V4 config?
export function isODataV4(config: S4Config): config is S4Config & { odataVersion: 'v4' } {
  return config.odataVersion === 'v4';
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent — `config-loader.js`</strong></sub>

```javascript
require('dotenv/config');

function loadS4Config() {
  const url = process.env.S4_URL || '';
  const username = process.env.S4_USERNAME || '';
  const password = process.env.S4_PASSWORD || '';

  if (!url || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }
  return { url, username, password, odataVersion: detectVersion(url) };
}

function detectVersion(url) {
  return url.includes('/odata4/') ? 'v4' : 'v2';
}

// In JS there is no "type guard" — just a boolean check
function isODataV2(config) { return config.odataVersion === 'v2'; }
function isODataV4(config) { return config.odataVersion === 'v4'; }

module.exports = { loadS4Config, detectVersion, isODataV2, isODataV4 };
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — the magic words:</strong> <code>config is S4Config & { odataVersion: 'v2' }</code> is the return type that makes it a <em>type guard</em>. After <code>if (isODataV2(cfg))</code>, TypeScript <strong>narrows</strong> <code>cfg</code> and knows for certain it is the V2 shape. JavaScript loses this entirely — it only sees a boolean.
</div>

---

## 3.3 — `payload-parser.ts` to validate the incoming JSON

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — never trust input:</strong> data arriving from outside is just unknown JSON. The parser checks every required field is present and the right type, then returns a clean, strongly typed object. Bad input is rejected with a clear message.</em>
</div>

Create `srv/lib/payload-parser.ts`:

```typescript
import type { SalesOrderInput, SalesOrderItemInput } from '../types/sales-order';

// Narrow `unknown` to an object we can index
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const v = obj[field];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Field "${field}" is required and must be a non-empty string.`);
  }
  return v;
}

function parseItem(raw: unknown): SalesOrderItemInput {
  if (!isRecord(raw)) throw new Error('Each item must be an object.');
  return {
    salesOrderItem: requireString(raw, 'salesOrderItem'),
    material: requireString(raw, 'material'),
    requestedQuantity: requireString(raw, 'requestedQuantity'),
    requestedQuantityUnit: requireString(raw, 'requestedQuantityUnit'),
  };
}

// The public entry point: unknown JSON -> validated SalesOrderInput
export function parseSalesOrder(raw: unknown): SalesOrderInput {
  if (!isRecord(raw)) throw new Error('Payload must be a JSON object.');

  const itemsRaw = raw['items'];
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('At least one item is required.');
  }

  return {
    salesOrderType: requireString(raw, 'salesOrderType'),
    salesOrganization: requireString(raw, 'salesOrganization'),
    distributionChannel: requireString(raw, 'distributionChannel'),
    organizationDivision: requireString(raw, 'organizationDivision'),
    salesDistrict: requireString(raw, 'salesDistrict'),
    soldToParty: requireString(raw, 'soldToParty'),
    salesOrderDate: requireString(raw, 'salesOrderDate'),
    items: itemsRaw.map(parseItem),
  };
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent — `payload-parser.js`</strong></sub>

```javascript
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function requireString(obj, field) {
  const v = obj[field];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Field "${field}" is required and must be a non-empty string.`);
  }
  return v;
}

function parseItem(raw) {
  if (!isRecord(raw)) throw new Error('Each item must be an object.');
  return {
    salesOrderItem: requireString(raw, 'salesOrderItem'),
    material: requireString(raw, 'material'),
    requestedQuantity: requireString(raw, 'requestedQuantity'),
    requestedQuantityUnit: requireString(raw, 'requestedQuantityUnit'),
  };
}

function parseSalesOrder(raw) {
  if (!isRecord(raw)) throw new Error('Payload must be a JSON object.');
  const itemsRaw = raw.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('At least one item is required.');
  }
  return {
    salesOrderType: requireString(raw, 'salesOrderType'),
    salesOrganization: requireString(raw, 'salesOrganization'),
    distributionChannel: requireString(raw, 'distributionChannel'),
    organizationDivision: requireString(raw, 'organizationDivision'),
    salesDistrict: requireString(raw, 'salesDistrict'),
    soldToParty: requireString(raw, 'soldToParty'),
    salesOrderDate: requireString(raw, 'salesOrderDate'),
    items: itemsRaw.map(parseItem),
  };
}

module.exports = { parseSalesOrder };
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Both versions run the same checks. Only the TypeScript version <em>guarantees at compile time</em> that the returned object matches <code>SalesOrderInput</code> — if you forget a field, TS refuses to build.
</div>

---

## 3.4 — The mashup handler: GET (snippet by snippet)

We will now extend `srv/CatalogService.ts` from Step 1 to also serve sales orders.

### Snippet A — imports and destination

```typescript
import cds from '@sap/cds';
import { loadS4Config } from './lib/config-loader';
import { parseSalesOrder } from './lib/payload-parser';
import type { SalesOrderView } from './types/sales-order';

// Generated in Step 2 (folder + factory are named after the EDMX service):
import { sapS4OpSalesorder0001V1 as salesOrderService } from './src/generated/sap-s4-OP_SALESORDER_0001-v1';
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — why this exact import:</strong> the generator names the output folder and the factory function after the service in the EDMX. So the client lives at <code>srv/src/generated/<strong>sap-s4-OP_SALESORDER_0001-v1</strong></code> and the factory export is <code><strong>sapS4OpSalesorder0001V1</strong></code> — there is no <code>salesOrderService</code> export. We use <code>import { sapS4OpSalesorder0001V1 <strong>as</strong> salesOrderService }</code> so the rest of the code can keep the short, readable name.
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — destination:</strong> the SDK needs to know <em>where</em> and <em>with what credentials</em> to call. That bundle is a "destination". Locally we build it from <code>.env</code>; in the cloud (Step 4) it comes from a BTP Destination service.</em>
</div>

### Snippet B — handle GET (read sales orders)

```typescript
this.on('getSalesOrders', async (): Promise<SalesOrderView[]> => {
  const cfg = loadS4Config();

  const orders = await salesOrderService()
    .salesOrderApi.requestBuilder()
    .getAll()
    .top(20)
    .execute({
      url: cfg.url,
      username: cfg.username,
      password: cfg.password,
    });

  // map the rich S/4HANA entity down to our slim view
  return orders.map((o) => ({
    salesOrder: o.salesOrder,
    salesOrderType: o.salesOrderType ?? '',
    soldToParty: o.soldToParty ?? '',
    salesOrganization: o.salesOrganization ?? '',
  }));
});
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
this.on('getSalesOrders', async () => {
  const cfg = loadS4Config();

  const orders = await salesOrderService()
    .salesOrderApi.requestBuilder()
    .getAll()
    .top(20)
    .execute({
      url: cfg.url,
      username: cfg.username,
      password: cfg.password,
    });

  return orders.map((o) => ({
    salesOrder: o.salesOrder,
    salesOrderType: o.salesOrderType || '',
    soldToParty: o.soldToParty || '',
    salesOrganization: o.salesOrganization || '',
  }));
});
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>.top(20)</code> limits results so a demo does not pull thousands of rows. The <code>?? ''</code> handles optional fields the SDK types as possibly <code>undefined</code> — TypeScript forces you to decide what happens when a field is missing.
</div>

---

## 3.5 — The mashup handler: POST (create a sales order)

### Snippet C — handle the create action

```typescript
this.on('createSalesOrder', async (req): Promise<SalesOrderView> => {
  const cfg = loadS4Config();

  // 1) validate + normalise the incoming JSON
  const input = parseSalesOrder(req.data.order);

  // 2) build the entity the way the generated client expects
  const api = salesOrderService().salesOrderApi;
  const newOrder = api.entityBuilder()
    .salesOrderType(input.salesOrderType)
    .salesOrganization(input.salesOrganization)
    .distributionChannel(input.distributionChannel)
    .organizationDivision(input.organizationDivision)
    .salesDistrict(input.salesDistrict)
    .soldToParty(input.soldToParty)
    .build();

  // 3) POST it to S/4HANA
  const created = await api.requestBuilder()
    .create(newOrder)
    .execute({
      url: cfg.url,
      username: cfg.username,
      password: cfg.password,
    });

  // 4) return the slim view
  return {
    salesOrder: created.salesOrder,
    salesOrderType: created.salesOrderType ?? '',
    soldToParty: created.soldToParty ?? '',
    salesOrganization: created.salesOrganization ?? '',
  };
});
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
this.on('createSalesOrder', async (req) => {
  const cfg = loadS4Config();

  const input = parseSalesOrder(req.data.order);

  const api = salesOrderService().salesOrderApi;
  const newOrder = api.entityBuilder()
    .salesOrderType(input.salesOrderType)
    .salesOrganization(input.salesOrganization)
    .distributionChannel(input.distributionChannel)
    .organizationDivision(input.organizationDivision)
    .salesDistrict(input.salesDistrict)
    .soldToParty(input.soldToParty)
    .build();

  const created = await api.requestBuilder()
    .create(newOrder)
    .execute({
      url: cfg.url,
      username: cfg.username,
      password: cfg.password,
    });

  return {
    salesOrder: created.salesOrder,
    salesOrderType: created.salesOrderType || '',
    soldToParty: created.soldToParty || '',
    salesOrganization: created.salesOrganization || '',
  };
});
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the entity builder:</strong> the generated <code>entityBuilder()</code> gives a typed, fluent way to assemble a new record. Each <code>.field(value)</code> is checked against the real S/4HANA field type — pass a number where a string is required and it will not compile.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — items & dates (OData V4):</strong> because this is a <strong>V4</strong> service, child line items are attached through the generated <code>_Item</code> navigation (an array, with <strong>no</strong> <code>results</code> wrapper) and dates are plain ISO strings such as <code>"2026-04-02"</code>. Use <code>salesOrderItemApi.entityBuilder()</code> for each item and attach them via the builder's navigation setter. Step 4 shows the full V4 payload.
</div>

---

## 3.6 — Final, complete code

### `srv/types/sales-order.d.ts`

```typescript
export interface SalesOrderItemInput {
  salesOrderItem: string;
  material: string;
  requestedQuantity: string;
  requestedQuantityUnit: string;
}

export interface SalesOrderInput {
  salesOrderType: string;
  salesOrganization: string;
  distributionChannel: string;
  organizationDivision: string;
  salesDistrict: string;
  soldToParty: string;
  salesOrderDate: string;
  items: SalesOrderItemInput[];
}

export interface SalesOrderView {
  salesOrder: string;
  salesOrderType: string;
  soldToParty: string;
  salesOrganization: string;
}

export type ODataVersion = 'v2' | 'v4';

export interface S4Config {
  url: string;
  username: string;
  password: string;
  odataVersion: ODataVersion;
}
```

<sub>**code by anubhav trainings**</sub>

### `srv/lib/config-loader.ts`

```typescript
import 'dotenv/config';
import type { S4Config, ODataVersion } from '../types/sales-order';

export function loadS4Config(): S4Config {
  const url = process.env.S4_URL ?? '';
  const username = process.env.S4_USERNAME ?? '';
  const password = process.env.S4_PASSWORD ?? '';

  if (!url || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }
  return { url, username, password, odataVersion: detectVersion(url) };
}

export function detectVersion(url: string): ODataVersion {
  return url.includes('/odata4/') ? 'v4' : 'v2';
}

export function isODataV2(config: S4Config): config is S4Config & { odataVersion: 'v2' } {
  return config.odataVersion === 'v2';
}

export function isODataV4(config: S4Config): config is S4Config & { odataVersion: 'v4' } {
  return config.odataVersion === 'v4';
}
```

<sub>**code by anubhav trainings**</sub>

### `srv/lib/payload-parser.ts`

```typescript
import type { SalesOrderInput, SalesOrderItemInput } from '../types/sales-order';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireString(obj: Record<string, unknown>, field: string): string {
  const v = obj[field];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Field "${field}" is required and must be a non-empty string.`);
  }
  return v;
}

function parseItem(raw: unknown): SalesOrderItemInput {
  if (!isRecord(raw)) throw new Error('Each item must be an object.');
  return {
    salesOrderItem: requireString(raw, 'salesOrderItem'),
    material: requireString(raw, 'material'),
    requestedQuantity: requireString(raw, 'requestedQuantity'),
    requestedQuantityUnit: requireString(raw, 'requestedQuantityUnit'),
  };
}

export function parseSalesOrder(raw: unknown): SalesOrderInput {
  if (!isRecord(raw)) throw new Error('Payload must be a JSON object.');

  const itemsRaw = raw['items'];
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('At least one item is required.');
  }

  return {
    salesOrderType: requireString(raw, 'salesOrderType'),
    salesOrganization: requireString(raw, 'salesOrganization'),
    distributionChannel: requireString(raw, 'distributionChannel'),
    organizationDivision: requireString(raw, 'organizationDivision'),
    salesDistrict: requireString(raw, 'salesDistrict'),
    soldToParty: requireString(raw, 'soldToParty'),
    salesOrderDate: requireString(raw, 'salesOrderDate'),
    items: itemsRaw.map(parseItem),
  };
}
```

<sub>**code by anubhav trainings**</sub>

### `srv/CatalogService.ts` (Step 1 rules + Step 3 mashup)

```typescript
import cds from '@sap/cds';
import { Material, Plant } from '#cds-models/CatalogService';
import { loadS4Config } from './lib/config-loader';
import { parseSalesOrder } from './lib/payload-parser';
import type { SalesOrderView } from './types/sales-order';
import { sapS4OpSalesorder0001V1 as salesOrderService } from './src/generated/sap-s4-OP_SALESORDER_0001-v1';

export class CatalogService extends cds.ApplicationService {
  async init(): Promise<void> {
    // --- Step 1 local validations ---
    this.before('CREATE', 'Materials', this.validateMaterialName);
    this.before('UPDATE', 'Materials', this.checkPlantExists);
    this.before('CREATE', 'Plants', this.checkStorageLocationLimit);

    // --- Step 3 remote mashup ---
    this.on('getSalesOrders', this.getSalesOrders);
    this.on('createSalesOrder', this.createSalesOrder);

    return super.init();
  }

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

  private checkPlantExists = async (req: cds.Request): Promise<void> => {
    const plantId = (req.data as Material).plant_ID;
    if (!plantId) return;
    const found = await SELECT.one.from(Plant).where({ ID: plantId });
    if (!found) req.reject(404, `Plant ${plantId} does not exist.`);
  };

  private checkStorageLocationLimit = async (req: cds.Request): Promise<void> => {
    const { storageLocation } = req.data as Plant;
    if (!storageLocation) return;
    const existing = await SELECT.from(Plant).where({ storageLocation });
    if (existing.length >= 2) {
      req.reject(409, `Storage location ${storageLocation} already has 2 plants.`);
    }
  };

  private getSalesOrders = async (): Promise<SalesOrderView[]> => {
    const cfg = loadS4Config();
    const orders = await salesOrderService()
      .salesOrderApi.requestBuilder()
      .getAll()
      .top(20)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return orders.map((o) => ({
      salesOrder: o.salesOrder,
      salesOrderType: o.salesOrderType ?? '',
      soldToParty: o.soldToParty ?? '',
      salesOrganization: o.salesOrganization ?? '',
    }));
  };

  private createSalesOrder = async (req: cds.Request): Promise<SalesOrderView> => {
    const cfg = loadS4Config();
    const input = parseSalesOrder(req.data.order);

    const api = salesOrderService().salesOrderApi;
    const newOrder = api.entityBuilder()
      .salesOrderType(input.salesOrderType)
      .salesOrganization(input.salesOrganization)
      .distributionChannel(input.distributionChannel)
      .organizationDivision(input.organizationDivision)
      .salesDistrict(input.salesDistrict)
      .soldToParty(input.soldToParty)
      .build();

    const created = await api.requestBuilder()
      .create(newOrder)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return {
      salesOrder: created.salesOrder,
      salesOrderType: created.salesOrderType ?? '',
      soldToParty: created.soldToParty ?? '',
      salesOrganization: created.salesOrganization ?? '',
    };
  };
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent — `srv/CatalogService.js` (mashup handlers only)</strong></sub>

```javascript
const cds = require('@sap/cds');
const { loadS4Config } = require('./lib/config-loader');
const { parseSalesOrder } = require('./lib/payload-parser');
const { sapS4OpSalesorder0001V1: salesOrderService } = require('./src/generated/sap-s4-OP_SALESORDER_0001-v1');

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {
    this.on('getSalesOrders', this.getSalesOrders);
    this.on('createSalesOrder', this.createSalesOrder);
    return super.init();
  }

  getSalesOrders = async () => {
    const cfg = loadS4Config();
    const orders = await salesOrderService()
      .salesOrderApi.requestBuilder()
      .getAll()
      .top(20)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return orders.map((o) => ({
      salesOrder: o.salesOrder,
      salesOrderType: o.salesOrderType || '',
      soldToParty: o.soldToParty || '',
      salesOrganization: o.salesOrganization || '',
    }));
  };

  createSalesOrder = async (req) => {
    const cfg = loadS4Config();
    const input = parseSalesOrder(req.data.order);

    const api = salesOrderService().salesOrderApi;
    const newOrder = api.entityBuilder()
      .salesOrderType(input.salesOrderType)
      .salesOrganization(input.salesOrganization)
      .distributionChannel(input.distributionChannel)
      .organizationDivision(input.organizationDivision)
      .salesDistrict(input.salesDistrict)
      .soldToParty(input.soldToParty)
      .build();

    const created = await api.requestBuilder()
      .create(newOrder)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return {
      salesOrder: created.salesOrder,
      salesOrderType: created.salesOrderType || '',
      soldToParty: created.soldToParty || '',
      salesOrganization: created.salesOrganization || '',
    };
  };
};
```

</div>

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 3 checklist

- [ ] `srv/types/sales-order.d.ts` holds all reusable interfaces.
- [ ] `config-loader.ts` reads `.env` and provides `isODataV2` / `isODataV4` type guards.
- [ ] `payload-parser.ts` validates unknown JSON into a typed `SalesOrderInput`.
- [ ] `getSalesOrders` consumes GET via the generated request builder.
- [ ] `createSalesOrder` consumes POST via the entity builder.
- [ ] `npx tsc --noEmit` is clean.

Continue to **`step4_local_testing_destination.md`** to test against the live system.

<sub>**code by anubhav trainings**</sub>
