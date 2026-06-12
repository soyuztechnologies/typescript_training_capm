# TypeScript Functions - Advanced Parameter Handling

## Mastering Function Signatures

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Function signatures* in TypeScript specify what types of parameters a function accepts and what type it returns. This ensures functions are called correctly and return expected values.
</span>

Functions are where much of your application logic lives. TypeScript makes them safer by enforcing parameter and return types, and providing advanced features like optional parameters, defaults, and rest parameters.

---

## Optional Parameters

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Optional parameters* allow you to make function parameters optional using the `?` symbol. The function can be called with or without them.
</span>

---

### Block 1: Creating Optional Parameters

```typescript
// The ? makes parameter 'c' optional
function add(a: number, b: number, c?: number) {
  // If c is not provided, use 0 as default
  return a + b + (c || 0);
}

// Calling with required parameters only
console.log(add(2, 3));        // ✓ OK - returns 5, c defaults to 0

// Calling with all parameters
console.log(add(2, 3, 4));     // ✓ OK - returns 9

// Optional parameters must come after required ones
// function wrong(a?: number, b: number) {}  // ✗ Error: required param after optional
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Optional Parameter Rules:</strong><br>
1. Use <code>?</code> after the parameter name to make it optional<br>
2. All optional parameters must come after required parameters<br>
3. Optional parameters can have any type<br>
4. Inside the function, optional params can be <code>undefined</code>
</div>

**code by anubhav trainings**

---

### Block 2: Handling Optional Parameters

```typescript
// Function that filters data - filter is optional
interface FilterOptions {
  search?: string;
  sort?: "asc" | "desc";
}

function getUsers(options?: FilterOptions) {
  // Check if options was provided
  if (!options) {
    return ["Alice", "Bob", "Charlie"];
  }

  // Now we can safely use options properties
  if (options.search) {
    console.log(`Searching for: ${options.search}`);
  }

  if (options.sort) {
    console.log(`Sorting: ${options.sort}`);
  }

  return [];
}

// Call with or without options
getUsers();                                    // ✓ OK
getUsers({ search: "Alice" });                // ✓ OK
getUsers({ search: "Alice", sort: "asc" });   // ✓ OK
```

**code by anubhav trainings**

---

## Default Parameters

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Default parameters* provide a default value when a parameter isn't provided. They're cleaner than optional parameters when you want a specific default.
</span>

---

### Block 3: Using Default Parameters

```typescript
// Set a default value for the exponent parameter
function pow(value: number, exponent: number = 10) {
  return value ** exponent;
}

// Calling with default
console.log("pow(2):", pow(2));           // ✓ Uses exponent = 10, returns 1024

// Calling with both parameters
console.log("pow(2, 3):", pow(2, 3));     // ✓ Overrides default, returns 8

// Default parameters can be expressions
function createMessage(name: string = "Guest", greeting: string = `Hello, ${name}!`) {
  return greeting;
}

console.log(createMessage());                    // "Hello, Guest!"
console.log(createMessage("Alice"));             // "Hello, Alice!"
console.log(createMessage("Bob", "Hi, Bob!"));   // "Hi, Bob!"
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>💡 Default vs Optional:</strong><br>
- <code>c?: number</code> means c can be undefined<br>
- <code>c: number = 0</code> means c has a default value<br>
- Prefer defaults for a specific fallback value<br>
- Use optional when "no value" is meaningful
</div>

**code by anubhav trainings**

---

## Named Parameters with Destructuring

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Destructuring parameters* allows you to pass an object with named properties instead of positional parameters. This makes function calls more readable and flexible.
</span>

---

### Block 4: Object Destructuring in Parameters

```typescript
// Instead of divide(20, 2), use divide({ dividend: 20, divisor: 2 })
// This makes the function call self-documenting

function divide({ dividend, divisor }: { dividend: number, divisor: number }) {
  return dividend / divisor;
}

// Call with clearly labeled parameters
console.log("divide({dividend: 20, divisor: 2}):", divide({dividend: 20, divisor: 2}));
// ✓ Output: 10

// The parameter names are clear - you know what each number represents
// This is much clearer than: divide(20, 2)
```

