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
| Decimal quantities | `npm i bignumber.js` → `new BigNumber('5')` | item qty |
| Read orders + items | `salesOrderApi.requestBuilder().getAll().expand(schema.ITEM).execute(dest)` | GET |
| Create order + items | `salesOrderItemApi.entityBuilder()...build()` → `.item(items)` → `create(order)` | POST |

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

// Slim line-item view returned inside each order
export interface SalesOrderItemView {
  salesOrderItem: string;
  material: string;
  requestedQuantity: string;
  requestedQuantityUnit: string;
}

// Slim view we return to the consumer (header + its items)
export interface SalesOrderView {
  salesOrder: string;
  salesOrderType: string;
  soldToParty: string;
  salesOrganization: string;
  items: SalesOrderItemView[];
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

// OData V4 service binding for the Sales Order (A2X) service.
// Kept here (not in .env) so the env only holds the host/credentials.
const SALES_ORDER_SERVICE_PATH =
  '/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001';

// Read and validate the S/4HANA configuration from .env
export function loadS4Config(): S4Config {
  const host = process.env.S4_URL ?? '';
  const username = process.env.S4_USERNAME ?? '';
  const password = process.env.S4_PASSWORD ?? '';

  if (!host || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }

  // Combine host (from .env) with the service path (defined above).
  const url = host.replace(/\/+$/, '') + SALES_ORDER_SERVICE_PATH;

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

// Service path lives in code, not in .env, so the env stays clean.
const SALES_ORDER_SERVICE_PATH =
  '/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001';

function loadS4Config() {
  const host = process.env.S4_URL || '';
  const username = process.env.S4_USERNAME || '';
  const password = process.env.S4_PASSWORD || '';

  if (!host || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }

  const url = host.replace(/\/+$/, '') + SALES_ORDER_SERVICE_PATH;
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

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — host in `.env`, path in code:</strong> the <code>.env</code> now holds only the <strong>host + port + credentials</strong> (the things that change per environment or are secret). The long, stable <strong>service path</strong> lives in one constant inside <code>config-loader.ts</code>, and we join them with <code>host.replace(/\/+$/, '') + PATH</code> (the regex trims any trailing slash so we never get a double <code>//</code>). This keeps <code>.env</code> clean and makes the endpoint easy to read in one place.</em>
</div>

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
import BigNumber from 'bignumber.js';
import { loadS4Config } from './lib/config-loader';
import { parseSalesOrder } from './lib/payload-parser';
import type { SalesOrderView } from './types/sales-order';

// Generated in Step 2 (folder + factory are named after the EDMX service):
import { sapS4OpSalesorder0001V1 as salesOrderService } from './src/generated/sap-s4-OP_SALESORDER_0001-v1';
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — install <code>bignumber.js</code>:</strong> S/4HANA quantity fields are decimals, and the SDK types them as <code>BigNumber</code> (exact decimal math, no floating-point rounding). Install it once: <code>npm install bignumber.js</code>. We use it in <code>createSalesOrder</code> to pass <code>requestedQuantity</code>.
</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — why this exact import:</strong> the generator names the output folder and the factory function after the service in the EDMX. So the client lives at <code>srv/src/generated/<strong>sap-s4-OP_SALESORDER_0001-v1</strong></code> and the factory export is <code><strong>sapS4OpSalesorder0001V1</strong></code> — there is no <code>salesOrderService</code> export. We use <code>import { sapS4OpSalesorder0001V1 <strong>as</strong> salesOrderService }</code> so the rest of the code can keep the short, readable name.
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — destination:</strong> the SDK needs to know <em>where</em> and <em>with what credentials</em> to call. That bundle is a "destination". Locally we build it from <code>.env</code>; in the cloud (Step 4) it comes from a BTP Destination service.</em>
</div>

### Snippet B — handle GET (read each order **with** its item lines)

We `.expand(...)` the item navigation so the detail view can show the lines in a table. On this generated client the selectable is `salesOrderApi.schema.ITEM` and the expanded rows arrive on the entity as `o.item`.

```typescript
this.on('getSalesOrders', async (): Promise<SalesOrderView[]> => {
  const cfg = loadS4Config();
  const service = salesOrderService();

  const orders = await service.salesOrderApi
    .requestBuilder()
    .getAll()
    // expand the item lines so the detail view can show them in a table
    .expand(service.salesOrderApi.schema.ITEM)
    .top(20)
    .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

  // map the rich S/4HANA entity down to our slim header + items view
  return orders.map((o) => ({
    salesOrder: o.salesOrder,
    salesOrderType: o.salesOrderType ?? '',
    soldToParty: o.soldToParty ?? '',
    salesOrganization: o.salesOrganization ?? '',
    items: (o.item ?? []).map((it) => ({
      salesOrderItem: it.salesOrderItem ?? '',
      material: it.product ?? '',
      // requestedQuantity is an Edm.Decimal (BigNumber) - send it as a string
      requestedQuantity: it.requestedQuantity?.toString() ?? '',
      requestedQuantityUnit: it.requestedQuantitySapUnit ?? it.requestedQuantityIsoUnit ?? '',
    })),
  }));
});
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
this.on('getSalesOrders', async () => {
  const cfg = loadS4Config();
  const service = salesOrderService();

  const orders = await service.salesOrderApi
    .requestBuilder()
    .getAll()
    .expand(service.salesOrderApi.schema.ITEM)
    .top(20)
    .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

  return orders.map((o) => ({
    salesOrder: o.salesOrder,
    salesOrderType: o.salesOrderType || '',
    soldToParty: o.soldToParty || '',
    salesOrganization: o.salesOrganization || '',
    items: (o.item || []).map((it) => ({
      salesOrderItem: it.salesOrderItem || '',
      material: it.product || '',
      requestedQuantity: it.requestedQuantity ? it.requestedQuantity.toString() : '',
      requestedQuantityUnit: it.requestedQuantitySapUnit || it.requestedQuantityIsoUnit || '',
    })),
  }));
});
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — `.expand(...)`:</strong> by default an OData GET returns only the header fields. <code>.expand(service.salesOrderApi.schema.ITEM)</code> tells S/4HANA to send the related line items in the same response (one round-trip), and the SDK fills <code>o.item</code> with a typed array. We map those into our <code>items</code> view so a UI can show a detail table.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — read-side field names:</strong> on the way <em>out</em>, the item's material is exposed as <code>product</code>, and the unit may arrive as <code>requestedQuantitySapUnit</code> <em>or</em> <code>requestedQuantityIsoUnit</code> (we fall back from one to the other). <code>requestedQuantity</code> is an <code>Edm.Decimal</code> (a <code>BigNumber</code>), so we call <code>.toString()</code>. If your generated <code>SalesOrderApi.ts</code> lists a different selectable than <code>ITEM</code>, use exactly what it shows.
</div>

---

## 3.5 — The mashup handler: POST (create a sales order)

### Snippet C — handle the create action (header **and** items)

This is the real-world version: we build each line item with the **item** API, attach them to the order via `.item(...)`, and wrap the call in `try/catch` so the actual S/4HANA error is surfaced instead of a generic 500.

```typescript
this.on('createSalesOrder', async (req): Promise<SalesOrderView> => {
  const cfg = loadS4Config();
  const input = parseSalesOrder(req.data.order);

  const service = salesOrderService();
  const api = service.salesOrderApi;

  // Map the validated input items to S/4HANA SalesOrderItem entities.
  // Note the S/4 field names: material -> product, unit -> requestedQuantityIsoUnit
  // (S/4 expects the ISO unit code, e.g. "PCE", here — not the SAP-internal code).
  // Do not send salesOrderItem: S/4 rejects external item numbering through
  // this channel ("External numbering is not supported"), so let it auto-number.
  const items = input.items.map((it) =>
    service.salesOrderItemApi
      .entityBuilder()
      .product(it.material)
      .requestedQuantity(new BigNumber(it.requestedQuantity))
      .requestedQuantityIsoUnit(it.requestedQuantityUnit)
      .build()
  );

  const newOrder = api.entityBuilder()
    .salesOrderType(input.salesOrderType)
    .salesOrganization(input.salesOrganization)
    .distributionChannel(input.distributionChannel)
    .organizationDivision(input.organizationDivision)
    .salesDistrict(input.salesDistrict)
    .soldToParty(input.soldToParty)
    .item(items)
    .build();

  console.log('[createSalesOrder] →', cfg.url + '/SalesOrder');

  try {
    const created = await api.requestBuilder()
      .create(newOrder)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return {
      salesOrder: created.salesOrder,
      salesOrderType: created.salesOrderType ?? '',
      soldToParty: created.soldToParty ?? '',
      salesOrganization: created.salesOrganization ?? '',
      // S/4 does not echo the created items on this response, so return what we sent
      items: input.items.map((it) => ({
        salesOrderItem: it.salesOrderItem ?? '',
        material: it.material ?? '',
        requestedQuantity: it.requestedQuantity ?? '',
        requestedQuantityUnit: it.requestedQuantityUnit ?? '',
      })),
    };
  } catch (err: any) {
    // Surface the real S/4 response instead of a generic 500.
    const status = err?.response?.status ?? err?.status;
    const body = err?.response?.data ?? err?.rootCause?.response?.data;
    console.error('[createSalesOrder] S/4 error status:', status);
    console.error('[createSalesOrder] S/4 error body:', JSON.stringify(body, null, 2));
    req.reject(status ?? 500, body?.error?.message ?? err?.message ?? 'S/4 call failed');
  }
});
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
this.on('createSalesOrder', async (req) => {
  const cfg = loadS4Config();
  const input = parseSalesOrder(req.data.order);

  const service = salesOrderService();
  const api = service.salesOrderApi;

  const items = input.items.map((it) =>
    service.salesOrderItemApi
      .entityBuilder()
      .product(it.material)
      .requestedQuantity(new BigNumber(it.requestedQuantity))
      .requestedQuantityIsoUnit(it.requestedQuantityUnit)
      .build()
  );

  const newOrder = api.entityBuilder()
    .salesOrderType(input.salesOrderType)
    .salesOrganization(input.salesOrganization)
    .distributionChannel(input.distributionChannel)
    .organizationDivision(input.organizationDivision)
    .salesDistrict(input.salesDistrict)
    .soldToParty(input.soldToParty)
    .item(items)
    .build();

  console.log('[createSalesOrder] →', cfg.url + '/SalesOrder');

  try {
    const created = await api.requestBuilder()
      .create(newOrder)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return {
      salesOrder: created.salesOrder,
      salesOrderType: created.salesOrderType || '',
      soldToParty: created.soldToParty || '',
      salesOrganization: created.salesOrganization || '',
      // S/4 does not echo the created items, so return what we sent
      items: input.items.map((it) => ({
        salesOrderItem: it.salesOrderItem || '',
        material: it.material || '',
        requestedQuantity: it.requestedQuantity || '',
        requestedQuantityUnit: it.requestedQuantityUnit || '',
      })),
    };
  } catch (err) {
    const status = (err && err.response && err.response.status) || err.status;
    const body = (err && err.response && err.response.data) ||
                 (err && err.rootCause && err.rootCause.response && err.rootCause.response.data);
    console.error('[createSalesOrder] S/4 error status:', status);
    console.error('[createSalesOrder] S/4 error body:', JSON.stringify(body, null, 2));
    req.reject(status || 500, (body && body.error && body.error.message) || err.message || 'S/4 call failed');
  }
});
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — building child items:</strong> we create each line with <code>salesOrderItemApi.entityBuilder()</code> and attach the whole array to the header through the <code>.item(items)</code> navigation setter. The SDK serialises this as the V4 <code>_Item</code> array on the wire — no <code>results</code> wrapper, no manual JSON.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — the field-name gotchas:</strong> S/4HANA's create API uses <code>product</code> (not <code>material</code>) and <code>requestedQuantityIsoUnit</code> (the ISO unit code, e.g. <code>"PCE"</code>, not the internal <code>"PC"</code>). Do <strong>not</strong> send <code>salesOrderItem</code> — external item numbering is rejected, so let S/4 auto-number. The <code>try/catch</code> reads the real S/4 error body and re-throws it with <code>req.reject</code>, so the caller sees the genuine reason instead of a blank 500.
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

export interface SalesOrderItemView {
  salesOrderItem: string;
  material: string;
  requestedQuantity: string;
  requestedQuantityUnit: string;
}

export interface SalesOrderView {
  salesOrder: string;
  salesOrderType: string;
  soldToParty: string;
  salesOrganization: string;
  items: SalesOrderItemView[];
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

// OData V4 service binding for the Sales Order (A2X) service.
// Kept here (not in .env) so the env only holds the host/credentials.
const SALES_ORDER_SERVICE_PATH =
  '/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001';

export function loadS4Config(): S4Config {
  const host = process.env.S4_URL ?? '';
  const username = process.env.S4_USERNAME ?? '';
  const password = process.env.S4_PASSWORD ?? '';

  if (!host || !username || !password) {
    throw new Error('Missing S4_URL / S4_USERNAME / S4_PASSWORD in .env');
  }

  // Combine host (from .env) with the service path (defined above).
  const url = host.replace(/\/+$/, '') + SALES_ORDER_SERVICE_PATH;

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
import BigNumber from 'bignumber.js';
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
    const service = salesOrderService();
    const orders = await service.salesOrderApi
      .requestBuilder()
      .getAll()
      // expand the item lines so the detail view can show them in a table
      .expand(service.salesOrderApi.schema.ITEM)
      .top(20)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return orders.map((o) => ({
      salesOrder: o.salesOrder,
      salesOrderType: o.salesOrderType ?? '',
      soldToParty: o.soldToParty ?? '',
      salesOrganization: o.salesOrganization ?? '',
      items: (o.item ?? []).map((it) => ({
        salesOrderItem: it.salesOrderItem ?? '',
        material: it.product ?? '',
        // requestedQuantity is an Edm.Decimal (BigNumber) - send it as a string
        requestedQuantity: it.requestedQuantity?.toString() ?? '',
        requestedQuantityUnit: it.requestedQuantitySapUnit ?? it.requestedQuantityIsoUnit ?? '',
      })),
    }));
  };

  private createSalesOrder = async (req: cds.Request): Promise<SalesOrderView> => {
    const cfg = loadS4Config();
    const input = parseSalesOrder(req.data.order);

    const service = salesOrderService();
    const api = service.salesOrderApi;

    // Map the validated input items to S/4HANA SalesOrderItem entities.
    // Note the S/4 field names: material -> product, unit -> requestedQuantityIsoUnit
    // (S/4 expects the ISO unit code, e.g. "PCE", here — not the SAP-internal code).
    // Do not send salesOrderItem: S/4 rejects external item numbering through
    // this channel ("External numbering is not supported"), so let it auto-number.
    const items = input.items.map((it) =>
      service.salesOrderItemApi
        .entityBuilder()
        .product(it.material)
        .requestedQuantity(new BigNumber(it.requestedQuantity))
        .requestedQuantityIsoUnit(it.requestedQuantityUnit)
        .build()
    );

    const newOrder = api.entityBuilder()
      .salesOrderType(input.salesOrderType)
      .salesOrganization(input.salesOrganization)
      .distributionChannel(input.distributionChannel)
      .organizationDivision(input.organizationDivision)
      .salesDistrict(input.salesDistrict)
      .soldToParty(input.soldToParty)
      .item(items)
      .build();

    // The SDK converts the camelCase entity to PascalCase OData on the wire,
    // so log the target URL; the real diagnostic is the S/4 error body below.
    console.log('[createSalesOrder] →', cfg.url + '/SalesOrder');

    try {
      const created = await api.requestBuilder()
        .create(newOrder)
        .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

      return {
        salesOrder: created.salesOrder,
        salesOrderType: created.salesOrderType ?? '',
        soldToParty: created.soldToParty ?? '',
        salesOrganization: created.salesOrganization ?? '',
        // S/4 does not echo the created items on this response, so return what we sent
        items: input.items.map((it) => ({
          salesOrderItem: it.salesOrderItem ?? '',
          material: it.material ?? '',
          requestedQuantity: it.requestedQuantity ?? '',
          requestedQuantityUnit: it.requestedQuantityUnit ?? '',
        })),
      };
    } catch (err: any) {
      // Surface the real S/4 response instead of a generic 500.
      const status = err?.response?.status ?? err?.status;
      const body = err?.response?.data ?? err?.rootCause?.response?.data;
      console.error('[createSalesOrder] S/4 error status:', status);
      console.error('[createSalesOrder] S/4 error body:', JSON.stringify(body, null, 2));
      req.reject(status ?? 500, body?.error?.message ?? err?.message ?? 'S/4 call failed');
    }
  };
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent — `srv/CatalogService.js` (mashup handlers only)</strong></sub>

```javascript
const cds = require('@sap/cds');
const BigNumber = require('bignumber.js');
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
    const service = salesOrderService();
    const orders = await service.salesOrderApi
      .requestBuilder()
      .getAll()
      .expand(service.salesOrderApi.schema.ITEM)
      .top(20)
      .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

    return orders.map((o) => ({
      salesOrder: o.salesOrder,
      salesOrderType: o.salesOrderType || '',
      soldToParty: o.soldToParty || '',
      salesOrganization: o.salesOrganization || '',
      items: (o.item || []).map((it) => ({
        salesOrderItem: it.salesOrderItem || '',
        material: it.product || '',
        requestedQuantity: it.requestedQuantity ? it.requestedQuantity.toString() : '',
        requestedQuantityUnit: it.requestedQuantitySapUnit || it.requestedQuantityIsoUnit || '',
      })),
    }));
  };

  createSalesOrder = async (req) => {
    const cfg = loadS4Config();
    const input = parseSalesOrder(req.data.order);

    const service = salesOrderService();
    const api = service.salesOrderApi;

    const items = input.items.map((it) =>
      service.salesOrderItemApi
        .entityBuilder()
        .product(it.material)
        .requestedQuantity(new BigNumber(it.requestedQuantity))
        .requestedQuantityIsoUnit(it.requestedQuantityUnit)
        .build()
    );

    const newOrder = api.entityBuilder()
      .salesOrderType(input.salesOrderType)
      .salesOrganization(input.salesOrganization)
      .distributionChannel(input.distributionChannel)
      .organizationDivision(input.organizationDivision)
      .salesDistrict(input.salesDistrict)
      .soldToParty(input.soldToParty)
      .item(items)
      .build();

    console.log('[createSalesOrder] →', cfg.url + '/SalesOrder');

    try {
      const created = await api.requestBuilder()
        .create(newOrder)
        .execute({ url: cfg.url, username: cfg.username, password: cfg.password });

      return {
        salesOrder: created.salesOrder,
        salesOrderType: created.salesOrderType || '',
        soldToParty: created.soldToParty || '',
        salesOrganization: created.salesOrganization || '',
        items: input.items.map((it) => ({
          salesOrderItem: it.salesOrderItem || '',
          material: it.material || '',
          requestedQuantity: it.requestedQuantity || '',
          requestedQuantityUnit: it.requestedQuantityUnit || '',
        })),
      };
    } catch (err) {
      const status = (err && err.response && err.response.status) || err.status;
      const body = (err && err.response && err.response.data) ||
                   (err && err.rootCause && err.rootCause.response && err.rootCause.response.data);
      console.error('[createSalesOrder] S/4 error status:', status);
      console.error('[createSalesOrder] S/4 error body:', JSON.stringify(body, null, 2));
      req.reject(status || 500, (body && body.error && body.error.message) || err.message || 'S/4 call failed');
    }
  };
};
```

</div>

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 3 checklist

- [ ] `srv/types/sales-order.d.ts` holds all reusable interfaces.
- [ ] `config-loader.ts` reads host + credentials from `.env`, appends the service path in code, and provides `isODataV2` / `isODataV4` type guards.
- [ ] `payload-parser.ts` validates unknown JSON into a typed `SalesOrderInput`.
- [ ] `getSalesOrders` consumes GET via the request builder and `.expand(schema.ITEM)` so each order returns its item lines.
- [ ] `createSalesOrder` builds line items with `salesOrderItemApi`, attaches them with `.item(...)`, POSTs the order, and echoes the sent items (with `try/catch` surfacing the real S/4 error).
- [ ] `bignumber.js` installed (`npm i bignumber.js`).
- [ ] `npx tsc --noEmit` is clean.

Continue to **`step4_local_testing_destination.md`** to test against the live system.

<sub>**code by anubhav trainings**</sub>
