<h1 align="center">🧱 Step 2 — Convert <code>Component</code> and <code>formatter</code></h1>

<p align="center"><em>Rename the two foundation files — <code>Component.js</code> and <code>util/formatter.js</code> — to TypeScript, confirm the app still renders, and prove the remaining <code>.js</code> controllers keep working (hybrid mode).</em></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>

---

## 🧾 Cheat Sheet

| File | From ➜ To | Key change |
|------|-----------|-----------|
| Component | `Component.js` ➜ `Component.ts` | `UIComponent.extend(...)` ➜ `class Component extends UIComponent` |
| Component metadata | inline object | `public static readonly metadata = { manifest: "json", interfaces: [...] }` |
| Formatter | `util/formatter.js` ➜ `util/formatter.ts` | each function gets `(code: string): string` types |
| Lifecycle | `init: function () {...}` | `public init(): void {...}` + `super.init()` |
| Verify | `npm run start` | app renders; `.js` controllers untouched |

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Goal of Step 2:</strong> convert the two files that <strong>everything else depends on</strong>. <code>Component.ts</code> boots the whole app; <code>formatter.ts</code> is used by every list and detail screen. Get these right and the rest of the migration is downhill.</em>
</div>

---

## 2.0 — Why these two first?

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — dependency order:</strong> <code>Component</code> is the <strong>root</strong> — UI5 loads it before any view or controller. <code>formatter</code> is a <strong>leaf</strong> — it is imported by <code>BaseController</code>, which every controller extends. Converting the root and a shared leaf first means every later file already has typed neighbours to lean on.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> "Rename" here means two things together — change the file <strong>extension</strong> from <code>.js</code> to <code>.ts</code> <em>and</em> rewrite the body from <code>sap.ui.define</code> to <code>import</code> + <code>class</code>. Just renaming the extension without rewriting the body will not compile.
</div>

---

## 2.1 — Convert `Component.js` ➜ `Component.ts`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — the <code>metadata</code> block:</strong> UI5 needs to know "where is my manifest?". In JS that was a property inside the object passed to <code>.extend()</code>. In TypeScript it becomes a <code>static readonly metadata</code> field on the class — <code>static</code> because it belongs to the class itself, not to each instance.</em>
</div>

### Old vs New — `Component`

<table>
<tr>
<th>❌ Before — <code>Component.js</code></th>
<th>✅ After — <code>Component.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/ats/manageorder/model/models"
],
function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend(
      "com.ats.manageorder.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // call base init
            UIComponent.prototype.init
                .apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(
              models.createDeviceModel(), "device");
        }
    });
});
```

</td>
<td valign="top">

```ts
import UIComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";

/**
 * @namespace com.ats.manageorder
 */
export default class Component extends UIComponent {

    public static readonly metadata = {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"]
    };

    public init(): void {
        // call the base component's init function
        super.init();

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(createDeviceModel(), "device");
    }
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

What changed, explained simply:

| Old JS | New TS | Why |
|--------|--------|-----|
| `UIComponent.prototype.init.apply(this, arguments)` | `super.init()` | real classes have `super` — cleaner and typed |
| `metadata: { manifest: "json" }` | `static readonly metadata = {...}` | belongs to the class, not the instance |
| import string `"...model/models"` + `models.createDeviceModel()` | `import { createDeviceModel }` + `createDeviceModel()` | named import; the unused `Device` import is dropped |
| `"com.ats.manageorder.Component"` string name | `@namespace com.ats.manageorder` JSDoc | the transpiler rebuilds the full name from namespace + class |

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The <code>@namespace com.ats.manageorder</code> comment is <strong>not decoration</strong> — the transpiler reads it to compute the runtime name <code>com.ats.manageorder.Component</code>. Delete it and UI5 cannot find your component. Every converted class file needs the right <code>@namespace</code>.
</div>

---

## 2.2 — Update `model/models.js` ➜ `model/models.ts`

`Component.ts` now imports `createDeviceModel` as a **named export**, so we adjust the helper to export it by name and add the return type.

### Old vs New — `model/models`

<table>
<tr>
<th>❌ Before — <code>model/models.js</code></th>
<th>✅ After — <code>model/models.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/BindingMode",
    "sap/ui/Device"
], function (JSONModel, BindingMode, Device) {
    return {
        createDeviceModel: () => {
            const oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode(
                BindingMode.OneWay);
            return oModel;
        }
    };
});
```

</td>
<td valign="top">

```ts
import JSONModel from "sap/ui/model/json/JSONModel";
import BindingMode from "sap/ui/model/BindingMode";
import Device from "sap/ui/Device";

