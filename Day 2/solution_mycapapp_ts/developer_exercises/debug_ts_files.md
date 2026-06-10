# Debugging TypeScript — Configuration & Breakpoints

> How to debug the migrated project **as TypeScript**, with real breakpoints in
> `srv/*.ts`, `utils/*.ts` and `test/*.test.ts` — no compile step, no `.js` in
> sight. Two launch configurations cover everything: one for the **running CAP
> server**, one for the **Jest suite**. The trick on both is the same — run through
> a TypeScript loader and let CAP resolve `.ts` handlers.

---

## 📋 Cheat Sheet — The Five Knobs

| # | Knob | Where | Why |
|---|------|-------|-----|
| 1 | `node --import tsx` | `runtimeArgs` | run `.ts` directly, in-memory, with source maps |
| 2 | `CDS_TYPESCRIPT: "true"` | launch `env` | lets CAP find `srv/*.ts` handlers (else it loads the generic service) |
| 3 | `"sourceMap": true` | [tsconfig.json](../tsconfig.json) | maps a runtime line back to your `.ts` so breakpoints bind |
| 4 | `--runInBand` | Jest `args` | one process, not workers — the debugger can attach |
| 5 | `skipFiles` | launch config | step over Node internals & `node_modules`, stay in your code |

> [!TIP]
> *Concept — why no build step: `tsx` (a dev dependency already in `package.json`) transpiles each `.ts` on the fly and emits an inline source map, so the debugger always knows which TypeScript line a breakpoint belongs to. You never produce a `dist/` folder, and you never debug generated JavaScript — you debug the `.ts` you wrote.*

---

## Step 1 — Confirm the Prerequisites

These are already true in this repo; verify before you start.

```powershell
# 1) source maps are on
Select-String -Path tsconfig.json -Pattern '"sourceMap": true'

# 2) the TypeScript loader is installed
node -e "console.log('tsx', require('tsx/package.json').version)"
```

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Special note:** if `sourceMap` is `false`, breakpoints will appear "unbound" (a hollow grey circle) because the debugger cannot line up the running code with your `.ts`. This single setting is the difference between a working breakpoint and one VS Code silently ignores.

---

## Step 2 — Add the Debug Configuration

Open (or create) [.vscode/launch.json](../.vscode/launch.json) and add the two configurations below. Keep any existing entries — just extend the `configurations` array.

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CAP server (TS)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeArgs": ["--import", "tsx"],
      "program": "${workspaceFolder}/node_modules/@sap/cds/bin/serve.js",
      "args": ["--in-memory"],
      "env": { "CDS_TYPESCRIPT": "true" },
      "console": "integratedTerminal",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ]
    },
    {
      "name": "Debug Jest (all tests)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--no-coverage"],
      "env": { "CDS_TYPESCRIPT": "true" },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ]
    },
    {
      "name": "Debug Jest (current file)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--no-coverage", "${fileBasenameNoExtension}"],
      "env": { "CDS_TYPESCRIPT": "true" },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": [
        "<node_internals>/**",
        "${workspaceFolder}/node_modules/**"
      ]
    }
  ]
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — why the local `serve.js`, not the `cds` command: `@sap/cds` ships the server entry at `node_modules/@sap/cds/bin/serve.js` (the `cds-serve` binary). Pointing `program` at it means the configuration works for anyone who runs `npm install`, even without the global `@sap/cds-dk` installed. The `runtimeArgs: ["--import", "tsx"]` line makes Node load that entry through the TypeScript loader, and `CDS_TYPESCRIPT` makes CAP pick `srv/CatalogService.ts` over the generic service.*

> [!CAUTION]
> **Special note:** without `"env": { "CDS_TYPESCRIPT": "true" }`, the server starts but loads `node_modules/@sap/cds/srv/app-service.js` instead of your `srv/*.ts`. Your breakpoints in the handlers never hit, and custom actions like `largestOrder` answer *"no handler"*. The flag is the same one [jest.setup.ts](../test/jest.setup.ts) sets for the tests — debugging needs it explicitly because it does not go through Jest's setup.

---

## Step 3 — Debug the Running Server

