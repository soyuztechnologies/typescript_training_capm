# Step 9 — Build & Deploy a TypeScript CAP Project

> For deployment you do **not** ship `tsx`-on-the-fly. The recommended path is to
> compile `.ts` → `.js` as a build step and deploy the JavaScript.

---

## Short Answer

`cds watch` running `.ts` directly via `tsx` is a **development** convenience. For a real deployment (Cloud Foundry / Kyma / MTA), **pre-compile `.ts` → `.js` with `tsc`** as a build step and deploy the compiled JavaScript.

---

## Why Compile for Production

| Concern | Run `.ts` via tsx in prod | Compile to `.js` (recommended) |
|---|---|---|
| Startup / runtime cost | esbuild transpiles on every boot | plain Node runs plain JS — fastest |
| `tsx` dependency | must move `tsx` to `dependencies` | not needed at runtime |
| Type safety before ship | none (tsx strips types) | the `tsc` build **fails** on type errors |
| Stability | tsx is a dev tool | standard, predictable Node app |

> [!CAUTION]
> **You *can* run TypeScript directly in production** by moving `tsx` into `dependencies` and starting the server through it — but it is discouraged. The build-to-JS route is what SAP recommends and what most CAP + TypeScript projects deploy.

---

## What Must End Up in the Deployment Artifact

Three categories of files have to be present as JavaScript / assets:

1. **Your handlers** — `srv/*.ts` → `srv/*.js`, produced by `tsc` with **emit on**. Your current `tsconfig.json` is tuned for `--noEmit` type-checking, so the build uses an emitting configuration (an `outDir`).
2. **The generated model** — `@cds-models/**/index.js`. These are *already* JavaScript (cds-typer emits both `.ts` and `.js`) and are needed at runtime, because every `import { ... } from '#cds-models/...'` resolves to those `.js` files.
3. **Non-code assets** — `.cds` models, `db/data/*.csv`, `package.json`, etc. They are copied as-is; CAP needs the `.cds` files at runtime.

> [!TIP]
> *Concept — why `@cds-models/*.js` is a runtime artifact, not just a dev type: your handlers `import` the generated entity classes (`PurchaseOrderSet_`, etc.) as real values used in `before` / `after` / CQL calls. Those resolve to the generated `index.js`, so they must be regenerated and shipped — they are not erased like ordinary types.*

---

## The Build Flow

```powershell
npx cds-typer "*" --outputDirectory @cds-models   # 1. regenerate typed models (.ts + .js)
npx tsc                                            # 2. compile your .ts handlers -> .js
npx cds build                                      # 3. assemble the CAP deployment artifact (gen/)
```

<sub>code by anubhav trainings</sub>

`cds build` produces the `gen/` folder that the deployer (`cf push` / MTA) ships. Because the `.ts` is compiled to `.js` first, the deployed server runs as a normal Node CAP app — **no `tsx`, no `CDS_TYPESCRIPT` flag, no on-the-fly transpilation** in production.

---

## A Convenience Script

Add a `build` script to `package.json` so the whole chain runs with one command:

```json
{
  "scripts": {
    "build": "cds-typer \"*\" --outputDirectory @cds-models && tsc && cds build",
    "check": "tsc --noEmit"
  }
}
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Make sure `tsc` actually emits.** For the build, point output to a folder via `outDir` (for example `gen/srv`) or a dedicated `tsconfig.build.json`, otherwise `tsc` configured with `noEmit` will type-check but produce no `.js`. Keep a separate `check` script (`tsc --noEmit`) for the pure type gate in CI.

---

## The Mental Model

```text
Dev   (cds watch)    -> tsx transpiles .ts in memory      -> convenient, no build
CI    (pre-deploy)   -> tsc compiles .ts -> .js + checks   -> your safety gate
Prod  (cf push)      -> runs compiled .js                  -> no TypeScript tooling at runtime
```

<sub>code by anubhav trainings</sub>

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
