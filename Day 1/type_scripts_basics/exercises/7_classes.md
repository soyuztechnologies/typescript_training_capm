# TypeScript Classes & Generics

> A complete step-by-step guide to understanding **Classes** and **Generics in Classes** in TypeScript — taught concept by concept, block by block.

---

## 📌 What are Classes?

*A **class** is a blueprint for creating objects. It bundles together **data** (properties) and **behaviour** (methods) in a single reusable structure. TypeScript classes work just like ES6 classes but with the added power of type annotations.*

---

## Step 1 — Defining a Basic Class

Let's start with a simple `Person` class:

```typescript
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

const person = new Person("Jane");
console.log(person.name); // ✓ Works fine
```

<sub>*code by anubhav trainings*</sub>

Breaking this down line by line:

- `name: string` — declares a **class property** with type `string`
- `constructor(name: string)` — a special method that runs when you create a new object with `new`
- `this.name = name` — assigns the incoming parameter to the class property
- `new Person("Jane")` — creates an **instance** of the class

*The `constructor` is the entry point of a class. Every time you call `new Person(...)`, the constructor runs and initialises the object.*

> 🩷 **Note:** This pattern — declaring a property first and then assigning it in the constructor — is the **explicit, readable** approach. TypeScript also supports a shorthand using **parameter properties** (`constructor(public name: string) {}`), but the explicit version shown here is considered best practice for learners as it makes the flow crystal clear.

---

## Step 2 — What are Generics?

*Before writing a generic class, understand the concept: **generics** allow you to create classes, functions, and type aliases that work with **any type** without specifying that type upfront. The actual type is decided at the time of use.*

Key benefits:

- Write the logic **once**, use it with **many types**
- TypeScript still enforces **type safety** throughout
- Avoids duplicating classes for every possible type

---

## Step 3 — Generic Functions

*A **generic function** uses type parameters (like `<S, T>`) in its signature. These are resolved when you actually call the function.*

```typescript
function createPair<S, T>(v1: S, v2: T): [S, T] {
  return [v1, v2];
}

console.log(createPair<string, number>('hello', 42)); // ['hello', 42]
```

<sub>*code by anubhav trainings*</sub>

Here:

- `<S, T>` — two type parameters; `S` for the first value, `T` for the second
- `v1: S, v2: T` — parameters typed using those placeholders
- `: [S, T]` — the **return type** is a **tuple** — an ordered array where position 0 is type `S` and position 1 is type `T`
- `createPair<string, number>` — at call time, `S` becomes `string` and `T` becomes `number`

*You can pass **two completely different types** and TypeScript tracks each one independently across the entire function.*

> 🩷 **Note:** A **tuple** (`[S, T]`) is different from a regular array (`T[]`). An array can have any number of items all of the same type. A tuple has a **fixed length** and each position has its **own type**. `[string, number]` means: exactly 2 items — first is a string, second is a number.

---

## Step 4 — Generic Classes

*Just like generic interfaces and functions, you can create **generic classes**. This is useful for building reusable containers or utilities that work with any type.*

```typescript
class NamedValue<T> {
  private _value: T | undefined;

  constructor(private name: string) {}

  public setValue(value: T) {
    this._value = value;
  }

  public getValue(): T | undefined {
    return this._value;
  }

  public toString(): string {
    return `${this.name}: ${this._value}`;
  }
}
```

<sub>*code by anubhav trainings*</sub>

Let's break down every part:

- `class NamedValue<T>` — the class accepts a type parameter `T`
- `private _value: T | undefined` — the stored value is of type `T`, or `undefined` if not yet set. The underscore (`_value`) is a naming convention for private fields
- `constructor(private name: string) {}` — **shorthand constructor syntax**: `private name` both declares the property AND assigns it in one go. The empty `{}` body means no other setup is needed
- `public setValue(value: T)` — accepts a value of type `T` and stores it
- `public getValue(): T | undefined` — returns the value (or `undefined`)
- `public toString(): string` — returns a formatted string combining the name and value

---

## Step 5 — Using the Generic Class

```typescript
let value = new NamedValue<number>('myNumber');
value.setValue(10);
console.log(value.toString()); // myNumber: 10
```

<sub>*code by anubhav trainings*</sub>

*When you write `new NamedValue<number>(...)`, TypeScript replaces every occurrence of `T` inside the class with `number`. So `setValue` now only accepts a `number`, and `getValue` now only returns `number | undefined`. Full type safety — automatically.*

> 🩷 **Note:** Access modifiers in TypeScript control **visibility**:
> - `public` — accessible from **anywhere** (default if not specified)
> - `private` — accessible only **within the class**
> - `protected` — accessible within the class and its **subclasses**
>
> Using `private` for internal state like `_value` and `public` for the API methods (`setValue`, `getValue`) is a core principle of **encapsulation** — one of the pillars of object-oriented programming.

---

## 🧠 Concept Summary

| Concept | What it does |
|---|---|
| `class Person` | Defines a class blueprint with properties and methods |
| `constructor(name: string)` | Initialises the object when `new` is called |
| `this.name = name` | Assigns constructor parameter to class property |
| `function createPair<S, T>` | A generic function with two type parameters |
| `[S, T]` | A tuple — fixed-length array with per-position types |
| `class NamedValue<T>` | A generic class — `T` is decided at instantiation |
| `private` / `public` | Access modifiers that control property/method visibility |
| `T \| undefined` | Union type — value is either `T` or `undefined` |

---

*Classes with generics are the backbone of reusable, enterprise-grade TypeScript code. Mastering them unlocks the ability to write powerful, flexible, and fully type-safe object-oriented systems.*

---

<sub>*code by anubhav trainings*</sub>
