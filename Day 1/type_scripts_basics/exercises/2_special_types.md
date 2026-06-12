# TypeScript Special Types: Any and Unknown

## Understanding Special Types in the Type System

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Special types* are unique types in TypeScript's type system that have specific behaviors. The two most important are <code>any</code> and <code>unknown</code>, which handle flexibility differently.
</span>

Sometimes you need flexibility when working with values whose type you don't know. TypeScript provides special types to handle these scenarios safely (or less safely, depending on your needs).

---

## The `any` Type - Opting Out of Type Checking

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*The `any` type* is a way to tell TypeScript: "I know what I'm doing, trust me." It disables type checking completely for that variable.
</span>

The `any` type is a powerful escape hatch, but it comes with trade-offs. Use it cautiously!

---

### Block 1: Understanding the Any Type

```typescript
// The 'any' type allows you to opt-out of type checking
// This variable can hold any value and you can perform any operation on it
let anything: any = "This can be a string";

// TypeScript doesn't complain about these reassignments
anything = 42;                      // ✓ OK - assigning a number
anything = { name: "Alice" };       // ✓ OK - assigning an object

// You can call any method without type checking
// anything.someNonExistentMethod(); // No error from TypeScript, but fails at runtime!
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>⚠️ Warning:</strong> The <code>any</code> type bypasses all type safety. If you use <code>any</code>, you lose all the benefits of TypeScript's type checking at that point. Avoid it when possible!
</div>

**code by anubhav trainings**

---

### Block 2: Why Any Is Problematic

```typescript
let value: any = "hello";

// TypeScript allows this even though it will fail at runtime
// value.toUpperCase();  // Works because string has this method

// But this will not show an error, even though it's wrong
// value.someRandomMethod();  // No error from TypeScript, crash at runtime!

// The problem: You lose all autocomplete and type safety
```

When you use `any`, you're essentially opting out of TypeScript's protection. The compiler trusts you completely, which can lead to runtime errors.

**code by anubhav trainings**

---

## The `unknown` Type - Safer Flexibility

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*The `unknown` type* is similar to `any` in that it can hold any value, but it's much safer because you cannot perform operations on it without first checking its actual type (type narrowing).
</span>

Think of `unknown` as "any with guardrails." It forces you to be explicit about type safety.

---

### Block 3: Basic Unknown Type Usage

```typescript
// The 'unknown' type can hold any value
let w: unknown = 1;

// You can reassign it to any value without error
w = "string";           // ✓ OK

w = {
  runANonExistentMethod: () => {
    console.log("I think therefore I am");
  }
} as { runANonExistentMethod: () => void}

// But you CANNOT call methods directly on unknown
// w.runANonExistentMethod(); // ✗ Error: Object is of type 'unknown'
```

The key difference: `unknown` requires you to check the type before using it. This is safer!

**code by anubhav trainings**

---

### Block 4: Type Narrowing with Unknown

To safely use an `unknown` value, you must first narrow its type using type guards:

```typescript
// Type narrowing: Check if w is an object before using it
if(typeof w === 'object' && w !== null) {
  // Now TypeScript knows w is an object
  // We still need to cast to use the method
  (w as { runANonExistentMethod: Function }).runANonExistentMethod();
}
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Type Narrowing Explained:</strong><br>
1. Check the type using <code>typeof</code>, <code>instanceof</code>, or other guards<br>
2. TypeScript then knows the narrower type within that code block<br>
3. This is safer than just casting with <code>as</code>
</div>

**code by anubhav trainings**

---

### Block 5: Processing Unknown Values Safely

```typescript
// This function demonstrates safe handling of unknown types
function processValue(value: unknown) {
  if (typeof value === 'string') {
    // TypeScript now knows value is a string in this block
    console.log(value.toUpperCase());
  } else if (Array.isArray(value)) {
    // TypeScript now knows value is an array in this block
    console.log(value.length);
  }
  // For other types, we can add more conditions
}

// Safe calls - type is checked before processing
processValue("Hello");      // ✓ OK - logs "HELLO"
processValue([1, 2, 3]);    // ✓ OK - logs 3
processValue(42);           // ✓ OK - enters neither condition
```

This pattern is much safer than using `any` because you're forced to think about what type the value actually is.

**code by anubhav trainings**

---

## When to Use Each Type

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
Understanding when to use `any` versus `unknown` is crucial for writing safe TypeScript code.
</span>

