---
layout: post
title: "The Expression Problem in Java (Litterature Review)"
---

<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/themes/prism.css" rel="stylesheet" />

<!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/themes/prism-tomorrow.min.css" rel="stylesheet" /> -->

Previously: [The Visitor Pattern in Java 8][visitor_java]

[visitor_java]: /java-visitor-pattern

[Last time][visitor_java] I presented a way to implement the visitor pattern, by
taking advantage of Java 8's `default` interface methods.

In the process I said this was a partial solution to the [expression problem],
which was defined as:

> The goal is to define a datatype by cases, where one can add new cases to the
> datatype and new functions over the datatype, without recompiling existing
> code, and while retaining static type safety (e.g., no casts).

[expression problem]: https://en.wikipedia.org/wiki/Expression_problem

Recall that in the context of Java, we can think of a *datatype* as an interface
or parent class, and of a *case* as a class implementing/extending the interface
or parent. When using this interpretation we will call the *cases* "*data
classes*", which is a bit less awkward.

On the other hand, some of the papers we will review will take another
interpretation in order to produce an interesting solution.

The solution I presented last time is partial, because it is not strictly
type-safe: it uses a cast.

Today, I want to look at the solutions that have been proposed in the
litterature, and try to extract their guiding insights, and show their
respective strengths and shortcomings.

## The Contenders

While the litterature on the expression problem in Java-like object-oriented
languages is surprisingly rich, I want to focus specifically on three papers
which I think covers the space of interesting solutions:

- **The Expression Problem Revisited: Four new solutions using generics**, Mads
  Torgersen, *ECOOP 2004* [\[link with pdf\]][mads]

- **Extensibility for the Masses: Practical Extensibility with Object
  Algebras**, Bruno C. d. S. Oliveira & William R. Cook, *ECOOP 2012* [\[link with pdf\]][algebra]

- **The expression problem, trivially!**, Yanlin Wang & Bruno C. d. S. Oliveira,
  *Modularity 2016*, [\[pdf\]][trivially]

[mads]: http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.85.2323
[algebra]: https://i.cs.hku.hk/~bruno/oa/
[trivially]: https://i.cs.hku.hk/~bruno/papers/Modularity2016.pdf

Since the first paper actually presents four solutions, that gives us 6
solutions to review. I'll also throw my partial solution into the mix for
comparison's sake.

## The Problem's Raison d'Être: Ambiguous Call Sites

For the expression problem to be interesting *at all*, it has to involve
ambiguous call sites: the same piece of code has to perform a method call which
could be dispatched to a specialized method for any of datatype cases.

Said otherwise, if every piece of code is statically typed and doesn't involve
any kind of [polymorphism] (e.g. inheritance or generics), then plain static
overloading is enough, and you don't have a *problem* in the first place.

[polymorphism]: /polymorphism/

Therefore, to build a type-safe solution to the expression problem, two big
avenues are open.

The first one has to be built into the compiler: the compiler will check that
implementations of operations (which can be added by anyone, not just the
original author of the datatype) exist for every data class. But this doesn't
seem to exist. I said as much in [the previous post][visitor_java]:

> In theory, there is nothing that prevents solving the expression problem at
> the language level. In an ideal world, we'd just be able to add abstract
> extension methods that have to be implemented for all classes implementing the
> interface. The linker would then verify that these methods were implemented
> for all such classes, and generate the proper virtual method tables. But no
> such object-oriented language exists.

The second avenue is to somehow *carry* the specialized implementation to the
call sites. This is what every solution in the litterature does, each in its own
way.

That is also how [typeclasses] work in Haskell. In this case, it's the typeclass
instances that carry the operation's implementation to the call site.

[typeclasses]: https://en.wikipedia.org/wiki/Type_class

In light of this, the statement of the expression problem is somewhat
problematic, because it doesn't specify which shape the ambiguous call sites can
take.

But I can think of two very interesting examples.

The first one is to apply one of the specialized methods on a list of data class
instances, *whose exact type is not known* (said otherwise, which just know they
are instances of the datatype).

Sadly, no type-safe solution in the litterature can do that. Our solution can,
but again, it isn't type safe.

