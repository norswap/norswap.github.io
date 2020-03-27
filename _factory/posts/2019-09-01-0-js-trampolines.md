---
layout: post
title: "Y Combinator and Trampolines in Javascript"
---

In *[Why Y? Deriving the Y Combinator in JavaScript][whyy]*, Reginald
Braithwaithe (aka Raganwald) explains, step by step, how the fixed-point Y
combinator and the long-tailed widowbird can be implemented in Javascript.

[whyy]: http://raganwald.com/2018/09/10/why-y.html

At this point, you're probably wondering **What the hell are we talking about?**

Essentially, these are tools that we can use to achieve two very useful things:

1. Inject code at each recursive call in a recursive function.
2. Make a [tail-recursive] function use a fixed amount of stack space, preventing
   the fabled [stack overflow].

[tail-recursive]: https://en.wikipedia.org/wiki/Tail_call
[stack overflow]: https://en.wikipedia.org/wiki/Stack_overflow

Sometimes, achieving the second item is called *using a [trampoline]*, because
we enter the recursive function but on "*recursion*", we jump right back out.

The technique is also called "tail-recursion elimination" or "tail call
optimization".

[trampoline]: https://en.wikipedia.org/wiki/Trampoline_(computing)

In this post I want to offer a very condensed version of this story that focuses
on the results. A motivation, really. You should read [Reginald's article][whyy]
to know about the gory details.

I also [simplified] the combinators' implementation — to make them more idiomatic,
and, in my opinion, easier to understand.

[simplified]: https://github.com/raganwald/raganwald.github.com/issues/134

---

## The Mockingbird (Code Injection)

Let's start with a recursive (JavaScript) function:

```javascript
const is_even = n =>
    (n === 0) || !is_even(n - 1);
```

This implement a very inefficient way to check if a number is even. It's a toy
example, obviously.

Let's take our first goal first: "inject code at each recursive call in a
recursive function".

To achieve this, we need to rewrite the function in a different form. Here is
the so-called "mockingbird form":

```javascript
const mock_is_even = (myself, n) =>
    (n === 0) || !myself(myself, n - 1);
```

`is_even` now take a `myself` function as argument, which it called recursively,
passing itself along.


We can call `mock_is_even(mock_is_even, 10)`, and it will behave just like
`is_even(10)`. So far that's pretty useless.

We can re-implement `is_even` in terms of `mock_is_even` using the "mockingbird"
combinator:

```javascript
const mockingbird =
    fn =>
        (...args) =>
            fn(fn, ...args);
      
const is_even = mockingbird(mock_is_even);
```

Okay, that works: when we call `is_even(10)`, the call becomes
`mock_is_even(mock_is_even, 10)`, exactly what we wanted.

What's the point?

Well, now we can inject code. Assume we want to memoize the function. After all,
the result of `is_even(X)` will always be the same for a given `X`.

```javascript
const memoized = fn => {
    const map = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        return map[key] || (map[key] = fn(args));
    }
}

const is_even_memo = mockingbird(memoized(mock_is_even));
```

We can verify it's working by measuring the run time:

```javascript
console.time('slow');
is_even_memo(100); // not memoized yet
console.timeEnd('slow');

console.time('fast');
is_even_memo(100); // memoized
console.timeEnd('fast');
```

## The Y Combinator (Better Code Injection)

This `myself(myself, ...)` business is ugly. Can we do better? Yes.

Instead of the mockingbird form:

```javascript
const mock_is_even = (myself, n) =>
    (n === 0) || !myself(myself, n - 1);
```

We can write our function in Y form:

```javascript
const Y_is_even = (myself, n) =>
    (n === 0) || !myself(n - 1);
```

And here is how we derive the `is_even` from the Y combinator:

```javascript
const Y = fn => {
    const wrapper = (...args) => fn(wrapper, ...args);
    return wrapper;
}

const is_even = Y(Y_is_even);
```

Injection is done the same way as before:

```javascript
const is_even_memo = Y(memoized(Y_is_even));
```

Let's explain: the Y combinator is similar to the mockingbird, but takes care of
passing the function to itself, so that we don't need to do it in Y-form
functions, unlike in mockingbird-form.

[Reginald's post][whyy] provides the traditional way to express the combinator,
using only function parameters, whereas we "cheat" by using a variable inside
the function. If you want to understand the Y combinator's root in [lambda
calculus], give the post a read!

[lambda calculus]: https://en.wikipedia.org/wiki/Lambda_calculus

<h2>The Longtailed Widowbird<br/> (Tail Recursion Elimination / Trampolines)</h2>

Let's move on to our second goal: "Make a [tail-recursive] function use a fixed
amount of stack space, preventing the fabled [stack overflow]."

This process will work with functions written in Y-form — but only as long as
they are *tail-recursive*.

Our `Y_is_even` function is not tail recursive, pecause of that pesky `!`
operator, which is applied after the call to `myself` returns.

Fortunately, we can rewrite it to be tail-recursive:

```javascript
const Y_is_even_tailrec = (myself, n) =>
    n === 0 ? true
    n === 1 ? false
    : myself(n - 2);
```

The idea behind the longtailed widowbird is that, instead of injecting code
around the recursive function call, we will *replace* the recursive call by code
that returns a function (which executes the "recursive" function call).

Once we get this function, we can call it. If it does another recursive call, it
will return another function, which we can call as well. And so on and so forth.
We call the returned functions in a loop, until we get the final result.
Recursion has been eliminated in favor of iteration!

Here is the longtailed widowbird combinator:

```javascript
const longtailed = fn => (...args0) => {

    class Thunk {
        constructor (delayed) {
            this.delayed = delayed;
        }

        evaluate() {
            return this.delayed();
        }
    }
    
    const wrapper = (...args) =>
        new Thunk(() => fn(wrapper, ...args));

    let value = fn(wrapper, ...args0);

    while (value instanceof Thunk)
        value = value.evaluate();

    return value;
}
```

Let's go over this.

The `Thunk` class is just a way to identify the functions we need to execute in
the loop (it's used in the `value instancceof Thunk` test). If we didn't have
this class and just tested for JavaScript's `Function` class, our combinator
wouldn't work with recursive functions that return functions!

We do the same `wrapper` trick as in the Y combinator, but this time we also
wrap the call in a function we store in a `Thunk` instance.

Then we get the initial value and we start iterating, until a result is
obtained!

Let's try this!

```javascript
const iter_is_even = longtailed(Y_is_even_tailrec);

// No problem!
iter_is_even(1000000);

// Maximum call stack size exceeded
is_even(1000000);

```

Can we still memoize? Of course:

```javascript
const iter_is_even_memo = longtailed(memoized(Y_is_even_tailrec));
```

And that's it folks! Code injection in recursive functions, and tail call
optimization in JavaScript, easy as pie!

You can find all the code in this article collected [in this gist].

[in this gist]: https://gist.github.com/norswap/be5fa7938f8331a252d3ff79e61e5834
