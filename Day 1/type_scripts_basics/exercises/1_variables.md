# TypeScript Variables and Type Basics

## Understanding Explicit Type Annotations

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Explicit typing* means you tell TypeScript exactly what type a variable should be. This provides clarity and catches errors at compile time rather than runtime.
</span>

TypeScript allows you to declare the type of a variable explicitly using a colon `:` followed by the type name. This is one of the most powerful features of TypeScript as it enables better tooling, autocomplete, and error detection.

---

### Block 1: Basic Type Declarations

Let's start with the fundamental types - **String**, **Number**, and **Boolean**:

```typescript
// String type - for text values
let greeting: string = "Hello, TypeScript!";

// Number type - for numeric values
let userCount: number = 42;

// Boolean type - for true/false values
let isLoading: boolean = true;

// Array of numbers - declared with square bracket notation
let scores: number[] = [100, 95, 98];
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>💡 Key Concept:</strong> Once you declare a type, TypeScript will prevent you from assigning a different type to that variable. This is type safety in action!
</div>

**code by anubhav trainings**

---

### Block 2: Function Type Annotations

Functions are more powerful when you specify the types of their parameters and return values:

```typescript
// Function with explicit parameter and return type
function greet(name: string): string {
    return `Hello, ${name}!`;
}

// TypeScript will ensure you pass the correct argument type
greet("Alice"); // ✓ OK - string passed

// greet(42);  // ✗ Error: Argument of type '42' is not assignable to parameter of type 'string'
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Understanding the Syntax:</strong><br>
- <code>name: string</code> means the parameter 'name' must be a string<br>
- <code>: string</code> after the parentheses means the function returns a string<br>
- This contract helps TypeScript verify your code is correct
</div>

**code by anubhav trainings**

---

## Type Inference - TypeScript Figures It Out

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Type inference* is when TypeScript automatically determines the type of a variable based on the value assigned to it. You don't always need to explicitly state the type!
</span>

TypeScript is intelligent enough to infer types from the values you assign. This reduces boilerplate code while maintaining type safety.

---

### Block 3: Variable Type Inference

```typescript
// TypeScript infers this is a string (no explicit type annotation needed)
let username = "alice";

// TypeScript infers this is a number
let score = 100;

// TypeScript infers this is a boolean array
let flags = [true, false, true];
```

When you hover over these variables in an IDE like VS Code, you'll see TypeScript has automatically determined their types, even though you didn't explicitly declare them.

**code by anubhav trainings**

---

### Block 4: Function Return Type Inference

```typescript
// TypeScript infers the return type is number based on the return statement
function sums(a: number, b: number) {
    return a + b;
}

// The function will return a number, TypeScript knows this automatically
const result = sums(5, 10);  // result is typed as number
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>🎯 Pro Tip:</strong> You can omit the return type annotation in functions when the return type is obvious from the return statement. TypeScript will infer it for you!
</div>

**code by anubhav trainings**

---

### Block 5: Object Type Inference

```typescript
// TypeScript infers the shape (structure) of the object
const user = {
    name: "Alice",
    age: 30,
    isAdmin: true
};

// TypeScript knows these properties exist
console.log(user.name);   // ✓ OK - property exists

// console.log(user.email); // ✗ Error: Property 'email' does not exist
```

TypeScript creates an invisible type for this object based on its shape. It knows exactly what properties exist and their types.

**code by anubhav trainings**

---

## Type Mismatch Errors

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Type mismatch errors* occur when you try to assign a value of one type to a variable declared as another type. This is how TypeScript prevents bugs!
</span>

```typescript
// Declaring a variable with explicit string type
let username: string = "alice";

// Trying to assign a number to a string variable
// username = 42;  // ✗ Error: Type 'number' is not assignable to type 'string'

// Correct - assigning a string to a string variable
username = "bob";  // ✓ OK
```

This error prevention is the core benefit of TypeScript. It catches these mistakes before your code runs, saving debugging time.

**code by anubhav trainings**

---

## The Never Type - For Code That Never Returns

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*The never type* represents values that never occur. It's used to indicate that a function never returns normally - it either throws an error or runs forever.
</span>

The `never` type is useful for functions that:
- Throw an error
- Enter an infinite loop
- Have unreachable code paths

---

### Block 6: Never Type in Error Throwing Functions

```typescript
// This function never returns normally - it always throws an error
function throwError(message: string): never {
  throw new Error(message);
}

// Example usage
// throwError("Something went wrong!"); // This line will always throw and stop execution
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>📌 When to Use Never:</strong><br>
- Functions that throw errors<br>
- Validation functions that reject invalid states<br>
- Functions that exhaustively check all possible cases in a switch statement<br>
- Code paths that should genuinely be unreachable
</div>

**code by anubhav trainings**

---

## Summary of Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| **Explicit Type** | Declare exact type | `let name: string = "John"` |
| **Type Inference** | Let TypeScript figure it out | `let name = "John"` |
| **Function Types** | Specify param and return types | `function greet(name: string): string` |
| **Never Type** | Functions that never return | `function throwError(): never` |

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Next Steps:</strong> Now that you understand basic types and type inference, you're ready to explore special types like <code>any</code> and <code>unknown</code> in the next lesson!
</div>

**code by anubhav trainings** ✨
