<h1 align="center">🛡️ Phase 2 — Step 2: CI/CD Pipeline with TypeScript Type-Gates</h1>

<p align="center"><i>Build <code>.github/workflows/deploy.yml</code> so every push is type-checked, tested, compiled, and only then deployed to SAP BTP Cloud Foundry — and prove the gate works by breaking it on purpose.</i></p>

---

## 📋 Cheat Sheet

### Cloud Foundry (cf) commands

```bash
cf api https://api.cf.<region>.hana.ondemand.com   # point CLI at your BTP landscape
cf auth "$CF_USERNAME" "$CF_PASSWORD"               # non-interactive login (CI uses this)
cf target -o <ORG> -s <SPACE>                       # choose org + space
cf apps                                             # list deployed apps
cf logs <app> --recent                              # recent logs for an app
mbt build                                           # build MTA -> mta_archives/*.mtar
cf deploy mta_archives/*.mtar -f                    # deploy MTA to BTP (-f = no prompt)
cf install-plugin multiapps -f                      # adds the `cf deploy` command
```

<sub>⌨️ code by anubhav trainings</sub>

### Git commands

```bash
git checkout -b feature/break-types   # create + switch to a branch
git add . && git commit -m "msg"
git push -u origin feature/break-types
git revert HEAD --no-edit             # undo the last commit safely
git push                              # upload the revert
```

<sub>⌨️ code by anubhav trainings</sub>

### TypeScript / test gate commands

```bash
npx tsc --noEmit     # GATE 1: type-check only, write no files
npx jest             # GATE 2: run unit tests
npx tsc              # GATE 3: compile TypeScript to dist/
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🎯 Goal of this step

We will create **one workflow file** that runs every time we push, in this exact order:

```text
checkout → install → ① tsc --noEmit → ② jest → ③ tsc (build dist/) → upload dist/ → ④ cf deploy
                         ▲ GATE 1        ▲ GATE 2     ▲ GATE 3                          ▲ only if all green
```

<sub>⌨️ code by anubhav trainings</sub>

![CI/CD pipeline diagram](images/design.svg)

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — build gate:</b> a gate is a step that can <b>stop</b> the pipeline. Because steps run top-to-bottom and a failed step skips everything after it, putting <code>tsc --noEmit</code> first makes type-safety <b>mandatory</b> — broken types can never reach the deploy step.</em>
</div>

---

## 🔐 Part A — Store Cloud Foundry credentials as GitHub Secrets

The deploy robot needs to log in to BTP, but we must **never** put passwords in the workflow file. We use **Secrets** instead.

### Step A1 — Find your CF connection details

```bash
cf api          # prints your API endpoint, e.g. https://api.cf.us10.hana.ondemand.com
cf target       # prints your current org and space
```

<sub>⌨️ code by anubhav trainings</sub>

### Step A2 — Add the secrets on GitHub

In your repo: **Settings → Secrets and variables → Actions → New repository secret**. Add these five:

| Secret name | Example value | What it is |
|-------------|---------------|------------|
| `CF_API` | `https://api.cf.us10.hana.ondemand.com` | Your BTP API endpoint |
| `CF_ORG` | `my-trial` | Your Cloud Foundry org |
| `CF_SPACE` | `dev` | Your space |
| `CF_USERNAME` | `you@example.com` | Your BTP login email |
| `CF_PASSWORD` | `••••••••` | Your BTP password |

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> Once saved, GitHub <b>hides</b> secret values forever — even you cannot read them back, only overwrite them. Inside the workflow we read them with <code>${{ secrets.CF_PASSWORD }}</code>. They are automatically masked in logs, so they never appear in plain text.
</div>

---

## 🏗️ Part B — Build the workflow snippet by snippet

We'll assemble [`.github/workflows/deploy.yml`](../../Day%203/capm-s4-mashup/.github/workflows/deploy.yml) one block at a time. Read each block, understand it, then we'll show the full file at the end.

### Snippet 1 — Name and triggers

