<h1 align="center">🧰 Phase 1 — Step 1: Prerequisites &amp; Manual Validation</h1>

<p align="center"><i>Before we automate anything, we prove the app works by hand: write small tests, run them, test the CAP backend and Fiori app manually, then put the project on GitHub.</i></p>

---

## 📋 Cheat Sheet

### Cloud Foundry (cf) commands

```bash
cf api https://api.cf.<region>.hana.ondemand.com   # point CLI at your BTP landscape
cf login                                            # interactive login
cf auth "$CF_USERNAME" "$CF_PASSWORD"               # non-interactive login (for CI)
cf target -o <ORG> -s <SPACE>                       # choose org + space
cf apps                                             # list deployed apps
cf logs <app> --recent                              # recent logs for an app
mbt build                                           # build MTA -> mta_archives/*.mtar
cf deploy mta_archives/*.mtar                       # deploy MTA to BTP
```

<sub>⌨️ code by anubhav trainings</sub>

### Git & GitHub commands

```bash
git init                              # make this folder a git repo
git remote add origin <repo-url>      # link to GitHub
git add .                             # stage everything
git commit -m "message"               # save a snapshot
git branch -M main                    # rename current branch to main
git push -u origin main               # upload to GitHub
```

<sub>⌨️ code by anubhav trainings</sub>

### Local run / test commands (run inside `Day 3/capm-s4-mashup`)

```bash
npm install            # install dependencies the first time
npm run watch          # start the CAP backend (cds watch) for manual testing
npm test               # run the Jest unit tests
npx jest --watch       # re-run tests automatically while you edit
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🎯 What we'll do in this step

1. **Write 2–3 Jest unit tests** for the order-data validator.
2. **Run those tests** and confirm they pass (and fail when they should).
3. **Manually test** the CAP backend and the Fiori app.
4. **Generate a GitHub PAT** (Personal Access Token).
5. **Create a new GitHub repository** and push the project.

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> Everything in this step happens inside the existing Day 3 project folder: <code>Day 3/capm-s4-mashup</code>. We only <b>add</b> new files. We never edit the app's source code.
</div>

---

## 🧪 Part A — Add Jest tests for the order data

### Why test the order validator?

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — Unit test:</b> a tiny program that calls one small piece of your real code with known inputs, and automatically checks the output is what you expect. If someone later breaks that code, the test goes red and warns you — <b>before</b> the bug reaches users.</em>
</div>

<br/>

Our backend has a function that **validates a sales order** before sending it to S/4HANA. It lives in [`srv/lib/payload-parser.ts`](../../Day%203/capm-s4-mashup/srv/lib/payload-parser.ts). Here is the function we are going to protect:

```ts
// srv/lib/payload-parser.ts  (existing code — DO NOT change)
export function parseSalesOrder(raw: unknown): SalesOrderInput {
  if (!isRecord(raw)) throw new Error('Payload must be a JSON object.');

  const itemsRaw = raw['items'];
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error('At least one item is required.');
  }

  return {
    salesOrderType: requireString(raw, 'salesOrderType'),
    salesOrganization: requireString(raw, 'salesOrganization'),
    distributionChannel: requireString(raw, 'distributionChannel'),
    organizationDivision: requireString(raw, 'organizationDivision'),
    salesDistrict: requireString(raw, 'salesDistrict'),
    soldToParty: requireString(raw, 'soldToParty'),
    salesOrderDate: requireString(raw, 'salesOrderDate'),
    items: itemsRaw.map(parseItem),
  };
}
```

<sub>⌨️ code by anubhav trainings</sub>

It has three behaviours worth testing:
- ✅ A **valid** order is parsed and returned correctly.
- ❌ An order with **no items** is rejected.
- ❌ An order **missing a required field** (like `soldToParty`) is rejected.

That is exactly 3 unit tests. 

---

### Step A1 — Install the test tools

`ts-jest` lets Jest understand TypeScript directly, so we can test our `.ts` files without compiling them first.

```bash
# run inside Day 3/capm-s4-mashup
npm install --save-dev jest ts-jest @types/jest
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>ts-jest</code>:</b> a translator that sits between Jest and TypeScript. Jest only understands JavaScript; <code>ts-jest</code> compiles each <code>.ts</code> test on the fly so Jest can run it. <code>@types/jest</code> gives your editor autocomplete for words like <code>describe</code>, <code>test</code>, and <code>expect</code>.</em>
</div>

