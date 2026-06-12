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
| Lifecycle | `init: function () {...}` | `public override init(): void {...}` + `super.init()` |
| Verify | `npm run start` | app renders; `.js` controllers untouched |
| CAP dev setup (§2.6) | `workspaces: ["app/*"]` + `cds-plugin-ui5` | one `cds watch` serves OData **and** live-transpiled UI5 |
| Bonus (§2.7) | `ui5 build` → serve `dist/` | test the compiled app; **no** live TS reload |

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

    public override init(): void {
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
| `init: function () {…}` | `public override init() {…}` | `init` overrides `UIComponent.init`, and `noImplicitOverride` (Step 1) requires the `override` keyword |
| `UIComponent.prototype.init.apply(this, arguments)` | `super.init()` | real classes have `super` — cleaner and typed |
| `metadata: { manifest: "json" }` | `static readonly metadata = {...}` | belongs to the class, not the instance |
| _(not declared)_ | `interfaces: ["sap.ui.core.IAsyncContentCreation"]` | opt in to **async** root-view & routing creation — loads views without blocking the browser |
| import string `"...model/models"` + `models.createDeviceModel()` | `import { createDeviceModel }` + `createDeviceModel()` | named import; the unused `Device` import is dropped |
| `"com.ats.manageorder.Component"` string name | `@namespace com.ats.manageorder` JSDoc | the transpiler rebuilds the full name from namespace + class |

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>sap.ui.core.IAsyncContentCreation</code>:</strong> this is a <strong>marker interface</strong> — it carries no methods, it simply <em>flags</em> your Component so UI5 builds the root view and all routed views <strong>asynchronously</strong> (in the background) instead of synchronously (freezing the page until each view is ready). Think of it like telling a waiter "bring the dishes as they're cooked" instead of "make me wait at the door until the whole meal is plated". Declaring this one interface lets you drop the older per-view <code>"async": true</code> flags and silences UI5's synchronous-loading deprecation warnings — the modern, recommended default for every new Component.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The original <code>Component.js</code> never declared this interface, so the app relied on the <code>"async": true</code> hints inside <code>manifest.json</code>'s routing config. Adding <code>IAsyncContentCreation</code> at the Component level is the cleaner, single source of truth — it guarantees the root view itself (not just routed targets) is also created asynchronously.
</div>

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

## 2.6 — Run it the CAP way: `cds-plugin-ui5` + npm workspaces

So far we ran the UI5 app on its own with `npm run start` (a standalone `ui5 serve`). But this app does not live alone — it belongs to the CAP project **`capm-s4-mashup`**, which serves the OData service the app calls (`/odata/v4/catalog/...`). The *standard* CAP + UI5-TypeScript dev setup runs **both** under one command: **`cds watch`**.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>cds-plugin-ui5</code>:</strong> a plugin for the CAP server. When <code>cds watch</code> starts, it scans your <strong>npm workspaces</strong> for any folder containing a <code>ui5.yaml</code>, and serves that UI5 app <em>through</em> the CAP server — running the very same <code>ui5-tooling-transpile</code> middleware from Step 1. Result: one server, one port, the OData service <strong>and</strong> the live-transpiled TypeScript UI together. No more CORS juggling between two ports.</em>
</div>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — npm workspaces:</strong> a way to keep several <code>package.json</code> packages inside one repo and install them together. The CAP project becomes the <strong>root</strong>; the UI5 app becomes a <strong>child workspace</strong>. One <code>npm install</code> at the root installs <em>both</em> dependency sets and hoists shared tools (TypeScript, the transpiler) into a single <code>node_modules</code>.</em>
</div>

### Step A — Put the app where CAP expects it

The CAP project's `package.json` already points at the app:

```json
"sapux": [
  "app/manageorder"
]
```

<sub><b>code by anubhav trainings</b></sub>

So the freestyle app folder (the one holding `webapp/`, `ui5.yaml`, `package.json`) must sit at **`capm-s4-mashup/app/manageorder`**. Move it there if it is not already.

### Step B — Add the workspace + plugin to the CAP root `package.json`

This is the **root** `package.json` you asked us to check — `capm-s4-mashup/package.json`. Today it has **no** `workspaces` key and **no** `cds-plugin-ui5`. Here is exactly what to add:

<table>
<tr>
<th>❌ Before — <code>capm-s4-mashup/package.json</code> (today)</th>
<th>✅ After — workspace + plugin wired</th>
</tr>
<tr>
<td valign="top">

```json
{
  "name": "capm-s4-mashup",
  "version": "1.0.0",
  "description": "A simple CAP project.",
  "dependencies": {
    "@sap/cds": "^9",
    "express": "^4"
  },
  "devDependencies": {
    "@cap-js/cds-typer": ">=0.1",
    "typescript": "^5.9.3"
  },
  "scripts": {
    "watch": "cds watch"
  },
  "private": true,
  "sapux": [
    "app/manageorder"
  ]
}
```

</td>
<td valign="top">

```json
{
  "name": "capm-s4-mashup",
  "version": "1.0.0",
  "description": "A simple CAP project.",
  "workspaces": [
    "app/*"
  ],
  "dependencies": {
    "@sap/cds": "^9",
    "express": "^4"
  },
  "devDependencies": {
    "@cap-js/cds-typer": ">=0.1",
    "typescript": "^5.9.3",
    "cds-plugin-ui5": "^0.16.0"
  },
  "scripts": {
    "watch": "cds watch"
  },
  "private": true,
  "sapux": [
    "app/manageorder"
  ]
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

Only **two** things changed (the rest of the file stays exactly as it is):

- **`"workspaces": ["app/*"]`** — tells npm "every folder under `app/` is a child package", so `app/manageorder` (with its `typescript`, `ui5-tooling-transpile`, `@openui5/ts-types-esm` devDeps from Step 1) is part of one install.
- **`"cds-plugin-ui5"` in `devDependencies`** — the plugin that makes `cds watch` serve the UI5 app.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>cds-plugin-ui5</code> is "zero-config" — you do <strong>not</strong> import it or call it anywhere. Simply having it in <code>devDependencies</code> is enough; CAP auto-loads any dependency whose name starts with <code>cds-plugin-</code>. The only requirement is that the UI5 app has a <code>ui5.yaml</code> (it does, from Step 1) and is inside a workspace.
</div>

### Step C — Install once at the root and run `cds watch`

```bash
# from the CAP project root: capm-s4-mashup/
npm install
cds watch
```

<sub><b>code by anubhav trainings</b></sub>

Then open the URL `cds watch` prints. You will see the app listed under the CAP index page, served at something like **`/manageorder/webapp/index.html`** — and:

- ✅ Editing a `.ts` controller → the transpiler runs and the browser **live-reloads** (the `ui5-middleware-livereload` from Step 1 works here too).
- ✅ The app's `fetch("/odata/v4/catalog/...")` hits the **same server** — no separate port, no CORS.
- ✅ `cds-typer` keeps regenerating the CAP model types, so the whole stack is TypeScript end-to-end.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Why this is the recommended setup:</strong> one terminal, one command, one URL. The service and the UI evolve together, your TypeScript is transpiled on the fly, and what you test locally is the same wiring you deploy. This is the workflow we will build on for App Router in Step 4.</em>
</div>

---

## 2.7 — 🎁 Bonus exercise: serve the **built** output with `ui5 build`

Live `cds watch` transpiles your `.ts` *on every request*. For a final "does the packaged app actually work?" check, you instead **pre-build** the app once and point CAP at the compiled result.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>ui5 build</code>:</strong> where <code>ui5 serve</code> transpiles in memory, <code>ui5 build</code> writes a real, optimized <code>dist/</code> folder to disk. Your <code>ui5-tooling-transpile-task</code> (registered in <code>ui5.yaml</code> back in Step 1) runs here — so <code>Component.ts</code> comes out as a plain <code>dist/Component.js</code>, with <strong>no TypeScript left at all</strong>. That <code>dist/</code> is exactly what gets deployed.</em>
</div>

### Step A — Build the app

```bash
# from app/manageorder/
npm run build      # → ui5 build --clean-dest
```

<sub><b>code by anubhav trainings</b></sub>

Look inside the new `app/manageorder/dist/` folder: you will find `Component.js`, `controller/*.js`, `util/formatter.js` — every `.ts` has become transpiled `.js`. There is **no `.ts` file** in `dist/`.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> This is proof of the Step 1 promise — <em>the browser never runs your TypeScript</em>. <code>dist/Component.js</code> is the classic <code>sap.ui.define([...])</code> form, rebuilt automatically from your modern <code>class Component extends UIComponent</code>.
</div>

### Step B — Point CAP at the built output

For a quick packaged-mode test, serve the static `dist/` folder from the CAP server instead of the live source. Add a tiny custom server hook to the CAP project:

```ts
// capm-s4-mashup/srv/server.ts
import cds from "@sap/cds";
import express from "express";
import path from "path";

cds.on("bootstrap", (app) => {
  // serve the PRE-BUILT UI5 app (plain JS, no live transpile)
  app.use(
    "/manageorder",
    express.static(path.join(__dirname, "../app/manageorder/dist"))
  );
});

export default cds.server;
```

<sub><b>code by anubhav trainings</b></sub>

Now start CAP normally and open `/manageorder/index.html` — you are running the **compiled** app against the live OData service.

```bash
# from capm-s4-mashup/
cds watch
```

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note — the trade-off:</strong> serving <code>dist/</code> means you <strong>lose live TypeScript reload</strong>. Every code change now requires a fresh <code>npm run build</code> before you can see it. So use this mode <strong>only</strong> for packaged / pre-deploy testing — confirming the built artifact behaves — and switch back to §2.6's <code>cds watch</code> for everyday development.
</div>

| Mode | Command | Live TS reload? | Use it for |
|------|---------|-----------------|-----------|
| **Dev** (§2.6) | `cds watch` + `cds-plugin-ui5` | ✅ yes | day-to-day coding |
| **Packaged** (§2.7) | `ui5 build` → serve `dist/` | ❌ no | final deploy sanity check |

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

    public override init(): void {
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
