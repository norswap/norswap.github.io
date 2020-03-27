---
layout: post
title: "The Visitor Pattern in Java 8"
---

The visitor pattern is probably one of the most (in)famous design patterns.

The problem it solves is fairly simple. In most object-oriented languages, it's
easy to add new *data-type variants*, i.e. new sub-classes. These classes can
naturally override the methods in the super-class/interface. However, we can't
add methods to an existing super-class without modifying it — which is not
possible if it belongs to a library. The visitor pattern is a way to achieve
something similar.

Imagine you want to add a `print()` method to an existing interface called
`Base` that has implementations `A` and `B`. If we could add `print()` to
`Base`, we could call `new A().print()`. The visitor pattern will allow us to do
`new A().accept(new PrintVisitor())` to achieve the same thing.

For this to work, `Base` needs to have been conceived with the visitor pattern
in mind. It needs to declare an abstract `accept(Visitor)` method and all its
implementations need to implement it according to the pattern.

With this interface and requirements in mind, let's see some code.

## Basic Example

```java
interface Visitor {
    void visit (A object);
    void visit (B object);
}

interface Base {
    void accept (Visitor visitor);
}

class A implements Base {
    @Override public void accept (Visitor visitor) {
        visitor.visit(this); // calls visit(A)
    }
}

class B implements Base {
    @Override public void accept (Visitor visitor) {
        visitor.visit(this); // calls visit(B)
    }
}

class PrintVisitor implements Visitor
{
    @Override public void visit (A object) {
        System.out.println("printing an A");
    }
    @Override public void visit (B object) {
        System.out.println("printing a B");
    }
}

public class Example
{
    public static void print (Base object) {
        object.accept(new PrintVisitor());
    }
    public static void main (String[] args) {
        print(new A());
    }
}
```

What happens is that the `accept()` method declared in `Base` must be overriden
in all of its implementations (`Base` could have been a class as well). The role
of the overriden method is to redirect the execution to the correct
`Visitor#visit` overload. This is possible (and type-safe) because the static
type of `this` corresponds to its dynamic type (`A` or `B`) in the overriden
method.

And honestly, that's all there is to the common formulation of the visitor
pattern. Explanations tend to contrive the point.

However, the pattern can be taken much further to supply a solution to the
*expression problem*. Basically, what if we have our visitor defined like above
but then we add a new implementation of `Base`? Currently, all implementations
have to be known in advance, because they are hardcoded into `Visitor`.

But first, let's solve a small practical issue.

## Handling Different Signatures

There is an easily solvable issue with the design I presented above: both
`accept` and `visit` don't admit extra parameters, nor do they have return
values.

One solution is to rewrite these methods to include the required parameters and
return type. But doing this means that you need one `Visitor`-like class and one
`accept` overload for each signature of interest.

A better solution is to use the `Visitor` implementation to pass data around.
Here is an example:

```java
class AddRankVisitor extends Visitor
{
    public int result;
    public final int base;
    
    public AddRankVisitor (int base) {
        this.base = base;
    }
    
    @Override public void visit (A object) { set_result(base + 1); }
    @Override public void visit (B object) { set_result(base + 2); }
}

public class Example
{
    public static void add_rank (Base object, int base)
    {
        Visitor visitor = new AddRankVisitor(base);
        object.accept(visitor);
        return visitor.result;
    }
    
    public static void main (String[] args) {
        System.out.println(add_rank(new A(), 5)); // prints 6
    }
}
```

We use `result` to represent the return value, and `base` as a parameter. Pretty
easy, isn't it?

## The Expression Problem

The original formulation of the [expression problem] is as follow:

> The goal is to define a datatype by cases, where one can add new cases to the
> datatype and new functions over the datatype, without recompiling existing
> code, and while retaining static type safety (e.g., no casts).

[expression problem]: https://en.wikipedia.org/wiki/Expression_problem

If you consider it in the context of object-oriented programming, a *datatype*
corresponds to a parent class or interface. *New datatype cases* are new classes
extending the parent class or interface. *New functions* are as thought you
could add an abstract method to the parent class or interface, along with
overrides for the implementing classes.

Adding a new case is simply sub-classing/implementation. Adding new functions
can be done via the visitor pattern as seen above. But can we do both?

If you defined visitors as we did above, then if you add a new implementation of
`Base`, it won't be handled by our `print` and `add_rank` methods. Like we said
before, `Visitor` needs to list all the implementations.

