---
layout: post
title: "Language Design Notes 0: A Map of Polymorphism"
---

This is the first post in [a series] where I write my thoughts on some aspects
of language design. This first installment will deal with polymorphism, what it
is, and how it manifests in its three main forms, which we review below.

[a series]: /language-design-notes

## Ad-Hoc Polymorphism

Basically polymorphism has to do with the ability to reuse the same code for
different types of values.

Dynamically-typed languages are very polymorphic, since any storage location
(variable, field) can hold any value.

Functions in dynamically-typed language exhibit **ad-hoc polymorphism**, which
is to say that functions may work even when supplied arguments of different
types.

Sometimes you just don't need to know the type of a value. If you're just going
to store it in a collection, for instance.

But sometimes it's ultimately necessary to separate the behaviour for different
types. This is done either through another kind of polymorphism (often
*subtyping polymorphism*), or by checking the type explicitly and branching out
in different execution path on that basis. For instance:

```
def foo(x):
    if type(x) is Bar:
        foo_bar(x)
    elif type(x) is Baz:
        foo_baz(x)
    else
        raise TypeError("x is neither Bar nor Baz")
```

Some people also say that *overloading* in statically-typed languages (having
multiple functions with the same name, but differing in the type of their
arguments) counts as polymorphism. I'm not anal about definitions, but
overloading isn't what I'm talking about here.

The problem is that (unlike every other types of "polymorphism"), overloading
doesn't compose. The specific overload that gets called must be determined
statically. As such the type must be fully determined — we can't use a type
parameter (cf. *parametric polymorphism*) and the specific subtype (cf.
*subtyping polymorphism*) isn't taken into account.

Basically, you can never reuse code that calls an overloaded function for
multiple types. Overloading is ultimately just a naming convenience: you could
give each overload its own name and nothing would change. (There is an exception
to that rule, see the discussion of C++ templates below.)

Nevertheless, ad-hoc polymorphism can also appear in statically typed languages,
either via a super type (e.g. `Object` in Java, but any shared super type will
do) or some other wildcard type that is cast-compatible with the others (e.g.
`void *` in C). Using these types essentially brings us back to a "dynamically
typed" scenario, except we can't directly call functions we know exist: we have
to cast the values to their proper types first.

In statically-typed languages, [flow typing] and union types (e.g. in
[Ceylon][ceylon-union] or [Scala][scala-union]) can help make ad-hoc
polymorphism more palatable.

[flow typing]: https://en.wikipedia.org/wiki/Flow-sensitive_typing
[ceylon-union]: https://ceylon-lang.org/documentation/1.3/tour/types/
[scala-union]: http://dotty.epfl.ch/docs/reference/new-types/union-types.html
        
## Subtyping/Inclusion Polymorphism

Another popular type of polymorphism is **subtyping (or inclusion)
polymorphism**. This is your standard object-oriented class and sub-class
scenario, but also includes things like interface implementations, traits, etc.

This one works for both dynamically- and statically-typed languages. It's
straightforward in statically-typed languages: you put a type on a parameter,
and the function can also accept any argument that is a subtype of that type.

Dynamically-typed languages of the OO variety also have inheritance, but in that
case I'm not sure if it should be considered as subtyping or ad-hoc polymorphism
(and it matters little). The thing is that you can have OO polymorphism without
even sharing a superclass. A function can call a method on an object, and has
long as the object does implement a method by that name, it will work.

Said otherwise, the interfaces can be left implicit, the following method is
polymorphic for any object that has both a `bar()` and `baz()` method.

```
def foo(x):
    x.bar()
    x.baz()
```

## Parametric Polymorphism

Finally, last of the big three, we have **parametric polymorphism**. There are a
few famous examples of that: generics in Java and C#, templates in C++.
Basically you endow bits of code (typically functions and data structures) with
type parameters that allow specializing the code for the given type.

At its most basic, parametric polymorphism for functions is the equivalent of
ad-hoc polymorphism for statically-typed languages: it allows you to call the
same code with values different types, but also preserves the specific type
being used.

Since the parametrized code must range over multiple types, the available
information is limited. At worse, you know nothing, but you can also have a
[type bound] that gives a common supertype (if also using *subtyping
polymorphism*) or some other information that constraint the valid type
arguments.

[type bound]: https://docs.oracle.com/javase/tutorial/java/generics/bounded.html

So, like ad-hoc polymorphism, if you ultimately want to do something specific to
the actual type, you either have to perform a cast, or rely on subtyping polymorphism.

We can further distinguish different realization of parametric polymorphism.
With Java and C# generics, the same (binary) code is used regardless of the
actual type arguments being used. In C++ templates, the code is automatically
duplicated and specialized for the specific type arguments. This has both pros
and cons. While Java/C# are limited to accepting object types (i.e. pointers) as
type arguments, C++ can accept any pointer, structure or primitive type — even
if they have different size in memory. The downside is that all the duplication
can bloat the binary size, something significantly so.

C++ templates are essentially a form of (turing-complete!) macro-expansion. They
are compiled using something called "two phase lookup". The template definition
is checked for basic syntactic errors, but the check for the existence of the
function calls in the template only occurs when the template is instantiated for
particular type arguments. An interesting consequence of this is that templates
can "redeem" overloading: the same source code can now call different overloads
by virtue of being specialized automatically by C++.

And by the way, yes, C macros can also be regarded as polymorphism. They can
redeem overloading in the same way as templates, though C doesn't have
overloading — but that can be papered over by using the [`typeof` GCC
extension]. A big difference is that C macros cannot be called automatically —
if you write a specializable function with it, you'll have to instantiated it
yourself for any type you want to use it with! More advanced types of macros
(e.g. Lisp macros) may take things even further.

[`typeof` GCC extension]: http://gcc.gnu.org/onlinedocs/gcc/Typeof.html

Java and C# generics also differ in one different respect: the erasure or
reification of type arguments. C# actually makes the type arguments available to
the user code, which can use it to perform type checks, type casts, type
reflection... Type arguments are essentially converted to additional arguments
of the generic function. Java, on the other hand, *erases* the type arguments
form the bytecode it generates, so the aforementioned use cases are not
possible.

Downsides of reified generics? Apparently, performance. It's hard to find a good
analysis of that claim, but Gilad Bracha [made it][reified-slow] based on his
work on the Dart VM, and I'm inclined to believe it. Still the statement isn't
qualified: how bad is it, really?

[reified-slow]: https://gbracha.blogspot.com/2018/10/reified-generics-search-for-cure.html
