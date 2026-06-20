---
layout: post
title: "How TypeScript infers type variables"
---

This is the second article about what I learned about the TypeScript type system while writing a small library.
This one is about how TypeScript assigns a type to type variables defined in functions via inference.

You can also read [the first article about how TypeScript distributes unions][unions].

[unions]: /typescript-distribute

Type variable inference is a complex process. It often does what you expect or want, although when you're lost in the
type sauce, it's not always obvious what that is.

Sometimes however, it's a little bit bonkers:

```typescript
class Foo<A> {
    foo(): Foo<A> {
        return new Foo()
    }
}
declare const r: Foo<string> | Foo<number>
const x = r.foo() // typed as Foo<string>
```

```typescript
function foo<A, B>(it: A & B): A & B { return it }
const x = foo(42) // typed as unknown
```

```typescript
function foo<A>(it: A & { x: number }): A { return it }
const x = foo({ x: 42, y: 42 }) // typed as { x: number, y: number }
```

```typescript
class X {}
class A extends X { readonly kind = "A" }
class B extends X { readonly kind = "B" }

function foo<T extends X>(a: T, b: T): T { return a }
const x = foo(new A(), new B()) // T = A
// ^ TS2345: Argument of type B is not assignable to parameter of type A
const y = foo<A|B>(new A(), new B()) // ok, also works with foo<X>
```

In this article, I'll lay down the rules that will help you understand how TypeScript infers type variables.

Type variable inference is a complex topic and we will not cover *all* the intricacies. The information I'm presenting
here is probably missing details and might even be somewhat incorrect by virtue of being simplified. Nevertheless, it
matches all the observations I've made and seems to be congruent with TypeScript's implementation. In any case, this
understanding will serve you well whenever you need to reason about type variable inference.