---

### Block 6: When to Use Unknown

<div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #ffeeba;">
<strong>🛡️ Concept — Type Guard:</strong> A <em>type guard</em> is any expression that lets TypeScript <em>narrow</em> an <code>unknown</code> (or wider) value down to a more specific type. Inside the <code>true</code> branch of the guard, TypeScript treats the value as that narrower type — so method calls and property access become safe. Common built-in guards:
<ul>
<li><code>typeof x === 'string'</code> — narrows to primitives (string, number, boolean, etc.)</li>
<li><code>Array.isArray(x)</code> — narrows to an array</li>
<li><code>x instanceof SomeClass</code> — narrows to a class instance</li>
<li><code>x !== null &amp;&amp; 'prop' in x</code> — checks a property exists on an object</li>
</ul>
</div>

```typescript
// Perfect use cases for unknown:

// 1. Working with external API responses
function handleApiResponse(data: unknown) {
  // Type guard: narrow 'unknown' to a non-null object before using it
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, any>;
    console.log(obj.status);
  }
}

// 2. Parsing user input
function parseUserInput(input: unknown) {
  // Type guard: only proceed if 'input' is actually a string
  if (typeof input === 'string') {
    return JSON.parse(input);
  }
  throw new Error("Invalid input");
}

// 3. Migrating from JavaScript gradually
// unknown forces you to add type checks as you upgrade to TypeScript
```

#### Testing the calls

Here's how you'd actually exercise the functions above and what each call does:

```typescript
// --- Testing handleApiResponse ---
handleApiResponse({ status: 200 });   // logs: 200 (passes the object type guard)
handleApiResponse("not an object");   // logs nothing (guard is false, string skipped)
handleApiResponse(null);              // logs nothing (data !== null blocks it)

// --- Testing parseUserInput ---
const parsed = parseUserInput('{"name":"Alice"}');
console.log(parsed);                  // logs: { name: "Alice" } (valid JSON string)

try {
  parseUserInput(42);                 // not a string -> guard fails
} catch (e) {
  console.log((e as Error).message);  // logs: "Invalid input"
}
```

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>💡 Try it yourself:</strong> Run this file with <code>ts-node 2_special_types.ts</code>, or compile with <code>tsc 2_special_types.ts</code> and run the output with <code>node 2_special_types.js</code>. Watch which calls log a value and which are silently skipped — that's the type guard doing its job.
</div>

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>✅ Best Practices:</strong><br>
- Use <code>unknown</code> when you need flexibility but want type safety<br>
- Use <code>any</code> only as a last resort when migrating large JavaScript codebases<br>
- Always prefer specific types over <code>any</code> or <code>unknown</code> when possible<br>
- Use type guards to narrow <code>unknown</code> before operating on it
</div>

**code by anubhav trainings**

---

## Comparison: Any vs Unknown

| Feature | `any` | `unknown` |
|---------|-------|----------|
| **Accepts any value** | ✓ Yes | ✓ Yes |
| **Type checking** | ✗ Disabled | ✓ Enabled |
| **Method calls** | ✓ Allowed | ✗ Not allowed |
| **Type guards required** | ✗ No | ✓ Yes |
| **Safety level** | Low | High |
| **When to use** | Emergency only | Flexibility needed |

---

### Block 7: Real-World Example - API Response Handler

```typescript
// Real scenario: Handling API responses with unknown

interface UserData {
  id: number;
  name: string;
  email: string;
}

function handleApiResponse(response: unknown): UserData | null {
  // Type guard: Is it an object?
  if (typeof response !== 'object' || response === null) {
    console.error("Invalid response format");
    return null;
  }

  const data = response as Record<string, any>;

  // Type guard: Does it have required properties?
  if (typeof data.id === 'number' && 
      typeof data.name === 'string' && 
      typeof data.email === 'string') {
    return {
      id: data.id,
      name: data.name,
      email: data.email
    };
  }

  console.error("Response missing required fields");
  return null;
}

// Usage
const apiResponse = await fetch('/api/user').then(r => r.json());
const user = handleApiResponse(apiResponse);
```

This pattern safely handles unpredictable data from external sources!

**code by anubhav trainings**

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Key Takeaway:</strong> Prefer <code>unknown</code> over <code>any</code>. It gives you flexibility while maintaining type safety through type guards. This is how professional TypeScript developers handle uncertainty!
</div>

**code by anubhav trainings** ✨