export function createDeviceModel(): JSONModel {
    const oModel = new JSONModel(Device);
    oModel.setDefaultBindingMode(BindingMode.OneWay);
    return oModel;
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — named export vs default export:</strong> a file can <code>export</code> many things <strong>by name</strong> (<code>export function createDeviceModel</code>) or one thing as the <strong>default</strong> (<code>export default class</code>). Helpers with several functions use named exports; a controller/component that <em>is</em> one thing uses a default export.</em>
</div>

---

## 2.3 — Convert `util/formatter.js` ➜ `util/formatter.ts`

This is where TypeScript starts to *catch bugs*. Every formatter takes a **code string** and returns a **string**. Writing those types makes wrong calls impossible.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — function signature:</strong> <code>getStatus(code: string): string</code> reads as "give me a <code>string</code> called <code>code</code>, and I promise to give a <code>string</code> back". If someone accidentally passes a number, TypeScript refuses to compile — the bug is caught before the app even runs.</em>
</div>

### Old vs New — `util/formatter` (status helpers)

<table>
<tr>
<th>❌ Before — <code>util/formatter.js</code></th>
<th>✅ After — <code>util/formatter.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define([], function () {
    return {
        getStatus: function (code) {
            switch (code) {
                case 'A': return 'Available';
                case 'D': return 'Discontinued';
                case 'O': return 'Out of Stock';
                default: break;
            }
        },
        getStatusColor: function (code) {
            switch (code) {
                case 'A': return 'Success';
                case 'D': return 'Error';
                case 'O': return 'Warning';
                default: break;
            }
        },
        // ...getOrderTypeDescription below
    };
});
```

</td>
<td valign="top">

```ts
/**
 * Formatter helpers — pure functions, no UI5 base class needed.
 */
export function getStatus(code: string): string {
    switch (code) {
        case "A": return "Available";
        case "D": return "Discontinued";
        case "O": return "Out of Stock";
        default:  return "";
    }
}

export function getStatusColor(code: string): string {
    switch (code) {
        case "A": return "Success";
        case "D": return "Error";
        case "O": return "Warning";
        default:  return "None";
    }
}
// ...getOrderTypeDescription below
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — a real bug TypeScript exposes:</strong> the old <code>default: break;</code> meant the function returned <code>undefined</code> when the code was unknown. Because we declared the return type as <code>string</code>, TypeScript <strong>forces</strong> us to return an actual string (<code>""</code> or <code>"None"</code>) in the <code>default</code> branch. The type system found a silent gap.
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The <code>break;</code> statements after every <code>return</code> in the old code were <strong>dead code</strong> (unreachable) — <code>return</code> already exits the function. TypeScript/ESLint flags them, so we drop them.
</div>

---

## 2.4 — Point `BaseController` at the new formatter

`BaseController` exposes the formatter to every controller. Because `formatter.ts` now uses **named exports**, we import the module namespace and attach it.

### Old vs New — `BaseController`

<table>
<tr>
<th>❌ Before — <code>BaseController.js</code></th>
<th>✅ After — <code>BaseController.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/ats/manageorder/util/formatter"
],
function (Controller, Formatter) {
    return Controller.extend(
      "com.ats.manageorder.controller.BaseController", {
        formatter: Formatter
        // common methods for all controllers
    });
});
```

</td>
<td valign="top">

```ts
import Controller from "sap/ui/core/mvc/Controller";
import * as formatter from "../util/formatter";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class BaseController extends Controller {
    // exposed to every child controller and to the XML views
    public formatter = formatter;

    // common methods for all controllers go here
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>import * as formatter</code>:</strong> this pulls in <strong>all</strong> named exports of the file under one object called <code>formatter</code>. So the XML binding <code>formatter: '.formatter.getOrderTypeDescription'</code> in <code>View1.view.xml</code> keeps working exactly as before — <code>this.formatter.getOrderTypeDescription</code> still resolves.</em>
</div>

---

## 2.5 — Verify (hybrid validation)

Start the server and inspect the same three checks as Step 1:

```bash
npm run start
```

<sub><b>code by anubhav trainings</b></sub>

- ✅ The **list (View1)** still shows orders and the **Order Type** column still reads "Standard Order" → proves `formatter.ts` works through the XML binding.
- ✅ The app **boots at all** → proves `Component.ts` and `models.ts` work.
- ✅ `View1`, `View2`, `View3`, `Add`, `App` controllers are **still `.js`** and behave normally → hybrid mode confirmed.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Snapshot of the project right now:</strong> <code>Component.ts</code> ✅, <code>models.ts</code> ✅, <code>formatter.ts</code> ✅, <code>BaseController.ts</code> ✅, <code>Empty.controller.ts</code> ✅ — and <strong>five controllers still in <code>.js</code></strong>. The app runs. That mixed state is the whole point of a safe migration.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If the Order Type column suddenly shows raw codes like <code>TA</code> instead of "Standard Order", the formatter import path in <code>BaseController.ts</code> is wrong. Check the relative path <code>"../util/formatter"</code>.
</div>

---

## ✅ Final versions after Step 2

<details open>
<summary><b>webapp/Component.ts</b></summary>

```ts
import UIComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";

/**
 * @namespace com.ats.manageorder
 */
export default class Component extends UIComponent {

    public static readonly metadata = {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"]
    };

    public init(): void {
        // call the base component's init function
        super.init();

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(createDeviceModel(), "device");
    }
}
```

</details>

<details>
<summary><b>webapp/model/models.ts</b></summary>

```ts
import JSONModel from "sap/ui/model/json/JSONModel";
import BindingMode from "sap/ui/model/BindingMode";
import Device from "sap/ui/Device";

export function createDeviceModel(): JSONModel {
    const oModel = new JSONModel(Device);
    oModel.setDefaultBindingMode(BindingMode.OneWay);
    return oModel;
}
```

</details>

<details>
<summary><b>webapp/util/formatter.ts</b></summary>

```ts
/**
 * Formatter helpers — pure functions, no UI5 base class needed.
 */
export function getStatus(code: string): string {
    switch (code) {
        case "A": return "Available";
        case "D": return "Discontinued";
        case "O": return "Out of Stock";
        default:  return "";
    }
}

export function getStatusColor(code: string): string {
    switch (code) {
        case "A": return "Success";
        case "D": return "Error";
        case "O": return "Warning";
        default:  return "None";
    }
}

// Show a readable text for the sales order type code e.g. TA => Standard Order
export function getOrderTypeDescription(code: string): string {
    switch (code) {
        case "TA":
        case "OR": return "Standard Order";
        case "RE": return "Returns Order";
        case "CR": return "Credit Memo Request";
        case "DR": return "Debit Memo Request";
        case "KB": return "Consignment Fill-Up";
        case "KE": return "Consignment Issue";
        case "KA": return "Consignment Pick-Up";
        case "KR": return "Consignment Returns";
        // if we do not know the code, just show the code itself
        default:   return code;
    }
}
```

</details>

<details>
<summary><b>webapp/controller/BaseController.ts</b></summary>

```ts
import Controller from "sap/ui/core/mvc/Controller";
import * as formatter from "../util/formatter";

/**
 * @namespace com.ats.manageorder.controller
 */
export default class BaseController extends Controller {
    // exposed to every child controller and to the XML views
    public formatter = formatter;

    // common methods for all controllers go here
}
```

</details>

<sub><b>code by anubhav trainings</b></sub>

---

<p align="center">➡️ Next: <a href="step3_controllers.md"><b>Step 3 — Convert controllers + shared types</b></a></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>
