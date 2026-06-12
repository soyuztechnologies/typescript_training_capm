<h1 align="center">📘 Phase 0 — Introduction to GitHub Actions</h1>

<p align="center"><i>The vocabulary and mental model you need before writing a single line of pipeline YAML.</i></p>

---

## 📋 Cheat Sheet

### Cloud Foundry (cf) commands

```bash
cf api https://api.cf.<region>.hana.ondemand.com   # point CLI at your BTP landscape
cf login                                            # interactive login
cf auth "$CF_USERNAME" "$CF_PASSWORD"               # non-interactive login (for CI)
cf target -o <ORG> -s <SPACE>                       # choose org + space
cf apps                                             # list deployed apps
mbt build                                           # build MTA -> *.mtar
cf deploy mta_archives/*.mtar                       # deploy MTA to BTP
```

<sub>⌨️ code by anubhav trainings</sub>

### Git & GitHub commands

```bash
git checkout -b feature/x   # new branch
git add . && git commit -m "msg"
git push -u origin feature/x
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🤖 What is GitHub Actions?

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — GitHub Actions:</b> a free robot that lives inside your GitHub repository. You give it a set of instructions in a file, and it <b>automatically runs those instructions</b> whenever something happens — like when you push code. It is GitHub's built-in <b>automation engine</b>.</em>
</div>

<br/>

Imagine you hired a tireless assistant who watches your repository 24/7. Every time you upload code, the assistant grabs a fresh computer, downloads your code onto it, and follows your checklist: *"compile it... test it... and if everything is fine, deploy it."* That assistant is **GitHub Actions**, and your checklist is a **workflow file**.

The best part: it is **free for public repos** (and has a generous free tier for private ones), and you never have to manage that computer — GitHub creates and destroys it for you each time.

---

## 🧱 The 7 Words You Must Know

Learning GitHub Actions is mostly learning 7 words. Here they are with a simple analogy: think of **putting on a school play** 🎭.

| Word | What it means | Play analogy 🎭 |
|------|---------------|-----------------|
| **Workflow** | The whole automated process, written in one `.yml` file | The entire play |
| **Event / Trigger** | The thing that *starts* the workflow (e.g. `push`) | The bell that starts the show |
| **Job** | A group of steps that run together on one machine | One act of the play |
| **Step** | A single instruction inside a job | One line spoken by an actor |
| **Action** | A reusable, pre-made step someone else wrote | A prop you borrow instead of building |
| **Runner** | The fresh computer that does the work | The stage |
| **Secret** | An encrypted password the workflow can use safely | The locked safe backstage |

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note:</b> The whole point of a <b>Secret</b> is that nobody — not even people who can read your code — can see its value. We will store the Cloud Foundry password as a secret so the deploy robot can log in <i>without</i> the password ever appearing in your code. Never, ever paste a password directly into a workflow file.
</div>

---

## 📂 Where does the workflow file live?

Always in this exact folder, or GitHub will not find it:

```text
your-project/
└── .github/
    └── workflows/
        └── deploy.yml      <-- your workflow lives here
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — Why <code>.yml</code>?</b> YAML is a text format for writing settings that humans can read easily. <b>Indentation (spaces) matters</b> in YAML the way it matters in Python — two spaces means "this belongs inside that". Never use the Tab key in YAML; use spaces.</em>
</div>

---

## 🔬 Reading a tiny workflow, line by line

Let's read the smallest useful workflow there is. Don't worry about memorizing it — just follow the comments.

```yaml
# .github/workflows/hello.yml

name: Say Hello                 # 1. A friendly name shown in the Actions tab

on: push                        # 2. TRIGGER: run this whenever code is pushed

jobs:                           # 3. The list of jobs (we have just one)
  greet:                        # 4. Our job is called "greet"
    runs-on: ubuntu-latest      # 5. RUNNER: do the work on a fresh Linux machine
    steps:                      # 6. The list of steps inside the job
      - name: Print a message   # 7. A human-readable step name
        run: echo "Hello!"      # 8. The actual command that runs on the runner
```

<sub>⌨️ code by anubhav trainings</sub>

Here is what happens, in plain English:

