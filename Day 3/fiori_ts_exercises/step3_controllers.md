<h1 align="center">🎛️ Step 3 — Convert Controllers + Shared Types</h1>

<p align="center"><em>Convert the remaining controllers to TypeScript with typed lifecycle hooks and event handlers, create a reusable <code>types/datatype.d.ts</code>, type the JSON model, and type the OData create callback (success + error).</em></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>

---

## 🧾 Cheat Sheet

| Concept | JavaScript | TypeScript |
|---------|-----------|-----------|
| Lifecycle hook | `onInit: function () {…}` | `public override onInit(): void {…}` |
| Event handler | `onSearch: function (oEvent) {…}` | `public onSearch(oEvent: SearchField$SearchEvent): void {…}` |
| Field on controller | `oField: null` | `private oField?: Input;` |
| Router | `this.getOwnerComponent().getRouter()` | `(this.getOwnerComponent() as UIComponent).getRouter()` |
| Model data | untyped `oData.value` | `(oData as SalesOrdersResponse).value` |
| List filter | `oList.getBinding("items").filter(f)` | `(oList.getBinding("items") as ListBinding).filter(f)` |
| Shared shapes | none | `types/datatype.d.ts` interfaces |
| OData callback | `.then(function(oData){…})` | `.then((oData: CreateOrderResponse) => {…})` |

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Goal of Step 3:</strong> turn the "click handlers" into <strong>typed</strong> click handlers. Once an event object has a type, the editor tells you exactly which parameters exist — no more guessing whether it is <code>getParameter("query")</code> or <code>getParameter("value")</code>.</em>
</div>

---

## 3.0 — First, the shared vocabulary: `types/datatype.d.ts`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>.d.ts</code> declaration file:</strong> a file that holds <strong>only types</strong>, no runnable code. Think of it as a shared dictionary: we describe the shape of a "Sales Order" once, and every controller imports that one definition instead of re-describing it. When the API changes, you fix one file.</em>
</div>

Create a new file **`webapp/types/datatype.d.ts`**:

```ts
// ----- A single line item inside a sales order -----
export interface SalesOrderItem {
    salesOrderItem: string;
    material: string;
    requestedQuantity: string;
    requestedQuantityUnit: string;
}

// ----- One sales order (header + its items) -----
export interface SalesOrder {
    salesOrder: string;
    salesOrderType: string;
    salesOrganization: string;
    distributionChannel?: string;
    organizationDivision?: string;
    salesDistrict?: string;
    soldToParty: string;
    salesOrderDate?: string;
    items?: SalesOrderItem[];
}

// ----- New order typed by the Add form (no salesOrder id yet — the backend assigns it) -----
export interface NewSalesOrder {
    salesOrderType: string;
    salesOrganization: string;
    distributionChannel: string;
    organizationDivision: string;
    salesDistrict: string;
    soldToParty: string;
    salesOrderDate: string;
    items: SalesOrderItem[];
}

// ----- OData V4 wraps collections in a "value" array -----
export interface SalesOrdersResponse {
    value: SalesOrder[];
}

// ----- Shape returned by the createSalesOrder action -----
export interface CreateOrderResponse extends SalesOrder {
    // the action echoes the full order back, incl. the new salesOrder id
}

// ----- Error envelope returned by OData on failure -----
export interface ODataError {
    error?: {
        code?: string;
        message?: string;
    };
}

// ----- Value-help row shapes used by the fragments -----
export interface Supplier {
    name: string;
    city: string;
}

export interface City {
    name: string;
    famousFor: string;
}
```

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The <code>?</code> after a property name (e.g. <code>items?</code>) means "optional — may be missing". We mark fields optional when the API does not always send them, so TypeScript reminds us to check before using them.
</div>

---

## 3.1 — Convert the List controller (`View1`)

This is the richest controller: it has an `onInit` lifecycle hook, a `fetch()` call, a search handler, and an item-press handler. We type all four.

### 3.1a — The lifecycle hook `onInit`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — lifecycle hook:</strong> <code>onInit</code> is a method UI5 calls <strong>automatically</strong> once, when the view is first created. Typing it <code>public override onInit(): void</code> tells TypeScript "this returns nothing" — and the <code>override</code> keyword (required by <code>noImplicitOverride</code> from Step 1) makes the compiler verify we really are overriding the base <code>Controller.onInit</code>, not accidentally inventing a new method.</em>
</div>

