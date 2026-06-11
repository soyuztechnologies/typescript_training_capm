<h1 align="center">🧩 Step 1 — Preparation for UI5 TypeScript Conversion</h1>

<p align="center"><em>Install the transpiler, wire up <code>ui5.yaml</code>, add <code>tsconfig.json</code>, then convert exactly <strong>one</strong> controller to prove that JavaScript and TypeScript can live together.</em></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>

---

## 🧾 Cheat Sheet

| Action | Command / File | Why |
|--------|----------------|-----|
| Install transpiler | `npm i -D ui5-tooling-transpile` | turns `.ts` into UI5-style `.js` on the fly |
| Install compiler | `npm i -D typescript` | the `tsc` type-checker |
| Install UI5 types | `npm i -D @sapui5/types` | teaches TypeScript what `sap.m.Button` etc. look like |
| Add middleware | `ui5.yaml` → `server.customMiddleware` | transpile while you **serve** |
| Add build task | `ui5.yaml` → `builder.customTasks` | transpile while you **build** |
| Add compiler config | `tsconfig.json` | tells `tsc` how strict to be |
| First conversion | `Empty.controller.js` ➜ `Empty.controller.ts` | smallest file = safest test |
| Verify | `ui5 serve` then open the app | JS + TS hybrid must still render |

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Goal of Step 1:</strong> not to convert the app — just to <strong>switch the engine on</strong>. By the end, the build understands TypeScript, and we have converted one tiny file to prove the pipeline works.</em>
</div>

---

## 1.0 — The concept: why a transpiler at all?

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — transpile:</strong> "transpile" = translate source code from one form to another form that does the same thing. The browser's UI5 runtime only understands the old <code>sap.ui.define([...], function(){...})</code> style. TypeScript files use modern <code>import</code> and <code>class</code>. The transpiler <strong>translates</strong> our modern TS back into the old style — and deletes the type annotations on the way out.</em>
</div>

![How the transpile pipeline works](images/ui5_conversion_babel.svg)

Read the picture left to right: **you write `.ts`** ➜ **`ui5-tooling-transpile` (Babel) translates it** ➜ **plain `.js` comes out** ➜ **the browser runs the `.js`**. A second, separate tool (`tsc`) only checks types — it is the "spell-checker", it never produces the file the browser runs.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Because the types are <strong>erased</strong> before the browser sees anything, TypeScript costs <strong>zero</strong> runtime performance. It is a tool for the developer, not for the user's browser.
</div>

---

## 1.1 — Install the three dev dependencies

Run these in the **root of the `manageorder` project** (the folder that holds `ui5.yaml`):

```bash
npm install --save-dev typescript
npm install --save-dev ui5-tooling-transpile
npm install --save-dev @sapui5/types
npm install --save-dev @ui5/cli
```

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>--save-dev</code>:</strong> these tools are only needed on the <strong>developer's machine</strong> (to build the app), never inside the shipped app. So they go in <code>devDependencies</code>, not <code>dependencies</code>.</em>
</div>

### Old vs New — `package.json`

<table>
<tr>
<th>❌ Before (JavaScript only)</th>
<th>✅ After (TypeScript-ready)</th>
</tr>
<tr>
<td valign="top">

```json
{
  "name": "manageorder",
  "version": "0.0.1",
  "description": "An SAP Fiori application.",
  "keywords": ["ui5", "openui5", "sapui5"],
  "main": "webapp/index.html",
  "scripts": {
    "deploy-config": "npx -p @sap/ux-ui5-tooling fiori add deploy-config cf"
  },
  "devDependencies": { }
}
```

</td>
<td valign="top">

