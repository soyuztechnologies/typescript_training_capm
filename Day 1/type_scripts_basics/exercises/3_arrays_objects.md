# TypeScript Arrays and Objects

## Working with Typed Collections

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Arrays and objects* are fundamental data structures. TypeScript allows you to specify exactly what types of values they can contain, preventing accidental type mismatches.
</span>

Arrays and objects in TypeScript go beyond JavaScript by allowing you to declare what types of values they should contain. This ensures consistency and catches errors early.

---

## Typed Arrays - Single Type Collections

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Typed arrays* in TypeScript ensure that all elements in an array are of the same type. You specify the type using the bracket notation: `type[]`.
</span>

---

### Block 1: Basic Typed Arrays

```typescript
// Array of strings - can only contain string values
const names: string[] = [];

// Adding a string to the array - allowed
names.push("Dylan");  // ✓ OK

// Trying to add a number would cause an error
// names.push(3);  // ✗ Error: Argument of type 'number' is not assignable to parameter of type 'string'

// The array type declaration ensures type consistency
```

Every element in a `string[]` must be a string. TypeScript will prevent you from adding other types.

**code by anubhav trainings**

---

### Block 2: Arrays of Other Types

```typescript
// Array of numbers
const scores: number[] = [100, 95, 98];
// scores.push("A+");  // ✗ Error: Can't add string to number array

// Array of booleans
const flags: boolean[] = [true, false, true];
// flags.push("maybe");  // ✗ Error: Can't add string to boolean array

// Alternative syntax (less common)
const numbersAlt: Array<number> = [1, 2, 3];
```

You can create typed arrays for any type: strings, numbers, booleans, objects, or even other arrays!

**code by anubhav trainings**

---

## Readonly Arrays - Immutable Collections

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Readonly arrays* cannot be modified after creation. They're useful when you want to ensure data doesn't change unexpectedly.
</span>

---

### Block 3: Creating Readonly Arrays

```typescript
// Define a readonly array of strings
const namesNew: readonly string[] = ["Dylan"];

// Trying to add elements causes an error
// namesNew.push("Jack");  // ✗ Error: Property 'push' does not exist on type 'readonly string[]'

// Other modification methods are also blocked
// namesNew[0] = "Michael";  // ✗ Error: Cannot assign to readonly property

// But you can read values
console.log(namesNew[0]);  // ✓ OK - outputs "Dylan"
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>💡 Use Readonly When:</strong><br>
- You want to prevent accidental mutations<br>
- Passing data to functions that shouldn't modify it<br>
- Storing configuration or constant data<br>
- Working with immutable programming patterns
</div>

**code by anubhav trainings**

---

## Tuples - Fixed Length, Mixed Type Arrays

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Tuples* are typed arrays with a specific length and type for each position. Unlike regular arrays, each element can have a different type.
</span>

Tuples are perfect when you have a known structure - like coordinates, RGB colors, or database records with specific fields.

---

### Block 4: Defining and Using Tuples

```typescript
// Define a tuple with specific types at each position
// Position 0: number, Position 1: boolean, Position 2: string
let ourTuple: [number, boolean, string];

// Initialize correctly - must match the tuple structure
ourTuple = [5, false, 'Coding God was here'];  // ✓ OK

// Correct type at each position
console.log(ourTuple[0]);  // ✓ OK - outputs 5 (number)
console.log(ourTuple[1]);  // ✓ OK - outputs false (boolean)
console.log(ourTuple[2]);  // ✓ OK - outputs "Coding God was here" (string)

// These would cause errors:
// ourTuple = ["hello", true, 5];  // ✗ Wrong order of types
// ourTuple = [5, false];           // ✗ Missing element
// ourTuple = [5, false, "hi", "extra"];  // ✗ Too many elements
```

**code by anubhav trainings**

---

### Block 5: Real-World Tuple Examples

```typescript
// Tuple for coordinates (x, y)
let coordinates: [number, number] = [10, 20];

// Tuple for RGB color (red, green, blue)
let rgbColor: [number, number, number] = [255, 128, 0];

