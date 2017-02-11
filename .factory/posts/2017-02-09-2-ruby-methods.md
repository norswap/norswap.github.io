---
title: "Ruby Methods, Procs and Blocks"
layout: post
---

This is the first article in the [Ruby's Dark Corners] series.

[Ruby's Dark Corners]: /ruby-dark-corners

Here are a few question this article will try to answer:

- What combination of parameters are legal in method definition?
- How are arguments assigned to parameters when calling a method?
- What is a proc in relation with a block?
- What are the differences between lambdas and procs?
- What is the difference between `{ ... }` and `do ... end`?

## Declaring Parameters

In everything that follows we make the distinction between *parameters* (or
*formal parameters*): the parameters as they appear in method definitions; and
*arguments* (or *actual parameters*): the value passed to method calls.

A method definition admits the following types of parameters:

| type | example |
|------|---------|
| required              | `a`           |
| optional              | `b = 2`       |
| array decomposition   | `(c, *d)`     |
| splat                 | `*args`       |
| post-required         | `f`           |
| keyword               | `g:`, `h: 7`  |
| double splat          | `**kwargs`    |
| block                 | `&blk`        |

A kitchen sink example:

```ruby
def foo a, b = 2, *c, d, e:, f: 7, **g, &blk; end
```

Here are quick explanations:

- Optional parameters can have a default value.

- Array decomposition parameters are required parameters that decompose an array
  argument into parts. Here are some examples, assuming the argument is `[[1,
  2], 3]`:
  
  ```
  (*a)          a = [[1, 2], 3]
  (a, b)        a = [1, 2], b = 3
  (a, *b)       a = [1, 2], b = [3]
  (a, b, *c)    a = [1, 2], b = 3,   c = []
  ((a, b), c)   a = 1,      b = 2,   c = 3
  ((a, *b), c)  a = 1,      b = [2], c = 3
  ```
  
  For seemingly no good reason, you cannot have an array decomposition
  parameter, a splat parameter and a keyword parameter in the same method. Go
  figure.
  
- The splat parameter enables variable length argument lists and receives all
  extra arguments.
  
- Post-required parameters are required parameters that occur after a splat
  parameter.
  
- Keyword operators have to be named explicitly when calling the method:
  `foo(f: 6)`. They can have default values.
  
- The double splat parameter acts like the splat parameter, but for extra
  keyword arguments.
  
- The block parameter gives a name to the block passed to the method, allowing
  you to pass it to other methods, and call it by name instead of through
  `yield`. See more on blocks in the section on [Blocks and Procs].
  
[Blocks and Procs]: #blocks-and-procs

You can get a list of a method's parameters with `Method#parameters`, which will
show the type of each parameter. Here it is, running over our `foo` method.

```ruby
method(:foo).parameters
# [[:req, :a], [:opt, :b], [:rest, :c], [:req, :d], [:keyreq, :e], [:key, :f], [:keyrest, :g], [:block, :blk]]
```

Note that this glitches for array decomposition parameters, indicating just
`[:req]`.

### Ordering

You can't mix match these parameters as you please. All types of parameters are
optional, but those that are present must respect the following ordering:

1. required parameters and optional parameters
2. splat parameter (at most one)
3. post-required parameters
4. keyword parameters
5. double splat parameter (at most one)
6. block parameter (at most one)

As a matter of best practices, you should not mix required and optional
parameters: put all required parameters first. You should also avoid
post-required parameters, and using both optional parameters and a splat
parameter. If you require default values, use keyword parameters instead.

See [some rationale][style-guide] for these practices.

[style-guide]: https://github.com/bbatsov/ruby-style-guide/issues/632

## Assigning Arguments to Parameters

The real complexity of Ruby's methods is determining how arguments are mapped to
parameters.

Here are the different types of arguments you can pass to a method call:

| type | example |
|------|---------|
| regular              | `v`                       |
| keyword               | `b:`, `b: v` or `:b => v`     |
| hash argument         | `v1 => v2`              |
| splat                 | `*v`                    |
| double splat          | `**v`                   |
| block conversion      | `&v`                    |
| block                 | `{ .. }` or `do .. end` |

You can substitute `v` (and `v1`, `v2`) with almost any expression, as long as
you respect operator precedence.

A kitchen sink example:

```ruby
foo 1, *array, 2, c: 3, "d" => 4, **hash
```

Here are quick explanations:

- Keyword arguments are equivalent to hash arguments whose key is a symbol. If
  you are using keyword arguments with the intent to fill keyword parameters,
  you should use the keyword syntax. In what follows, when we say *keyword
  arguments* we alway refer to keyword argument **and** hash arguments with a
  symbol key: the two are indistinguishable.

- Hash arguments will be aggregated into a hash that will be assigned to one of
  the method's parameters. Keywords argument may or may not be added to this
  hash (see below).

- If the splat argument is an `Array` or an object that supported the `to_a`
  method, it is expanded inside the method call: `foo(1, *[2, 3], 3)` is
  equivalent to `foo(1, 2, 3, 4)`. Otherwise the splat expands to a regular
  argument.
  
- A double splat works the same, but for hashes: `foo(a: 1, **{b: 2, c: 3}, e:
  4)` is equivalent to `foo(a: 1, b: 2, c: 3, d: 4)`. It performs implicit
  conversion to `Hash` for objects that support the `to_hash` method. Note in
  passing that by convention `to_hash` represents implicit conversion to a
  `Hash`, while `to_h` represents explicit (on-demand only) conversion.
  
- A block conversion argument must be a `Proc`, or an object that can implicitly
  converted to one via `to_proc`.
  
- Finally, a method can be passed a block explicitly. The block will appear
  after the argument list. We'll touch on the difference between the two block
  syntaxes in the [section about blocks][Blocks and Procs].

### Ordering

Again, arguments cannot be supplied in any order. All regular and splat
arguments must appear before any keyword and double splat arguments. A block
conversion or block argument (only one allowed) must appear last.

If the order is not respected, an error ensues.

### Assigning Arguments to Parameters

Where an error is mentionned, it is most likely an `ArgumentError`. I haven't
re-checked everything, but it should always be the case.

Here is the full procedure for figuring out how arguments are assigned to
parameters:

1. Expand any splat or double splat arguments. The expanded content is taken
   into account when we talk about regular, keyword or hash arguments later on.
   
2. First, we handle all keywords and hash parameters.

   If there is exactly one more required parameters than there are regular
   arguments, all keyword and hash arguments are collected into a hash, which is
   assigned to that parameter. If there were any keyword parameter, an error
   ensues. If there was a double splat parameter, it is assigned an empty hash.
   
   Otherwise, if all of the following conditions hold, *implicit hash conversion* is
   performed.
   
   - There are keyword or double splat parameters.
   - There are no keyword or hash arguments.
   - There are more regular arguments than required parameters.
   - The last regular argument is a hash, or can be converted to one via
     `to_hash` and that method doesn't return `nil`.
   
   Implicit hash conversion simply consists of treating all the (key, value)
   pairs from the last regular argument as additional keyword or hash arguments.
   These new arguments are taken into account in the rest of the assignment
   procedure.
   
   We now assign keyword arguments to the corresponding keyword parameters. If a
   keyword parameter without default value cannot be assigned, an error ensues.
   
   If there is double splat parameter, assign it a hash aggregating all
   remaining keyword parameters.
      
   If there remains keyword or hash arguments, aggregate them in a hash, which
   is to be treated as the last regular argument.
   
   Note: if two values are supplied for the same key, the last one wins and the
   previous one disappears. However, if the two values are visible in the method
   call (e.g. `foo(a: 1, **{a: 2})`), a warning is emitted.

3. We now consider regular arguments, which by now consists of the supplied
   regular arguments (including the result of splat expansion), minus the last
   argument if implicit hash conversion was performed in step 2, plus a final
   argument containing a hash if arguments remained in step 2.
   
   If there are less regular arguments than required parameters, an error
   ensues. Otherwise, let `x` be the number of regular arguments and `n` the
   number of required and optional parameters.
   
   If `x <= n`, the last `n-x` optional parameters get assigned their default
   values, while the remaining `x` parameters get assigned the `x` regular
   arguments.
   
   If `x > n`, the `n` first arguments are assigned to the `n` parameters. The
   `x-n` remaining arguments are collected in an array, which is assigned to the
   splat parameter. If there is no splat parameter, an error ensues.

4. If a block or block conversion argument is passed, make a proc from it and
   assign it to the block parameter, if any — otherwise it becomes the implicit
   block parameter.

## Blocks and Procs

The following is in general much better understood than assignment from
arguments to parameters.

Procs are [higher-order functions][hofunc], while blocks are a syntactic
notation to pass a proc to a method. It's not *quite* that simple however. You
can pass procs as regular arguments, but the block parameter is special. All
methods can accept a block implicitly, or explicitly via a block a parameter.
This parameter must be assigned a (syntactic) block (which becomes a proc) or a
"regular" proc marked with `&`.

Other than with blocks, procs can be instantiated with `proc`, `Proc.new`,
`lambda` or `->` (*lambda literal* or *dash rocket* or *stab operator*). The
tree first forms simply take a block argument, while the last form looks like this:

```ruby
-> (a, b) { ... }
-> (a, b) do .. end
-> { ... }
-> do .. end
```

When a method accepts an implicit block, you can call it with `yield` (you can
also call the explicit block parameter with `yield`). Somewhat peculiarly, the
`yield` notation cannot be passed a block of its own. A proc or block parameter
named `x` can be called using `x.call(1, 2)`, `x.(1, 2)` or `x[1, 2]`.

A less known trick is that you can also get a reference to the proc backing the
block argument by using `proc` or `Proc.new` (without passing them a block)
inside the method.

[hofunc]: https://en.wikipedia.org/wiki/Higher-order_function

### Procs vs Lambdas

Lambdas are special, stricter kind of procs.

-  Regular procs can perform non-local control flow: if a proc uses `retry`,
   `return`, `break`, `next` or `redo`, those will be interpreted as though the
   proc's code had been inlined at the point where the proc was called. This can
   only happen in the method in which the proc was originally defined. If called
   outside the method, a proc that performs non-local control flow will cause a
   `LocalJumpError`.
   
- If regular procs are passed too many arguments, the extra arguments are
  ignored instead of causing an error (the behaviour is otherwise the same as
  for methods, as outlined above). Lambda behave like methods for parameter
  assignment.
  
`proc` and `Proc.new` are used to create regular procs, while `lambda` and `->`
create lambdas.

### Curly Brackets (`{}`) vs `do .. end`

There is not semantic difference between both forms.

There is one syntactic difference because the two forms have different
precedences:

```ruby
foo bar { ... }     # foo(bar { ... })
foo bar do ... end  # foo(bar) { ... }
```

If you don't need to use this particularity, there are two popular ways to
choose on form over the other:

- Use curlies for single-line blocks, `do ... end` for multi-line blocks.

- Use curlies when the return value is used, `do ... end` when only the
  side-effects matter.

## Edits

**1**

Thanks to [Benoit Daloze], who pointed out many small mistakes in the article,
as well as the fact that the proper names for what I called *regular* and
*default* parameters were *required* and *optional* parameters. He also
mentionned `Method#parameters`, and inspired me to improve the section on blocks
and procs.

[Benoit Daloze]: https://twitter.com/eregontp

**2**

Following a conversation with [Tom Enebo] on Twitter, I realized that I forgot
to account for hash arguments with non-symbol keys! This lead to some more
investigation and the uncovering of a few errors. The assignment procedure has
been revised and is now much simpler.

[Tom Enebo]: https://twitter.com/tom_enebo
