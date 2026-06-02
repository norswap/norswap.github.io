---
layout: post
title: "How TypeScript distributes unions"
---

In the past few weeks I've been writing a little library in TypeScript, and I've learned a lot about the type system in
the process. This is the first article, which focuses on how TypeScript deals with unions.

Does this typecheck? And if it does, what is the type of `x`?

```typescript
function foo(it: string): string
function foo(it: number): number
function foo(it: number | string): number | string { return it }
declare const it: number | string
const x = foo(it)
```

What about this?

```typescript
class Foo {
    foo(): string { return "1" }
}
class Bar {
    foo(): number { return 1 }
}
declare const r: Foo | Bar
const x = r.foo()
```

Final question, in the following snippet does `x` come out as `Foo<number | string>` or `Foo<number> | Foo<string>`?

```typescript
class Foo<A> {
    constructor (readonly value: A) {}
    copy(): Foo<A> { return new Foo(this.value) }
}
declare const r: Foo<string> | Foo<number>
const x = r.copy()
```

The first example doesn't compile, the second does. This will explain why, and how we can create a functional signature
equivalent to that of the first example.

The third example comes out as `Foo<number> | Foo<string>` (which is *assignable* to `Foo<number | string>`). This is
what we want! However, we will see how to can force the function to output `Foo<number | string>`, because that is
sometimes convenient.

This is mostly a reference piece for the language nerds amongst you. But if you're curious, let's dive in.

