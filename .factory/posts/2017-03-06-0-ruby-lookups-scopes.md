---
title: "Ruby's Lookups & Scopes"
layout: post
---

This is the third and last article in the [Ruby's Dark Corners] series.

[Ruby's Dark Corners]: /ruby-dark-corners

## Lookups in Ruby

The great difficulty in Ruby is knowing what names refer
to. [Linearization][linearization] showed us that knowing which method gets
called is non-trivial. Unfortunately it's only part of the story.

[linearization]: /ruby-module-linearization

In Ruby, names can refer to:

- methods: `x.name` or `name`
- local variables: `name`
- class variables: `@@name`
- global variables: `$name`
- constants: `NAME`
- modules: `Name`

We also would like to know on which module methods are defined. By the way,
since `Class < Module`, when we say *modules* we mean *modules and classes*,
unless otherwise specified.

There are five big concepts involved with these lookups (and then some fun
sprinkled on top):

- **self**: what does `self` refer to?
- **definee**: if a method definition appears, on which class is it defined?
- **scoping**: knowing which constructs create new scope for local variables and
  which don't
- **nesting**: what are the surrounding modules? (often called *cref*)

Let's look at how each type of name is resolved.

## Local & Global Variables

Global variables are prefixed with `$` and they are easy: they are accessible
everywhere.

Local variables depend on static scopes. New scopes are create when you enter a
new method or module body, or when you enter a method call's block. Control flow
statements do not create scopes!

Only scopes created by blocks inherit their parent's scope. Scope created by
methods and modules are completely isolated from their parent's scope. It is
sometimes said that `module`, `class` and `def` are *scope gates*.


```ruby
x = 1
module Foo
  p x # NameError
end
```

There is however a trick you can use:

```ruby
x = 1
Foo = Module.new do
  p x # ok
end
```

It is possible to make local variables survive their lexical scope:

```ruby
def foo
  x = 0
  [lambda { x += 1 }, lambda { p x }]
end
x, y = foo
x.call()
y.call() # 1
```
  
Something else that is peculiar: a variable is "in scope" in an assignment to it
has appeared before in the current scope.

```ruby
p x # NameError
x = 1
# but
x = 1 if false
p x # nil
```

Reflection can help with local variables too: the `binding` method (both
`Kernel#binding` and `Proc#binding`) returns a `Binding` object which describes
the local variables in scope.

## Instance Variables

Instance variables are prefixed by `@`. They are **always** looked up on `self`.
If an instance variable doesn't exists (it has never been assigned), it
evaluates to `nil`.

Note that this means that instance variables are effectively instance-private:
an instance of `X` cannot access the instance variables of another instance of
`X`. This is more restrictive than `private` in Java for instance. However, it's
easy to use reflection to side-step this with
`Object#instance_variable_get/set`.

## Class Variables

Class variables are prefixed with `@@`. They are defined on modules, and can be
accessed both in module bodies and in method bodies. Strangely, they can also be
accessed in the meta-class of a module (and its meta-meta-class, etc).

If a module inherits multiple version of a class variable, it's always the first
inherited version that wins (so the first `<`, `include` or `preprend`).

You can list the class variables "owned" by a module with
`Module#class_variables(false)` (`false` says not to include class inherited
class variables). Interestingly, class variables can "migrate": if the module is
a class that has a class variable `@@a`, and that `@@a` becomes defined on one
of its ancestor, the class variable will disappear from the class. This will not
happen for non-class modules however.

```ruby
class T; @@a = 't'; end
class Object; @@a = 'o'; end
class T
  p @@a # o
  p class_variables(false) # []
end
```

If a class variable is accessed before it has been assigned, a `NameError`
occurs.

Final catch, class variables can only be accessed inside the body of a class
that inherits/includes the class defining the variables. This means you can't
use the `@@x` notation with the `eval` method that we will see later. However,
you can use reflection: `Module#class_variable_get/set`.

## Constants (and Modules)

Constants start with an uppercase letter, and modules are actually a kind of
constant.

Constants depend on the notion of `nesting`: you can access a constant if it is
declared inside a module body that is around you, or in one of the ancestors of
the current module (but **not** in an ancestor of a surrounding module!). You
can also use `::` to navigate through modules:

```ruby
X = 0
module A
  X = 1
  p ::X # 0
  module B; module C; Y = 2; end; end
  module D
    p X # 1
    p B::C::Y
  end
end
```

The following exemple illustrates two gotchas:

- You don't have access to constants defined in an ancestor of a surrounding
  module.
- Constants in surrounding modules take precedence over constants in ancestors.

```ruby
module A; X = 'a'; end
module B; Y = 'b'; end
module C
  include A
  p X # ok
  Y = 'c'
  module D
    include B
    p Y # 'c'!
    p X # NameError
  end
end
```

The module body really has to be around you:

```ruby
module A::B::C; p Y; end # ok (Y defined in C)
module A::D; p X; end # NameError (X defined in A)
```

We can access the current nesting with `Module::nesting` and clarify the
example:

```ruby
module A
  module D; p Module.nesting; end # [A, A::D]
end
module A::D; p Module.nesting; end # [A::D]
```

Of course, if you try to access a constant before it has been assigned, a
`NameError` ensues. `Module::constants` will list the constants defined at the
point of call, while `Module#constants` will list the constants defined by the
module (and optionally by its ancestors, depending on the argument).

## Methods

Methods are looked up on the receiver (the thing before the dot). If there is no
receiver, `self` is assumed. Then it's just a matter to perform the lookup
according to [linearization]. `self` may also have a meta-class which has
priority on all other ancestors.

**Refinements**

However, there is another subtlety, called *refinements*. In Ruby, it is common
to use *monkey patching* to open a class and add and redefine methods. However,
if every library starts doing this, you can end up with nasty conflicts.
Refinements were introduced as a solution to this problem.

Refinements can only be defined in non-class modules, and only classes can be refined:

```ruby
class C
  def foo; 'foo'; end
end

module M
  refine C do
    def foo; 'bar'; end
  end
end
```

Defining a refinement does nothing by itself. You have to use the `Module#using`
function to enable some refinements in the current module:

```ruby
module N
  p C.new.foo # 'foo'
  using M
  p C.new.foo # 'bar'
end
p C.new.foo # 'foo'
```

`using` statements are somewhat peculiar, because they are strictly lexical in
scope. Said otherwise, the introduced refinements have the same visibility as
constants, **excepted** that the `using` is not inherited (via sublassing or
include):

```ruby
class A; using M; end
class B < A
  p C.new.foo # 'foo'
end
```

However, refinements themselves are inherited:

```ruby
module O
  include M
end
module P
  using O
  p C.new.foo # 'bar'
end
```

How prioritary are refinements? Refinements always take priority over everything
else. What if multiple refinements conflicts? The latest innermost `using` statement
always wins.

You can get a list of modules whose refinements are visible with
`Module::used_modules`.

## On which module are methods defined?

Last, but not least, when you use the `def` keyword, on which module are the
methods defined? The not-so-helpful answer is that these methods become instance
methods of *the definee*. Entering certain declarations and calling certain
functions change the definee, as we'll see in the next section.

## How `self` and the definee change

| where | self | definee |
|------ |------|---------|
| top-level (file or REPL)  | `main` (an instance of `Object`)  | Object                |
| in a module               | module                            | module                |
| in `class << X`           | metaclass of `X`                  | metaclass of `X`      |
| in a `def method`         | receiver                          | surrounding module    |
| in a `def X.method`       | receiver (`X`)                    | metaclass of `X`      |
| `X.instance_eval`         | receiver (`X`)                    | metaclass of `X`      |
| `X.class_eval`            | receiver (`X`, a module)          | receiver (`X`)        |

Also note that `Module#module_eval` is an alias for `Module#class_eval`. There
are also variants called `class/module/instance_exec`, which do the same thing
as the `eval` version but allow passing additional arguments to the block
(useful to make instance variables accessible to the block). This is **the
only** difference between the `exec` and `eval` family, despite the
documentation seeming to hint at some bizarre lookup behaviour.

Note that for the two `def` rows, the definee is both the module on which the
method itself is being defined, and the definee for nested method definitions.

At first, it may seem that `class/module_eval` does the same as a `module` or
`class` block. However, you cannot open a class inside a method, so `class_eval`
helps in you need to evaluate something in the context of a class as part of a
method. Note however that it is possible to open metaclasses in a method through
`class << X`.

There are also string-based `eval` based. But things are complex enough as it
is, if you can avoid to go there, please do.

Finally, if you experiment, you may find out you cannot define singleton method
on the classes `Integer` and `Symbol` (e.g. `def Integer.foo`). I assume for
performance reasons.

## Doing Better?

The situation is a bit hairy, to say the least. How could we simplify things?

Once you wrap your head around them, globals, class and instance variables are
rather simple. One caveat: I would allow accessing class variables whenever
`self` is the class, removing an exception with little benefit.

Regarding local variables, it's not quite obvious why scope gates are needed.
Maybe because they would encourage people to use class-local variables instead
of class variables? It doesn't really hurt, but adds yet another thing to
remember to the language.

Constants lookup is puzzling. My take is that constants should be looked up
first in the ancestors then in the surrounding module and its ancestors, etc.
That would be much less surprising. I don't see **any** reason to do things in
the current way (surrounding modules take precedence over the ancestors).

I think a useful heuristic is to preserve the ability to move code vertically.
Code that is well-defined in a class should have the same meaning in a subclass
or in a superclass, unless some symbols are overridden in the class. Surrounding
modules should not affect such code.

Refinements blatantly violate the heuristic above. I can appreciate why: the
idea was to to restrict monkey patching to a well-defined blob of code, and
inheriting `using` statements goes against that by forcing monkey patching on
sub-classes. On the other hand, I think it goes against the principle of least
surprise by violating my heuristic above.

Another reason refinements are awkward is that they introduce not one, but two
new forms of lookup: `using` statements and refinement definitions (`refine`).

I believe it was a mistake to overload modules with another role as "refinement
container". It would probably have been better to merge `using` into `refine`:
make all refinements active as soon as defined, and combine them through
inheritance (using the ancestor chain).

If it was really desirable to refine a method only within a superclass but not
within its subclasses, the `private` function could have been reused. This would
have made refinement lookups similar to method lookup, and would have surprised
no-one.

There is a big problem with this idea: dynamically looking up refinement is
expensive: you now need to walk two ancestor chains instead of one for every
lookup. A simple countermeasure: forbid adding new refinements dynamically,
which is already the case in the current version.

Finally, I would allow opening classes and modules in methods, and allow any
expression in place of the class name. This would remove the need for
`class_eval` method. If needed one can add the restriction that only existing
classes and modules can be opened in methods.

I would also remove `instance_eval`, however it has no immediate analog. I would
retool the `class << X` notation for this purpose. In order to keep the
metaclass accessible, I would introduce a `metaclass` field in class `Object`.
This value can be used in conjunction with `class` so that `class X.metaclass`
achieves the previous effect of `class << X`.

So in summary:

- Allow class variables to be used anywhere where `self` is the class.
- Abolish scope gates?
- Lookup constants first in the ancestors, then in the surround class and their
  ancestors.
- Merge `using` into `refine`, and make this new kind of refinement inheritable,
  except when qualified with `private`. Forbid dynamically adding refinements to
  avoid dynamic refinement lookup.
- Remove the `instance_eval` and `class_eval` methods; allow opening classes in
  methods; and make `class << X` take the meaning of `X.instance_eval`.
- Add a `metaclass` field to class `Object`.

Of course, it's too late for Ruby. But for a language inspired by Ruby, these
points are worth considering.
