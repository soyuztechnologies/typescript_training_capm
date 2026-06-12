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
    oList.getBinding("items")?.filter(oFilter);
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

---

## 3.2 — Type the OData **create** callback (`Add` controller)

The `Add` controller `POST`s a new order and reads back **two different shapes**: a success body and an error body. This is the perfect place to use our `CreateOrderResponse` and `ODataError` types.

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
        .getData() as SalesOrder;

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

## 3.4 — Verify everything is typed

```bash
npm run start        # app still renders, now 100% TS controllers
npm run ts-typecheck # tsc --noEmit → expect zero errors
```

<sub><b>code by anubhav trainings</b></sub>

- ✅ Click an order → detail opens (`View2` typed route works).
- ✅ Search → list filters (`onSearch` typed event works).
- ✅ Create an order → toast shows the new id (`Add` typed callback works).
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
        oList.getBinding("items")?.filter(oFilter);
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