---

### Step A2 — Add a Jest config file

Create a new file named **`jest.config.js`** in the project root (`Day 3/capm-s4-mashup`):

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  // use ts-jest so Jest can read TypeScript files
  preset: 'ts-jest',

  // run tests in a Node environment (not a browser)
  testEnvironment: 'node',

  // only look for tests inside the /test folder, named *.test.ts
  testMatch: ['**/test/**/*.test.ts'],

  // use a dedicated tsconfig so test settings stay separate from the app
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
```

<sub>⌨️ code by anubhav trainings</sub>

Now create the test-only TypeScript config **`tsconfig.test.json`** next to it. The app's own `tsconfig.json` uses `"noEmit": true` and strict module settings; tests are happier with the simpler `commonjs` module format, so we give them their own config:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmit": false,
    "types": ["jest", "node"]
  },
  "include": ["test/**/*.ts", "srv/**/*.ts"]
}
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> Keeping a separate <code>tsconfig.test.json</code> means our tests can compile and run without touching the carefully-tuned <code>tsconfig.json</code> that the CAP app and the type-gate rely on. Separation of concerns = fewer surprises.
</div>

---

### Step A3 — Write the test file

Create a new folder `test/` and inside it a file **`test/payload-parser.test.ts`**:

```ts
// test/payload-parser.test.ts
import { parseSalesOrder } from '../srv/lib/payload-parser';

// A reusable, fully-valid order we can tweak per test.
const validOrder = {
  salesOrderType: 'OR',
  salesOrganization: '1710',
  distributionChannel: '10',
  organizationDivision: '00',
  salesDistrict: 'DE0001',
  soldToParty: '17100001',
  salesOrderDate: '2026-06-12',
  items: [
    {
      salesOrderItem: '10',
      material: 'TG11',
      requestedQuantity: '5',
      requestedQuantityUnit: 'PC',
    },
  ],
};

describe('parseSalesOrder (order data validation)', () => {
  // TEST 1 — the happy path
  test('parses a valid order and returns the typed object', () => {
    const result = parseSalesOrder(validOrder);

    expect(result.soldToParty).toBe('17100001');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].material).toBe('TG11');
  });

  // TEST 2 — an order with no items must be rejected
  test('throws when the items array is empty', () => {
    const badOrder = { ...validOrder, items: [] };

    expect(() => parseSalesOrder(badOrder)).toThrow('At least one item is required.');
  });

  // TEST 3 — a missing required field must be rejected
  test('throws when a required field (soldToParty) is missing', () => {
    const { soldToParty, ...withoutSoldTo } = validOrder;

    expect(() => parseSalesOrder(withoutSoldTo)).toThrow(/soldToParty/);
  });
});
```

<sub>⌨️ code by anubhav trainings</sub>

Let's read what each test does:

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>describe</code> / <code>test</code> / <code>expect</code>:</b> <code>describe</code> groups related tests under a title. <code>test</code> (or <code>it</code>) is one single check. <code>expect(x).toBe(y)</code> says "I expect x to equal y" — if it doesn't, the test fails. <code>expect(fn).toThrow(...)</code> says "I expect calling this function to throw an error".</em>
</div>

- **Test 1** feeds a perfect order in and confirms the validator returns the right fields.
- **Test 2** removes all items and confirms the validator **refuses** it with the right message.
- **Test 3** deletes `soldToParty` and confirms the validator complains about that field.

---

### Step A4 — Wire up the `test` script

The project already has this script in `package.json`:

```json
"scripts": {
  "test": "npx jest"
}
```

<sub>⌨️ code by anubhav trainings</sub>

So `npm test` will already call Jest. Nothing to change here — good.

---

## 🏃 Part B — Run and validate the tests manually

### Step B1 — Run the tests

```bash
# inside Day 3/capm-s4-mashup
npm test
```

<sub>⌨️ code by anubhav trainings</sub>

You should see all three tests pass, something like:

```text
PASS  test/payload-parser.test.ts
  parseSalesOrder (order data validation)
    ✓ parses a valid order and returns the typed object (3 ms)
    ✓ throws when the items array is empty (1 ms)
    ✓ throws when a required field (soldToParty) is missing

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — green vs red:</b> ✓ (green) means the code behaved as the test expected. ✗ (red) means it did not. A passing test suite is your safety net before pushing to GitHub.</em>
</div>