```text
1. Open  srv/CatalogService.ts
2. Click the gutter on a line inside a handler (e.g. the salary check in the
   before('CREATE','UPDATE', EmployeeSet_) handler) → a red breakpoint dot.
3. Run & Debug panel → pick "Debug CAP server (TS)" → press F5.
4. Wait for:  [cds] - serving CatalogService { impl: 'srv\CatalogService.ts' }
5. Trigger the handler — open srv/tester.http and send a CREATE EmployeeSet,
   or hit  http://localhost:4004  in a browser.
6. Execution pauses on your line; inspect req.data, step with F10 / F11.
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — the `impl: 'srv\CatalogService.ts'` line in the Debug Console is your proof the TypeScript handler loaded. If you instead see `impl: '…/app-service.js'`, the `CDS_TYPESCRIPT` flag did not reach the process — re-check Step 2's `env` block. Once paused, the **Variables** pane shows `req`, `req.data`, `cds.tx(req)` exactly as typed in your `.ts`.*

> [!CAUTION]
> **Special note:** `EADDRINUSE: address already in use :::4004` means a previous server (or `cds watch`) is still holding the port. Stop the other process — `Get-Process node | Stop-Process` as a blunt last resort — then start the debug session again.

---

## Step 4 — Debug the Jest Tests

```text
ALL TESTS
  Run & Debug → "Debug Jest (all tests)" → F5.
  Breakpoints in test/*.test.ts AND in the srv/utils .ts they exercise both bind,
  because ts-jest emits source maps for every compiled module.

ONE FILE
  Open the test file you care about (e.g. test/CatalogService.test.ts),
  then run "Debug Jest (current file)". The ${fileBasenameNoExtension} token
  passes "CatalogService.test" to Jest as a filename filter.
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `--runInBand` is mandatory for debugging: by default Jest forks worker processes, and a breakpoint set in the editor binds to the **main** process, so it never fires. `--runInBand` collapses everything into one process the debugger is already attached to. `--no-coverage` simply keeps the run fast and the stack frames clean.*

> [!TIP]
> *Concept — you can breakpoint **across the boundary**: pause on a line in `test/CatalogService.test.ts`, then `F11` (Step Into) `srv.send('largestOrder')` and you land inside `srv/CatalogService.ts`. The same source-map machinery that makes the tests run as TypeScript makes them debuggable as TypeScript.*

---

## Step 5 — (Optional) Attach Instead of Launch

To debug a server you started yourself from a terminal:

```powershell
$env:CDS_TYPESCRIPT = 'true'
node --inspect-brk --import tsx node_modules/@sap/cds/bin/serve.js --in-memory
```

<sub>code by anubhav trainings</sub>

Then add and run this attach configuration:

```jsonc
{
  "name": "Attach to CAP server",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "skipFiles": ["<node_internals>/**", "${workspaceFolder}/node_modules/**"]
}
```

<sub>code by anubhav trainings</sub>

> [!TIP]
> *Concept — `--inspect-brk` opens the Node inspector on port 9229 and pauses on the first line until a debugger attaches, so you never miss early startup code. Use **attach** when you want the process under your own terminal (custom env vars, profiles, log piping); use **launch** (Steps 2–4) for the one-key F5 workflow.*

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Hollow grey breakpoint | source maps off | `"sourceMap": true` in [tsconfig.json](../tsconfig.json) |
| Breakpoint in handler never hits | TS impl not loaded | add `"env": { "CDS_TYPESCRIPT": "true" }` |
| `no handler for largestOrder` | generic service loaded | same as above — the `CDS_TYPESCRIPT` flag |
| Jest breakpoints ignored | worker processes | add `--runInBand` |
| `EADDRINUSE :::4004` | port already bound | stop the other `node` / `cds watch` process |
| Steps into `node_modules` | missing skip rule | add it to `skipFiles` |

<sub>code by anubhav trainings</sub>

> [!CAUTION]
> **Special note:** these debug settings are the *runtime* counterpart of the migration. `allowJs: false` (Step 7) certifies the code is TypeScript; `--import tsx` + `CDS_TYPESCRIPT` certify you can also **run and debug** it as TypeScript, with zero generated JavaScript in the loop.

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
