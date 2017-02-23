---
layout: post
title: "Ruby Module Linearization"
---

This is the second article in the [Ruby's Dark Corners] series.

[Ruby's Dark Corners]: /ruby-dark-corners

## Mixin Modules

In Ruby, classes can only inherit from a single class. However they can
*include* multiple modules.

A class that includes a module will be able to use the methods defined in the
modules. A class doesn't really "inherit instance variables". Instance variables
must not be declared, they exist just by virtue of being accessed. This means
that if a class and its superclass (or an included module) both access a
variable `@x`, they will access the same variable.

This is because of *late binding* (aka *dynamic dispatch*): both instance
variables and methods will be looked up from *self* at run-time.

While here is only a single copy of each instance variable, there could be
multiple method declarations with the same name. How does Ruby select which one
to use?

The answer is a process called *linearization*, which defines how Ruby orders
all the (transitively) inherited classes and included modules. You can inspect
this ordering through the `Module#ancestors` method. For instance try
`Integer.ancestors`.

More than lookup, linearization also controls the behaviour of calls to super
methods through `super()`. Ruby reorganizes all modules and classes into a
single inheritance chain (the *ancestor chain*) and consecutive calls to
`super()` move up this chain.

## Confusing Examples

But how does linearization work, exactly?

Here are a couple scenarios, what do you think the behaviour for each of this
scenario is? Each is taylored to show something about the linearization process.

```ruby
# Scenario 1

module A1; end
module B1; end
module C1
  include A1
  include B1
end
```

```ruby
# Scenario 2

module A2; end
module B2; end
module C2
  include A2
end
module D2
  include B2
end
module E2
  include C2
  include D2
end
```

```ruby
# Scenario 3

module A3; end
module C3
  include A3
end
module D3
  include A3
end
module E3
  include C3
  include D3
end
```

```ruby
# Scenario 4

module A4; end
module B4; end
module F4; end
module C4
  include B4
  include A4
end
module D4
  include F4
  include A4
end
module E4
  include C4
  include D4
end
```

```ruby
# Scenario 5

module A5; end
module B5; end
module C5
  include B5
  include A5
end
module D5
  include A5
  include B5
end
module E5
  include C5
  include D5
end
```

And here are the linearized orderings:

```ruby
C1.ancestors    => [C1, B1, A1]
E2.ancestors    => [E2, D2, B2, C2, A2] 
E3.ancestors    => [E3, D3, C3, A3]
# so far, so good
E4.ancestors    => [E4, D4, C4, A4, F4, B4]
E5.ancestors    => [E5, D5, C5, A5, B5]
# where is your god now?
```

Two things further complicate the situation:

- The `prepend` function is a variant of `include` with a slightly different
  behaviour.
- `include A, B` is the same as `include B; include A`. Yep.

## The Algorithm

The linearization algorithm is very hard to describe precisely with a few
sentences, so I'll just serve you the code:

```ruby
Include = Struct.new :mod
Prepend = Struct.new :mod

# Returns the ancestry chain of `mod`, given the environment `env`.
#
# No distinctions are made between classes and modules: where a class extends
# another class, that class is treated as the first included module.
#
# params:
# - mod: Symbol
#   Represents a module.
# - env: Map<Symbol, Array<Include|Prepend>>
#   Maps modules to inclusions, in order of apperance.

def ancestors (mod, env)
  chain = [mod]
  includes = env[mod]
  includes.each { |it| insert(mod, it, env, chain) }
  chain
end


def insert (mod, inclusion, env, chain)
  i = inclusion.is_a?(Prepend) ? 0 : 1
  ancestors(inclusion.mod, env).each do |it|
    raise ArgumentError('cyclic include detected') if it == mod
    j = chain.find_index it
    if not j.nil?
      i = j + 1 if j >= i
      next
    end
    chain.insert(i, it)
    i += 1
  end
end
```

### Intuition

Let's try to get some intuition in there. Let's start with some observations:

- If B is included after A, B take precedence over A.

- If B extends or includes A, B takes precedences over A.

- When including a module X, the algorithm tries to maintain the ordering
  of the ancestor chain of X.

- If there is a conflict of ordering, the algorithm always favors the
  ordering of modules that were included earlier.

The last point highlight the most unintuitive thing about the algorithm: modules
included later take precedence, but when considering conflicts of ordering, it's
modules included earlier that win!

The reason is that in Ruby, we may include a module in another at any time. Ruby
never reorders modules in the ancestor chain, but has no problem inserting
modules in between existing modules. This does make sense, but leads to puzzling
linearization behaviour.

Making module included earlier take precedence would solve the problem. However
when we include a module in another at runtime, we usually would like it to take
precedence on previously included modules!

### Inheritance vs Inclusion

As mentionned in the comment, there is no difference between inheritance and
inclusion with regards to linearization. An inherited class is treated as though
it was the first included module.

### Merging Ancestor Chains

If you look at the algorithm, you will see that it is a recursive process: to
include a module, you need to acquire its ancestor chain, then merge it with the
current ancestor chain of the includer.

The way this is done — for regular includes — is to start just after the class
then insert the modules one by one. We only diverge from this if a module is
already present in the ancestor chain. Either it is further ahead in the chain:
then we skip to that position and continue the process; or it is earlier in the
chain (signifying there is an ordering conflict between included modules) and we
remain at the current position (in both cases the module is not re-inserted).

### Include vs Prepend

The only difference between `include` and `prepend` is that prepend will try
merging the ancestor chain of its parameter *before* the class in the class
own's ancestor chain:

```ruby
module M; end
class C; prepend M; end
C.ancestors => [M, C, ...]
```

## Doing Better?

Despite its idiosyncracies, I would be hard pressed to improve on the algorithm
without losing some of its nice properties. The key tension is that later calls
to `include` should take precedence (to enable effective run-time
meta-programming), but re-ordering modules is objectively bad.

If you have any idea, make sure to share them!

It should also be said that, of course, scenarios such as ordering conflicts
rarely happen in practice. Most people ignore these rules and are not really
worse off because of it.
