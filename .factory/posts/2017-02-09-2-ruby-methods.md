---
title: "Ruby Methods, Procs and Blocks"
layout: post
---

This is the first article in the [Ruby's Dark Corners] series.

[Ruby's Dark Corners]: /ruby-dark-corners

Here are a few question this article will try to answer:

- What combination of parameters are legal in method definition?
- How are arguments assigned to parameters when calling a method?
- How do blocks differ from procs?
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
| splat                 | `*e`          |
| keyword               | `f:`, `g: 7`  |
| double splat          | `**h`         |
| block                 | `&i`          |

A kitchen sink example:

```ruby
def foo a, (b, c), d = 1, *e, f:, g: 7, **h, &i; end
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
  
- The splat parameter enables variable length argument lists and receives all
  extra arguments.
  
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
Notice the glitch for the array decomposition parameter!

```ruby
method(:foo).parameters
# [[:req, :a], [:req], [:opt, :d], [:rest, :e], [:keyreq, :f], [:key, :g], [:keyrest, :h], [:block, :i]]
```

### Ordering

You can't mix match these parameters as you please. All types of parameters are
optional, but those that are present must respect the following ordering:

1. required parameters, optional parameters, and splat parameter (at most one)
2. keyword parameters
3. double splat parameter (at most one)
4. block parameter (at most one)

Actually, required parameters that appear after the splat parameter are named
"post-required parameters". I was told this by two persons but it's pretty much
un-googlable. The distinction does not affect the semantics in any way.

### Best Practices

Put the parameters in the following order:

1. required parameters
2. optional parameters
3. splat parameters
4. keyword parameters
5. double splat parameter
6. block parameter

You should not mix the ordering of required, optional and splat parameters, it
makes it very unintuitive which parameters gets assigned which argument.

## Assigning Arguments to Parameters

The real complexity of Ruby's methods is determining how arguments are mapped to
parameters.

Here are the different types of arguments you can pass to a method call:

| type | example |
|------|---------|
| regular              | `v`           |
| keyword               | `b: v`        |
| hash argument         | `:c => v`     |
| splat                 | `*v`          |
| double splat          | `**v`         |
| block conversion      | `&v`          |
| block                 | `{ .. }` or `do .. end` |

You can substitute `v` with almost any expression, as long as you respect
operator precedence.

A kitchen sink example:

```ruby
foo 1, *array, 2, c: 3, :d => 4, **hash
```

Here are quick explanations:

- Keyword and hash arguments are always treated the same. You should prefer the
  keyword syntax. They match keyword parameters.

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

Below we say "keyword argument" to mean "keyword or hash argument", as those are
always treated identically.

Where an error is mentionned, it is most likely an `ArgumentError`. I haven't
re-checked everything, but it should always be the case.

Here is the full procedure for figuring out how arguments are assigned to
parameters:

1. Expand any splat or double splat arguments. The expanded content is taken
   into account when we talk about regular or keyword arguments later on.

2. Let `n` be the number of required parameters  
   Let `m` be the number of required and optional parameters  
   Let `x` be the number of regular arguments
   
   Depending on the value of `x` (pick the first case that matches):
   
   - `x < n-1`
   
     There aren't enough regular arguments, an error ensues.
      
   - `x == n-1`
   
     If there aren't any keyword arguments, an error ensues.
     
     Otherwise, the last required parameter will receive a hash that will
     collect all keyword arguments.
     
     If there were any keyword parameter without default value, an error
     ensues. If there was a double splat parameter, it will receive an empty
     hash.
     
     The `x` regular arguments are assigned to the `x` first required
     parameters.
   
   - `x < m`
   
     The first `x` regular arguments are assigned to the `x` first required
     and/or keyword parameters. The last `m-x` optional parameters get assigned
     their default values.
     
     However, a special case arises if there are keyword arguments but no
     keyword or double splat parameters. In this case, the keyword arguments
     will be collected in a hash, and assigned to the first optional parameter
     who has a hash as default value. If none have, the hash is assigned to the
     first required or optional parameter instead. The assignment from arguments
     to parameters is shifted, of course (i.e. no arguments is lost because of
     this).
     
   - `x > m`
   
     The `m` first arguments are assigned to the `m` first required and/or
     optional parameters.
   
     If there is at least a keyword or double splat parameter, but there are no
     keyword arguments, and if the last regular argument is a `Hash` or can be
     converted to one with `to_hash`, consider it is a double splat argument and
     expand it.
   
     All other arguments (`x-m` or `x-m-1` of them) are collected in an array
     and assigned to the splat parameter if it exists. If there is no splat
     parameter and there more than 0 such arguments, an error ensues.
      
3. Assuming the keyword argument weren't captured in either the `x == n-1` or `x
   < m` cases in step 2, three situations are possible:
   
   - The are keyword or double splat parameters.
   
     The keywords arguments are assigned to the corresponding keyword parameter.
     If a keyword parameter without default value is not filled, an error ensued.

     If two values are supplied for the same key, the last one wins. However, if
     the two values are visible in the method call (e.g. `foo(a: 1, **{a: 2})`),
     a warning is emitted.

     If any keyword arguments remain, they are collected inside a hash and
     assigned to the double splat parameter if it exists. If it doesn't and any
     keyword argument remain, an error ensues.
          
   - There are no keyword or double splat parameters, but there is a splat
     parameter.
     
     All keyword arguments are collected in a hash, which is added to the array
     assigned to the splat parameter.
     
   - There are no keyword, double splat or splat parameters. If there are any
     keyword arguments, an error ensues.
     
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

Thanks to [Benoit Daloze], who pointed out many small mistakes in the article,
as well as the fact that the proper names for what I called *regular* and
*default* parameters were *required* and *optional* parameters. He also
mentionned `Method#parameters`, and inspired me to improve the section on blocks
and procs.

[Benoit Daloze]: https://twitter.com/eregontp