Interestingly, Haskell can do this only if using a compiler extension
introducing [existential types]. An existential type is basically just a pair of
a type and its associated typeclass instance for a given typeclass. The
existential type just says "here is an instance of *something* that has an
instance for the given typeclass". Then you have to use a list of
existentially-typed values — which crucially you mean you can't reuse a
pre-existing list that isn't existentially-typed. There has to be a way to
(statically) retrieve the correct typeclass instance when constructing the list.

[existential types]: https://wiki.haskell.org/Existential_type

The second example is, fortunately, the one that is always used as a benchmark
in the litterature: a tree structure where each node is a data class instance.

This example is easier because it is possible to inject type information while
building the tree — something that is not possible with plain lists, but is
exactly what we're doing when we're building an existentially-typed list.

## The Benchmark Problem

In particular, the typical example uses trees that represent arithmetic
expressions.

This benchmark example was there since the beginning, and is certainly partially
responsible for the name of the *expression* problem.

Our datatype is an `Exp` type.

The cases for the datatype are:

- `Lit`: an integer literal
- `Add`: addition of two expression
- `Neg`: negation of an expression — which is added as an extension

Initially, we'll have a single operation: `Print` which prints a string
representation of the expression to standard output. Later we'll add `Eval`,
which evaluates the expression.

## Norswap's Solution

To ease us into the problem, let's see a type-unsafe solution to the problem
using my formulation of the [visitor pattern][visitor_java].

