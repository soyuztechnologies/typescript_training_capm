# TypeScript Generic Interfaces

> A complete step-by-step guide to understanding **Generic Interfaces** in TypeScript — taught concept by concept, block by block.

---

## 📌 What is a Generic?

*A **generic** is a placeholder type that can be replaced with different types later. Think of it like a variable — but for types, not values. Generics make your code flexible and reusable without sacrificing type safety.*

---

## Step 1 — The Problem: A Fixed-Type Interface

Before understanding generics, let's see **why** they are needed.

Consider a simple `Box` interface that holds a `number`:

```typescript
interface Box {
  value: number
}

const box: Box = {
  value: 100
}
```

<sub>*code by anubhav trainings*</sub>

> 🩷 **Note:** This works perfectly for numbers. But what if tomorrow you need a `Box` that holds a `string`, or a `boolean`, or a custom object? You would need a **separate interface** for every type — that's repetitive and hard to maintain.

---

## Step 2 — The Solution: A Generic Interface

*A **generic interface** uses a **type parameter** (commonly written as `<T>`) to represent the type. When you use the interface, you specify what `T` should be.*

```typescript
interface Box<T> {
  value: T
}
```

<sub>*code by anubhav trainings*</sub>

Here, `T` is the **type variable**. It acts as a placeholder. You decide what `T` is when you actually use the interface.

---

## Step 3 — Using the Generic Interface

Now the same `Box` interface can hold **any type** — you just pass the type inside `< >` when declaring the variable:

```typescript
const numberBox: Box<number> = {
  value: 100
}

const stringBox: Box<string> = {
  value: "Hello"
}
```

<sub>*code by anubhav trainings*</sub>

*When you write `Box<number>`, TypeScript replaces `T` with `number`. When you write `Box<string>`, TypeScript replaces `T` with `string`. One interface — infinite possibilities.*

> 🩷 **Note:** TypeScript will throw a **compile-time error** if you try to assign a value of the wrong type. For example, `Box<number>` with `value: "Hello"` will fail. This is the power of generics — flexibility **with** safety.

---

## Step 4 — Default Type Parameters

*You can give a **default type** to a generic parameter using `= SomeType`. If the user doesn't provide a type, the default is used.*

```typescript
interface ODataV2Payload<T = unknown> {
  d: {
    results: T[]
  }
}
```

<sub>*code by anubhav trainings*</sub>

Here:

- `T` is the generic type parameter
- `= unknown` is the **default** — if no type is given, TypeScript uses `unknown` (the safest fallback)
- `results: T[]` means the `results` array will contain items of type `T`

---

## Step 5 — Combining Generics with Custom Interfaces

*Generics become truly powerful when combined with your own custom interfaces. You can describe real-world data structures in a fully type-safe way.*

First, define a `Student` interface:

```typescript
interface Student {
  name: string
  grade: number
}
```

<sub>*code by anubhav trainings*</sub>

Now use it with `ODataV2Payload<T>` to describe a typed API response:

```typescript
const response: ODataV2Payload<Student> = {
  d: {
    results: [
      {
        name: "Rahul",
        grade: 5
      },
      {
        name: "Priya",
        grade: 6
      }
    ]
  }
}

console.log(response)
```

<sub>*code by anubhav trainings*</sub>

*Here, TypeScript now knows that every item inside `results` is a `Student`. If you accidentally add a field that doesn't exist on `Student`, or miss a required field, TypeScript will immediately warn you.*

> 🩷 **Note:** This pattern (`ODataV2Payload<T>`) is extremely common in **SAP / OData** integrations and enterprise API development. Generics let you write one payload wrapper that works for **Students, Products, Orders** — or any other entity — without rewriting the wrapper each time.

---

## 🧠 Concept Summary

| Concept | What it does |
|---|---|
| `interface Box<T>` | Declares a generic interface with type placeholder `T` |
| `Box<number>` | Replaces `T` with `number` when using the interface |
| `T = unknown` | Sets a default type if none is provided |
| `T[]` | An array of whatever type `T` resolves to |
| Combining interfaces | Pass a custom interface as `T` for full type-safety |

---

*Generic interfaces are one of the most important tools in TypeScript for writing **reusable, scalable, and type-safe** code.*

---

<sub>*code by anubhav trainings*</sub>