In theory, there is nothing that prevents solving the expression problem at the
language level. In an ideal world, we'd just be able to add abstract extension
methods that have to be implemented for all classes implementing the interface.
The [linker] would then verify that these methods were implemented for all such
classes, and generate the proper [virtual method tables][vtables]. But no such
object-oriented language exists.

Perhaps a more well-understood way to do this is through statically-typed
[multi-methods]. But I don't know any actual practical language (i.e. something
used in production) that has them, though there are academic papers on the
subject. [Nim] has statically-typed multi-methods but you must include a default
implementation. [C# 4] has a `dynamic` keyword that enables multi-methods but
without compile-time checking.

[linker]: https://en.wikipedia.org/wiki/Linker_(computing)
[vtables]: https://en.wikipedia.org/wiki/Virtual_method_table
[multi-methods]: https://en.wikipedia.org/wiki/Multiple_dispatch
[Nim]: https://nim-lang.org/docs/tut2.html#object-oriented-programming-dynamic-dispatch
[C# 4]: https://blogs.msdn.microsoft.com/laurionb/2009/08/13/multimethods-in-c-4-0-with-dynamic/

There are languages that solve the expression problem however. The foremost
solution is [typeclasses], notably in Haskell (also read [here][my-typeclass]
for my thoughts on a potential typeclass system).

Basically, you can add new methods over existing types by writing new
typeclasses and their implementations for the given types. Compared to our
object-oriented scenario, there is no notion of inheritance, so no way to say
that a group of types should implement the typeclass — the expectation is that
this will be caught statically when you try to require a typeclass
implementation for such a type.

[typeclasses]: https://en.wikipedia.org/wiki/Type_class
[my-typeclass]: /typeclass-scheme

But back to Java-land. Let's see how we can approach a solution by building on
top of the visitor pattern.

## Adding a Class to an Existing Visitor

Let's add a new implementation of `Base` called `C`.

```java
interface VisitorC extends Visitor {
    void visit (C object);
}

class C implements Base {
    @Override public void accept (Visitor visitor) {
        ((VisitorC) visitor).visit(this);
    }
}

class PrintVisitorC extends PrintVisitor implements VisitorC {
    @Override public void visit (C object) {
        System.out.println("printing a C");
    }
}

class AddRankVisitorC extends AddRankVisitor implements VisitorC
{
    public AddRankVisitorC (int base) { super(base); }
    @Override public void visit (C object) { set_result(base + 3); }
}

public class Example
{
    public static void print (Base object) {
        object.accept(new PrintVisitorC());
    }
    
    public static void add_rank (Base object, int base)
    {
        VisitorC visitor = new AddRankVisitorC(base);
        object.accept(visitor);
        return visitor.result;
    }
    
    public static void main (String[] args) {
        print(new A());
        print(new C());
        System.out.println(add_rank(new A(), 5)); // prints 6
        System.out.println(add_rank(new C(), 5)); // prints 8
    }
}
```

Since `Visitor` doesn't have an overload for `C`, we add this overload in an
extension of `Visitor` called `VisitorC`. The only worry: `accept` takes
`Visitor`, not `VisitorC`, so we have to perform a cast.

We similarly extends `PrintVisitor` and `AddRankVisitor` to add an
implementation for the `visit(C)` overload.

Also notice how we do not need to reimplement the storage for `AddRankVisitorC`
if we extend `AddRankVisitor`.

The trick works: we can use a `PrintVisitorC` and `AddRankVisitorC` to visit
both the previous `A` and `B` classes but also the new `C` class.

In the process however, we've jeopardized type safety. We could write: `new
C().accept(new PrintVisitor())` and the code would compile but crash at run-time
with a `ClassCastException`.

There actually is a pretty rich literature on how to solve the expression
problem in Java with proper statical type safety. So it *is* possible. However,
all these solutions have other pitfalls (in my humble opinion, worse pitfalls).
A followup article will discuss the limitations of these solutions and why I
feel my solution is better.

But before... we are not entirely done yet!

## Composing Independent Extensions

The last section deals with extending our system with a new class. But what if
you use two libraries, both of which have independently extended the visitor.
Can you compose them back into a single usable visitor?

If the library authors have followed a couple of simple guidlines, you can!

The key idea is as follow: each time we implement / extend a visitor, we will do
it in an interface instead of a class. We will add a corresponding class only to
make the interface instanciable and supply the necessary storage.

With that in mind, let us revise what we have done above. First for what we had
before adding `C`:

```java
interface _PrintVisitor extends Visitor
{
    @Override default void visit (A object) {
        System.out.println("printing an A");
    }
    @Override default void visit (B object) {
        System.out.println("printing a B");
    }
}

class PrintVisitor implements _PrintVisitor {}
```

```java
interface _AddRankVisitor extends Visitor
{
    int result();
    void set_result (int result);
    int base();
    
    @Override default void visit (A object) { set_result(base() + 1); }
    @Override default void visit (B object) { set_result(base() + 2); }
}

class AddRankVisitor implements _AddRankVisitor
{
    private int result;
    private int base;
    
    @Override public int result() { return result; }
    
    @Override public void set_result (int result) {
        this.result = result;
    }
    
    @Override int base() { return base; }
    
    public AddRankVisitor (int base) {
        this.base = base;
    }
}
```

For `PrintVisitor`, the class becomes an interface with a prefix `_` and we add
a class with an empty body — no extra work required.

For `AddRankVisitor`, our fields are replaced with getter/setters in the
interface and we have to implement the storage for those in the class.

Notice that with this setup, our former `Example.main` methods (from before
adding `C`) still work unmodified.

Let's then add back `C`, which will constitute the first of two independent
extensions:

```java
// `VisitorC` and `C` remain unchanged from above!

interface _PrintVisitorC extends _PrintVisitor, VisitorC
{
    @Override default void visit (C object) {
        System.out.println("printing a C");
    }
}

class PrintVisitorC implements _PrintVisitorC {}

interface _AddRankVisitorC extends AddRankVisitor, VisitorC
{
    @Override default void visit (C object) { set_result(base + 3); }
}

class AddRankVisitorC extends AddRankVistor
    implements _AddRankVisitorC
{
    public AddRankVisitorC (int base) { super(base); }
}
```

This is a lot like what we just did for the base visitors. Like before, we don't
need to reimplement the storage for `AddRankVisitorC` if we extend
`AddRankVisitor`.

Let's do another similar extension, called `D`. This is almost the same code by
a different name:

```java
interface VisitorD extends Visitor {
    void visit (D object);
}

class D implements Base
{
    @Override public void accept (Visitor visitor) {
        ((VisitorD) visitor).visit(this);
    }
}

interface _PrintVisitorD extends _PrintVisitor, VisitorD
{
    @Override default void visit (D object) {
        System.out.println("printing a D");
    }
}

class PrintVisitorD implements _PrintVisitorD {}

interface _AddRankVisitorD extends AddRankVisitor, VisitorD
{
    @Override default void visit (D object) { set_result(base + 4); }
}

class AddRankVisitorD extends AddRankVistor
    implements _AddRankVisitorD
{
    public AddRankVisitorD (int base) { super(base); }
}
```

Now that we have our two independant extensions setup properly with interfaces,
let's compose them into a single one.

```java
interface VisitorCD
    extends VisitorC, VisitorD {}

interface _PrintVisitorCD
    extends VisitorCD, _PrintVisitorC, _PrintVisitorD {}

class PrintVisitorCD
    implements _PrintVisitorCD {}

interface _AddRankVisitorCD
    extends VisitorCD, _AddRankVisitorC, _AddRankVisitorD {}

class AddRankVisitorCD extends AddRankVistor
    implements _AddRankVisitorCD
{
    public AddRankVisitorCD (int base) { super(base); }
}

public class Example
{
    public static void print (Base object) {
        object.accept(new PrintVisitorCD());
    }
    
    public static void add_rank (Base object, int base)
    {
        VisitorCD visitor = new AddRankVisitorCD(base);
        object.accept(visitor);
        return visitor.result;
    }
    
    public static void main (String[] args) {
        print(new A());
        print(new C());
        print(new D());
        System.out.println(add_rank(new A(), 5)); // prints 6
        System.out.println(add_rank(new C(), 5)); // prints 8
        System.out.println(add_rank(new D(), 5)); // prints 9
    }
}
```

That's it? Yep that's it! And that's actually the long version — which you
should use when you expose the visitor as part of a library. Even then
`VisitorCD` is not capital and just helps add a tiny bit of type safety.

If you write client code and nobody is supposed to extend your visitor, you
could just write:

```java
class PrintVisitorCD
    implements _PrintVisitorC, _PrintVisitorD {}

class AddRankVisitorCD
    extends AddRankVisitor
    implements, _AddRankVisitorC, _AddRankVisitorD
{
    public AddRankVisitorCD (int base) { super(base); }
}
```

Isn't life beautiful?

You can consult the full final example (with `A`, `B`, `C`, `D`, `PrintVisitor`
and `AddRankVisitor`) on [this page].

[this page]: https://gist.github.com/norswap/7f3d40adb85491d440bdf026b738890a