```yaml
name: CI-CD to Cloud Foundry

on:
  push:
    branches: [ main ]          # deploy when code lands on main
  pull_request:
    branches: [ main ]          # check (but DON'T deploy) on PRs into main
  workflow_dispatch:            # allow a manual run button
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — why include <code>pull_request</code>?</b> When we later create a branch with a deliberate type error and open a PR, this trigger makes the pipeline run on that branch. That is how we will <b>catch</b> the bad code before it merges — the gate does its job on the PR, not in production.</em>
</div>

---

### Snippet 2 — Job 1: the quality gates (build job)

A **job** runs on its own fresh machine. Our first job does the three gates plus saves the output.

```yaml
jobs:
  build:
    name: Type-check, Test & Compile
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Day 3/capm-s4-mashup   # run all commands inside the project
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: Day 3/capm-s4-mashup/package-lock.json

      - name: Install dependencies
        run: npm ci
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> Our project sits in a folder with a <b>space</b> in the name (<code>Day 3</code>). The <code>working-directory</code> setting tells every <code>run:</code> step to execute inside <code>Day 3/capm-s4-mashup</code> so we don't repeat <code>cd</code> everywhere. <code>npm ci</code> (clean install) is preferred over <code>npm install</code> in CI because it installs the <i>exact</i> versions from <code>package-lock.json</code>.</em>
</div>

---

### Snippet 3 — GATE 1: TypeScript type-check (must be first)

```yaml
      # ───── GATE 1: TYPE CHECK ─────
      - name: TypeScript type-check (tsc --noEmit)
        run: npx tsc --noEmit
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>tsc --noEmit</code>:</b> ask the TypeScript compiler to check every type in the project but <b>write zero files</b>. If any type is wrong, <code>tsc</code> exits with an error code, which makes the step fail, which stops the pipeline. This is the gate that enforces type safety.</em>
</div>

---

### Snippet 4 — GATE 2: Jest tests (after type-check, before deploy)

```yaml
      # ───── GATE 2: UNIT TESTS ─────
      - name: Run unit tests (jest / ts-jest)
        run: npx jest --ci
```

<sub>⌨️ code by anubhav trainings</sub>

The `--ci` flag tells Jest it is running on a server (no interactive prompts, fail instead of writing new snapshots). These are the **order-data tests** you wrote in Step 1. They only run if GATE 1 passed.

---

### Snippet 5 — GATE 3: Compile to `dist/`

```yaml
      # ───── GATE 3: COMPILE ─────
      - name: Compile TypeScript to dist/
        run: npx tsc --project tsconfig.build.json
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> The app's main <code>tsconfig.json</code> has <code>"noEmit": true</code> (it is tuned for <i>checking</i>, not emitting). To actually produce JavaScript in <code>dist/</code>, we use a small extra config <code>tsconfig.build.json</code> that turns emitting back on. We create that file in Part C below.
</div>

---

### Snippet 6 — Upload `dist/` as a build artifact

We compiled `dist/` in Job 1, but Job 2 (deploy) runs on a **different fresh machine** that doesn't have those files. We "hand them over" using an **artifact**.

```yaml
      # ───── PRESERVE BUILD OUTPUT BETWEEN JOBS ─────
      - name: Upload dist/ artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-dist
          path: Day 3/capm-s4-mashup/dist
          retention-days: 5
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — artifact:</b> a zip of files that one job <b>saves</b> and another job (or you, via the GitHub UI) can <b>download</b>. Each job gets a clean machine with nothing shared, so artifacts are how jobs pass results to each other. Here we preserve the compiled <code>dist/</code> so the deploy job can reuse it instead of recompiling.</em>
</div>

---

### Snippet 7 — Job 2: Deploy to Cloud Foundry (only on `main`)

```yaml
  deploy:
    name: Deploy to BTP Cloud Foundry
    needs: build                                   # wait for ALL gates to pass first
    if: github.ref == 'refs/heads/main'            # only deploy from main, never from a PR
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Day 3/capm-s4-mashup
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download dist/ artifact
        uses: actions/download-artifact@v4
        with:
          name: build-dist
          path: Day 3/capm-s4-mashup/dist

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install CF CLI + MTA build tool
        run: |
          npm install -g mbt
          curl -L "https://packages.cloudfoundry.org/stable?release=linux64-binary&source=github" | tar -zx
          sudo mv cf8 /usr/local/bin/cf || sudo mv cf /usr/local/bin/cf
          cf install-plugin multiapps -f

      - name: Build the MTA archive
        run: mbt build

      - name: Login to Cloud Foundry
        run: |
          cf api "${{ secrets.CF_API }}"
          cf auth "${{ secrets.CF_USERNAME }}" "${{ secrets.CF_PASSWORD }}"
          cf target -o "${{ secrets.CF_ORG }}" -s "${{ secrets.CF_SPACE }}"

      - name: Deploy to Cloud Foundry
        run: cf deploy mta_archives/*.mtar -f
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>needs</code> and <code>if</code>:</b> <code>needs: build</code> means the deploy job will not even start until the build job (all three gates) is fully green. <code>if: github.ref == 'refs/heads/main'</code> means deploy <b>only</b> happens for the real <code>main</code> branch — pull-request runs do the checks but stop before deploying. Safety on top of safety.</em>
</div>

---

## 🧩 Part C — The one helper file you must add

Because `tsconfig.json` uses `"noEmit": true`, GATE 3 needs a tiny override to actually write JavaScript. Create **`tsconfig.build.json`** in the project root:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["srv/**/*.ts"]
}
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> We do <b>not</b> touch the original <code>tsconfig.json</code> — we <code>extends</code> it and override only what we need. This keeps GATE 1 (<code>tsc --noEmit</code>) honest while letting GATE 3 produce real output. <code>dist/</code> should be added to <code>.gitignore</code> so compiled files never get committed.</em>
</div>

