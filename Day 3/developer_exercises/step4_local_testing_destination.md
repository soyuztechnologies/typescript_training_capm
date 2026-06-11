# Step 4 — Local Testing Through a BTP Destination

### Connect your locally running CAP app to the real S/4HANA system using a BTP Destination service, then test GET and POST with a simple `.http` file.

---

## 🧾 Cheat Sheet

| Task | Command / Value |
|------|-----------------|
| Create destination service | `cf create-service destination lite s4-destination` |
| Create a service key | `cf create-service-key s4-destination s4-key` |
| View the key | `cf service-key s4-destination s4-key` |
| Bind locally (hybrid) | `cds bind -2 s4-destination` |
| Run with cloud bindings | `cds watch --profile hybrid` |
| Test file | `srv/tester.http` (VS Code REST Client extension) |
| Destination name | `S4HANA_SALESORDER` (used in code & config) |

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>The big idea of Step 4:</strong> hard-coding URLs and passwords is fine for a first local test, but the SAP way is a <strong>Destination</strong> — a named, central place that stores the URL, credentials and auth type. Your code just says "call destination <code>S4HANA_SALESORDER</code>" and BTP supplies the rest.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — how the sample project actually runs:</strong> the <code>capm-s4-mashup</code> sample in this folder connects with the <strong>inline <code>.env</code> credentials</strong> built by <code>config-loader.ts</code> (Step 3) — it does <strong>not</strong> ship a BTP Destination. The Destination shown in this step is the recommended path for <strong>cloud deployment</strong>, where you cannot bundle a <code>.env</code>. Use whichever fits: <code>.env</code> for local, Destination for BTP.
</div>

---

## 4.1 — Create the Destination in your BTP account

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — Destination:</strong> a Destination is like a saved contact card for a remote system. Instead of writing down someone's full address and phone every time, you save it once under a name and just say "call Mum". Here the "contact" is the S/4HANA Sales Order system.</em>
</div>

In the **BTP Cockpit**:

1. Go to your **Subaccount → Connectivity → Destinations**.
2. Click **New Destination** and fill in:

```text
Name:           S4HANA_SALESORDER
Type:           HTTP
URL:            http://122.162.240.164:8010
Proxy Type:     Internet
Authentication: BasicAuthentication
User:           <YOUR_S4_USER>
Password:       <YOUR_S4_PASSWORD>
```

<sub>**code by anubhav trainings**</sub>

3. Add these additional properties (used by the Cloud SDK):

```text
sap-client          = 100
HTML5.DynamicDestination = true
WebIDEEnabled       = true
```

<sub>**code by anubhav trainings**</sub>

4. **Save**, then click **Check Connection** — you want a green "200 / connection established".

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The Destination URL is the <strong>host only</strong> (no <code>/sap/opu/...</code> path). The service path comes from your generated client / CAP model. Mixing the full path into the Destination URL is the #1 cause of 404s.
</div>

---

## 4.2 — Create the Destination service instance and key, then bind

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — service instance + key:</strong> the Destination <em>service</em> is the BTP capability; an <em>instance</em> is your own copy of it; a <em>service key</em> is the username/password your local app uses to talk to that instance. Binding tells your project to use that key.</em>
</div>

Log in and create the instance + key:

```bash
cf login -a <your-api-endpoint>
cf create-service destination lite s4-destination
cf create-service-key s4-destination s4-key
cf service-key s4-destination s4-key
```

<sub>**code by anubhav trainings**</sub>

Bind it to your project for local "hybrid" testing:

