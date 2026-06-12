# Converting JavaScript Functions to TypeScript

## From Plain JS to Type-Safe TS

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Converting* JavaScript to TypeScript is usually incremental. You start with working JS, then add type annotations to parameters and return values so the compiler can catch mistakes before runtime.
</span>

The golden rule: **the runtime logic stays the same — you are only adding types.** Valid JavaScript is already valid TypeScript, so conversion is about *strengthening* the code, not rewriting it.

---

## When to Use Each Type

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
In the examples below, the left column is the original JavaScript and the right column is the converted TypeScript. Read them side by side to see exactly what was added.
</span>

---

### Block 1: Simple Function Conversion

The most basic conversion: annotate each parameter and the return value.

<table>
<tr>
<th>❌ Old JavaScript</th>
<th>✅ New TypeScript</th>
</tr>
<tr>
<td>

```javascript
// No types - anything can be passed in
function add(a, b) {
  return a + b;
}

add(2, 3);       // 5
add("2", "3");   // "23" 😱 oops!
```

</td>
<td>

```typescript
// Parameters and return value are typed
function add(a: number, b: number): number {
  return a + b;
}

add(2, 3);       // 5  ✓
// add("2", "3"); // ✗ Compile error!
```

</td>
</tr>
</table>

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>What changed:</strong><br>
- <code>a</code> → <code>a: number</code> (parameter type)<br>
- <code>b</code> → <code>b: number</code> (parameter type)<br>
- <code>)</code> → <code>): number</code> (return type)<br>
The body is identical — only annotations were added.
</div>

**code by anubhav trainings**

---

### Block 2: Arrow Function Conversion

Arrow functions follow the same pattern — types go in the same places.

<table>
<tr>
<th>❌ Old JavaScript</th>
<th>✅ New TypeScript</th>
</tr>
<tr>
<td>

```javascript
// Untyped arrow function
const greet = (name) => {
  return `Hello, ${name}!`;
};

// One-liner version
const square = (n) => n * n;
```

</td>
<td>

```typescript
// Typed arrow function
const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

// One-liner version
const square = (n: number): number => n * n;
```

</td>
</tr>
</table>

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Tip:</strong> TypeScript can often <em>infer</em> the return type, so <code>const square = (n: number) => n * n;</code> is also valid. Annotating the return type explicitly is still good practice for public functions — it documents intent and catches mistakes inside the body.
</div>

**code by anubhav trainings**

---

### Block 3: Adding an Interface as a Parameter

When a function takes an object, describe its shape with an `interface` instead of leaving it untyped.

<table>
<tr>
<th>❌ Old JavaScript</th>
<th>✅ New TypeScript</th>
</tr>
<tr>
<td>

```javascript
// 'user' is just "some object" -
// no idea what properties it has
function formatUser(user) {
  return `${user.name} (${user.age})`;
}

formatUser({ name: "Alice", age: 30 });
```

</td>
<td>

```typescript
// Describe the object's shape once
interface User {
  name: string;
  age: number;
}

function formatUser(user: User): string {
  return `${user.name} (${user.age})`;
}

formatUser({ name: "Alice", age: 30 });
```

</td>
</tr>
</table>

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Why an interface?</strong> Now the editor autocompletes <code>user.name</code> and <code>user.age</code>, and typos like <code>user.naem</code> become compile errors. Passing an object missing a field (e.g. no <code>age</code>) is also rejected.
</div>

**code by anubhav trainings**

---

### Block 4: Typed Return Value with a Type Guard

When a function returns an object, type the return value too. If the input is uncertain (e.g. `unknown` data), use a **type guard** to prove the shape before returning.

<table>
<tr>
<th>❌ Old JavaScript</th>
<th>✅ New TypeScript</th>
</tr>
<tr>
<td>

```javascript
// Returns... something. Caller can't
// be sure what they get back.
function parseUser(data) {
  if (data && data.name) {
    return { name: data.name, age: data.age };
  }
  return null;
}
```

</td>
<td>