<table>
<tr>
<th>❌ Before — <code>View1.controller.js</code></th>
<th>✅ After — <code>View1.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define([
    "com/ats/manageorder/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
],
function (BaseController, MessageBox, MessageToast,
          Filter, FilterOperator, JSONModel) {
    return BaseController.extend(
      "com.ats.manageorder.controller.View1", {
        onInit: function () {
            this.oRouter =
              this.getOwnerComponent().getRouter();
            this.getOwnerComponent()
              .setModel(new JSONModel(), "orders");
            this.getSalesOrders();
        },
```

</td>
<td valign="top">

```ts
import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/m/routing/Router";
import List from "sap/m/List";
import ListBase from "sap/m/ListBase";
import { SalesOrdersResponse } from "../types/datatype";
import { SearchField$SearchEvent } from "sap/m/SearchField";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class View1 extends BaseController {
    private oRouter: Router;

    public override onInit(): void {
        this.oRouter =
          (this.getOwnerComponent() as UIComponent).getRouter() as Router;
        (this.getOwnerComponent() as UIComponent)
          .setModel(new JSONModel(), "orders");
        this.getSalesOrders();
    }
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — why <code>as UIComponent</code>?</strong> <code>getOwnerComponent()</code> is typed to return a generic <code>Component</code>, which has no <code>getRouter()</code>. We <strong>narrow</strong> it with <code>as UIComponent</code> ("trust me, it is the richer type") so the typed <code>getRouter()</code> becomes available. This <code>as</code> keyword is called a <em>type assertion</em>.
</div>

### 3.1b — The `fetch` + typed response

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — typing an API response:</strong> a raw <code>fetch().json()</code> gives back <code>any</code> (TypeScript knows nothing about it). By asserting <code>oData as SalesOrdersResponse</code>, we promise the shape, and from that point the editor autocompletes <code>.value</code> and knows each item is a <code>SalesOrder</code>.</em>
</div>

<table>
<tr>
<th>❌ Before</th>
<th>✅ After</th>
</tr>
<tr>
<td valign="top">

```js
getSalesOrders: function () {
    var that = this;
    fetch("/odata/v4/catalog/getSalesOrders()", {
        headers: { "Accept": "application/json" }
    })
    .then(function (oResponse) {
        return oResponse.json();
    })
    .then(function (oData) {
        that.getOwnerComponent()
          .getModel("orders")
          .setData(oData.value || []);
    })
    .catch(function (oError) {
        MessageBox.error(
          "Unable to load sales orders: "
          + oError.message);
    });
},
```

</td>
<td valign="top">

```ts
public getSalesOrders(): void {
    fetch("/odata/v4/catalog/getSalesOrders()", {
        headers: { Accept: "application/json" }
    })
    .then((oResponse: Response) => oResponse.json())
    .then((oData: SalesOrdersResponse) => {
        const oModel = (this.getOwnerComponent() as UIComponent)
            .getModel("orders") as JSONModel;
        oModel.setData(oData.value || []);
    })
    .catch((oError: Error) => {
        MessageBox.error(
          "Unable to load sales orders: " + oError.message);
    });
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — arrow functions kill <code>var that = this</code>:</strong> the old code saved <code>this</code> into <code>that</code> because a normal <code>function</code> loses <code>this</code>. An <strong>arrow function</strong> <code>(oData) => {…}</code> keeps the surrounding <code>this</code>, so the <code>that</code> trick disappears entirely.</em>
</div>

### 3.1c — Typed event handlers (`onSearch`, `onAdd`, `onItemPress`)

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — typed events:</strong> every UI5 control ships a type for each event it fires, e.g. <code>SearchField$SearchEvent</code>. Typing the parameter means <code>oEvent.getParameter("query")</code> is checked — if you mistype <code>"querry"</code>, the compiler stops you.</em>
</div>

<table>
<tr>
<th>❌ Before</th>
<th>✅ After</th>
</tr>
<tr>
<td valign="top">

```js
onAdd: function () {
    this.oRouter.navTo("addOrder");
},
onSearch: function (oEvent) {
    var searchStr = oEvent.getParameter("query");
    var oFilter1 = new Filter("salesOrder",
        FilterOperator.Contains, searchStr);
    var oFilter2 = new Filter("salesOrderType",
        FilterOperator.Contains, searchStr);
    var aFilter = [oFilter1, oFilter2];
    var oFilter = new Filter({
        filters: aFilter, and: false
    });
    var oList = this.getView().byId("idList");
    oList.getBinding("items").filter(oFilter);
},
onItemPress: function (oEvent) {
    var oListItem = oEvent.getParameter("listItem");
    var sPath = oListItem
        .getBindingContext("orders").getPath();
    var sIndex = sPath.split("/")[
        sPath.split("/").length - 1];
    this.oRouter.navTo("spiderman",
        { orderId: sIndex });
}
```

</td>
<td valign="top">

```ts
public onAdd(): void {
    this.oRouter.navTo("addOrder");
}

public onSearch(oEvent: SearchField$SearchEvent): void {
    const searchStr = oEvent.getParameter("query") ?? "";
    const oFilter1 = new Filter("salesOrder",
        FilterOperator.Contains, searchStr);
    const oFilter2 = new Filter("salesOrderType",
        FilterOperator.Contains, searchStr);
    const oFilter = new Filter({
        filters: [oFilter1, oFilter2], and: false
    });
    const oList = this.getView()?.byId("idList") as List;
    // narrow the generic Binding to ListBinding so .filter() exists
    (oList.getBinding("items") as ListBinding)?.filter(oFilter);
}

public onItemPress(oEvent: ListBase$SelectionChangeEvent): void {
    const oListItem = oEvent.getParameter("listItem");
    const sPath = oListItem!
        .getBindingContext("orders")!.getPath();
    const aParts = sPath.split("/");
    const sIndex = aParts[aParts.length - 1];
    this.oRouter.navTo("spiderman", { orderId: sIndex });
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — the <code>?</code> and <code>!</code> operators:</strong> <code>this.getView()?.byId(...)</code> uses <code>?.</code> ("optional chaining" — skip if null). <code>getBindingContext("orders")!</code> uses <code>!</code> ("non-null assertion" — "I am certain this is not null"). Our Step 1 <code>tsconfig.json</code> keeps <code>strict: false</code>, so these guards are <strong>not</strong> forced by the compiler yet — we write them as <em>good defensive habit</em> and to future-proof the code for the day you flip <code>strictNullChecks</code> (or full <code>strict</code>) on. Even off, <code>?.</code> still protects against a real <code>null</code> at runtime.
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — fixing <code>Property 'filter' does not exist on type 'Binding'</code>:</strong> <code>oList.getBinding("items")</code> is typed to return the <strong>generic base class</strong> <code>Binding</code>, which does <em>not</em> have a <code>.filter()</code> method — only its subclass <code>ListBinding</code> does. So calling <code>.filter()</code> straight away raises <code>ts(2339)</code>. The fix is a <strong>type assertion</strong>: import <code>ListBinding from "sap/ui/model/ListBinding"</code> and narrow the binding before filtering —
<br><code>(oList.getBinding("items") as ListBinding)?.filter(oFilter);</code><br>
This is the same "trust me, it is the richer type" pattern we used for <code>getOwnerComponent() as UIComponent</code>. At runtime the binding really <em>is</em> a <code>ListBinding</code>, so the cast is safe.
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — base type vs subclass:</strong> UI5 has one generic <code>Binding</code> and several specialised subclasses (<code>ListBinding</code>, <code>PropertyBinding</code>, <code>ContextBinding</code>). Aggregation bindings like a list's <code>items</code> are <code>ListBinding</code>s — only they can <code>filter()</code>, <code>sort()</code> and <code>getCurrentContexts()</code>. TypeScript gives you the safe, generic type by default and asks <em>you</em> to confirm the specific one you know it is.</em>
</div>

---

## 3.2 — Convert the `Add` controller (create form + typed OData callback)

The `Add` controller is the busiest "write" controller. The original `Add.controller.js` has **six** methods — we convert them one at a time so nothing is skipped:

| Method | What it does | Main typing job |
|--------|--------------|-----------------|
| `onInit` | wire the route + first reset | typed router, `override` |
| `resetForm` | seed a fresh blank order | `NewSalesOrder` typed default |
| `onAddItem` | add an empty item row | typed `SalesOrderItem[]` array |
| `onDeleteItem` | remove the selected row | typed `Table` + binding context |
| `onSave` | POST the order, handle reply | success vs error response shapes |
| `onCancel` | leave without saving | typed router nav |

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — input shape vs stored shape:</strong> the order the user is <em>creating</em> has no <code>salesOrder</code> id yet — the backend assigns it on save. So the form is typed as <code>NewSalesOrder</code> (no id), while the order we read back and store in the list is a full <code>SalesOrder</code> / <code>CreateOrderResponse</code> (with id). Same data, two life-stages, two types.</em>
</div>

### 3.2a — `onInit` + `resetForm` (wire the route, seed a typed default)

<table>
<tr>
<th>❌ Before — <code>Add.controller.js</code></th>
<th>✅ After — <code>Add.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
onInit: function () {
    this.oRouter =
      this.getOwnerComponent().getRouter();
    // start fresh whenever the add route is hit
    this.oRouter.getRoute("addOrder")
      .attachMatched(this.resetForm, this);
},
resetForm: function () {
    var oNewOrder = {
        salesOrderType: "TA",
        salesOrganization: "BMGB",
        distributionChannel: "DB",
        organizationDivision: "AC",
        salesDistrict: "000001",
        soldToParty: "49",
        salesOrderDate: "2026-04-06",
        items: [
            {
                salesOrderItem: "10",
                material: "220",
                requestedQuantity: "5",
                requestedQuantityUnit: "PCE"
            }
        ]
    };
    this.getView().setModel(
      new JSONModel(oNewOrder), "newOrder");
},
```

</td>
<td valign="top">

```ts
public override onInit(): void {
    this.oRouter =
      (this.getOwnerComponent() as UIComponent)
        .getRouter() as Router;
    // start fresh whenever the add route is hit
    this.oRouter.getRoute("addOrder")
      ?.attachMatched(this.resetForm, this);
}

private resetForm(): void {
    // default payload, typed as NewSalesOrder (no id yet)
    const oNewOrder: NewSalesOrder = {
        salesOrderType: "TA",
        salesOrganization: "BMGB",
        distributionChannel: "DB",
        organizationDivision: "AC",
        salesDistrict: "000001",
        soldToParty: "49",
        salesOrderDate: "2026-04-06",
        items: [
            {
                salesOrderItem: "10",
                material: "220",
                requestedQuantity: "5",
                requestedQuantityUnit: "PCE"
            }
        ]
    };
    this.getView()?.setModel(
      new JSONModel(oNewOrder), "newOrder");
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Typing <code>oNewOrder: NewSalesOrder</code> turns the default object into a <strong>checked template</strong> — misspell <code>salesOrgaization</code> or forget <code>items</code> and the compiler complains right here, long before the POST. <code>resetForm</code> is <code>private</code> because only this controller's route handler calls it.
</div>

### 3.2b — `onAddItem` + `onDeleteItem` (typed model arrays + table selection)

<table>
<tr>
<th>❌ Before — <code>Add.controller.js</code></th>
<th>✅ After — <code>Add.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
onAddItem: function () {
    var oModel =
      this.getView().getModel("newOrder");
    var aItems = oModel.getProperty("/items");
    aItems.push({
        salesOrderItem: "",
        material: "",
        requestedQuantity: "",
        requestedQuantityUnit: ""
    });
    oModel.setProperty("/items", aItems);
},
onDeleteItem: function () {
    var oTable =
      this.getView().byId("idNewItems");
    var oItem = oTable.getSelectedItem();
    if (!oItem) {
        MessageToast.show(
          "Please select an item to delete.");
        return;
    }
    var sPath = oItem
      .getBindingContext("newOrder").getPath();
    var iIndex = parseInt(
      sPath.split("/")[
        sPath.split("/").length - 1], 10);
    var oModel =
      this.getView().getModel("newOrder");
    var aItems = oModel.getProperty("/items");
    aItems.splice(iIndex, 1);
    oModel.setProperty("/items", aItems);
},
```

</td>
<td valign="top">

```ts
public onAddItem(): void {
    const oModel =
      this.getView()?.getModel("newOrder") as JSONModel;
    const aItems =
      oModel.getProperty("/items") as SalesOrderItem[];
    // add a new empty item row to the table
    aItems.push({
        salesOrderItem: "",
        material: "",
        requestedQuantity: "",
        requestedQuantityUnit: ""
    });
    oModel.setProperty("/items", aItems);
}

public onDeleteItem(): void {
    // Step 1: get the selected row of the items table
    const oTable =
      this.getView()?.byId("idNewItems") as Table;
    const oItem = oTable.getSelectedItem();
    if (!oItem) {
        MessageToast.show(
          "Please select an item to delete.");
        return;
    }
    // Step 2: find the index of the row in the array
    const sPath =
      oItem.getBindingContext("newOrder")!.getPath();
    const iIndex = parseInt(sPath.split("/").pop()!, 10);
    // Step 3: remove that row and refresh the binding
    const oModel =
      this.getView()?.getModel("newOrder") as JSONModel;
    const aItems =
      oModel.getProperty("/items") as SalesOrderItem[];
    aItems.splice(iIndex, 1);
    oModel.setProperty("/items", aItems);
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>getProperty</code> returns <code>any</code>:</strong> a <code>JSONModel</code> cannot know what is stored at <code>"/items"</code>, so it hands back <code>any</code>. We immediately pin it with <code>as SalesOrderItem[]</code> — now <code>.push(...)</code> only accepts objects with the four correct fields, and <code>.splice</code> stays type-safe.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>this.getView()?.byId("idNewItems")</code> is typed as the generic <code>Element</code>, so we narrow it with <code>as Table</code> (from <code>sap/m/Table</code>) to reach <code>getSelectedItem()</code>. We also simplified the index math: <code>sPath.split("/").pop()!</code> grabs the last path segment directly.
</div>

### 3.2c — `onSave` (the typed POST callback)

This is the heart of the controller: it `POST`s the new order and reads back **two different shapes** — a success body and an error body — so we lean on `CreateOrderResponse` and `ODataError`.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — success shape vs error shape:</strong> a server reply can mean "it worked" (here is the order) or "it failed" (here is an error). Giving each branch its own type lets the editor protect us: on success we can read <code>.salesOrder</code>; on failure we read <code>.error.message</code> — and TypeScript won't let us mix them up.</em>
</div>

<table>
<tr>
<th>❌ Before — <code>Add.controller.js</code></th>
<th>✅ After — <code>Add.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
onSave: function () {
    var that = this;
    var oOrder = this.getView()
        .getModel("newOrder").getData();
    fetch("/odata/v4/catalog/createSalesOrder", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ order: oOrder })
    })
    .then(function (oResponse) {
        return oResponse.json().then(function (oData) {
            return { ok: oResponse.ok, body: oData };
        });
    })
    .then(function (oResult) {
        if (!oResult.ok) {
            var sMsg = (oResult.body
                && oResult.body.error
                && oResult.body.error.message)
                || "Create failed.";
            MessageBox.error(sMsg);
            return;
        }
        MessageToast.show("Sales order "
            + oResult.body.salesOrder + " created.");
        var oOrdersModel = that.getOwnerComponent()
            .getModel("orders");
        var aOrders = oOrdersModel.getData();
        if (!Array.isArray(aOrders)) { aOrders = []; }
        aOrders.unshift(oResult.body);
        oOrdersModel.setData(aOrders);
        that.oRouter.navTo("spiderman", { orderId: 0 });
    })
    .catch(function (oError) {
        MessageBox.error(
          "Create failed: " + oError.message);
    });
}
```

</td>
<td valign="top">

```ts
public onSave(): void {
    const oOrder = (this.getView()!
        .getModel("newOrder") as JSONModel)
        .getData() as NewSalesOrder;

    fetch("/odata/v4/catalog/createSalesOrder", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ order: oOrder })
    })
    .then(async (oResponse: Response) => {
        const body = await oResponse.json();
        return { ok: oResponse.ok, body };
    })
    .then((oResult: { ok: boolean; body: CreateOrderResponse & ODataError }) => {
        if (!oResult.ok) {
            const sMsg =
                oResult.body?.error?.message ?? "Create failed.";
            MessageBox.error(sMsg);
            return;
        }
        MessageToast.show(
            `Sales order ${oResult.body.salesOrder} created.`);

        const oOrdersModel = (this.getOwnerComponent() as UIComponent)
            .getModel("orders") as JSONModel;
        const aOrders: SalesOrder[] =
            Array.isArray(oOrdersModel.getData())
                ? oOrdersModel.getData() : [];
        aOrders.unshift(oResult.body);
        oOrdersModel.setData(aOrders);
        this.oRouter.navTo("spiderman", { orderId: 0 });
    })
    .catch((oError: Error) => {
        MessageBox.error("Create failed: " + oError.message);
    });
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — <code>CreateOrderResponse & ODataError</code>:</strong> the <code>&</code> is an <strong>intersection type</strong> — "this object could carry success fields <em>and</em> error fields". That matches reality: we read the body before we know if it succeeded, so we type it as both, then branch on <code>oResult.ok</code>.
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The POST body <code>oOrder</code> is read as <code>NewSalesOrder</code> (no id), but the <strong>response</strong> we <code>unshift</code> into the shared "orders" list is a full <code>CreateOrderResponse</code> (which <code>extends SalesOrder</code>, so it carries the new <code>salesOrder</code> id). The two types meeting here is exactly the input-vs-stored split from the start of §3.2.
</div>

### 3.2d — `onCancel` (typed router nav)

<table>
<tr>
<th>❌ Before — <code>Add.controller.js</code></th>
<th>✅ After — <code>Add.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
onCancel: function () {
    // leave the create screen without saving
    this.oRouter.navTo("leftSide");
}
```

</td>
<td valign="top">

```ts
public onCancel(): void {
    // leave the create screen without saving
    this.oRouter.navTo("leftSide");
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — barely any change here:</strong> <code>onCancel</code> shows that not every method gets longer in TypeScript. A one-liner with a typed <code>this.oRouter</code> just gains its <code>public</code> + return type. The value is consistency: every handler now reads the same way.</em>
</div>

### ✅ Complete `Add.controller.ts`

<details open>
<summary><b>webapp/controller/Add.controller.ts</b> (all six methods)</summary>

```ts
import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/m/routing/Router";
import Table from "sap/m/Table";
import {
    NewSalesOrder,
    SalesOrder,
    SalesOrderItem,
    CreateOrderResponse,
    ODataError
} from "../types/datatype";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class Add extends BaseController {
    private oRouter: Router;

    public override onInit(): void {
        // here we need the router object - get it from our Component
        this.oRouter =
            (this.getOwnerComponent() as UIComponent).getRouter() as Router;
        // whenever the add route is hit, start with a fresh empty order
        this.oRouter.getRoute("addOrder")?.attachMatched(this.resetForm, this);
    }

    private resetForm(): void {
        // default payload mirrors the demo order; typed as NewSalesOrder (no id yet)
        const oNewOrder: NewSalesOrder = {
            salesOrderType: "TA",
            salesOrganization: "BMGB",
            distributionChannel: "DB",
            organizationDivision: "AC",
            salesDistrict: "000001",
            soldToParty: "49",
            salesOrderDate: "2026-04-06",
            items: [
                {
                    salesOrderItem: "10",
                    material: "220",
                    requestedQuantity: "5",
                    requestedQuantityUnit: "PCE"
                }
            ]
        };
        this.getView()?.setModel(new JSONModel(oNewOrder), "newOrder");
    }

    public onAddItem(): void {
        // add a new empty item row to the table
        const oModel = this.getView()?.getModel("newOrder") as JSONModel;
        const aItems = oModel.getProperty("/items") as SalesOrderItem[];
        aItems.push({
            salesOrderItem: "",
            material: "",
            requestedQuantity: "",
            requestedQuantityUnit: ""
        });
        oModel.setProperty("/items", aItems);
    }

    public onDeleteItem(): void {
        // Step 1: get the selected row of the items table
        const oTable = this.getView()?.byId("idNewItems") as Table;
        const oItem = oTable.getSelectedItem();
        if (!oItem) {
            MessageToast.show("Please select an item to delete.");
            return;
        }
        // Step 2: find the index of the row inside the items array
        const sPath = oItem.getBindingContext("newOrder")!.getPath();
        const iIndex = parseInt(sPath.split("/").pop()!, 10);
        // Step 3: remove that row and refresh the binding
        const oModel = this.getView()?.getModel("newOrder") as JSONModel;
        const aItems = oModel.getProperty("/items") as SalesOrderItem[];
        aItems.splice(iIndex, 1);
        oModel.setProperty("/items", aItems);
    }

    public onSave(): void {
        // collect the order data the user entered (input shape, no id yet)
        const oOrder = (this.getView()!
            .getModel("newOrder") as JSONModel).getData() as NewSalesOrder;

        // POST to the CAP action createSalesOrder(order: SalesOrderInput)
        fetch("/odata/v4/catalog/createSalesOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ order: oOrder })
        })
        .then(async (oResponse: Response) => {
            // read body together with the http status so we can show S/4 errors
            const body = await oResponse.json();
            return { ok: oResponse.ok, body };
        })
        .then((oResult: { ok: boolean; body: CreateOrderResponse & ODataError }) => {
            if (!oResult.ok) {
                const sMsg = oResult.body?.error?.message ?? "Create failed.";
                MessageBox.error(sMsg);
                return;
            }
            MessageToast.show(`Sales order ${oResult.body.salesOrder} created.`);

            // put the freshly created order at the top of the shared list
            const oOrdersModel = (this.getOwnerComponent() as UIComponent)
                .getModel("orders") as JSONModel;
            const aOrders: SalesOrder[] =
                Array.isArray(oOrdersModel.getData()) ? oOrdersModel.getData() : [];
            aOrders.unshift(oResult.body);
            oOrdersModel.setData(aOrders);

            // open the new order in front of the user - it is now at index 0
            this.oRouter.navTo("spiderman", { orderId: 0 });
        })
        .catch((oError: Error) => {
            MessageBox.error("Create failed: " + oError.message);
        });
    }

    public onCancel(): void {
        // leave the create screen without saving
        this.oRouter.navTo("leftSide");
    }
}
```

</details>

<sub><b>code by anubhav trainings</b></sub>

---

## 3.3 — Convert the detail controllers (`View2`, `View3`)

These follow the same recipe. The key new idea is typing the **route-matched** event and the private fragment fields.

### Typed `attachMatched` and fragment fields (`View2`)

<table>
<tr>
<th>❌ Before — <code>View2.controller.js</code></th>
<th>✅ After — <code>View2.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
return BaseController.extend(
  "com.ats.manageorder.controller.View2", {
    onInit: function () {
        this.oRouter =
          this.getOwnerComponent().getRouter();
        this.oRouter.getRoute("spiderman")
          .attachMatched(this.herculis, this);
    },
    herculis: function (oEvent) {
        var oView2 = this.getView();
        var sIndex = oEvent
          .getParameter("arguments").orderId;
        oView2.bindElement({
            path: "/" + sIndex, model: "orders"
        });
    },
    oField: null,
    oSupplierPopup: null,
    oCityPopup: null,
    // ...onFilter / onF4Help / onPopupSelect
```

</td>
<td valign="top">

```ts
import BaseController from "./BaseController";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/m/routing/Router";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import Input from "sap/m/Input";
import SelectDialog from "sap/m/SelectDialog";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class View2 extends BaseController {
    private oRouter: Router;
    private oField?: Input;
    private oSupplierPopup?: SelectDialog;
    private oCityPopup?: SelectDialog;

    public override onInit(): void {
        this.oRouter =
          (this.getOwnerComponent() as UIComponent)
            .getRouter() as Router;
        this.oRouter.getRoute("spiderman")
          ?.attachMatched(this.herculis, this);
    }

    private herculis(oEvent: Route$MatchedEvent): void {
        const oView2 = this.getView()!;
        const sIndex =
          (oEvent.getParameter("arguments") as { orderId: string }).orderId;
        oView2.bindElement({ path: "/" + sIndex, model: "orders" });
    }
    // ...onFilter / onF4Help / onPopupSelect
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — class fields replace object properties:</strong> the old <code>oField: null</code>, <code>oSupplierPopup: null</code> were object properties. In TypeScript they become <strong>declared class fields</strong> with types: <code>private oSupplierPopup?: SelectDialog;</code>. Now the compiler knows exactly what each one holds, and <code>private</code> documents that only this controller touches them.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Inside <code>herculis</code> the old code worried about losing <code>this</code> (hence passing <code>this</code> as the second argument to <code>attachMatched</code>). We <strong>keep</strong> that second <code>this</code> argument because UI5 still calls the handler — but because <code>herculis</code> is now a real class method, <code>this</code> is correctly typed as the controller.
</div>

---

## 3.3b — Convert the shell controller (`App`)

`App.controller.js` is the root view's controller — the smallest file of all. The original is an **empty** `extend(...)` with no methods. We convert it to a class and add a typed (empty) `onInit` so there is an obvious, type-checked place to hook future shell logic.

<table>
<tr>
<th>❌ Before — <code>App.controller.js</code></th>
<th>✅ After — <code>App.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define(
    ["com/ats/manageorder/controller/BaseController"],
    function (BaseController) {
        return BaseController.extend(
          "com.ats.manageorder.controller.App", {

        });
    }
);
```

</td>
<td valign="top">

```ts
import BaseController from "./BaseController";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class App extends BaseController {

    public override onInit(): void {

    }
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — same recipe, even when empty:</strong> an empty controller still follows the exact pattern — drop <code>sap.ui.define</code>, <code>import</code> the base, <code>export default class … extends BaseController</code>, and add the <code>@namespace</code> JSDoc so the transpiler rebuilds the full name <code>com.ats.manageorder.controller.App</code>. The <code>override</code> on <code>onInit</code> is required by <code>noImplicitOverride</code> (Step 1) because <code>onInit</code> exists on the base <code>Controller</code> — even when the body is empty.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The original <code>App.controller.js</code> had <strong>no</strong> <code>onInit</code> at all. Adding an empty typed one is optional, but it gives you a ready, autocompleted spot for shell-level code (e.g. setting the content density model) and keeps every controller in the project looking the same. <code>App.controller.ts</code> is the twin of <code>Empty.controller.ts</code> we converted back in Step 1.
</div>

---

## 3.4 — Verify everything is typed

```bash
npm run start        # app still renders, now 100% TS controllers
npm run ts-typecheck # tsc --noEmit → expect zero errors
```

<sub><b>code by anubhav trainings</b></sub>

- ✅ Click an order → detail opens (`View2` typed route works).
- ✅ Search → list filters (`onSearch` typed event works).
- ✅ Add item / delete item / create order → toast shows the new id (all `Add` methods typed).
- ✅ App boots through the typed shell (`App` / `Empty` controllers converted).
- ✅ `tsc --noEmit` prints nothing → the **type gate** is green.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Snapshot:</strong> every file under <code>webapp/</code> (except XML and JSON) is now <code>.ts</code>. The hybrid phase is over — we are fully TypeScript and the app behaves identically.</em>
</div>

---

## ✅ Final version — `webapp/controller/View1.controller.ts`

<details open>
<summary><b>View1.controller.ts</b> (complete)</summary>

```ts
import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/m/routing/Router";
import List from "sap/m/List";
import ListBinding from "sap/ui/model/ListBinding";
import { SalesOrdersResponse } from "../types/datatype";
import { SearchField$SearchEvent } from "sap/m/SearchField";
import { ListBase$SelectionChangeEvent } from "sap/m/ListBase";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class View1 extends BaseController {
    private oRouter: Router;

    public override onInit(): void {
        // here we need the router object - get it from our Component
        this.oRouter =
            (this.getOwnerComponent() as UIComponent).getRouter() as Router;
        // create a JSON model to hold the sales orders, shared with View2
        (this.getOwnerComponent() as UIComponent)
            .setModel(new JSONModel(), "orders");
        // load the orders when the app starts
        this.getSalesOrders();
    }

    public getSalesOrders(): void {
        fetch("/odata/v4/catalog/getSalesOrders()", {
            headers: { Accept: "application/json" }
        })
        .then((oResponse: Response) => oResponse.json())
        .then((oData: SalesOrdersResponse) => {
            const oModel = (this.getOwnerComponent() as UIComponent)
                .getModel("orders") as JSONModel;
            oModel.setData(oData.value || []);
        })
        .catch((oError: Error) => {
            MessageBox.error(
                "Unable to load sales orders: " + oError.message);
        });
    }

    public onAdd(): void {
        // navigate to the Add view to create a brand new sales order
        this.oRouter.navTo("addOrder");
    }

    public onSearch(oEvent: SearchField$SearchEvent): void {
        // Step 1: extract the query parameter
        const searchStr = oEvent.getParameter("query") ?? "";
        // Step 2: construct the filter conditions
        const oFilter1 = new Filter("salesOrder", FilterOperator.Contains, searchStr);
        const oFilter2 = new Filter("salesOrderType", FilterOperator.Contains, searchStr);
        // Step 3: combine with OR
        const oFilter = new Filter({ filters: [oFilter1, oFilter2], and: false });
        // Step 4: get the list and inject the filter
        const oList = this.getView()?.byId("idList") as List;
        // narrow the generic Binding to ListBinding so .filter() exists
        (oList.getBinding("items") as ListBinding)?.filter(oFilter);
    }

    public onItemPress(oEvent: ListBase$SelectionChangeEvent): void {
        // get the clicked list item and its binding path e.g. /3
        const oListItem = oEvent.getParameter("listItem");
        const sPath = oListItem!.getBindingContext("orders")!.getPath();
        const aParts = sPath.split("/");
        const sIndex = aParts[aParts.length - 1];
        // navigate to the detail view passing the selected order index
        this.oRouter.navTo("spiderman", { orderId: sIndex });
    }
}
```

</details>

<details>
<summary><b>webapp/types/datatype.d.ts</b> (complete)</summary>

```ts
export interface SalesOrderItem {
    salesOrderItem: string;
    material: string;
    requestedQuantity: string;
    requestedQuantityUnit: string;
}

export interface SalesOrder {
    salesOrder: string;
    salesOrderType: string;
    salesOrganization: string;
    distributionChannel?: string;
    organizationDivision?: string;
    salesDistrict?: string;
    soldToParty: string;
    salesOrderDate?: string;
    items?: SalesOrderItem[];
}

export interface NewSalesOrder {
    salesOrderType: string;
    salesOrganization: string;
    distributionChannel: string;
    organizationDivision: string;
    salesDistrict: string;
    soldToParty: string;
    salesOrderDate: string;
    items: SalesOrderItem[];
}

export interface SalesOrdersResponse {
    value: SalesOrder[];
}

export interface CreateOrderResponse extends SalesOrder {}

export interface ODataError {
    error?: {
        code?: string;
        message?: string;
    };
}

export interface Supplier {
    name: string;
    city: string;
}

export interface City {
    name: string;
    famousFor: string;
}
```

</details>

<sub><b>code by anubhav trainings</b></sub>

---

## 3.5 — ⚠️ A word on the `?.` and `!` guards (because `strict: false`)

Throughout this step we wrote defensive code like `this.getView()?.byId("idList")` and `getBindingContext("orders")!`. It is important to be honest about **when the compiler forces these and when it does not**.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Our Step 1 <code>tsconfig.json</code> keeps <code>strict: false</code>, and we did <strong>not</strong> turn on <code>strictNullChecks</code>. That means the editor will <strong>not force</strong> the <code>?.</code> / <code>!</code> guards in these Step 3 controllers — TypeScript currently treats <code>null</code> and <code>undefined</code> as assignable to everything. So in this configuration the guards are <strong>good-practice / future-proofing</strong>, not compiler-required. They still protect you at <em>runtime</em>, and they mean the code already compiles cleanly the day you tighten the settings.</em>
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>If you'd prefer them enforced:</strong> add one line to <code>compilerOptions</code> in <code>tsconfig.json</code> and TypeScript will start <em>demanding</em> a guard everywhere a value could be <code>null</code>/<code>undefined</code> (e.g. <code>getView()</code> can be <code>undefined</code>, <code>getBinding("items")</code> can be <code>null</code>).</em>
</div>

```jsonc
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "strictNullChecks": true   // ← add this to make ?. and ! mandatory
  }
}
```

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Turning on <code>strictNullChecks</code> after the fact will usually surface a batch of new <code>TS2531: Object is possibly 'null'</code> / <code>TS18048: ... is possibly 'undefined'</code> errors across the older controllers. That is expected — it is the compiler pointing at every spot a guard was missing. Because we already wrote the guards in Step 3, those files stay green; you then fix the rest one by one. This is exactly the kind of <strong>gradual tightening</strong> the <code>strict: false</code> + individual-flags approach is designed to allow.
</div>

---

<p align="center">➡️ Next: <a href="step4_approuter.md"><b>Step 4 — App Router & MTA deployment</b></a></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>