**code by anubhav trainings**

---

### Block 5: Destructuring with Defaults

```typescript
// Destructuring with default values
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  timeout?: number;
}

function makeRequest(url: string, { 
  method = "GET", 
  headers = {}, 
  timeout = 5000 
}: RequestOptions = {}) {
  console.log(`${method} ${url}`);
  console.log(`Headers:`, headers);
  console.log(`Timeout: ${timeout}ms`);
}

// Can call with no options - uses all defaults
makeRequest("https://api.example.com");

// Or override specific options
makeRequest("https://api.example.com", {
  method: "POST",
  timeout: 10000
});
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Benefits of Destructuring Parameters:</strong><br>
1. Parameter names are self-documenting<br>
2. Easy to add new parameters later<br>
3. Order doesn't matter<br>
4. Can set default values for each property<br>
5. Makes the function signature clearer
</div>

**code by anubhav trainings**

---

## Rest Parameters - Variable Arguments

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Rest parameters* allow a function to accept an unlimited number of arguments as an array. Use the `...` spread operator before the parameter name.
</span>

Rest parameters are perfect when you need to work with a variable number of values, like summing numbers or combining arrays.

---

### Block 6: Basic Rest Parameters

```typescript
// Rest parameter 'zkas' collects all extra arguments into an array
function addNums(a: number, b: number, ...zkas: number[]) {
  // zkas is an array of numbers
  return a + b + zkas.reduce((p, c) => p + c, 0);
}

// Call with 2 arguments (rest is empty array)
console.log("addNums(2, 3):", addNums(2, 3));
// ✓ Returns 5

// Call with 3 arguments (rest contains [4])
console.log("addNums(2, 3, 4):", addNums(2, 3, 4));
// ✓ Returns 9

// Call with 4 arguments (rest contains [4, 5])
console.log("addNums(2, 3, 4, 5):", addNums(2, 3, 4, 5));
// ✓ Returns 14
```

**code by anubhav trainings**

---

### Block 7: Advanced Rest Parameter Patterns

```typescript
// Rest parameters with different types
function combineStrings(separator: string, ...strings: string[]) {
  return strings.join(separator);
}

console.log(combineStrings(", ", "apple", "banana", "orange"));
// ✓ Returns: "apple, banana, orange"

// Rest parameters with object spreading
interface User {
  id: number;
  name: string;
  email: string;
}

function createUsers(...users: User[]) {
  return users;
}

const userList = createUsers(
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" }
);

// Using rest parameters with tuples
function logAll(label: string, ...values: (string | number)[]) {
  console.log(`${label}:`, values);
}

logAll("Numbers", 1, 2, 3);                    // ✓ OK
logAll("Mixed", "hello", 42, "world");         // ✓ OK
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>Rest Parameter Rules:</strong><br>
1. Can only be one rest parameter per function<br>
2. Must be the last parameter<br>
3. Becomes an array of the specified type<br>
4. Can be an empty array if no extra arguments
</div>

**code by anubhav trainings**

---

## Function Parameter Summary

| Feature | Syntax | Use Case |
|---------|--------|----------|
| **Required** | `param: type` | Must always be provided |
| **Optional** | `param?: type` | May be omitted, can be undefined |
| **Default** | `param: type = value` | Has a fallback value |
| **Destructured** | `{ prop }: { prop: type }` | Named object parameters |
| **Rest** | `...params: type[]` | Variable number of arguments |

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Best Practices:</strong><br>
- Use destructuring for functions with many parameters<br>
- Prefer defaults over optionals when a specific value makes sense<br>
- Use rest parameters for functions accepting variable arguments<br>
- Document complex function signatures with JSDoc comments
</div>

**code by anubhav trainings** ✨
