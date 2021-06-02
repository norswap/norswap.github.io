---
title: "Imperative Ambiguity"
layout: post
---

A while ago I realized that something people value about [purely functional
programming] is the certainties it gives about a function's signature. That
might seem obvious, after all there is no data mutation and no side effects.

I, however, am not a fan of purely functional programming. This is not a debate
I want to wade in; it suffice to say that I enjoy using purely functional
programming techniques, but despise being forced to write my whole program using
that paradigm.

I am much more interested in what it means not to have these guarantees, and the
resulting ambiguity in function signatures. And of course, how we could make
things better.

[purely functional programming]: https://en.wikipedia.org/wiki/Purely_functional_programming

## An Ambiguous Function

Consider the following function signature:

    List<T> process(List<T> list);

In a purely functional language, you know that `list` cannot be modified, and
the returned list will depend only on `list` and whatever data was captured via
[closure] at the function definition point (data which, of course, does not
change).

[closure]: https://en.wikipedia.org/wiki/Closure_(computer_programming)

In an imperative language, however, the following is unclear:

1. Can `process` modify `list`?
2. Does `process` modify any state beside `list`?
3. Does `process` store a reference to `list` in some other data structure?
4. Does `process` store a reference to the list it returns in some other data
   structure?
5. Can the returned list be `list` itself?

The first two questions are about mutation, but the last three questions are
relevant *because of* mutation. It's important to know who can access the list,
because of the possibility it might be mutated.

## Caller and Callee

It's important for us to distinguish between the caller and the callee.
The caller is the entity that makes the function call, while the callee is the
entity to which the called function belongs.

What are those entities? Different views can apply: they could be packages,
modules, classes, objects, clients or libraries.

I think the most interesting case is when the caller and the callee are evolved
separately. In this scenario the author/maintainer of the callee does not need
to be aware of the caller, and the author/maintainer of the caller only needs to
be aware of the interface of the callee.

When we talk about ambiguity, we talk about the ambiguity of this interface.

## Interpretations

Let's consider a few possible interpretations of the function:

    List<T> process(List<T> list);

- **Immutable**: no one can modify the argument list: not the caller, not the
  callee, nor anyone else.

- **Read Loan**: the callee is allowed to read the list, but not write to it nor
  create a reference that outlives the function's execution.

- **Write Loan**: the callee is allowed to read and write the list, but not
  create a reference that outlives the function's execution.

- **Transfer**: the callee may do whatever it wants with the list, the caller may
  not retain a reference to the list that outlives its execution; or, even more
  stringently, may not access the list at all after the call to `process`.

- **Pipe In**: the callee may read the list and retain a read-only reference that
  outlives the function's execution. The caller may still read and write the
  list. Data is being *piped in* the callee.

- **Pipe Out**: the callee may read or write the list and retain a reference that
  outlives the functions's execution. The caller may still read the list. Data
  is being *piped out* of the callee.

- **Sync**: the callee may read or write the list and retain a reference that
  outlives the function's execution. The caller may still read and write the
  list.

Since things are complex enough as it is, we omit discussing whether the
returned list is an alias or the argument list, as well as considerations
relating to concurrent execution.

## In Practice

Is it possible to disambiguate all these scenarios in a way that can be enforced
by a compiler?

Maybe. We could imagine keywords on parameters to enforce those. Simple
(function-local) flow analysis should be sufficient to implement most of them.

I'm eager to see new languages that engage with this problem.

The closest thing we have currently is probably [Rust], but it restricts the
possible scenarios a lot for the sake of precisely tracking the ownership of a
piece of data, which is necessary for its <abbr title="Garbage
Collection">GC</abbr>-less memory management system.

[Rust]: https://en.wikipedia.org/wiki/Rust_(programming_language)