- [Norswap's Solution Code][norswap-ep]

[norswap-ep]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-norswapep-java

Compared to the previous post, the solution has been simplified/crippled a
little bit for the sake of brevity and better comparison. We no longer use
*implementation interfaces*, which allow the composition of independently
developped extensions (i.e. new data classes or operations).

None of Torgersen's solutions can handle composition. This is excusable, as our
trick (using `default` methods in interfaces) wasn't available at the time the
paper was written.

## The Choice for Data-Structure Solutions

The nature of the expression problem is that each time we add a new data class,
we need to add corresponding implementations for the existing operations.
Conversely, each time we add a new operation, we need to implement it for all
existing data classes.

Unfortunately, it's not as simple as just writing them. The "compiler" solution
that neatly composes everything for us isn't available. Therefore, we will have
to take care of the plumbing ourselves.

As long as we keep one dimension fixed, everything is easy. If we have a fixed
set of operations, they can be encoded as an interface which we can just
implement. If we have a fixed set of data classes, the simple visitor pattern
suffices, and we can just implement the visitor interface to add new operations.

Things become tricky when we need to add both new operations and new data
classes.

There are fundamentally two ways to do this.

**Option 1**: replacing the data classes. Each time we add a new operation, we
need to extend all data classes so that they may handle the new operation.
Operation's implementation will live inside the data classes.

This option means we need to control/parameterize the creation of our data
structure. Whenever we add a new operation, we need to swap the classes that are
being instantiated!

**Option 2**: replacing the operations. Each time we add a new data class, we
need to extend all existing operations so that they may handle the new data
class. Operation's implementation will typically live in some kind of visitor
implementation.

This options means we need to control/parameterized the operation's call sites.
Whenever we add a new data class, we need to swap the object that holds the
operation's implementations, lest it doesn't work for the new data class.

My solution uses option 2.

## Torgersen's 1st Solution: Data-Centered

This is the first solution in the "*The Expression Problem Revisited: Four new
solutions using generics*" ([link][mads]) paper by Mads Torgersen. Discussion of
the other three solutions will follow.

This is a solution that takes *option 1* from the last section: replacing the
data classes. When adding a new operation, we subclass all existing data
classes. The code that create data strutures needs to be parameterized.

- [Torgersen's Data-Centered Solution Code][torgersen-data]

[torgersen-data]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-torgersendataep-java

There are two difficulties in this solution that not readily apparent when
*option 1* is stated briefly.

First, in order to make the solution type-safe, it is necessary to know which
operations the nodes in the expression tree implement. This means there needs to
be someway to "carry the type" to the nodes that are down in the tree.

In this solution, this is done via generics, and in particular the use of a
F-bound: `C extends Exp<C>`. F-bounds are a crude way to encode "self-types" in
Java. Basically it lets us use `C` as though it meant "the type of this class"
(or, like here, the type of one of its superclasses or superinterfaces).
However, to use an F-bound, you need to "fix" `C`. This is the role of all the
classes whose name end with `F`, such as `class LitF extends Lit<ExpF>
implements ExpF`. Unfortunately, that makes the solution more verbose as we need
to actually add in all of these `F` classes.

The second difficulty — which is only hinted at in the paper — is the need to
carry the node creation logic to the places where you would normally call a data
class constructor. Since there may be a lot of different types of nodes, it
makes sense to collect the creators in a factory.

The issue with that is that each time you add a new data case you need to extend
the existing factory. Each time you add a new operation, you not only need to
extend every data class, but also to create a whole new factory that return
instances of these new classes.

So this works, but it's quite verbose and it's relatively annoying that we
actually need to change the data classes being used when we add new operations.

## Torgersen's 2nd Solution: Operation-Centered

This solution takes *option 2* outlined above. Each time we add a new data
class, we need to extend all existing operations so that they may handle the new
data class. Operation's implementation live in a visitor implementation.

This is also what my own solution does, I will explain the difference below.

- [Torgersen's Operation-Centered Solution Code][torgersen-op]

[torgersen-op]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-torgersenoperationep-java

However, there is a big pitfall that comes from the need to be type-safe. For
the initial data classes, there are no issues. But when a new data class is
added, it is necessary to add a new visitor interface. This is as expected.

However, each data class instance has to know the requirements on the visitors
it can handle. To use our previous examples, a `Neg` node can only handle
visitors that implement `NegVisitor`.

But it doesn't stop there. If an `Add` node has a `Neg` child, it too should
only accept visitors that implement `NegVisitor` — since they can invoke the
visitor on their children.

Again, generics come to the rescue: we parameterize all data classes with `<V
extends Visitor>` (for the initial data classes) or `<V extends NegVisitor>`
(for `Neg` — same principle would apply if we added new data classes).

This doesn't entirely fix the problem. In the `visit` methods, it wouldnt work
to call, for instance, `add.left.accept(this)`. Why? Because there is no
guarantee that `this` has type `V`.

Torgersen comes up with a really neat trick to solve this issue, which is to let
the visitor accept itself as an extra parameter of type `V`. This parameter will
be supplied by the `accept` methods: `visitor.visit(visitor, this)` (where
`this` is a an instance of a data class such as `Add<V>`). Since `visitor` has
type `V` there, this type-checks ok.

The cost? Once again, we can't reuse our expression trees. They now have to be
parameterized differently depending on added data classes. So creation logic has
to be parameterized by the proper visitor interface (note you can't really see
this is our simplistic demo code). At least, we don't need verbose factories
this time.

## Torgersen's 3rd Solution: Operation-Centered with Object-Level Extensibility

This solution is an extension of the second solution. The goal is to relax the
requirement on the control of all instantiation sites.

- [Torgersen's Operation-Centered with Object-Level Extensibility Solution Code][torgersen-op2]

[torgersen-op2]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-torgersenoperationep-java

From the perspective of the previous solution, the goal here is to make it
possible to reuse old `Add<Visitor>` and `Lit<Visitor>` trees that were
instantiated without knowing that `Neg` existed. These node will still work if
passed a `NegVisitor` (which extends `Visitor`)!

The author calls this ability to reuse old trees *object-level extensibility*.

And since the old trees were created before we added `Neg`, they couldn't
contain `Neg` nodes, and so using plain `Visitor` implementations is fine as
well.

Achieving object-level extensibility is actually pretty easy. In the data
classes, just change the node's children type to `Exp<? super V>`. Without
entering into the details, this means that `Add<NegVisitor>` may have children
that with type `Exp<Visitor>` or `Exp<NegVisitor>`. On the other hand
`Add<Visitor>` may not have a child of type `Exp<NegVisitor>`

This effectively enables reusing old trees in newer trees.

There is only one catch: your ability to rewrite the trees becomes limited.
Since `Add<Visitor>` may not have children of type `Exp<NegVisitor>` this may
hamper your ability to write involved tree rewrite logic that would need to
assign a newer tree as a child of an older tree.

However, as the author correctly notes, there are plenty of use-cases (maybe
even most of them) that do not involve such kind of tree rewriting.

If type-safety is a must-have for you and you don't need tree rewrites, this is
pretty good. You'll still pay a cost of sorts by having to carry these annoyings
type parameters everywhere.

## Torgersen's 4th Solution: Type-Unsafe Hybrid

This one is interesting too.

- [Torgersen's Hybrid Solution][torgersen-ep]
- [Torgersen's Hybrid Solution, Without Generics][torgersen-better-ep]

[torgersen-ep]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-torgersenhybridep-java
[torgersen-better-ep]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-torgersenbetterhybridep-java

Torgersen starts from the an operation-centered visitor solution (much like his
second solution) but pairs each operation (i.e. visitor implementation) with an
interface that defines the signature of the operation. Data classes can choose
to implement this interface. If they do so, the operation will notice (via an
`instanceof` check) and call the implementation — otherwise it falls back on the
visitor pattern.

The solution isn't type-safe because Torgersen opts not to force the children of
each data class node to encode their visitor interface. So instead of being
typed as `Exp<V>` or `Exp<? extends V>` as in solution 2 and 3 respectively,
they are simply typed as `Exp`.

The payload of foregoing type-safety here is that control over the creation
logic is no longer necessary. You can finally have data classes whose types and
implementations don't change depending on subsequent extensions. In that, it is
similar to my solution.

If you know in advance all operations you need to implement, you can also avoid
extending existing operations when you introduce a new data class, by having the
data class implement the operations' associated interfaces.

Because the lack of type safety, when an expression accepts a visitor, it must
verify that this visitor actually can handle the expression's data class or fall
back on some general behaviour (at worse, throw a runtime exception, which is
what my solution does).

To make all of this work, the solution involves some helper super-classes, which
can be slightly confusing.

I'd also argue that the most use of generics in this solution is woefully
unecessary — it just saves on inlining two lines of logic into every visitor,
which you sort of have to do *anyway* because Java doesn't support `instanceof`
on generic type arguments (which are [erased]). Hence I made a [simplified
solution][torgersen-better-ep] that eliminates non-essential generics use, and
simplifies the scaffolding considerably, making it **much** easier to
understand, in my humble opinion.

[erased]: https://www.baeldung.com/java-type-erasure

Compared to my solution, this one is more complicated, but has the important
benefit that data classes can be added without extending all operations
individually, greatly reducing verbosity in that scenario.

## Object Algebras

We now discussion the solution from the "Extensibility for the Masses: Practical
Extensibility with Object Algebras" paper ([link][algebra]). This one is quite
different from those we discussed previously, and conforms to neither of our two
options — because it doesn't encode data as a data structure at all!

Instead, data is encoded as a tree of method calls. Here is an example:

```java
interface Algebra<E> {
    E lit (int value);
    E add (E left, E right);
}

public static <E> E expression (Algebra<E> a) {
    return a.add(a.lit(1), a.lit(2)); // 1 + 2
}
```

The `expression` method encodes the expression tree `1 + 2` made of an "add
node" with two "literal node" child. Of course, there are no such nodes — it's
just a method!

To do anything useful with `expression`, we need to supply an `Algebra<E>` where
`E` is an (unconstrainted) type used to represent the result of an operation on
one of our "nodes". So for instance, `a.lit(1)` will return a value of type `E`.
The `add` method returns a value of type `E`, but also takes as parameter two
values of type `E`, corresponding to the result of "evaluating" its two
operands.

To define an operation, we need to implement `Algebra<E>`. Here is a full
implementation that uses the same example as previously:

- [Object Algebra Solution][algebra-sol]

[algebra-sol]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-objectalgebraep-java

So there our operations are printing and evaluation. We actually use two
different techniques for these two operations.

In the case of `PrintAlgebra`, we implement `Algebra<Print>` where `Print` is a
functional interface we defined with a `print()` method. Therefore, calling
`expression(new PrintAlgebra())` will return an object that can be used to print
the expression.

This is not the most direct avenue — we could have opted to implement
`Algebra<String>` instead and have `lit` and `add` return their string
representation directly. In fact, we take this approach with `EvalAlgebra` which
implements `Algebra<Integer>` — there, `lit` and `add` directly return the
integer they evaluate to.

Finally, a really neat trick not mentionned in the paper is that we can build an
actual data structure from the functional encoding. For this, simply make an
algebra that implements `Algebra<Exp>` or `NegAlgebra<Exp>` (depending on your
needs, and assuming `Exp` is the parent class) and have each method return the
node it corresponds to.

Turning these data structures back into an algebra encoding is unfortunately not
possible. One could imagine that `Exp` has a `E visit(Algebra<E>)` method that
is overriden in data classes to simply call the corresponding algebra method.
The problem happens when you have introduced new data cases. If you added a
`neg` method in `NegAlgebra<E>`, now you need the signature to be `E
visit(NegAlgebra<E>)`. This is *almost* feasible, supposing we could
parameterize `Exp` as follow: `Exp<A extends Algebra>` and then define the
method `E visit (A<E>)`. Unfortunately that would make `A` a [higher-order type]
(i.e. a type that takes a parameter, here `E`) and Java doesn't have those.

[higher-order type]: https://en.wikipedia.org/wiki/Type_constructor

Of course, you could just use `Algebra<E>` as a bound and add a cast in there,
type-unsafe but effective.

When dealing with object algebra, one may be concerned that it's no longer
possible to "build a data structure dynamically", i.e. that all data must be
statically defined like in our `expression` method.

That is fortunately not the case. Since the algebra encoding of an expression is
just method calls, any execution flow that calls algebra methods can yield
expressions. And execution can contain conditions, loops, etc. One potential
pitfall is that the whole construction logic needs to be re-run each time we
want to run an operation of our data. If the construction logic is expensive,
this can be a problem. Fortunately there is a solution: simply return a function
object that encodes the expression:

```java
public E expr1 (NegAlgebra<E> a) {
    return expensive_predicate()
        ? a.add(a.lit(1), a.lit(2))
        : a.add(a.lit(1), a.neg(a.lit(2)));
}

// use: expr1(my_algebra);
// slow!

public E Function<NegAlgebra<E>, E> expr2() {
    return expensive_predicate()
        ? a -> a.add(a.lit(1), a.lit(2))
        : a -> a.add(a.lit(1), a.neg(a.lit(2)));
}

// use: expr2.apply(my_algebra);
// fast!
```

When we pass an algebra to `expr2`, `expensive_predicate()` is not run — it is
only run once when the `expr2` is created.

Finally, object algebra make "tree reuse" easy. You can compose an expression
built with an `Algebra<E>` and one built with a `NegAlgebra<E>` pretty easily:
the trick is that they only interface using `E`, so as long as `E` is the same,
anything goes. Of course, this means you have to use *compatible* algebras. It
could be argued that is not type-safe (or that it is another advantage): nothing
prevents you from using two algebra with different semantics together, passing
the result of one to the other... as long as `E` is the same.

The paper mentions other interesting possibilities: multi-parameter algebra
(mimicking [type families]), combinators for automatic combination of multiple
algebra, as well as allowing extension of the `E` parameter (e.g. `Eval<E
extends Number> implements Algebra<E>`), ...

[type families]: https://en.wikipedia.org/wiki/Type_family

There is a lot to like about object algebra, it's a really elegant technique —
in fact it's the shortest implementation, and one of the most readable. It has
many advantages, from the possibility of building a real data structure to "tree
reuse". Perhaps its main weakness is being a bit *too* alien to be integrated in
many code bases, where one will *need* to have actual data structures. For
instance, in my [Autumn] parsing library, the parser combinators can't be
canonically represented as function calls — while it is possible to implement
parsing that way (by using objects similar to `Print` in our example), it would
be incredibly slow. However it is possible to use an object algebra to build the
parser combinator graph, and to reuse the encoding for visiting it. However,
this is only possible because this graph is immutable (and so will always stay
in sync with its functional encoding).

It's definitely a technique to keep in the back of your mind.

[Autumn]: https://github.com/norswap/autumn

## Covariant Return Types

Finally, we look at our last solution, from the paper "The Expression Problem,
Trivially!" ([link][trivially]).

This solution is very very close to Torgersen's [first (data-driven) solution][torgersen-data],
but the essential differences between both is that this solution foregoes the
use of generics in favor of covariant return types. What are covariant return
types? In Java, you can override a method by a method with a different return
type, but only if that type is a subtype of the original return type, for
instance:

```java
abstract class A {
    abstract Object foo();
}

abstract class B extends A {
    @Override String foo();
}
```

This works because `String` is a subclass of `Object`. And if you didn't know,
yes you can override an abstract method without implementing it — that's an
essential feature needed in the covariant solution.

Let's have a look at the solution:

- [Covariant Return Type Solution][covariant-sol]

[covariant-sol]: https://gist.github.com/norswap/9d4dd9ae5c0fd2ef652a1f41778467ea#file-covariantep-java

Whereas Torgersen's solution encodes the expression type as an F-shape bounded
generic type parameter (`C extends Exp<C>`), and subsequently types children
using this type (e.g. `C left, right;` in the `Add` class; the covariant
solution defines the children as abstract method whose return type is `Exp`.

Both solution need a "fix class": in Torgersen's solution, the class fixes `C`:
`AddF extends Add<ExpF>` and later `EvalAddF extends EvalAdd<EvalExpF>`. In the
covariant solution, the methods are overriden with the actual expression type:
simply `Exp` in the base case, but `EvalExp` in the "eval" extension.

This is rather neat, and absent some issue I didn't think of, seems strictly
superior Torgersen's solution. It does however come with that solution's other
pitfalls, including the need to parameterize the construction logic. You'll note
we didn't include factories in our code for this solution, but we did in
Torgersen's solution. Don't let this fool you: they are equally needed (or can
equally be dispensed with) in both cases.

## Discussion & Recommendations

I came out of this article having learned a lot more than I expected going in.
The impetus for this article was that I couldn't clearly articulate how the
different solutions worked and how they related to each other.

I also wanted to make the point that they were needlessly complex and that my
solution was better. Having done the research, I wouldn't say that this is
necessarily true. Hence the little discussion now to be had about what should be
used when.

First off, you should try to determine your requirements as precisely as
possible. In particular:

- Do you need strict type safety? How do you define that? (What is not allowed
  to happen?)
- Do you care about independent extensibility: if two different developers
  extend the base framework and redistribute their exensions, can a third
  developer come along and compose their extensions without resorting to
  modifying the code written by the two first developers?
- Who is going to use the solution? What is its area of surface?

With that in mind...

First off, if you care about independent extensibility, you have no choice but
to use my solution. The others *might* be modified to accomodate it, by using
Java 8's `default` interface methods — but you'll have to figure that yourself.
Do keep in mind that this aspect of it wasn't shown in [the example
code][norswap-ep] but is explained in [the previous post][visitor_java].

Beware that independent extensibility does add a lot of boilerplate, and likely
will in other solutions too. And remember my solution isn't type-safe.

If you need perfect type safety (do you really?) **and** you're using immutable
trees, I would go for Torgensen's 3rd solution (operation-centered with
object-level extensibility).

In general, I would try to think hard about whether object algebras can be used
in your use case. In a sense, they're the most elegant solution. One big caveat:
I would think twice about using them to build a data structure — now you have
two representations to keep in sync, and double duties.

In general, I feel like the sweet spot for them is either small localized
things, or a central paradigm around which everything revolves. I'd be uneasy
about making an object algebra one of many big moving parts in a program. My
programmer's intuition say this way lay clunky mixed-metaphors.

I would avoid using the data-centered solutions (Torgersen's 1st and the
covariant solution) **unless** object instantiation is very tightly controlled
or centralized in your program. Playing with factories is not super fun.

A few more observations:

My solution and Torgersen's 4th (hybrid) solution are pretty much tied. Mine is
guaranteed to work with independent extensibility (with the proper boilerplate),
but Torgersen's will also work fairly often. But for instance, it won't work if
two people introduce new data classes and implement an old visitor for these
classes — there is no easy/safe way to "merge" the two implementations. However,
it would more natural to implement the operations directly into the data class
in this case! Torgersen's solution can also lead to less boilerplate in the case
where you never have to deal with independent extensibility.

The covariant solution strictly dominates Torgersen's 1st (data-centered)
solution.
