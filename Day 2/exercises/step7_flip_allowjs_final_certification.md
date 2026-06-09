# Step 7 — Flip `allowJs: false` & Final Certification

> The closing move of the migration. With every authored module now in TypeScript,
> we **turn off the JavaScript escape hatch** in `tsconfig.json` and re-run both
> gates. A clean run with `allowJs: false` is the certificate: the project no longer
> *depends* on any hand-written JavaScript to type-check or to pass its tests.

---

## 📋 Cheat Sheet (the final flip)

| # | Before | After | Why |
|---|--------|-------|-----|
| 1 | `"allowJs": true` | `"allowJs": false` | stop the compiler from accepting `.js` source |
| 2 | mixed `.js` / `.ts` tolerated | TS-only authored code | every handler, util and test is now `.ts` |
| 3 | "it compiles" | **type gate** `tsc --noEmit` clean | no `.js` is silently propping up the build |
| 4 | "it ran once" | **behaviour gate** `npm test` green | 32 tests still pass with the flag off |

---

## Step 7.1 — Flip the Flag

In [tsconfig.json](../tsconfig.json):

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "allowJs": false,
    "paths": {
      "@sap/cds": ["./node_modules/@cap-js/cds-types"],
      "#cds-models/*": ["./@cds-models/*"]
    }
  }
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — what `allowJs` actually controls: with `true`, TypeScript will read, resolve and (optionally) type-check plain `.js` files alongside your `.ts`. That was the scaffold that let Steps 1–6 migrate the codebase one file at a time without breaking the build. Setting it to `false` removes the scaffold: from now on a stray `.js` in your source path is invisible to the compiler, which is exactly what you want once the migration is complete.*

---

## Step 7.2 — The Type Gate

```powershell
npx tsc --noEmit
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — this run is stricter than every previous one. Any handler that had quietly leaned on a `.js` neighbour would now fail to resolve. A clean exit proves the entire type graph — services, utils, tests and the generated `#cds-models` types — closes over TypeScript alone.*

---

## Step 7.3 — The Behaviour Gate

```powershell
npm test
```

<sub>code by anubhav trainings</sub>

```text
Test Suites: 2 passed, 2 total
Tests:       32 passed, 32 total
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — the type gate proves the code is well-typed; the behaviour gate proves it still does the same thing. Both must be green at the same time for the migration to count. The `CDS_TYPESCRIPT` flag from Step 6.7 is what keeps the runtime resolving your `.ts` handlers here — flipping `allowJs` does not change that.*

---

## Step 7.4 — Account for Every Remaining `.js`

`allowJs: false` does not delete the `.js` files that legitimately remain — it simply stops the compiler from owning them. Confirm each leftover is **out of scope by design**:

```powershell
Get-ChildItem -Recurse -Include *.js,*.mjs |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\coverage\\' } |
  ForEach-Object { $_.FullName.Replace($PWD.Path + '\','') }
```

<sub>code by anubhav trainings</sub>

| Remaining file(s) | Category | Why it stays `.js` |
|---|---|---|
| `@cds-models/**/index.js` | **Generated** | Emitted by `cds-typer` next to its `index.ts`; regenerated on build, never hand-edited |
| `app/managepo/webapp/**` | **UI5 frontend** | The SAPUI5/Fiori app is a separate browser stack, not part of the Node service migration |
| `jest.config.js` | **Tooling config** | Jest reads its config as CommonJS; intentionally JS |
| `eslint.config.mjs` | **Tooling config** | ESLint flat config; intentionally an ES module |

> [!CAUTION]
> **Special note:** the authored backend — everything under `srv/`, `utils/` and `test/` — is now **100% TypeScript**. The files above are either machine-generated, owned by a different (frontend) toolchain, or tool configuration. None of them is compiled by `tsc` under `allowJs: false`, so they cannot weaken the type guarantee.

---

## Step 7.5 — CAP Model Sanity Check

A TypeScript migration must not disturb the CDS model. Confirm it still compiles:

```powershell
npx cds compile srv --to sql
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `tsc` certifies the TypeScript; `cds compile` certifies the CDS layer (entities, projections, the `OverallStatus` / `Criticality` cases, the `boost` / `largestOrder` actions). Together they prove the migration touched only the **implementation language**, never the **model**.*

---

## Step 7.6 — Certification Checklist

```text
[x] Step 1  Project initialization + tsconfig
[x] Step 2  utils/error-mapper.ts
[x] Step 3  utils/payload-transformer.ts
[x] Step 4  srv/CDSService.ts
[x] Step 5  srv/CatalogService.ts
[x] Step 6  test/*.test.ts  + CDS_TYPESCRIPT wiring
[x] Step 7  allowJs: false  → tsc clean + 32 tests green + cds compile OK
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — "certified" means reproducible, not "ran once on my machine." Anyone who clones the repo and runs `npx tsc --noEmit && npm test` gets the same two green gates, with no `.js` source in the loop. That is the deliverable of a JS→TS migration: identical behaviour, full type coverage, and a build that can no longer silently accept JavaScript.*

> [!CAUTION]
> **Special note:** keep `CDS_TYPESCRIPT=true` available wherever the service runs for real — not just under Jest. For `cds watch` / `cds serve`, run through a TypeScript loader (the project already ships `tsx`) or export the variable in your start environment, or CAP will once again fall back to the generic service and skip your compiled handlers.

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