```typescript
interface User {
  name: string;
  age: number;
}

// Type guard: returns 'data is User'.
// If it returns true, TS treats data as User.
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as User).name === "string" &&
    typeof (data as User).age === "number"
  );
}

// Return type is clearly User | null
function parseUser(data: unknown): User | null {
  if (isUser(data)) {
    // Inside here, data is narrowed to User
    return { name: data.name, age: data.age };
  }
  return null;
}
```

</td>
</tr>
</table>

<div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #ffeeba;">
<strong>🛡️ Concept — Type Guard with <code>is</code>:</strong> A function whose return type is written <code>data is User</code> is a <em>user-defined type guard</em>. When it returns <code>true</code>, TypeScript <em>narrows</em> the argument to that type in the calling code — so inside <code>if (isUser(data))</code> you can safely access <code>data.name</code> and <code>data.age</code> with full type checking. This is how you bridge untyped <code>unknown</code> input to a strongly-typed return value.
</div>

**code by anubhav trainings**

---

### Block 5: Safe Nested Access with Optional Chaining (`?.`)

Real data is often deeply nested and properties may be missing. The optional chaining operator `?.` lets you reach into nested values without crashing.

<table>
<tr>
<th>❌ Old JavaScript</th>
<th>✅ New TypeScript</th>
</tr>
<tr>
<td>

```javascript
// Crashes if 'a' or 'b' is missing:
// "Cannot read property 'c' of undefined"
const value = mydata.a.b.c;

// Old defensive style - verbose
const safe =
  mydata && mydata.a && mydata.a.b
    ? mydata.a.b.c
    : undefined;
```

</td>
<td>

```typescript
interface MyData {
  a?: { b?: { c?: string } };
}

const mydata: MyData = {};

// Short-circuits to undefined if any
// link in the chain is null/undefined
const value = mydata?.a?.b?.c;  // undefined, no crash
```

</td>
</tr>
</table>

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>💡 How <code>mydata?.a?.b?.c</code> works (conceptually):</strong><br>
Read it left to right. At <em>each</em> <code>?.</code>, TypeScript asks: <em>"is the thing on my left <code>null</code> or <code>undefined</code>?"</em><br><br>
1. <code>mydata?.</code> → if <code>mydata</code> is null/undefined, stop and return <code>undefined</code>. Otherwise continue.<br>
2. <code>.a?.</code> → if <code>a</code> is null/undefined, stop and return <code>undefined</code>. Otherwise continue.<br>
3. <code>.b?.</code> → if <code>b</code> is null/undefined, stop and return <code>undefined</code>. Otherwise continue.<br>
4. <code>.c</code> → finally read <code>c</code>.<br><br>
The whole expression "short-circuits": the moment any link is missing, evaluation stops and the result is <code>undefined</code> — never a runtime crash. Because the interface marks each level as optional (<code>?</code>), TypeScript correctly types the result as <code>string | undefined</code>, forcing you to handle the missing case.
</div>

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>⚠️ Note:</strong> <code>?.</code> only guards against <code>null</code> and <code>undefined</code> — not against a wrong type. Combine it with the <code>??</code> (nullish coalescing) operator to supply a default: <code>const c = mydata?.a?.b?.c ?? "default";</code>
</div>

**code by anubhav trainings**

---

## Conversion Checklist

| Step | JavaScript | TypeScript |
|------|-----------|-----------|
| **Parameters** | `function f(x)` | `function f(x: number)` |
| **Return value** | `function f()` | `function f(): string` |
| **Object params** | `(user)` | `(user: User)` with an `interface` |
| **Uncertain input** | manual `if` checks | `unknown` + type guard (`x is T`) |
| **Nested access** | `a && a.b && a.b.c` | `a?.b?.c` |

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Key Takeaway:</strong> Converting JS to TS means <em>adding types, not changing logic</em>. Start with parameters and return values, describe objects with interfaces, protect uncertain data with type guards, and reach into nested values safely with <code>?.</code>. Each annotation moves a potential runtime bug to compile time!
</div>

**code by anubhav trainings** ✨