### Step B2 — Prove the test actually checks something

A test that can never fail is useless. Prove yours works by **temporarily** changing a test's expectation, e.g. change `toHaveLength(1)` to `toHaveLength(2)`. Re-run `npm test` — it should now go **red**. Then change it back. This is how you trust your tests.

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> Always undo this experiment! It is only to <i>see</i> a failing test once. Put the <code>1</code> back so the suite is green again before you continue.
</div>

---

## 🖥️ Part C — Manually test the CAP backend &amp; Fiori app

Automated tests are great, but you should still see the real app run at least once.

### Step C1 — Start the CAP backend

```bash
# inside Day 3/capm-s4-mashup
npm run watch
```

<sub>⌨️ code by anubhav trainings</sub>

This runs `cds watch`. Watch the terminal for a line like:

```text
[cds] - server listening on { url: 'http://localhost:4004' }
```

<sub>⌨️ code by anubhav trainings</sub>

### Step C2 — Check the service in the browser

Open **http://localhost:4004** in a browser. You should see the CAP welcome page listing the **CatalogService** with entities like **Materials** and **Plants**, and the **getSalesOrders** / **createSalesOrder** operations.

Manual checks to tick off:

| ✅ Check | How |
|---------|-----|
| Service is up | The welcome page at `:4004` loads |
| Local entities work | Click `Materials` → you see seeded rows |
| Mashup function exists | `getSalesOrders` appears in the service list |
| Fiori app loads | Open `http://localhost:4004/manageorder/index.html` (the *Manage Order* UI) |

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — "mocked auth":</b> Day 3's <code>package.json</code> uses <code>auth: mocked</code> for local runs, so you can open the service without logging in. In production it switches to <code>xsuaa</code> (real BTP login). That switch is why we deploy to Cloud Foundry later — to run it "for real".</em>
</div>

### Step C3 — Test the Fiori "Manage Order" app

The Freestyle Fiori app lives in [`app/manageorder`](../../Day%203/capm-s4-mashup/app/manageorder). Open it at:

```text
http://localhost:4004/manageorder/index.html
```

<sub>⌨️ code by anubhav trainings</sub>

Click around: the app talks to the CAP backend's OData service. If the list renders and you can navigate, the front-end ↔ back-end wiring is healthy. Press `Ctrl + C` in the terminal to stop the server when done.

---

## 🔑 Part D — Generate a GitHub Personal Access Token (PAT)

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — PAT (Personal Access Token):</b> a long, secret password that proves to GitHub "this is really me" — used by command-line tools and scripts instead of your real account password. You can give it limited powers and an expiry date, and revoke it any time.</em>
</div>

### Step D1 — Create the token

1. Sign in to **GitHub**.
2. Top-right avatar → **Settings**.
3. Left sidebar (scroll to bottom) → **Developer settings**.
4. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
5. Fill in:
   - **Note:** `capm-s4-mashup CI`
   - **Expiration:** 30 days (fine for training).
   - **Scopes (tick these):**
     - ✅ `repo` (full control of repositories — needed to push)
     - ✅ `workflow` (needed to add/update GitHub Actions files)
6. Click **Generate token**.

### Step D2 — Copy and store it safely