---

## 🚀 Part D — Commit and watch it run

```bash
git checkout -b ci/add-deploy-workflow
git add .github/workflows/deploy.yml tsconfig.build.json .gitignore
git commit -m "Add CI/CD workflow with type-gates and CF deploy"
git push -u origin ci/add-deploy-workflow
```

<sub>⌨️ code by anubhav trainings</sub>

Open a **Pull Request** into `main`. Go to the repo's **Actions** tab — you'll see the run start. On the PR you'll see the **build** job run the three gates (deploy is skipped because we're not on `main` yet). Merge the PR; the run on `main` will also execute the **deploy** job.

---

## 🧨 Part E — Prove the gate works: break the types on purpose

This is the most important part. A safety net you never test is just decoration. Let's confirm the type-gate actually **blocks** bad code.

### Step E1 — Make a branch for the experiment

```bash
git checkout main
git pull
git checkout -b feature/break-types
```

<sub>⌨️ code by anubhav trainings</sub>

### Step E2 — Introduce a deliberate type error

We'll add **one bad line** to a test file (or any `.ts` file). For example, in `test/payload-parser.test.ts`, add this line inside the first test:

```ts
// 👇 deliberate type error: assigning a number to a string variable
const broken: string = 123;   // TS2322: Type 'number' is not assignable to type 'string'.
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — error code TS2322:</b> TypeScript numbers its errors. <code>TS2322</code> means "you tried to put a value of one type into a slot meant for another type." <code>tsc --noEmit</code> will spot this instantly and exit with a failure — which is exactly what we want the pipeline to catch.</em>
</div>

### Step E3 — Push and open a PR

```bash
git add test/payload-parser.test.ts
git commit -m "TEST: deliberate type error to verify the gate"
git push -u origin feature/break-types
```

<sub>⌨️ code by anubhav trainings</sub>

Open a PR from `feature/break-types` into `main`. Go to the **Actions** tab.

### Step E4 — Confirm the pipeline FAILS at GATE 1

You should see:

```text
✅ Checkout code
✅ Set up Node.js
✅ Install dependencies
❌ TypeScript type-check (tsc --noEmit)
      test/payload-parser.test.ts(12,13): error TS2322:
      Type 'number' is not assignable to type 'string'.
⏭️  Run unit tests (jest)            ← skipped
⏭️  Compile TypeScript to dist/      ← skipped
⏭️  Upload dist/ artifact            ← skipped
⏭️  Deploy to Cloud Foundry          ← skipped (whole job blocked)
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note — this red ❌ is a SUCCESS for us.</b> The pipeline did its one job: it stopped broken code from going any further. Test and deploy never ran. The PR shows a red check, so a reviewer cannot accidentally merge it. <b>This is the whole point of a type-gate.</b>
</div>

### Step E5 — Revert the error and confirm it passes end-to-end

Undo the bad commit cleanly:

