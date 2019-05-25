---
layout: post
title: "Language Design Notes 1: A Precise Typeclass Scheme"
---

This is the second post in my **[Language Design Notes]** series.

[Language Design Notes]: /language-design-notes/

This instalment is a bit particular, as it outlines pretty precisely (though not
formally) a way to implement [typeclasses] in an imaginary (and for the most
part, unspecified) language. Nothing much is assumed about the language — it
isn't assumed to be purely functional for instance. The syntax is taken to look
a bit like Python (using significant indentation).

Some context about why I wrote this, lifted from the the [series
index][Language Design Notes]:

> As I started thinking about typeclasses more, I found the need to write down
> some form of specification of the system I was imagining, so that I could
> refer to other parts of the design, and see if it was consistent.
> 
> I found the need to be fairly precise. Or maybe I just got carried away... but
> I think the precision really helps throw in relief the small details that
> threaten the consistency and elegance of the whole. Anyhow, this ended up
> looking more like a specification than a nice explanative article, although I
> tried to include enough examples.
> 
> It's not perfect, but as [discussed earlier], I want thing to move forward, so
> here it is!

[typeclasses]: https://en.wikipedia.org/wiki/Type_class
[discussed earlier]: /more-content/

And that being said, let's dive right in!

## Declaring Typeclasses and Instances

This is how you declare a single-parameter typeclass:

```
class Serializable $T
    fun serialize (it: $T): String
    fun deserialize (str: String): $T
```

`$T` is a generic type. Generic types all start with a dollar sign. This makes
them easy to pick out and avoids namespace clashes with regular types. It also
dispenses us from declaring which types are generic separately. This is not a
problem for typeclass declarations, but it is for function declaration, where
generic types may be mingled with normal types.

For instance, java lists the generic types before the function signature:

    <T> String serialize (T it);

Haskell uses the scheme we propose, but with lowercase letters for generic
types. We'd like to keep lowercase letters for things in the domain of values,
while things in the domain of types are capitalized. (That being said, types
will also be first-class values in our language.)

This is how you create an instance of a single-parameter typeclass for a type
called `Point`:

```
instance Serializable Point
    fun serialize (it: Point): String
        return it.x + "," + it.y
    fun deserialize (str: String): Point
        val strs = str.split(",")
        return Point(parse_int(strs[0]), parse_int(strs[1]))
```

Here is how you declare a multiple-parameter typeclass:

```
enum Order { BIGGER, EQUAL, SMALLER }

class Orderable $X $Y
    fun order (x: $X, y: $Y): Order
```

Here is how you create an instance of a multiple-parameter typeclass for types
`String` and `Char`:

```
instance Orderable String Char
    fun order (x: String, y: Char): Order
        if x.size == 0
            return SMALLER
        if x[0] == y
            return x.size == 1 ? EQUAL : BIGGER
        else
            return x[0] > y ? BIGGER : SMALLER
```

Note that both type parameters of `Orderable` can be the same type:

```
instance Orderable Int Int
    fun order (x: Int, y: Int): Order
        if (x > y) return BIGGER
        if (x < y) return SMALLER
        return EQUAL
```

## Instances Names

