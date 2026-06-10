# Concept — How `cds watch` Runs Your TypeScript

> Understanding what actually happens when you run `cds watch` on a TypeScript
> CAP project: is it compiling `.ts` to `.js`, or running `.ts` directly?

---

## Short Answer

`cds watch` runs your TypeScript **directly** — it does **not** write `.js` files to disk. Your `srv/` folder stays `.ts`-only; no `CatalogService.js` is ever generated next to `CatalogService.ts`.

> [!TIP]
> *Concept — "run TS directly" really means "transpile in memory": Node itself can only execute JavaScript. Every `.ts` is still turned into JS on the fly — but in RAM, not as files. The invisible translator doing this is `tsx`.*

---

## How It Actually Works

The mechanism is **`tsx`** (it lives in your `devDependencies`). The chain is:

1. `cds watch` starts the CAP server. Because TypeScript is set up (tsx installed + CAP's `CDS_TYPESCRIPT` handling), CAP registers the **tsx loader** into Node.
2. `tsx` hooks into Node's module loading. Every time a `.ts` file is `require`d / `import`ed (`CatalogService.ts`, `CDSService.ts`, the utils), tsx **transpiles it in memory** using **esbuild** and hands the resulting JavaScript straight to Node.
3. That transpiled JS exists only in memory for that run. When the process stops, it is gone. **Nothing is written to disk.**

---

## The One Catch You Must Remember

> [!CAUTION]
> **Transpiling ≠ type-checking.** `tsx` / esbuild is fast precisely because it only **strips the types** — it does **not** verify them. So `cds watch` will happily run code that contains type errors. That is by design. The only tool that validates your types is `tsc --noEmit`, which you must run separately.

---

## Three Tools, None Emit `.js`

| Command | Tool | What it does | Emits `.js`? |
|---|---|---|---|
| `cds watch` | tsx / esbuild | runs the app (strips types, in-memory) | ❌ No |
| `npm test` | ts-jest | runs tests (strips types, in-memory) | ❌ No |
| `npx tsc --noEmit` | tsc | **checks types only** (your safety net) | ❌ No |

> [!TIP]
> *Concept — keep your gates separate: `cds watch` and `npm test` prove your code runs and behaves correctly, but neither catches a type mistake. `tsc --noEmit` is the only type gate. Run it before every commit.*

---

## The Mental Model

```text
Dev (cds watch)   ->  tsx transpiles .ts in memory   ->  no build, no type-check
Tests (npm test)  ->  ts-jest transpiles .ts in memory ->  behaviour gate
Type gate         ->  tsc --noEmit                    ->  validates types only
```

<sub>code by anubhav trainings</sub>

---

## Prove It To Yourself

```powershell
cds watch
# then, in another terminal, list the srv folder:
Get-ChildItem srv
```

<sub>code by anubhav trainings</sub>

You will see only `.ts` and `.cds` files — never a generated `.js`. If CAP were compiling to disk, you would find a `gen/` or `dist/` folder full of `.js`; you will not.

---

<sub>Document generated for the TypeScript migration exercise · code by anubhav trainings</sub>