```bash
git revert HEAD --no-edit     # creates a new commit that removes the bad line
git push
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>git revert</code> vs delete:</b> <code>git revert</code> doesn't erase history — it adds a <b>new</b> commit that is the exact opposite of the bad one. This is the safe, honest way to undo: anyone reading the history can see the mistake was made <i>and</i> corrected.</em>
</div>

The pipeline re-runs on the new commit. This time you'll see **all gates green**:

```text
✅ TypeScript type-check (tsc --noEmit)
✅ Run unit tests (jest)        → 3 passed
✅ Compile TypeScript to dist/
✅ Upload dist/ artifact
```

<sub>⌨️ code by anubhav trainings</sub>

Merge the PR into `main`; the `main` run additionally executes the **deploy** job and ships the app to Cloud Foundry. 🚀

---

## ✅ Step 2 Definition of Done

- [ ] 5 CF secrets added to the GitHub repo.
- [ ] `tsconfig.build.json` and `dist/` in `.gitignore` added.
- [ ] `.github/workflows/deploy.yml` created with GATE 1 → 2 → 3 → artifact → deploy.
- [ ] Type-check runs **first**; tests run **after** type-check, **before** deploy.
- [ ] `dist/` uploaded as an artifact and downloaded by the deploy job.
- [ ] You created `feature/break-types`, saw the pipeline **fail at GATE 1**.
- [ ] You **reverted** and saw the pipeline pass **end-to-end**.
- [ ] Deploy job runs only on `main` and pushes to Cloud Foundry.

---

## 🧾 Final version — complete `.github/workflows/deploy.yml`

```yaml
# .github/workflows/deploy.yml
name: CI-CD to Cloud Foundry

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  # ============================================================
  # JOB 1 — Quality gates: type-check, test, compile, save dist/
  # ============================================================
  build:
    name: Type-check, Test & Compile
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Day 3/capm-s4-mashup
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: Day 3/capm-s4-mashup/package-lock.json

      - name: Install dependencies
        run: npm ci

      # ───── GATE 1: TYPE CHECK (must be first) ─────
      - name: TypeScript type-check (tsc --noEmit)
        run: npx tsc --noEmit

      # ───── GATE 2: UNIT TESTS (after type-check, before deploy) ─────
      - name: Run unit tests (jest / ts-jest)
        run: npx jest --ci

      # ───── GATE 3: COMPILE to dist/ ─────
      - name: Compile TypeScript to dist/
        run: npx tsc --project tsconfig.build.json

      # ───── PRESERVE dist/ BETWEEN JOBS ─────
      - name: Upload dist/ artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-dist
          path: Day 3/capm-s4-mashup/dist
          retention-days: 5

  # ============================================================
  # JOB 2 — Deploy to Cloud Foundry (only after gates pass, only on main)
  # ============================================================
  deploy:
    name: Deploy to BTP Cloud Foundry
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Day 3/capm-s4-mashup
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download dist/ artifact
        uses: actions/download-artifact@v4
        with:
          name: build-dist
          path: Day 3/capm-s4-mashup/dist

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install CF CLI + MTA build tool
        run: |
          npm install -g mbt
          curl -L "https://packages.cloudfoundry.org/stable?release=linux64-binary&source=github" | tar -zx
          sudo mv cf8 /usr/local/bin/cf || sudo mv cf /usr/local/bin/cf
          cf install-plugin multiapps -f

      - name: Build the MTA archive
        run: mbt build

      - name: Login to Cloud Foundry
        run: |
          cf api "${{ secrets.CF_API }}"
          cf auth "${{ secrets.CF_USERNAME }}" "${{ secrets.CF_PASSWORD }}"
          cf target -o "${{ secrets.CF_ORG }}" -s "${{ secrets.CF_SPACE }}"

      - name: Deploy to Cloud Foundry
        run: cf deploy mta_archives/*.mtar -f
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🧾 Final version — `tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["srv/**/*.ts"]
}
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🧾 Final version — add to `.gitignore`

```text
# compiled output produced by GATE 3 — never commit it
dist/
mta_archives/
gen/
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>You did it!</b> You now have a real CI/CD pipeline that <b>enforces type safety as a mandatory gate</b>, runs your order-data tests, compiles, preserves the build, and deploys to SAP BTP Cloud Foundry — and you <b>proved</b> the gate works by breaking it and fixing it.</em>
</div>

<br/>

⬅️ **Back to:** [00-summary.md](00-summary.md)

<sub>⌨️ code by anubhav trainings</sub>