```json
{
  "name": "manageorder",
  "version": "0.0.1",
  "description": "An SAP Fiori application.",
  "keywords": ["ui5", "openui5", "sapui5"],
  "main": "webapp/index.html",
  "scripts": {
    "deploy-config": "npx -p @sap/ux-ui5-tooling fiori add deploy-config cf",
    "start": "ui5 serve --open index.html",
    "build": "ui5 build --clean-dest",
    "ts-typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@sapui5/types": "1.149.0",
    "@ui5/cli": "^4.0.0",
    "typescript": "^5.5.0",
    "ui5-tooling-transpile": "^3.0.0"
  }
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> Match the <code>@sapui5/types</code> version to the UI5 version your app bootstraps with. In <code>webapp/index.html</code> this app loads <code>1.149.0</code>, so we pin the types to <code>1.149.0</code> too. Mismatched versions = wrong autocomplete.
</div>

---

## 1.2 — Wire the transpiler into `ui5.yaml`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — middleware vs task:</strong> <code>ui5 serve</code> runs a tiny web server while you develop — a <strong>middleware</strong> plugs into that server and transpiles each <code>.ts</code> file the moment the browser asks for it. <code>ui5 build</code> produces the final <code>dist/</code> folder for deployment — a <strong>task</strong> plugs into that build. We register the transpiler in <strong>both</strong> so dev and production behave the same.</em>
</div>

### Old vs New — `ui5.yaml`

<table>
<tr>
<th>❌ Before</th>
<th>✅ After</th>
</tr>
<tr>
<td valign="top">

```yaml
specVersion: "2.5"
metadata:
  name: com.ats.manageorder
type: application
```

</td>
<td valign="top">

```yaml
specVersion: "3.0"
metadata:
  name: com.ats.manageorder
type: application
builder:
  customTasks:
    - name: ui5-tooling-transpile-task
      afterTask: replaceVersion
      configuration:
        debugInformation: true
        transpileDependencies: false
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
      configuration:
        debugInformation: true
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

What each new line means, in plain words:

- **`specVersion: "3.0"`** — custom tasks/middleware need the newer spec version (we bump from `2.5`).
- **`builder.customTasks`** — the transpiler that runs during `ui5 build`.
- **`server.customMiddleware`** — the transpiler that runs during `ui5 serve`.
- **`afterTask` / `afterMiddleware`** — *when* in the pipeline our transpiler runs (after compression / after the version is replaced).
- **`debugInformation: true`** — keeps source maps so the browser debugger shows your **`.ts`** code, not the generated `.js`.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The names <code>ui5-tooling-transpile-task</code> and <code>ui5-tooling-transpile-middleware</code> are <strong>fixed</strong> — they are defined by the package you installed. A typo here means UI5 silently skips transpiling and your <code>.ts</code> files will 404 in the browser.
</div>

---

## 1.3 — Add `tsconfig.json`

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — <code>tsconfig.json</code>:</strong> the rule-book for the TypeScript compiler. It answers three questions: <strong>(1)</strong> which files to check, <strong>(2)</strong> how modern the JavaScript may be, and <strong>(3)</strong> how strict to be about mistakes.</em>
</div>

Create a new file **`tsconfig.json`** at the project root (next to `ui5.yaml`):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "rootDir": "webapp",
    "baseUrl": "./",
    "paths": {
      "com/ats/manageorder/*": ["webapp/*"]
    },
    "typeRoots": ["node_modules/@types", "node_modules/@sapui5/types"],
    "types": ["@sapui5/types"]
  },
  "include": ["webapp/**/*"]
}
```

<sub><b>code by anubhav trainings</b></sub>

The lines that matter most for a school-simple explanation:

- **`"target": "ES2022"`** — "you may write modern JavaScript; the transpiler handles old browsers".
- **`"allowJs": true`** — *the magic switch for hybrid mode*: it lets `.js` and `.ts` files sit in the same project without complaints.
- **`"strict": true`** — "warn me about every risky thing" — this is what makes TypeScript valuable.
- **`"paths"`** — maps the app's namespace `com/ats/manageorder/...` to the `webapp/` folder, so imports resolve correctly.
- **`"types": ["@sapui5/types"]`** — loads the UI5 type definitions so `sap.m.Button`, `Controller`, etc. are known.

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> <code>allowJs: true</code> is the line that makes the <strong>whole gradual migration possible</strong>. Remove it and TypeScript would demand every file be <code>.ts</code> on day one — exactly the "big bang" we are avoiding.
</div>

---

## 1.4 — Convert ONE controller (the proof)

We pick **`Empty.controller.js`** because it is the smallest file in the project — if anything is wrong with the setup, we find out with the least risk.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>Concept — from <code>sap.ui.define</code> to <code>class</code>:</strong> The old style passes a list of dependency strings and a matching function. The TypeScript style uses <code>import</code> (one line per dependency) and an <code>export default class</code>. The transpiler turns the new style back into the old style for the browser — so they are <strong>equivalent</strong>, just easier to read and type-check.</em>
</div>

**Action:** rename `webapp/controller/Empty.controller.js` to `webapp/controller/Empty.controller.ts` and replace its body.

### Old vs New — `Empty.controller`

<table>
<tr>
<th>❌ Before — <code>Empty.controller.js</code></th>
<th>✅ After — <code>Empty.controller.ts</code></th>
</tr>
<tr>
<td valign="top">

```js
sap.ui.define(
    ["com/ats/manageorder/controller/BaseController"],
    function (BaseController) {
        return BaseController.extend(
            "com.ats.manageorder.controller.Empty", {

        });
    }
);
```

</td>
<td valign="top">

```ts
import BaseController from "./BaseController";