```text
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   <-- copy this NOW
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note — you only see it once!</b> GitHub shows the token a single time. Copy it immediately into a safe place (a password manager). If you lose it, just delete it and generate a new one. <b>Never commit a PAT into your code</b> — anyone who sees it can act as you.
</div>

---

## 📦 Part E — Create a new GitHub repository &amp; push

### Step E1 — Create the empty repo on GitHub

1. Top-left **+** → **New repository**.
2. **Repository name:** `capm-s4-mashup-cicd`.
3. Visibility: **Private** is fine.
4. **Do NOT** tick "Add a README" / .gitignore / license (we already have files).
5. **Create repository**.

GitHub now shows a URL like:

```text
https://github.com/<your-username>/capm-s4-mashup-cicd.git
```

<sub>⌨️ code by anubhav trainings</sub>

### Step E2 — Push your project

From inside the project folder (`Day 3/capm-s4-mashup`):

```bash
git init                      # only if this folder is not already a repo
git add .
git commit -m "Day 3 app + Jest order-data tests"
git branch -M main
git remote add origin https://github.com/<your-username>/capm-s4-mashup-cicd.git
git push -u origin main
```

<sub>⌨️ code by anubhav trainings</sub>

When git asks for a **password**, paste your **PAT** (not your GitHub login password).

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — origin:</b> "origin" is just the nickname for the GitHub copy of your repo. <code>git push -u origin main</code> means "upload my <b>main</b> branch to the GitHub copy and remember this as the default." After the <code>-u</code> once, you can just type <code>git push</code> next time.</em>
</div>

### Step E3 — Confirm it landed

Refresh the GitHub repo page. You should see your files, including `test/payload-parser.test.ts`. 

---

## ✅ Step 1 Definition of Done

- [ ] `jest`, `ts-jest`, `@types/jest` installed.
- [ ] `jest.config.js` and `tsconfig.test.json` created.
- [ ] `test/payload-parser.test.ts` created with **3 passing tests**.
- [ ] `npm test` shows **3 passed**.
- [ ] You saw a test go red on purpose, then green again.
- [ ] CAP backend ran locally and the Fiori app opened.
- [ ] PAT generated and stored safely.
- [ ] New GitHub repo created and project pushed to `main`.

---

## 🧾 Final versions of the files you created

<details>
<summary><b>jest.config.js</b></summary>

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
```

</details>

<details>
<summary><b>tsconfig.test.json</b></summary>

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmit": false,
    "types": ["jest", "node"]
  },
  "include": ["test/**/*.ts", "srv/**/*.ts"]
}
```

</details>

<details>
<summary><b>test/payload-parser.test.ts</b></summary>

```ts
import { parseSalesOrder } from '../srv/lib/payload-parser';

const validOrder = {
  salesOrderType: 'OR',
  salesOrganization: '1710',
  distributionChannel: '10',
  organizationDivision: '00',
  salesDistrict: 'DE0001',
  soldToParty: '17100001',
  salesOrderDate: '2026-06-12',
  items: [
    {
      salesOrderItem: '10',
      material: 'TG11',
      requestedQuantity: '5',
      requestedQuantityUnit: 'PC',
    },
  ],
};

describe('parseSalesOrder (order data validation)', () => {
  test('parses a valid order and returns the typed object', () => {
    const result = parseSalesOrder(validOrder);
    expect(result.soldToParty).toBe('17100001');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].material).toBe('TG11');
  });

  test('throws when the items array is empty', () => {
    const badOrder = { ...validOrder, items: [] };
    expect(() => parseSalesOrder(badOrder)).toThrow('At least one item is required.');
  });

  test('throws when a required field (soldToParty) is missing', () => {
    const { soldToParty, ...withoutSoldTo } = validOrder;
    expect(() => parseSalesOrder(withoutSoldTo)).toThrow(/soldToParty/);
  });
});
```

</details>

<sub>⌨️ code by anubhav trainings</sub>

➡️ **Next:** [03-step2-cicd-type-gates.md](03-step2-cicd-type-gates.md)

<sub>⌨️ code by anubhav trainings</sub>