1. **`name`** — what you'll see in GitHub's *Actions* tab. Cosmetic only.
2. **`on: push`** — the **trigger**. "Whenever someone pushes code, wake up."
3. **`jobs`** — everything below is the work to do.
4. **`greet`** — the internal id of our one job.
5. **`runs-on: ubuntu-latest`** — GitHub spins up a brand-new Linux computer (the **runner**) just for this run, then throws it away after.
6. **`steps`** — the checklist for this job.
7–8. The single step prints `Hello!` to the log.

---

## 🧰 Steps come in two flavours

Look closely — a step does **one of two things**:

### Flavour A — `run:` a command (you type a shell command)

```yaml
- name: Install dependencies
  run: npm ci
```

<sub>⌨️ code by anubhav trainings</sub>

### Flavour B — `uses:` an Action (you borrow someone's ready-made step)

```yaml
- name: Get my code onto the runner
  uses: actions/checkout@v4     # a pre-built Action that clones your repo
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>Concept — <code>actions/checkout</code>:</b> the runner starts <b>empty</b> — it does not have your code yet! The very first step of almost every workflow is <code>uses: actions/checkout@v4</code>, which downloads ("checks out") your repository onto the runner so the next steps have something to work with.</em>
</div>

---

## 🔁 How a run actually flows

```text
You: git push
        │
        ▼
GitHub sees the "push" event  ──►  matches  on: push  in deploy.yml
        │
        ▼
GitHub rents a fresh Linux runner 🖥️
        │
        ▼
Runs each step top-to-bottom:
   1. checkout code
   2. install Node + deps
   3. tsc --noEmit   (type gate)
   4. jest           (test gate)
   5. tsc            (compile)
   6. cf deploy      (ship it)
        │
        ▼
If ANY step fails ❌ → stop, mark the run red, email you.
If ALL steps pass ✅ → run is green, app is deployed.
```

<sub>⌨️ code by anubhav trainings</sub>

<div style="background-color:#ffe3ec;border-left:6px solid #e5476d;padding:10px 16px;border-radius:6px;">
📌 <b>Note — the golden rule:</b> steps run <b>top to bottom</b>, and if one step <b>fails</b> (exits with an error), every step after it is <b>skipped</b>. This is <i>exactly</i> why we put <code>tsc --noEmit</code> first: if the types are broken, the test and deploy steps never even run. That is what makes it a <b>gate</b>.
</div>

---

## 🧪 Triggers you'll actually use

```yaml
on:
  push:
    branches: [ main ]          # run when code lands on main
  pull_request:
    branches: [ main ]          # ALSO run when someone opens a PR into main
  workflow_dispatch:            # ALSO allow a manual "Run" button in the UI
```

<sub>⌨️ code by anubhav trainings</sub>

- **`push`** → great for "deploy when it reaches main".
- **`pull_request`** → great for "check this branch *before* we merge it" (this is how our deliberate type-error test will get caught!).
- **`workflow_dispatch`** → adds a button so you can run it by hand whenever you want.

---

## 🎯 Final version — a complete starter workflow

This is a full, valid workflow that checks out code, installs Node, and runs a type-check. We will grow this into the real deploy pipeline in Phase 2 — but if you understand every line here, the rest is easy.

```yaml
# .github/workflows/intro.yml
name: Intro CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      # 1) put the repository's files onto the runner
      - name: Checkout code
        uses: actions/checkout@v4

      # 2) install a specific Node.js version on the runner
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # 3) install exactly the dependencies from package-lock.json
      - name: Install dependencies
        run: npm ci

      # 4) the quality GATE — fail the whole run if types are wrong
      - name: TypeScript type check
        run: npx tsc --noEmit
```

<sub>⌨️ code by anubhav trainings</sub>

---

## 🧠 Quick self-check

Before moving on, make sure you can answer these out loud:

1. What is the difference between a **job** and a **step**?
2. What does `uses: actions/checkout@v4` do, and why is it almost always first?
3. If step 3 fails, will step 4 run? Why is that useful?
4. Where must the workflow file live for GitHub to notice it?
5. Why do we store the Cloud Foundry password as a **secret** instead of in the file?

<div style="background-color:#e6ffed;border-left:6px solid #2da44e;padding:10px 16px;border-radius:6px;">
<em>🌱 <b>You're ready.</b> You now know enough vocabulary to read any GitHub Actions workflow. Next we get our hands dirty: write tests, test the app manually, and put the project on GitHub.</em>
</div>

<br/>

➡️ **Next:** [02-step1-prerequisites.md](02-step1-prerequisites.md)

<sub>⌨️ code by anubhav trainings</sub>