Every instance must have a name. A subsequent section ([Picking
Instances](#picking-instances)) will explain why names are needed, but for the
moment bear with me.

If a name is not given explicitly, it will be generated automatically. For
instance, our `Serializable` instance for `Point` will be called
`Serializable_Point`.

We can also give a name explicitly. Imagine we want to serialize points using
slashes (/) because of an obscure data format we use:

```
instance PointSlash: Serializable Point
    fun serialize (it: Point): String
        return it.x + "/" + it.y
    fun deserialize (str: String): Point
        val strs = str.split("/")
        return Point(parse_int(strs[0]), parse_int(strs[1]))
```

(The definition is the same as `Serializable_Point`, except the comma has been replaced by a
slash.)

This instance will be called `PointSlash`. It will not receive an automatically
generated name.

The scheme to build automatic names for multiple-parameter typeclasses is what
you'd expect , e.g. `Orderable_Int_Int`.

## Deriving Typeclasses Automatically

We can derive a typeclass instance from the existence of another typeclass as
follows:

```
derive instance Orderable $X $Y
        from Reverse: Orderable $Y $X
    
    fun order (x: $X, y: $Y): Order
        val rev = Reverse.order(y, x)
        if (rev == BIGGER)  return SMALLER
        if (rev == SMALLER) return BIGGER
        return EQUAL
```

We call this declaration an *instance derivation*. The instance that will
fullfill the from-clause is called the *source instance*. The instance derived
from a specific source instance is simply known as a *derived instance*.

Instance selection will always prefer an explicit instance rather than a derived
instance when both are in the same scope. So our derived `Orderable` instance
does not cause issues when `$X` and `$Y` are the same type. We'll talk about
this more in the [Type Derivations and Instance
Selection](#type-derivations-and-instance-selection) section.

Just like instances, instance derivations have names. Similarly, they can have
explicit names:

```
derive instance Reversed: Orderable $X $Y
        from Reverse: Orderable $Y $X
    // ...
```

But otherwise an automatic name is attributed. For our example, the name would
be `Orderable_$X_$Y_from_Orderable_$Y_$X`.

A single derivation can yield many different instances. There will of course be
instances with different type arguments, but also instances using a different
source instance.

Source instances can be given a name (`Reverse` in our example) or have a name
assigned automatically — it would be `Orderable_$X_$Y` in our example). This,
however, is not the true name of the source instance — which is simply the name
of whatever instance is selected to fullfill the role of the source instance.
Rather it's an alias that can be used within the definition of the type
derivation. It may happens that this name clashes with previously declared
names. In this case, this name shadows the previous declaration, for the
duration of the type derivation definition. It will be possible to access
file-levels and imported names by prefixing them with a module name — see next
section.

While we don't declare derived instances explicitly, they also have names! These
are derived by treating the name of the derivation as a function of the source
instance, e.g. `Reversed(Orderable_Int_Int)`

## Importing Typeclasses and Instances

In this imaginary language, I've decided not to specify explicitly how things
can become imported.

Having nevertheless given it some thought, it appears clear that importing all
instances explicitly would be cumbersome. One could therefore suppose that
typeclass instances will get imported *implicitly*.

For instance, we could **imagine** that if we import a set of types from a file,
then all typeclass instances in the file for that set of types would get
imported implicitly.

An instance is said to be *in scope* of some code if they're declared in the
same file, or if they've been imported (explicitly or implicitly).

I imagine that this system will rely on a notion of *module*.

As such, it will be possible to prefix of an instance or type derivation by the
name of its defining module — with the special keyword `self` designating the
current module. e.g. `self.Serializable_Point` or
`my_module.Serializable_Point`.

## Default Functions

Typeclass definitions are free to provide default implementations for the
functions they declare. Such a default definition can always be overidden in the
typeclass instances — otherwise it should just be a normal function and not a
typeclass function!

For instance, the following class includes a default implementation for
`receive_all` in terms of its other function `receive`.

```
class Receiver $T $X
    fun receive (it: $T, item: $X)
    fun receive_all (it: $T, items: List[$T])
        for item in items:
            receive(it, item)
```

It's even possible to have two functions in terms of one another — the user
implementing the instance will have to override at least one of them.

(It would be possible to add language-level support to defining such sets of
functions, at least one of which needs to be overriden, but I'm not sure the
benefits are worth the conceptual overhead.)

There are essentially two ways to implement default methods. The first is for
them to be some kind of template, specialized for and copied into each instance
that does not override them. The second is to use a late binding mechanism,
which can be especially interesting if the implementation targets supports it
(e.g. the JVM).


## Typeclass Constraints

There are two places where it's possible to constrain types based on whether
they possess a typeclass instance: method definition and typeclass declarations.

Here is a method with a typeclass constraint:

```
fun foo (it: $T) where Serializable $T
    output(serialize(it))
```

And here is a typeclass with a constraint:

```
class Reducible $T $X
        where Sequential: Sequence $T $X
        
    fun reduce (it: $T): $X
```

The function's constraint prevents us from calling `foo` with a type `$T` that
does not have a corresponding `Serializable $T` instance.

Similarly, the typeclass' constraint prevents us from instanciating `Reducible`
for pair of types that do not have a corresponding `Sequence $T $X` instance.

We call instances that satisfy a function's constraints *the call instances*,
and the instances that satisfy a typeclass's constraint the *required
instances*.

Sometimes, a typeclass with a type constraint can be very close to a type
derivation, especially when the typeclass defines default implementations for
all its functions. The big difference is that a class must still be implemented
explicitly — an implementation has to be requested even if no functions have to
be implemented. A derivation, on the other hand, is always "active".

Just like for source instances in type derivations (cf. the [Deriving
Typeclasses Automatically](#deriving-typeclasses-automatically) section), the
required instances may be named and have otherwise an automatically generated
name. This is not the "true" instance name, but a local alias that may shadow
previous declarations.

The other big difference between typeclass declarations with type constraints
and type derivations is **when** instance selection occurs. We'll come back to
it in the [Type Constraints vs Type
Derivations](#type-constraints-vs-type-derivations) section.

## Picking Instances

During the execution of our program, there are a couple times when instances
will need to be picked. 

- *Direct instance selection* — when we call a function that belong to a
  typeclass, we need to decide which instance will provide the implementation.

- *Call instance selection* — selecting the instance that satisfies a typeclass
  constraint in a function (cf. last section).

- *Required instance selection* — selecting the instance that satisfies a
  typeclass constraint in a typeclass (cf. last section).

- *Source instance selection* — select the instances used as source for instance
  derivations.

Fortunately, all types of instance selections are similar, and follow the same
rules. In each case, we know the typeclass we want to provide an instance for,
and we have to select that instance from those that are in scope and fit the
bill (or emit an error if no instance will do).

If there is only one instance that works, the language will know to pick it. But
if there are ambiguities, it needs to decide on a particular instance, based on
hints supplied by the programmer.

We'll explain the instance selection rules using *direct instance selection*,
and add precisions for other types of selections later, as required.

## Direct Instance Selection

Imagine that we import `Serializable_Point` and `PointSlash` from before, two
instances of `Serializable Point`.

<u>Small aside</u>: it would be more proper to say "two instances of `Serializable`
for the type `Point`" — but that's tedious. And what category does `Serializable
Point` even belong to? It's not a typeclass (`Serializable` is) nor an instance
(`Serializable_Point` is). If we really need a name, we could could this a
*typeclass specification*.

```
fun foo (it: Point)
    output(serialize(it))
``` 

Which instance should this code use?

We can select the proper instance in two ways:

1) Specify the instance to use at the instance selection site:

```
fun foo (it: Point)
    output(Serializable_Point.serialize(it))
``` 

2) Specify the instance to use in a certain scope (e.g. file or function) with
   an `use` declaration.
   
```
fun foo (it: Point)
    use PointSlash
    output(serialize(it))
```

Of course, you could do `PointSlash.serialize(it)` and `use Serializable_Point`
as well.

When your two instances have automatically generated names which therefore clash
(i.e. both are named `Serializable_Point`), you can prefix with module names to
disambiguate them (e.g. `self.Serializable_Point` or
`my_module.Serializable_Point`) — see the [Importing Typeclasses and
Instances](#importing-typeclasses-and-instances) section.

Regarding `use`, the current plan is that it will be possible to override an
`use` declaration with another, even in the same scope. For instance:

```
fun foo (it: Point)
    use PointSlash
    output(serialize(it))
    use Serializable_Point
    output(serialize(it))
```

Nevertheless, `use` remains a *declaration* whose scope is purely static. It is
not a *statement* (and so cannot be guarded by an if statement, etc).

## Type Derivations and Instance Selection

Derived instances do complicate the instance selection mechanism somewhat.

The basic issue is relatively simple. If there is a conflict between two
instances, and both of these instances can serve as base for the creation of
derived instance, then you'll have a conflict there as well.

Consider the following example:

```
class Named $T
    fun name (it: $T): String
    
instance UserFirst: Named User
    fun name (it: User): String
        return it.first_name
        
instance UserLast: Named User
    fun name (it: User): String
        return it.last_name
    
class Stringifiable $T
    fun to_string (it: $T): String
    
derive instance Stringifiable $T from Named $T
    fun to_string (it: $T): String
        return name(it)
        
fun foo (usr: User)
    output(to_string(usr))
```

Should `foo` output the users's first or last name? Say we want the last name.

There is an easy ways to fix that conflict, should write `use UserLast`. This
will have the effect of disambiguating the *source instance selection* of the
type derivation, hence `foo` will use the `Stringifiable` instance derived from
`UserLast`.

But what if we add the following?

```
derive instance ThingNamed: Stringifiable $T
        from Named $T
    fun to_string (it: $T): String
        return "the thing named '" + name(it) + "'"
```

Now we also need to specify which derivation we want. We can do this in a couple
ways:

1. `use ThingNamed` — always use the `ThingNamed` derivation to supply a
   `Stringifiable` when a `Named` instance exists.
2. `ThingNamed.to_string(usr)` — specifying the derivation to use explicitly at
   the use site.
3. `use ThingNamed(UserLast)`
4. `ThingNamed(UserLast).to_string(usr)`
   
The first solution is a new form of `use` which does not specify an instance but
an instance derivation!

The second solution is symmetric to the first, we use the derivation instead of
an instance at the instance selection site.

The third and fourth solution have nothing novel: we just specify the full
instance explicitly.

The first two solutions, however, do require us to have specified `use UserLast`
before! Otherwise, we know to use `ThingNamed`, but should it use the the
`UserFirst` or `UserLast` instance?

**Using** an instance derivation demands *source instance selection*. This
selection may be done manually (as in `use ThingNamed(UserLast)`) or
automatically — if there is no ambiguity or the proper `use` statements have
been made.

Automatic source instance selection may entail a recursion problem when an
instance derivation creates a instance of the same kind as its pre-requisite. We
already saw a derivation like that:

```
instance Orderable Int Int
    // ...

// assume we imported this
derive instance Reversed: Orderable $X $Y
        from Reverse: Orderable $Y $X
    // ...
```

I said earlier:

> Instance selection will always prefer an explicit instance rather than a
> derived instance when both are in the same scope.

That's because I assume that within a single file, you're aware when an explicit
and derived instance clash.

But it doesn't work like that when importing one of the two instances. In that
case, the policy is to let them clash to bring awareness to the conflict.


If you want the base behaviour, you can do `use Orderable_Int_Int` and all is
well. But if you want the derived behaviour, you **can't** do `use Reversed`.
Because that would mean the derivation would use itself as `Reverse` — an
infinite recursion. It is therefore a compile-time error.

The solution in this case is simply to do manual source instance selection, i.e.
specify the full instance name: `use Reversed(Orderable_Int_Int)`.

## Implicit `use`

We need to add an important precision to what precedes.

Whenever there is a typeclass constraint, the constraint acts like an implicit
`use` statement!

So the following pair of functions are always equivalent:

```
fun foo1 (it: $T) where Serializable $T
    output(serialize(it))n

fun foo2 (it: $T) where Serializable $T
    use Serializable_$T
    output(serialize(it))
```

The same principle applies for typeclass' constraints.


## Type Constraints vs Type Derivations

When we introduced typeclass' constraints in the [Typeclass
Constraints](#typeclass-constraints) section, we said that a big difference
between typeclasses with constraints on the one hand, and type derivations on
the other hand, was that one must always request a typeclass instances, whereas
type derivation are always "active" to generate instances on a by-need basis.

Now we can introduce another big difference that directly falls out from that
first difference, namely *when* instance selection occurs.

Instances that implement a typeclass with type constraints cause the required
instances to be *captured*. This means they're essentially stored inside the
instance, and their usage is not dependent on the context in which the instance
functions are used.

For type derivations, it's some other instance selection that triggers the
source instance selection!

Just like other forms of instance selection, required instance selection is
affected by `use` statements. Manual disambiguation is also possible with the
`using` clause.

```
class Foo $T requires Named $T
    // ...
    
instance FooUser User using LastName
    // ...
    
```

On occasions, the capture of required instances, might lead to situations that
are very slightly unintuitive:

```
class Reducible $T $X
        where Sequential: Sequence $T $X
        
    fun reduce (it: $T): $X

// ...

fun foo (seq: $T) where Reducible $T Point, Sequence $T Point
    reduce(seq)
```

In the above example, there is not guarantee that the instance selected for the
function's `Sequence $T Point` constraint will be the same as the instance
selected for the typeclass' constraint!

The first one is selected when the instance satisfying `Reducible $T Point` is
defined, whereas the second is selected when the function `foo` is called.

## Shortcut Notation For Parameter Types

We admit a shortcut notation for uses of unary typeclasses, so thoses two
snippets are equivalent:

```
fun foo (mk_string: $A) where Stringifiable $A
    // ...
```

```
fun foo (mk_string: Stringifiable)
    // ...
```

The second one sure looks nicer!

There are a few reason not to use the shorthand though:

- When you need to express other constraints on the actual type.
- When you need to reuse the actual type for other parameters.

For instance, these two snippets are equivalent:

```
fun foo (mk_string1: $A, mk_string2 $B)
        where Stringifiable $A, Stringifiable $B
    // ...
```

```
fun foo (mk_string1: Stringifiable, mk_string2: Stringifiable)
    // ...
```

In practice, names will likely need to be attributed to the underlying generic
type when using the shortcut notation. The current plan is to use simple
sequential identifiers preceded by a reserved string (something like `__$A`,
`__$B`, ...).

The shortcut notation can also be used for multi-parameter typeclasses, for
instance the two following snippets are equivalent:

```
fun foo (seq: $A) where Sequence $A String
    // ...
```

```
fun foo (seq: Sequence[String])
    // ...
```

If there are more than two parameters to the typeclass, supplemental parameters
are separated by a comma:

```
fun foo (graph: Graph[Node, Edge]) // Graph $A Node Edge
    // ...
```

This is an example notation anyway, but I'm wondering if using `Sequence String`
and `Graph Node Edge` wouldn't be more pleasant? If I don't type need type-level
operators, maybe I'll do just that.

## Empty Typeclasses

One may imagine that we will end up with a lot of typeclasses that define
fine-grained behaviours. Some of those will be related by type constraints. It's
probably a good idea to make it possible to access required instances from the
instance that requires them.

Sometimes, we would like to bundle a couple of instances together, to compose a
more precise behaviour contract (which is what a typeclass essentially is) from
a bunch of smaller ones.

In that case, a common pattern would be to use an empty typeclass with a list of
requirements:

```
class List $T $X where
    Sequential $T $X,
    Indexable $T $X,
    Iterable $T $X
```

Assuming we have an instance of this class, we can access the required instances
by dot references: `ListInstance.Sequential_$T_$X`.

We can also bring required instances in scope via some local import statement:
`import ListInstance.Sequential_$T_$X`. Or if we want all of them: `import
ListInstance.*`.

Note that importing the instances brings them in scope. It pointedly *does not*
resolve ambiguities. It is not an `use` statement! (But you can also supply
required instances to `use`, of course.)

## Aliases

What if you import an instance and the original author hasn't given it a nice
name? Fortunately for you, the `alias` declaration has you covered:

```
alias PointComma = Serializable_Point
```

`alias` work for any kind of names: typeclass derivations, constructed instance
names, ...

```
alias Reversed = Orderable_$X_$Y_from_Orderable_$Y_$X
alias ReversedIntComp = Orderable_$X_$Y_from_Orderable_$Y_$X(Orderable_Int_Int)
// or, using the first allias:
alias ReversedIntComp = Reversed(Orderable_Int_Int)
```

An alias makes its left and right part interchangeable for code in which the
`alias` is in scope. It's not the same as giving a name to the instance when
it's declared: in that case, no automatically generated name is attributed!

## What Remains to be Done

This post is long enough as it is (and a dry read besides), so I thought it wise
to stop myself here.

There are however a few topics that still need consideration to make for a
truly great typeclass system.

First, what in Haskell are called *existentials*, basically a way to have a type
`R exists Serializable R` meaning that there exists some type X such that an
instance of `Serializable X` exists, but X is not fixed, so that variables of
type `R` can take values with different underlying types.

A value of such a type is a pair of a value and a typeclass (or potentially, a
tuple of multiple values and typeclass instances).

Most notably, existentials are necessary to implemented *heterogeneous
collections* as you can be had in most language, e.g. `List<Serializable>` in
Java. Without existentials, it's impossible to specify a list of values with
different types who happen to have a corresponding `Serializable` instance.

The second important thing is to add some mechanism that help with code reuse.
In particular, some form of delegation or late binding (e.g. Scala traits) would
be neat. Some would advocate that a benefit of type classes is to get rid of
that aspect of OO, but I disagree. The problem in OO in general is that
permissions are too open by default: non-final clases and methods in Java for
instance. As Joshua Bloch puts it in [Effective Java]: 

> Design and document for inheritance or else prohibit it.

[Effective Java]: https://books.google.be/books/about/Effective_Java.html?id=ka2VUBqHiWkC&redir_esc=y

Well done late binding is effectively a clean way to specify callbacks,
potentially with a default behaviour in place. These callbacks may themselves
call inside the late bound entity (class or typeclass). Effectively, this saves
a lot of plumbing headaches.

There are a couple more things that could go in, but they aren't as essential.

One particular nicety I can think of is a mechanism for type unions. Not only
boring unions (like `int | String` to specify you expect either an integer or a
string), but also being able to specify a type `R` such that there is either an
instance of `Serializable R` or an instance of `Stringifyable R` (or both!).
Similar types intersection are already possible, just by putting multiple
constraints on a type.

These type unions make some [ad-hoc polymorphism] possible, and would be further
well served by some form of pattern matching and [flow typing].

But all this will have to wait for another day!

[ad-hoc polymorphism]: /polymorphism/#ad-hoc-polymorphism
[flow typing]: https://en.wikipedia.org/wiki/Flow-sensitive_typing