<!-- TOC -->
  * [Overload Distributivity](#overload-distributivity)
  * [Receiver Distributivity](#receiver-distributivity)
  * [Conditional Distributivity](#conditional-distributivity)
  * ["Overloads" via Generic Signatures](#overloads-via-generic-signatures)
  * [Squashing Homogeneous Unions with Extractor Types](#squashing-homogeneous-unions-with-extractor-types)
  * [Summary](#summary)
<!-- TOC -->

## Overload Distributivity

Let's take our motivating example:

```typescript
function foo(it: string): string
function foo(it: number): number
function foo(it: number | string): number | string { return it }
declare const it: number | string
const x = foo(it) // TS2769: No overload matches this call. 
```

`foo` is an overloaded function. These work differently in TypeScript than in traditional statically-typed languages
like Java. In Java, each overload would be its own distinct function, with its own implementation, that just happen to
share a name. In TypeScript, there is a single implementation with multiple signatures.

TypeScript *could* do what Java does. It could compile each overload to a JavaScript function with a different name
and statically assign each call site to the proper overload based on type information.

The reason is doesn't is probably twofold: first, this system allows writing multiple type signatures for a single
existing JavaScript function. Second, TypeScript generally shies away from complex code generation: the TypeScript
compiler mostly just checks types, then strips them. (There are exceptions, for instance TypeScript `enum` do generate
code, albeit the generation is local and doesn't affect the call site.)

In any case, our argument has type `number | string` and quite clearly, allowing the call and typing `x` as `number |
string` is correct.

**When matching function arguments, TypeScript simply doesn't distribute signatures over unions.**

However, that doesn't hold for method receivers (`x` in `x.foo()`). The next section will cover that, the section after
that covers some necessary background, and then we'll go on to show how we can actually achieve this overloaded
signature!

## Receiver Distributivity

For receivers, the logic is more complicated. **The basic idea is that TypeScript tries to find matching signatures
across receivers, and that match does not include the return type, so distribution is possible!**

Therefore our example works and types `x` as `string | number`:

```typescript
class Foo {
    foo(): string { return "1" }
}
class Bar {
    foo(): number { return 1 }
}
declare const r: Foo | Bar
const x = r.foo()
```

Now let's unpack the exact process.

When calling a method on a union receiver, TypeScript collects the method definitions on both sides. It instantiates the
class type parameters (if any) with the concrete type arguments. It then tries to build a set of unified signatures,
basically trying to match every signature on every branch with another signature on all the other branches. If no match
can be found across all branches of the union, the signature is dropped.

Signatures match if:

- Their function type parameters have the same shape (number, bounds & defaults)
- They have the same number of parameters, and their types are identical (not merely compatible).
    - Optional parameters are allowed however.
- If type parameters are present, return type must match exactly. Even if they don't contain type parameters.
    - This protects against issues when the return type does contain type params, and apparently the language authors
      did not bother to allow the case where it causes no issues.

Each matching set produces a unified signature where the return type is the union of the return type of all
signatures in the set.

The resulting set of unified signatures is then matched against the arguments. If nothing match you get a "TS2769:
No overload matches this call.".

If no unified signatures are produced, TypeScript falls back to a secondary algorithm, but only if at most one
branch has overloads.

In that case, it takes every overload (or just a singular signature if no branch has overloads) and produces unified
signatures against the (singular) signature in the other branches. These unified signatures are different from the
ones in the initial approach: the parameter types become intersection types of the types across branches. The return
type is a union type like before. More precisely: types in covariant positions are union-ed, while types in
contravariant position are intersected (don't worry to much if you don't know what that means). If present, an explicit
`this` parameter is treated as any other parameter.

In the secondary algorithm, the signatures being unified can have a different number of parameters. Shorter
parameter lists don't contribute typing info to the parameters they don't have.

The handling of type parameter is also more relaxed: one side is allowed to have a parameter list if the other sides
don't. Otherwise the signatures have to be compatible, excepted that they may differ in their defaults. The default (or
absence of default!) from one branch of the union is always applied. If other branches had defaults, those are
always dropped. The selected branch is non-deterministic! (It depends on non-guaranteed loading logic.)

If the set of signatures produced by the second algorithm is also empty, you can get the following errors:

- "TS2339: Property <function name> does not exist on type <...>"
    - When a signature is straight out missing on one branch of union.
- "TS2349: This expression is not callable. Each member of the union type <...> has signatures, but none of those
  signatures are compatible with each other."
    - In all the other cases.

And if the signature set not empty but it can't match the parameters to any signature, you will get:

- "TS2769: No overload matches this call."
    - If there were multiple signatures in the final set.
- "TS2345: Argument of type <...> is not assignable to parameter of type <...>".
    - If there was only a single signature in the final set.

**This is not always safe.**

If multiple overloads match the arguments, they are normally prioritized in the order in which they appear.
The signature matching process can however cause some signatures to disappear.

Consider the following example, where we can imagine that `Foo.foo` is a function to process parameters, where
strings are automatically parsed as numbers:

```typescript
class Foo {
    foo(x: string): number
    foo<A>(it: A): A
    foo<A>(it: A | string): A | number {
        return typeof it === "string" ? Number.parseInt(it) : it
    }
}
class Bar {
    foo<A>(it: A): A { return it }
}
declare const r: Foo | Bar
const x = r.foo("42") // x: "42"
```

Here `x` will type as `"42"`, because the first `foo` signature disappears in the matching process. The implementation,
however, remains the same. This means that if `r` is assigned an instance of `Foo`, then `x` will contain `42`, but type
as `"42"`, a type soundness issue.

## Conditional Distributivity

Before we get into the method we can use to achieve almost arbitrary "overloaded" signatures, we need some background
on type conditionals (i.e. type-level expression of the form `A extends B ? C : D`).

Type conditionals distribute on unions if the left-hand side of the condition is naked. They don't distribute if it is
wrapped. The common way to prevent distribution is to wrap in a tuple.

```typescript
type Foo<T> = T extends "a" ? "A" : T extends "b" ? "B" : "C"
type Test = Foo<"a" | "b" | "c"> // "A" | "B" | "C"

type Foo2<T> = [T] extends ["a"] ? "A" : [T] extends ["b"] ? "B" : "C"
type Test2 = Foo2<"a" | "b" | "c"> // "C"
```

The example should be self-explanatory: in `Foo1` the union distributes and each lowercase string type maps to the
corresponding uppercase string type. In `Foo2`, `T` is the entire union, which falls through the default case (`"C"`).

**`never` in conditionals**

`never` with conditionals behaves like an empty union. Distributing `never` on a conditional yields `never`.

```typescript
type TestNever = Foo<never> // never
type TestNever2 = Foo2<never> // "A"
```

**Bonus note: `any` in conditionals**

Nothing to do with the topic at hand, but despite `any` being both a top and bottom type (meaning it acts as both a
supertype and subtype of every other types) `any extends X` evaluates to `false` for every `X` besides `any` and
`unknown`. Which is an understandble choice for a situation where there isn't a good solution for all cases.

## "Overloads" via Generic Signatures

What overloads provide is the ability to define multiple parameter lists for a single function, and to map each
parameter list to a return type.

With a few tricks, we can achieve a lot of this, **and** allow distribution over unions.

The method I will present is well suited when parameter lists are relatively homogenous: each parameter has one or
multiple possible types, and all combinations are valid. It works poorly with very heterogenous parameter lists, where
overloads should stil be used (and union distribution is probably not applicable anyway).

To mimic overloads with generic (using a single-parameter function as example), we will need:

- A union of the possible parameter types.
- A type variable bounded by the union, to capture the concrete type of the parameter.
- A nested conditional type mapping the concrete parameter type to a concrete return type, to be used as return type.

Given our headline example:

```typescript
function foo(it: string): string
function foo(it: number): number
function foo(it: number | string): number | string { return it }
declare const it: number | string
const x = foo(it) // TS2769: No overload matches this call. 
```

The solution looks like this:

```typescript
type FooReturn<T extends number | string> = T extends number ? number : string
function foo<T extends number | string>(it: T): FooReturn<T> { return it as FooReturn<T> }
declare const it: number | string
const x = foo(it) // number | string
const y = foo(42) // number
```

Maybe you've noticed this is overcomplicated here, and the return type could simply have been `T`. This is indeed
correct here, but in every case where the parameter type and return type differ, you will need the conditional type.

Notice that sadly, TypeScript will be unable to figure out that the return type matches the bound, so a cast will be
needed.

How does this handle unions? Simple: remember that unions distribute on type conditionals, so `FooReturn` maps each
branch of the union separately.

## Squashing Homogeneous Unions with Extractor Types

A particularly interesting class of unions are those where each branch is a differently-parameterized version of the
same type.

Consider the example from the intro:

```typescript
class Foo<T> {
    constructor (readonly value: T) {}
    copy(): Foo<T> { return new Foo(this.value) }
}
declare const r: Foo<string> | Foo<number>
const x = r.copy() // types as `Foo<string> | Foo<number>`
const y: Foo<string | number> = r.copy()
```

Up to the `x` assignment, nothing is terribly novel here: we've seen that typescript can distribute methods over
receivers.

The `y` assignment is interesting: whenever `T` is a covariant type parameter, it is always true that `Foo<A> | Foo<B>`
is assignable to `Foo<A | B>`.

"`Foo` is covariant in `T`" means that if `B` is assignable to `A`, then `Foo<B>` is assignable to `Foo<A>`. This is the
case whenever `T` only appears in "output" position in `T` (in return types, but not parameter types).

In reality, TypeScript is very loose here and treats a lot of things as covariant when doing so isn't type-safe, for the
sake of legacy compatibility. A full treatement of covariance, contravariance and invariance in TypeScript would be its
own article — a quick definition of covariance will suffice here.

Note that while `Foo<A> | Foo<B>` is assignable to `Foo<A | B>` the reverse isn't true. This is because this is
generally unsafe (albeit it isn't in this specific definition of `Foo`): `Foo<A> | Foo<B>` refers to things that either
always output `A` or always output `B`, while `Foo<A | B>` refers to things that can output a mix or `A` or `B`.

Now as we've seen before, unions are not always distributed over, making them sometimes inconvenient. They also arise
naturally in the code via multiple `return` statements and conditionals (`condition ? new Foo(42) : new Foo("AH")`).

While we can always coerce to `Foo<A | B>` via a cast or a type bound, it is sometimes convenient to perform this
coercion as part of a method. I encountered the situation while writing a small result library for TypeScript:

```typescript
const x = condition ? okay(42) : fail(Error("error!")) // Result<number, never> | Result<never, Error>
const y = x.map(it => it + 69)
```

We'd like `y` to have the "nice" type `Result<number, Error>`, meaning it either holds a number or an error, instead
of `Result<number, never> | Result<never, Error>`, which means the same thing, but is less readable.

Here's how you do it:

```typescript
type GetT<F extends Foo<unknown>> = F extends Foo<infer T> ? T : never
class Foo<T> {
    constructor (readonly value: T) {}
    copy<This extends Foo<unknown>>(this: This): Foo<GetT<This>> { return new Foo(this.value as GetT<This>) }
}
declare const r: Foo<string> | Foo<number>
const x = r.copy() // types as `Foo<string | number>`
```

We capture the type of the receiver in `This` (and in this example, it's a union). Then we use the extractor type `GetT`
to recover the value of `T`. Because unions distribute over type conditionals, `GetT<This>` yields `string | number`,
and we get what we want.

## Summary

There you have it. You now know:

- how overloads distribute over union arguments (they don't, excepted for the receiver).
- how types conditional distribute over unions (they do if the thing before `extends` is a naked type variable).
- how to emulate overloads distributing over unions by using type variables, union types, and type conditionals.
- how to squash homogeneous unions (`Foo<A> | Foo<B>` to `Foo<A | B>`) within methods by using extractor types.

I hope it's been helpful, until next time!