<!-- TOC -->
  * [Outline](#outline)
  * [Candidate Collection](#candidate-collection)
  * [Candidate Resolution](#candidate-resolution)
  * [Type Variable Inference with Type Variables in Source Types](#type-variable-inference-with-type-variables-in-source-types)
  * [Steering Inference With `NoInfer<T>`](#steering-inference-with-noinfert)
  * [The most annoying situation: Capturing a concrete subtype and its structural subparts](#the-most-annoying-situation-capturing-a-concrete-subtype-and-its-structural-subparts)
  * [Summary](#summary)
<!-- TOC -->

## Outline

The process start with a series of source types, which are the types of the argument passed to the function, as well as
expected return type (e.g. if assigning to a variable declaration with an explicit type). These will be paired (1-1)
with a series of target types which are the types of the parameters of the function and its return type. The target
types can contain type variables.

The inference process then runs in two phases:

1. **Candidate Collection** — Walk the source and target types in parallel. Every time the walk reaches a bare type
   parameter on the target side, record the corresponding source type as a candidate.
2. **Candidate Resolution** — Collapse the candidate list(s) into a single inferred type.

This is then followed by applying the regular type checking algorithm after injecting the resolved candidate into the
type parameters.

We'll detail these two phases in the two next sections.

## Candidate Collection

As we said, every time a bare type parameter is reached, inference occur, otherwise we recurse.

Candidates are collected in two distinct lists: covariant ("output position") and contravariant ("input position"). See
[this wikipedia article][variance] for more info on type variance.

[variance]: https://en.wikipedia.org/wiki/Type_variance

Simple example:

```typescript
function f<A, B, C>(x: A, y: (a: B) => C) {}
f(true, (it: number) => "hello")
```

Infers `A = boolean`, `B = number`, `C = string`. B is a [contravariant] candidate, A and C are covariant candidates.

[contravariant]: https://www.typescriptlang.org/docs/handbook/2/generics.html#variance-annotations

The "walk" we're referering to: when matching `(it: number) => string` to `(a: B) => C`, we're recursing inside both
structures as we're matching them to reach the bare type parameters. If a match is impossible, that part of the walk is
aborted during inference. If the source type cannot match the target type at all, you'll get a type error when regular
type checking runs.

This process also walks "into" type definitions.

```typescript
type ArrayContainer<T> = T[] | { array: T[] }
function f<E>(x: ArrayContainer<E>) {}
f([1, 2, 3])
```

Infers `E = number`. The type definition is expanded, so we're matching `number[]` against `E[] | { array: E[] }`.
The array side matches, we're collecting `E = number` as a candidate.

When a type-level conditional is encountered, candidates are collected on the right-hand side of conditionals.

```typescript
type Pair<A, B> = A extends string ? Map<A, B> : [A, B]
function f<A, B>(x: Pair<A, B>) {}
f([1, 2])
f(new Map([["a", 1]]))
f(["a", "b"]) // TS2345: Argument of type string[] is not assignable to parameter of type Map<string, string>
```

In this case, the first call collects `A = number, B = number` from the second branch, while the second call collects `A
= string, B = number` from the first branch.

The third call collects `A = string, B = string` from the second branch. It causes an error at type-checking time
because ["a", "b"] does not satisfy `Pair<string, string>` (when `A = string`, `Pair<A, B> = Map<A, B>`). Notice that
the candidates are collected from the second branch, but type checking walks into the first branch! **Type variable
inference does not evaluate branches!**

Note that object key and value type inference in conditionals does not work (I don't know why). So we couldn't have
written `type Pair<A, B> = A extends string ? { [key in A]: B } : [A, B]`.

Additionally `infer T` directives create new type variables that are added to the set of variables to be inferred.

A goood example is this simplified redefinition of the standard `Awaited` type (only for promises, not all thenables):

```typescript
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T
type Foo = Awaited<Promise<Promise<number>>>
```

In this case, `U` is inferred to `Promise<number>` in the first expansion of `Awaited`, then `U` is inferred to `number`
in the recursive expansion of `Awaited` (these two `U`s count as distinct type variables).

Let's now highlight some unintuitive aspects of this, as well as give some additional information on special cases.

**What is not considered during candidate collection.**

- The condition-side of conditional types.
    - `infer` still introducing new variables
    - The condition never adds candidate for any variables. `T extends Foo` does NOT add `Foo` as a candidate for `T`!
- Type parameter constraints (`<T extends Foo>` in type, class or function type parameter list).
    - They can be injected later (during the resolution phase) if the selected candidates do not match them,
      or if there is no candidate.
- Type parameter defaults `<T = unknown>`.
- Supertypes of a source type (or of its type arguments).

**Inference distributes over unions, source intersection types sometimes merge.**

Whenever the source type at a walk step is a union and the target type is not a bare type parameter (in which case it
simply matches the union), the walk iterates over union branches and reruns inference against the target for each one
independently. All resulting candidates land in the same list (they are not re-unioned).

```typescript
declare function f<T>(x: Foo<T>): T
declare const u: Foo<Dog> | Foo<Cat>
f(u) // candidates: [Dog, Cat]
```

From [my article on union distribution][unions], also remember that type conditionals distribute if the thing before
`extends` is a naked type variable (e.g. `A extends { x: number }` distributes, `[A] extends [{x: number}]` does not).

Source intersection types mostly remain intact, except when structurally matching to an object type (e.g. `{ x: T }`) is
required. In the case of structural matching, the intersected (merged) object shape is created (e.g. `{ x: string, y:
number } & { x: "a" }` yields `{ x: "a", y: number }`).

**Ambiguous target intersections do not record candidates**

```typescript
function foo<A, B>(it: A & B) {}
foo(42)
```

Both `A` and `B` infer to `unknown`, as TypeScript is unable to determine whether `A` or `B` should match
`number` (but bizarrely does not choose arbitrarily).

**Type variables in target intersections sometimes "peel off" and sometimes don't**

```typescript
function foo<A>(it: A & { x: number }) {}
foo({ x: 42, y: 42 }) // A = `{x: number, y: number }`

function bar<A>(it: A & number) {}
bar(42 as number & { brand: "USD" }) // A = { brand: "USD" }

function baz<A>(it: A & string) {}
baz("a" as "a" & { brand: 1 }) // A = "a" & { brand: 1 }

function qux<A>(it: A & "a") {}
qux("a" as "a" & { brand: 1 }) // A = { brand: 1 }
```

We could expect `A` to infer to `{ y: number }` in the `foo` call, and to `{ brand: 1 }` in the `baz` call, but that is
not the case. These are probably heuristics designed to maximize the utility of the captured type: in the first case, to
capture the entire object type, and in the second case to capture the precise literal string.

Note that the order in which the intersection is specified (both in source and target types) never matters.

**Important takeaway: type variables can only match against structural parts of the concrete type.**

If we have a source type `Elephant<Savannah>` with `Elephant extends Animal` and `Savannah extends Location`, type
variables inferred against this source type can only ever match `Elephant<Savannah>`, or `Savannah`. Supertypes are
never considered for candidate collection, so `Animal`, `Animal<Savannah>`, `Location`, etc...  will never end up in the
candidate lists.

Another corollary: there is no way to have an argument of type `number` and produce a binding of a type variable to
`string`. Surprisingly, that would actualy be quite convenient, consider:

```typescript
type Indexed<K, V> = K extends string ? Map<K, V> : V[]
function f<K, V>(x: Indexed<K, V>) {}
f([1, 2])
f(new Map([["a", 1]]))
```

We'd love to infer `K = number` when the argument is an array! Of course we don't use the key type for anything.
If we needed it, here's how we could get around it:

```typescript
type Indexed<K, V> = K extends string ? Map<K, V> : V[]
type Key<K> = K extends string ? string : number
declare function f<K, V>(x: Indexed<K, V>): Key<K>
const x: number = f([1, 2])
const y: string = f(new Map([["a", 1]]))
```

Here's an alternative way:

```typescript
type Indexed<K, V> = K extends string ? Map<K, V> : V[]
type Key<T> = T extends Map<infer K, any> ? K : number
declare function f<T, K, V>(x: T & Indexed<K, V>): Key<T>
const x: number = f([1, 2])
const y: string = f(new Map([["a", 1]]))
```

It's unnecessary here, but the pattern of saving the entire input type `T` (and how to do so it needs to appear in an
inference position) ends up being useful quite often when doing advanced type alchemy.

In fact we use this trick in our article on [union distribution][unions] to simulate overloads with generics.

## Candidate Resolution

Candidate collection outputs two candidate lists: covariant and contravariant.
Resolution reduces each list to a single type, then combines them.

The general process:

- The covariant candidates collapse to a union (under rare specific conditions — see below), a common supertype (if
  one is present in the candidate list), or its first member.
    - To reduce to a common supertype, it must present in the candidate list — TypeScript never resolves to a type not
      in the candidate list.
    - See below for how the list is collapsed.
    - If the list contains multiple anonymous literal object or array types (e.g. `{ a: number }` inferred via the source
      argument `{ a: 1 }`), then they get unioned together before collapsing (only for the covariant list).
- The contravariant candidates collapse to an intersection (under rare specific conditions), a common subtype
  (if one is present in the candidate list), or to its first member.
- If both a covariant and a contravariant candidate list are present, the contravariant result wins.
    - ... unless it fails to satisfy the type parameter's constraint, in which case the covariant one is used as a fallback.
    - ... unless the covariant result is a subtype of the contravariant result, in which case the covariant one wins.
- If both lists are empty, the type parameter's declared default is used.
- With no default, the result is `unknown`.
- If the resolved type doesn't satisfy its type constraint (`extends`), it is replaced by the constraint.

The "anonymous literal types" rule is weird. Below is an illustration. The motivation boils down to the fact that we
probably didn't intend different **named** types to match the same type variable, while if we're using object or array
literals, that might actually be our intent, and this lets us avoid writing extra type definition to clarify.

```typescript
declare function f<T>(x: T, y: T): T
f({a: 1}, {b: 2}) // T = { a: number } | { b: number }

interface A { a: number }
interface B { b: number }
declare const a: A, b: B
f(a, b) // TS2345: Argument of type B is not assignable to parameter of type A
```

Regarding choosing the covariant type over the contravariant type when both are present and the covariant type is
a subtype the contravariant type, this example will make it make sense:

```typescript
function f<T>(x: T, sink: (t: T) => void) { sink(x) }
f(new Dog(), (_: Animal) => {}) // T = Dog
f(new Animal(), (_: Dog) => {}) // T = Dog
// ^ TS2345: Argument of type Animal is not assignable to parameter of type Dog
```

In the first call, everything make senses: a function accepting animals also accepts dogs (i.e. T is contravariant!), so
everything type checks. Both `T = Animal` and `T = Dog` would have worked, but `Dog` is more precise. Imagine we want to
return `x` from the function, inferring `T = Dog` does indeed give is a more precise return type.

In the second one, it's impossible to type check the call given the two arguments, no matter what we infer `T` to (`Dog`
or `Animal`).
 
**Collapsing Candidate Lists**

Here's how the candidate lists are collapsed. This is the explanation for the covariant list, but the principle is the
same for the contravariant list, just inverting the type relationship (look for subtypes instead of supertypes).

1. If all candidates are literals of the same base type, union them.
2. Otherwise scan the list looking for one candidate that is a strict supertype of all others. If found, return it.
3. If not, try again using a looser supertype check (we won't get into the details, it's very edge-casey, like "does
   `any` subtype `unknown`?).
    - This is a left-reduce: start with the first type as the candidate, then replacing it with a supertype if one is
      encountered. Don't exit early if unrelated types are encountered.
    - As a result, if no candidate is a supertype of the first candidate, the first candidate is returned.

Crucially, resolution never settles on a type that is not on a list of candidates. So if your candidate list is `[Cat,
Dog]`, the type will resolve to `Dog` and not the common supertype `Animal`, nor `Cat | Dog`.

**Examples**

```typescript
function f<T>(x: T, y: T) {}
f("a", "b")  // T = "a" | "b"
```

Two covariant candidates, both string literals of the same base. Same-base-literal candidates get unioned.

```typescript
class Animal {}
class Dog extends Animal { readonly kind = "dog" }
declare const a: Animal, d: Dog, c: Cat
declare const ad: Dog[], ac: Cat[]

declare function f<T>(x: T, y: T): T
f(d, a)         // T = Animal       (Animal is strict supertype of Dog → found)
f(a, d)         // T = Animal       (same)
f(d, c)         // T = Dog          (siblings → first kept!)
f("a", 1)       // T = "a"          (different bases → first kept)
f(ad, ac)       // T = Dog[]        (sibling Array generics → first kept)
```

```typescript
declare function f<T>(x: T, y: T): T
f(new Dog(), new Cat()) // T = Dog (not Animal!)
```

**Priorities**

Each candidate is tagged with priority bits at collection time, with lower numeric value = higher priority. When a
candidate of higher priority arrives, candidates at lower priorities (higher numeric value) get wiped.

(This is a collection-time concern, but since the consequences of priorities are felt during candidate selection, I'm
including it in this section.)

Here are the priority bits alongside where they apply:

- **None (0)** — everything not covered in the other buckets
- **NakedTypeVariable (1)** — when a source fully matches the non-T constituent of `T | string` (leaving nothing for T),
  the source is recorded against T at this priority. If the source does not match the other constituent (`string` in the
  example), it falls through to bare-T recording at *None* priority.
- **MappedTypeConstraint (32)** — when inferring through a mapped type whose key constraint is a type parameter.
- **ReturnType (128)** — when a return type is inferred from the context in which the function call appears (e.g. `const x: X
  = f()` → `X` is a candidate for the type variable `T` returned by `f`) or used as an argument (e.g. passing `f` to `g(f:
  () => number)` inferring `T` to `number`).
- **LiteralKeyof (256)** — when matching a literal type against `keyof T`.

`MappedTypeConstraint`, `ReturnType`, and `LiteralKeyof` are the "combination" priorities — if the candidate list is at
this priority, the resolved type is obtained via union (covariant) or intersection (contravariant) instead of
supertype/subtype (respectively).

**Defaults are looked up on the type parameter being resolved, not on aliases referenced from the parameter type.**

```typescript
type Result<V, E = never> = { okay: V } | { error: E }
function f<V, E>(x: Result<V, E>) {}
f({ okay: 42 }) // E = unknown, NOT never
```

The walk into `Result` collects no candidates for `E`. Resolution of `f`'s `E` then checks `f`'s declared default —
there isn't one — and falls back to `unknown`. The `E = never` default belongs to `Result`, and only kicks in when
`Result` is referenced as `Result<X>` with the second argument omitted.

To get `never` at the call site, you need `function f<V, E = never>(...) {}`.

## Type Variable Inference with Type Variables in Source Types

When inference is done in a generic context where type variables appear in the source type, one complication is
introduced: type conditionals cannot be evaluated.

Type variable inference is always local, but locally in a generic function, type variables are uninstantiated, hence why
evaluating conditionals is not possible.

Let's use the standard `Exclude` type, defined as `type Exclude<T, U> = T extends U ? never : T` as an intuition pump.

```typescript
function foo(x: Exclude<unknown, number>) {}
function bar<X>(x: Exclude<X, number>) {}
function baz<X extends Exclude<unknown, number>>(x: X) {}
function quz<X, Y extends Exclude<X, number>>(x: Y) {}
foo(42) // allowed
bar(42) // TS2345: Argument of type 42 is not assignable to parameter of type never
baz(42) // allowed
quz(42) // allowed
```

In general, `Exclude` is meant to work with an union as its first type parameter. Remember [unions distribute over type
conditionals][unions]. But here's how it works (or doesn't) here.

In `foo`, the parameter type reduces to `unknown` (`unknown` doesn't extend `number`, so `Exclude<unknown, number> =
unknown`) and so our intent to block numbers fails.

In `bar`, `X` is inferred to `number`, so we get `Exclude<number, number> = never` for the parameter type and the number
argument is successfully blocked.

`baz` fails in exactly the same way as `foo` (the bound becomes `X extends unknown`).

In `quz`, there is no way to infer `X` at all! It only appears in the `extends` bound, which doesn't contribute an
inference candidate, and so we end up with `X = unknown`.

Now let's introduce the generic context by calling `bar` (the correct function) from a generic function, here's the only
way that will work:

```typescript
function quuz<V>(x: Exclude<V, number>) { bar(x) }
```

You basically need to reproduce the type. Because inside `quuz`, `V` is unbound, the conditional in `Exclude<V, number>`
cannot be evaluated. The only way this type-checks is because TypeScript does a structural match between the type of the
`x` argument from `quuz` and the type of the `x` parameter from `bar`. Even though it can't evaluate the conditional,
the types are structurally identical, and the call type checks.

## Steering Inference With `NoInfer<T>`

TypeScript offers the built-in utility type `NoInfer` to block inference. Instead of using a type variable `T`, you
write `NoInfer<T>`, the effect of which is that `T` will not collect candidates from that position.

Note a minor inconvenience of `NoInfer`: at the time of writing, some IDE tooling (at least IntelliJ) doesn't always see
through `NoInfer` and might give you some spurious warnings related to it.

## The most annoying situation: Capturing a concrete subtype and its structural subparts

In the article on [unions], we explained how to use generics to build the equivalent of this non-functional overloads
example:

```typescript
function foo(it: string): string
function foo(it: number): number
function foo(it: number | string): number | string { return it }
declare const it: number | string
const x = foo(it) // TS2769: No overload matches this call.
```

The solution was this (with the note that the return type could be simplified to just `T` in this case, but in general
selecting the return type based on the input type requires a conditional type):

```typescript
type FooReturn<T extends number | string> = T extends number ? number : string
function foo<T extends number | string>(it: T): FooReturn<T> {
    return it as FooReturn<T>
}
declare const it: number | string
const x = foo(it) // number | string
const y = foo(42) // number
```

Now, the "most annoying situation" happens when one of the input type has type parameter that we want to infer, but
don't appear in the input:

```typescript
function foo<K, V, T extends Map<K, V>>(map: T, key: K): [T, V] {
    return [map, map.get(key)!]
}
const map = new Map([[42, "42"]])
const x = foo(map, 42)
//    ^ [Map<number, string>, unknown]
```

It's very clear that `V` should infer to `string`, but since (1) the `extends` bound does not contribute candidates to
inference, and (2) `V` does not appear in the target type, the inference algorithm will not figure it out.

If we had typed `map: Map<K, V>`, there would be no issue, but in some cases, we do want to capture the exact `T` type!

The [previous article][unions] also covered "extractor types" and that can indeed help here:

```typescript
type GetV<T extends Map<unknown, unknown>> = T extends Map<unknown, infer V> ? V : never
function foo<K, V, T extends Map<K, V>>(map: T, key: K): [T, GetV<T>] {
    return [map, map.get(key) as GetV<T>]
}
const map = new Map([[42, "42"]])
const x = foo(map, 42)
```

This time, everything works! But note that TypeScript cannot figure out that `typeof map.get(key)` is the same as
`GetV<T>`, hence we need the pesky cast.

Here's another solution that avoids the cast, at the cost of some verbosity (note the bound on the `map` parameter):

```typescript
function foo<K, V, T extends Map<K, V>>(map: T & Map<K, V>, key: K): [T, V] {
    return [map, map.get(key)!]
}
const map = new Map([[42, "42"]])
const x = foo(map, 42)
```

Perfect? Not quite. In the previous article we saw how we could use extractor types to make sure unions distribute on
the signature, and that does not work with the last solution:

```typescript
function foo<K, V, T extends Map<K, V>>(map: T & Map<K, V>, key: K): [T, V] {
    return [map, map.get(key)!]
}
const map = new Map([[42, "42"]]) as Map<number, string> | Map<number, boolean>
const x = foo(map, 42)
// TS2345: Argument of type Map<number, string> | Map<number, boolean> is not assignable to parameter of type Map<number, string>
```

So your choice is between an uglier signature and the need for casts, and supporting unions.

## Summary

We learned about the complex algorithm TypeScript uses to infer function-level type variables when a function call is
made. If we simplify a lot, here's what that algorithm looks like:

- Walk source (argument) types against target (parameter) types.
    - Add a candidate to the (covariant or contravariant) list when a bare type variable is encountered.
    - When unions are encountered, distribute the other type over them.
    - Candidates have priorities, with higher priorities wiping out lower priorities candidates.
    - Candidates are only collected from the source types and its structural components.
        - Not from `extends` bounds, defaults, the condition part of type conditionals, supertypes, ...
- Reduce each list to a single candidate.
    - Pick a candidate that supertypes (covariant) or subtypes (contravariant) all other candidates.
    - Otherwise start with first candidate, iterate the list, replacing the current candidate with a
      supertype/subtype if encountered.
    - In some very specific cases (lower priorites), an union of the candidates is picked instead.
- Pick the final contravariant candidate if (1) present, (2) the covariant candidate is not a subtype of it, and (3) it
  fits the `extends` bound if present; otherwise pick the final covariant candidate.
- If an `extends` bound is present and not satisfied by the selected candidate, replace the candidate with the bound.
- If there is still no candidate, use the default value if present, and use `unknown` otherwise.

And note that intersection types behave a little strangely sometimes, but refer to the article for that.

Hopefully this helps you debug some unintuitive type variable inference behaviour! See you around, language nerd.

<script type="module">
  import hljs from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/highlight.min.js";
  import typescript from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/languages/typescript.min.js";
  hljs.registerLanguage("typescript", typescript);
</script>