```bash
cds bind -2 s4-destination
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — hybrid testing:</strong> "hybrid" means your code runs on your laptop, but the <strong>service bindings</strong> (Destination, XSUAA, etc.) come live from the cloud. You get cloud-realistic behaviour without deploying every time.</em>
</div>

Tell CAP about the Destination in `package.json` (the `hybrid` profile):

```json
{
  "cds": {
    "requires": {
      "S4HANA_SALESORDER": {
        "kind": "odata-v4",
        "[hybrid]": {
          "credentials": { "destination": "S4HANA_SALESORDER", "path": "/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001" }
        }
      }
    }
  }
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>kind</code> is <code>odata-v4</code> to match our V4 Sales Order service (the <code>odata4</code> URL). This must agree with the Cloud SDK runtime you installed in Step 2 (<code>@sap-cloud-sdk/odata-v4</code>).
</div>

---

## 4.3 — Point the SDK at the Destination instead of `.env`

In the cloud / hybrid mode, replace the inline `{ url, username, password }` with a Destination name. The Cloud SDK resolves it automatically.

```typescript
// Step 3 used inline credentials from .env.
// In hybrid/cloud mode, pass a destination name instead:
const orders = await salesOrderService()
  .salesOrderApi.requestBuilder()
  .getAll()
  .top(20)
  .execute({ destinationName: 'S4HANA_SALESORDER' });
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#eeeeee; border-radius: 5px; padding: 1px 12px;">

<sub>🗄️ <strong>(legacy) JavaScript equivalent</strong></sub>

```javascript
const orders = await salesOrderService()
  .salesOrderApi.requestBuilder()
  .getAll()
  .top(20)
  .execute({ destinationName: 'S4HANA_SALESORDER' });
```

</div>

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — one switch, two modes:</strong> use <code>{ url, username, password }</code> from <code>.env</code> for a quick offline test, and <code>{ destinationName: '...' }</code> for hybrid/cloud. A small helper can pick the right one based on whether bindings are present.</em>
</div>

---

## 4.4 — Run in hybrid mode

```bash
cds watch --profile hybrid
```

<sub>**code by anubhav trainings**</sub>

You should see CAP log that it connected the `S4HANA_SALESORDER` destination. Now we drive it with an `.http` file.

---

## 4.5 — Test GET and POST with `srv/tester.http`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the `.http` file:</strong> with the VS Code "REST Client" extension you can write plain-text HTTP requests in a file and click "Send Request" above each one. No Postman needed — the requests live in your repo next to the code.</em>
</div>

Create `srv/tester.http`:

```http
@host = http://localhost:4004

### 1) GET — read sales orders from S/4HANA via the mashup
GET {{host}}/odata/v4/catalog/getSalesOrders()
Accept: application/json

### 2) POST — create a sales order through the mashup action
POST {{host}}/odata/v4/catalog/createSalesOrder
Content-Type: application/json

{
  "order": {
    "salesOrderType": "TA",
    "salesOrganization": "BMGB",
    "distributionChannel": "DB",
    "organizationDivision": "AC",
    "salesDistrict": "000001",
    "soldToParty": "49",
    "salesOrderDate": "2026-04-06",
    "items": [
      {
        "salesOrderItem": "10",
        "material": "220",
        "requestedQuantity": "5",
        "requestedQuantityUnit": "PCE"
      }
    ]
  }
}
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — this is the CAP payload, not the S/4 wire payload:</strong> we send our clean camelCase fields (<code>material</code>, <code>requestedQuantityUnit</code>). The handler maps them to S/4's names before calling — <code>material → Product</code> and the ISO unit <code>"PCE"</code> → <code>RequestedQuantityIsoUnit</code>. Use <code>salesOrderType</code> <code>"TA"</code> (standard order) and a valid ISO unit like <code>"PCE"</code>; the SAP-internal <code>"PC"</code> is rejected on this channel. The <code>salesOrderItem</code> number is ignored — S/4 auto-numbers items.
</div>

For reference, the **raw S/4HANA V4 payload** (what the SDK actually sends after the handler's mapping) looks like this — note `Product`, `RequestedQuantityISOUnit`, and **no** `SalesOrderItem`:

```json
{
  "SalesOrderType": "TA",
  "SalesOrganization": "BMGB",
  "DistributionChannel": "DB",
  "OrganizationDivision": "AC",
  "SalesDistrict": "000001",
  "SoldToParty": "49",
  "SalesOrderDate": "2026-04-06",
  "_Item": [
    {
      "Product": "220",
      "RequestedQuantity": "5",
      "RequestedQuantityISOUnit": "PCE"
    }
  ]
}
```

<sub>**code by anubhav trainings**</sub>

---

## 4.6 — Direct test against S/4HANA (bypass CAP, optional)

Sometimes you want to confirm the system itself works before blaming your code. You can call S/4HANA directly from the same `.http` file:

```http
@s4host = http://122.162.240.164:8010
@s4path = /sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001
@auth = Basic {{$dotenv S4_USERNAME}}:{{$dotenv S4_PASSWORD}}

### Read straight from S/4HANA
GET {{s4host}}{{s4path}}/SalesOrder?$top=5
Authorization: {{auth}}
Accept: application/json
```

<sub>**code by anubhav trainings**</sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> A POST that changes data in S/4HANA usually needs a CSRF token: first send a GET with header <code>x-csrf-token: fetch</code>, read the returned token, then send the POST with that token. The Cloud SDK does this for you automatically — which is one more reason to go through the generated client rather than raw HTTP.
</div>

---

## 4.7 — Reading the results

| Request | Expected | If it fails |
|---------|----------|-------------|
| GET sales orders | `200` + JSON array of orders | 401 → wrong Destination credentials; 404 → Destination URL has a path in it |
| POST sales order | `201` + the created order with a `salesOrder` number | 400 → payload failed `parseSalesOrder`; 403 → CSRF/authorization |
| Direct S/4HANA GET | `200` + raw S/4HANA JSON | proves system vs. code: if this works but the mashup fails, the bug is in your handler/config |

<sub>**code by anubhav trainings**</sub>

---

## 4.8 — Final files for Step 4

### `srv/tester.http`

```http
@host = http://localhost:4004

### GET — read sales orders via the mashup
GET {{host}}/odata/v4/catalog/getSalesOrders()
Accept: application/json

### POST — create a sales order via the mashup action
POST {{host}}/odata/v4/catalog/createSalesOrder
Content-Type: application/json

{
  "order": {
    "salesOrderType": "TA",
    "salesOrganization": "BMGB",
    "distributionChannel": "DB",
    "organizationDivision": "AC",
    "salesDistrict": "000001",
    "soldToParty": "49",
    "salesOrderDate": "2026-04-06",
    "items": [
      {
        "salesOrderItem": "10",
        "material": "220",
        "requestedQuantity": "5",
        "requestedQuantityUnit": "PCE"
      }
    ]
  }
}
```

<sub>**code by anubhav trainings**</sub>

### `package.json` (destination requires block)

```json
{
  "cds": {
    "requires": {
      "S4HANA_SALESORDER": {
        "kind": "odata-v4",
        "[hybrid]": {
          "credentials": {
            "destination": "S4HANA_SALESORDER",
            "path": "/sap/opu/odata4/sap/api_salesorder/srvd_a2x/sap/salesorder/0001"
          }
        }
      }
    }
  }
}
```

<sub>**code by anubhav trainings**</sub>

---

## ✅ Step 4 checklist

- [ ] Destination `S4HANA_SALESORDER` created in BTP and "Check Connection" is green.
- [ ] `destination` service instance + service key created and bound (`cds bind`).
- [ ] `package.json` hybrid profile points to the Destination.
- [ ] SDK calls switched to `{ destinationName: 'S4HANA_SALESORDER' }` for hybrid/cloud.
- [ ] `cds watch --profile hybrid` connects to the Destination.
- [ ] `srv/tester.http` GET returns `200` with orders.
- [ ] `srv/tester.http` POST returns `201` with a created order number.

---

## 🎓 You did it — full round-trip

You now have a single TypeScript CAP application that:

- Stores and validates **local** Material and Plant data (Step 1).
- Owns a **generated, typed** S/4HANA client instead of hand-written interfaces (Step 2).
- **Consumes** GET/POST against the remote service with clean, modular, type-safe code (Step 3).
- Talks to the **live system** through a BTP Destination, verified end-to-end (Step 4).

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 The same four-step pattern — scaffold, generate, implement, test through a destination — works for <strong>any</strong> SAP system you need to integrate. Master it once, reuse it everywhere.</em>
</div>

<sub>**code by anubhav trainings**</sub>