/**
 * Empty placeholder pane.
 * Same behaviour as before — just typed.
 */
export default class Empty extends BaseController {
    // no logic yet; the class body stays empty
}
```

</td>
</tr>
</table>

<sub><b>code by anubhav trainings</b></sub>

Line-by-line, what changed and why:

| Old JS | New TS | Reason |
|--------|--------|--------|
| `sap.ui.define([...], function(){...})` | `import ...` + `export default class` | modern module syntax the transpiler converts back |
| dependency **string** `"com/ats/manageorder/controller/BaseController"` | **relative import** `"./BaseController"` | TS resolves the path; shorter and checkable |
| `BaseController.extend("...Empty", {})` | `class Empty extends BaseController {}` | real class inheritance, with the name as the class name |
| no return type info | the compiler now *knows* `Empty` is a `Controller` | autocomplete + error checking |

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> The string name <code>"com.ats.manageorder.controller.Empty"</code> disappears from the source. The transpiler re-creates it automatically from the file path during build, so the UI5 runtime still finds the controller by its full name. The XML view's <code>controllerName="com.ats.manageorder.controller.Empty"</code> keeps working unchanged.
</div>

---

## 1.5 — Verify the hybrid setup

Run the dev server from the project root:

```bash
npm run start
```

<sub><b>code by anubhav trainings</b></sub>

Then check three things:

1. ✅ The terminal shows **no transpile errors**.
2. ✅ The app opens in the browser and **renders exactly as before**.
3. ✅ All the **other controllers are still `.js`** and still work — that is the hybrid proof.

<div style="background-color:#e8f5e9; border-left: 5px solid #4caf50; padding: 10px 15px; border-radius: 4px;">
<em>💡 <strong>What "hybrid" means here:</strong> at this exact moment your <code>webapp/controller/</code> folder contains <strong>six <code>.js</code> files and one <code>.ts</code> file</strong>, and the app runs perfectly. That mixed state is normal and will continue for the next two steps.</em>
</div>

<div style="background-color:#fce4ec; border-left: 5px solid #e91e63; padding: 10px 15px; border-radius: 4px;">
📌 <strong>Note:</strong> If the app shows a blank page, open the browser console. A <code>404 Empty.controller.js</code> usually means the middleware name in <code>ui5.yaml</code> is misspelled, so the <code>.ts</code> was never transpiled.
</div>

---

## ✅ Final versions after Step 1

<details open>
<summary><b>tsconfig.json</b> (new file)</summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "rootDir": "webapp",
    "baseUrl": "./",
    "paths": {
      "com/ats/manageorder/*": ["webapp/*"]
    },
    "typeRoots": ["node_modules/@types", "node_modules/@sapui5/types"],
    "types": ["@sapui5/types"]
  },
  "include": ["webapp/**/*"]
}
```

</details>

<details>
<summary><b>ui5.yaml</b> (updated)</summary>

```yaml
specVersion: "3.0"
metadata:
  name: com.ats.manageorder
type: application
builder:
  customTasks:
    - name: ui5-tooling-transpile-task
      afterTask: replaceVersion
      configuration:
        debugInformation: true
        transpileDependencies: false
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
      configuration:
        debugInformation: true
```

</details>

<details>
<summary><b>webapp/controller/Empty.controller.ts</b> (converted)</summary>

```ts
import BaseController from "./BaseController";

/**
 * Empty placeholder pane.
 * Same behaviour as before — just typed.
 */
export default class Empty extends BaseController {
    // no logic yet; the class body stays empty
}
```

</details>

<sub><b>code by anubhav trainings</b></sub>

---

<p align="center">➡️ Next: <a href="step2_component_formatter.md"><b>Step 2 — Convert Component & formatter</b></a></p>

<p align="center"><sub><b>code by anubhav trainings</b></sub></p>
