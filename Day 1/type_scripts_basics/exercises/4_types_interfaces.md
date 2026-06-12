# TypeScript Types and Interfaces

## Creating Reusable Type Definitions

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Types and Interfaces* are ways to define reusable object shapes in TypeScript. Instead of repeating the same object structure everywhere, you define it once and use it throughout your code.
</span>

TypeScript provides two main ways to define object shapes: `type` aliases and `interface` declarations. Both serve similar purposes but have subtle differences.

---

## Type Aliases - Creating Named Types

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Type aliases* create a new name for any type using the `type` keyword. They're flexible and can represent primitives, unions, tuples, and any other type.
</span>

---

### Block 1: Simple Type Aliases

```typescript
// Create type aliases for primitive types
type CarYear = number;
type CarType = string;
type CarModel = string;

// Now use these aliases instead of repeating the types
const carYear: CarYear = 2001;
const carType: CarType = "Toyota";
const carModel: CarModel = "Corolla";

// This is a form of semantic naming - these aren't just numbers and strings,
// they're specifically car years, types, and models
console.log(`${carYear} ${carType} ${carModel}`);  // ✓ Works perfectly
```

This approach makes code more readable by giving meaningful names to types.

**code by anubhav trainings**

---

### Block 2: Object Type Aliases

```typescript
// Create a type alias for an object shape
type Car = {
  year: CarYear,      // Using previously defined types
  type: CarType,
  model: CarModel
};

// Now you can use this Car type anywhere
const myCar: Car = {
  year: 2001,
  type: "Toyota",
  model: "Corolla"
};

// The object must match the structure exactly
const anotherCar: Car = {
  year: 2020,
  type: "Honda",
  model: "Civic"
};  // ✓ OK
```

**code by anubhav trainings**

---

## Union Types - Multiple Possibilities

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Union types* allow a value to be one of several types. Use the pipe symbol `|` to indicate "or". Union types with `&` combine multiple types (intersection types).
</span>

---

### Block 3: Creating and Using Union Types

```typescript
// Union type: a value can be either "success" or "error"
type Status = "success" | "error";

let response: Status = "success";  // ✓ OK
response = "error";                // ✓ OK
// response = "pending";          // ✗ Error: not a valid Status value

// This pattern is great for state management
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const method: HttpMethod = "POST";  // ✓ OK
// const method: HttpMethod = "FETCH";  // ✗ Error: invalid method
```

<div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #c3e6cb;">
<strong>Union Types Are Great For:</strong><br>
- Status values (success, error, pending)<br>
- HTTP methods (GET, POST, etc.)<br>
- Authentication states<br>
- Result types (success with data, or error with message)
</div>

**code by anubhav trainings**

---

### Block 4: Type Intersection - Combining Types

```typescript
// Define base type
type Animal = { name: string };

// Create a new type that combines Animal with additional properties
// The & symbol means "AND" - must have all properties from both types
type Bear = Animal & { honey: boolean };

// Create a variable of type Bear
const bear: Bear = { 
  name: "Winnie",      // From Animal type
  honey: true          // From additional properties
};

console.log(`${bear.name} likes honey: ${bear.honey}`);  // ✓ OK

// Another example: combining multiple types
type Swimmer = { swim: () => void };
type Flyer = { fly: () => void };
type Dragon = Swimmer & Flyer & { name: string };

const dragon: Dragon = {
  name: "Smaug",
  swim: () => console.log("Swimming"),
  fly: () => console.log("Flying")
};
```

**code by anubhav trainings**

---

## Interfaces - Structural Type Definitions

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Interfaces* are a way to define contracts for object shapes. They use the `interface` keyword and are specifically designed for describing the structure of objects and classes.
</span>

Interfaces are similar to `type` but have some key differences. They're particularly useful for object-oriented programming.

---

### Block 5: Creating Interfaces

```typescript
// Define an interface for a Rectangle
interface Rectangle {
  height: number,
  width: number
}

// Use the interface as a type annotation
const rectangle: Rectangle = {
  height: 20,
  width: 10
};

console.log(`Rectangle: ${rectangle.width}x${rectangle.height}`);  // ✓ OK

// This is the same as using type, but interfaces are cleaner for objects
// interface Rectangle = { ... }  // ✗ This syntax doesn't work with type
```

**code by anubhav trainings**

---

### Block 6: Extending Interfaces - Inheritance

<span style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin: 10px 0;">
*Extending an interface* means creating a new interface that inherits all properties from an existing interface, plus new ones. This creates hierarchical type definitions.
</span>

```typescript
// Base interface
interface Rectangle {
  height: number,
  width: number
}

// Extend the Rectangle interface to add color property
interface ColoredRectangle extends Rectangle {
  color: string
}

// A ColoredRectangle must have height, width (from Rectangle) AND color
const coloredRectangle: ColoredRectangle = {
  height: 20,
  width: 10,
  color: "red"
};

console.log(`${coloredRectangle.color} rectangle: ${coloredRectangle.width}x${coloredRectangle.height}`);
```

<div style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f5c6cb;">
<strong>💡 Interface Inheritance Benefits:</strong><br>
- Avoid repeating common properties<br>
- Create clear hierarchies of types<br>
- Makes code more maintainable<br>
- Easier to refactor shared properties
</div>

**code by anubhav trainings**

---

### Block 7: Multiple Interface Extension

```typescript
// Define multiple interfaces
interface Animal {
  name: string;
  age: number;
}

interface Mammal {
  warm_blooded: boolean;
  hair: boolean;
}

interface Pet {
  owner: string;
  trained: boolean;
}

// Extend multiple interfaces with a single interface
interface Dog extends Animal, Mammal, Pet {
  breed: string;
}

// A Dog must satisfy all parent interfaces plus its own property
const myDog: Dog = {
  name: "Buddy",
  age: 5,
  warm_blooded: true,
  hair: true,
  owner: "John",
  trained: true,
  breed: "Golden Retriever"
};
```

**code by anubhav trainings**

---

## Type vs Interface - Key Differences

| Feature | `type` | `interface` |
|---------|--------|-----------|
| **Primary use** | Any type | Objects only |
| **Can extend** | No (use `&`) | Yes (extends) |
| **Can merge** | No | Yes |
| **Union types** | ✓ Yes | ✗ No |
| **Intersection** | ✓ Yes (`&`) | ✓ Yes (extends) |
| **Syntax** | `type X = { ... }` | `interface X { ... }` |

---

### Block 8: Complex Real-World Example

```typescript
// Define types for an e-commerce system

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order extends Address {
  orderId: string;
  userId: string;
  products: Product[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
}

// Usage
const myOrder: Order = {
  orderId: "ORD-123",
  userId: "USR-456",
  products: [
    { id: "P1", name: "Laptop", price: 999, quantity: 1 },
    { id: "P2", name: "Mouse", price: 29, quantity: 2 }
  ],
  status: "shipped",
  totalAmount: 1057,
  createdAt: new Date(),
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  country: "USA"
};
```

This demonstrates how types and interfaces work together in real applications!

**code by anubhav trainings**

---

<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #bee5eb;">
<strong>🚀 Key Takeaway:</strong> Use <code>interface</code> for object shapes (most common) and <code>type</code> for everything else (unions, intersections, primitives). This combination gives you the best of both worlds!
</div>

**code by anubhav trainings** ✨