// Tuple for API response (status, data)
let apiResponse: [number, string] = [200, "Success"];

// Function returning a tuple
function getUserInfo(id: number): [string, number, boolean] {
  // Returns [name, age, isActive]
  return ["Alice", 30, true];
}

const [name, age, isActive] = getUserInfo(1);  // Destructuring tuple
console.log(name, age, isActive);
```

Tuples provide type safety for fixed-structure data!

**code by anubhav trainings**

---

### Block 6: Readonly Tuples

```typescript
// Define a readonly tuple - cannot be modified after creation
const ourReadonlyTuple: readonly [number, boolean, string] = [5, true, 'The Real Coding God'];

// Trying to modify causes an error
// ourReadonlyTuple.push('Coding God took a day off');  // ✗ Error: Property 'push' does not exist

// Also cannot reassign elements
// ourReadonlyTuple[0] = 10;  // ✗ Error: Cannot assign to readonly property

// But reading values works fine
console.log(ourReadonlyTuple[0]);  // ✓ OK - outputs 5
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Tuple Best Practices:</strong><br>
- Use tuples for fixed-structure data (coordinates, colors, pairs)<br>
- Mark tuples as <code>readonly</code> when they shouldn't change<br>
- For larger structures, prefer interfaces (next lesson!)<br>
- Consider adding labels for clarity in complex tuples
</div>

**code by anubhav trainings**

---

## Typed Objects - Shape Definitions

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Typed objects* in TypeScript allow you to define the exact shape of an object - what properties it has and what types those properties should be.
</span>

---

### Block 7: Object Type Annotations

```typescript
// Define an inline object type with property types
const car: { type: string, model: string, year: number } = {
  type: "Toyota",
  model: "Corolla",
  year: 2009
};

// Accessing properties - TypeScript knows their types
console.log(car.type);   // ✓ OK - outputs "Toyota"
// console.log(car.color);  // ✗ Error: Property 'color' does not exist on type

// Type safety: trying to assign wrong types
// car.year = "2009";  // ✗ Error: Type 'string' is not assignable to type 'number'
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>⚠️ Note:</strong> While inline object types work, it's better to use <code>interface</code> or <code>type</code> for reusable object shapes. More on that in the next lesson!
</div>

**code by anubhav trainings**

---

### Block 8: Object Property Access

```typescript
// TypeScript ensures type safety for all properties
interface Product {
  name: string;
  price: number;
  inStock: boolean;
}

const product: Product = {
  name: "Laptop",
  price: 999,
  inStock: true
};

// Safe property access with type checking
const productName: string = product.name;      // ✓ OK
const productPrice: number = product.price;    // ✓ OK
const isAvailable: boolean = product.inStock;  // ✓ OK

// These would cause type errors:
// const invalid: string = product.price;     // ✗ Can't assign number to string
// console.log(product.description);          // ✗ Property doesn't exist
```

**code by anubhav trainings**

---

## Summary: Arrays and Objects

| Structure | Syntax | Use Case |
|-----------|--------|----------|
| **Typed Array** | `string[]` | Variable length, single type |
| **Readonly Array** | `readonly string[]` | Immutable collections |
| **Tuple** | `[number, string, boolean]` | Fixed length, mixed types |
| **Readonly Tuple** | `readonly [number, string]` | Fixed, immutable structure |
| **Typed Object** | `{ name: string, age: number }` | Specific shape with properties |

---

### Block 9: Combining Arrays and Objects

```typescript
// Array of objects - very common pattern
interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" }
];

// Type-safe iteration
for (const user of users) {
  console.log(`${user.name}: ${user.email}`);  // ✓ Types are checked
}

// Array methods work with type safety
const emails: string[] = users.map(u => u.email);
console.log(emails);  // ✓ emails is correctly typed as string[]
```

**code by anubhav trainings**

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Next Steps:</strong> Arrays and objects are the foundation. In the next lesson, you'll learn <code>type</code> and <code>interface</code> to create reusable, well-organized type definitions!
</div>

**code by anubhav trainings** ✨
