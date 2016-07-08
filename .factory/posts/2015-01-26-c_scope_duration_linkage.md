---
layout: post
title: "C: Scope, Duration & Linkage"
---

<a name="intro"></a>

This article explains the concepts of scope, linkage and duration (aka lifetime)
in the C programming language. It also explains how scope, linkage and duration
are determined for each function or variable declaration, depending on its
location in the file and its storage class specifier (`extern`, `static`, etc).

In what follows we will use the term "object" to mean "function or variable".
The terminology is used by the C standard and avoids tedious repetitions. When
we say "declaration", we always mean "object declaration", since types have
declarations as well. An "identifier" is just a name; e.g., a variable name.

The **scope** of a declaration is the part of the code where the declaration is
seen and can be used.

Note that this says nothing about whether the object associated to the
declaration can be accessed from some other part of the code via another
declaration!

We uniquely identify an object by its memory: the storage for a variable or the
function code.

**Duration** indicates whether the object associated to the declaration persists
throughout the program's execution or whether it is allocated dynamically when
the declaration's scope is entered.

**Linkage** is what determines if multiple declarations of the same object refer
to the same object, or to separate ones.

As you might suspect, the three notions are closely inter-related. Let's try to
untangle them.

# Scope
<a name="scope"></a>

C features four scopes:

- block scope
- function scope
- function prototype scope
- file scope

Every variable or function declaration that appears inside a block (including a
function body) has **block scope**. The scope goes from the declaration to the end
of the innermost block in which the declaration appears.

Function parameter declarations in function definitions (but not in prototypes)
also have block scope. The scope of a parameter declaration therefore includes
the parameter declarations that appear after it.

**Function scope** is a bit special: it is the scope of goto labels. Goto labels are
implicitly declared at the place where they appears, but they are visible
throughout the function, even if they appear inside a block.

Note that goto labels have a different namespace than objects, meaning you can
have goto labels and objects using the same identifier without incurring any
problems.

**Function prototype scope** is the scope for function parameters that appear inside
a function prototype. It extends until the end of the prototype. This scope
exists to ensure that function parameters have distinct names.

All variables and functions defined outside functions have **file scope**. They are
visible from their declaration until the end of the file. Here, the term "file"
should be understood as the source file being compiled, after all includes have
been resolved.

<div class="nsep"></div>

The other two concepts (duration and linkage) are only relevant to declarations
that have block scope or file scope. We will ignore the two other kinds of scope
from now on.

Finally, note that a declaration in a nested scope can hide a declaration in an
outer scope; but only if one of the two has no linkage. Most compilers have
warning flags to warn you when this kind of hiding occurs, as it can be
error-prone.

# Storage Class Specifiers

The are five storage class specifiers: `static`, `extern`, `auto`, `register`
and `typedef`. Each declaration can only have a single storage class specifier.

As you are probably well aware, `typedef` is kind of a hack, and we don't need
to concern ourselves with it for regular declarations.

## At Block Scope

The storage class specifiers `auto` and `register` are only valid for variable
declarations appearing inside functions.

`auto` cannot apply to parameter declarations. It is the default for variable
declared inside a function body, and is hence never necessary. The existence of
`auto` is rather puzzling, as is the fact that it is not allowed with
parameters. `auto` is in fact a historic leftover from C predecessor's "B".

`register` is a hint to the compiler that it might be a good idea to store the
variable in a register, but the compiler is not forced to do so. The compiler
does make sure that you do not take the address of a variable with the
`register` storage class.

Inside a function, variable declarations with the `static` storage class
specifiers keeps its value in between invocations of the function.

Variables declared inside a function with the `extern` behaves exactly like a
file-scope `extern` declaration, excepted for the difference in scope.

## At File Scope

At file scope, `extern` and `static` influence the linkage of a declaration,
according to rules that we will describe shortly.

# Duration

There are two kind of duration:

- automatic
- static

A static duration means the object associated to the declaration persists for
the whole program execution. Automatic duration means the object is allocated
dynamically when the declaration's scope is entered.

Within functions (at block-scope), declarations without `extern` or `static`
have automatic duration. Any other declaration (at file or block-scope) has
static duration.

Sometimes, people talk of **lifetime**. Strictly speaking the duration is either
automatic or static, while the lifetime refers to the portion of the execution
during which memory is reserved for the object. The distinction is moot and both
terms are often used interchangeably.

# Linkage

Remember that linkage is what determines if multiple declarations of the same
object refer to the same object (i.e., memory location), or to separate ones.

There are three kind of linkage:

- no linkage
- internal linkage
- external linkage

A declaration with no linkage is associated to an object that is not shared with
any other declaration.

In a single compilation unit, all declarations for the same object that have
linkage (so not "no linkage") must have the same linkage (either internal or
external).

Within the compilation unit, all declarations with internal linkage for the same
identifier refer to the same object.

Within the whole program, all declarations with external linkage for the same
identifier refer to the same object.

Of course, all declarations for the same object must agree on its type!

All declarations with no linkage happen at block-scope: all block-scope
declarations without the `extern` storage class specifier have no linkage.

For all other objects in the compilation units, the object has internal linkage
if there is a declaration with the `static` storage class specifier. This
declaration must happen before any `extern` declaration, and there cannot be any
declaration without storage class specifier (or a compilation error ensues).
Otherwise, it has external linkage.

# Declarations & Definitions
<a name="declarations_and_definitions"></a>

All declarations with no linkage are also definitions.

Other declarations are definitions if they have an initializer. A function body
is treated as an initializer.

A file-scope **variable** declaration without the `extern` storage class
specifier or initializer is a tentative definition.

Note that `extern` declarations can have an initializer; although it makes no
sense to do that (since dropping the `extern` specifier preserves the behaviour
and makes and clarifies intent). Some compiler warn if you try to specify both
`extern` and an initializer.

For a declared object to be defined, there must be at least one definition or
tentative definition, and not more than one non-tentative definition.

The object for a variable defined without initializer is initialized to 0 (its
memory is zeroed).

Why does this matter? To be able to use a declared object, there must be a
definition. Second, these rules ensure that an object isn't initialized
multiple times.

# Const

A small note about the `const` qualifier (not the same thing as a storage class
specifier). Using `const` does not influence scope, duration or linkage in C. In
C++ however, declaration with `const` at the "top-level" (the outermost pointer,
or the whole variable if there's no pointer) have internal linkage by default.

The reason C++ does this is to enable more optimizations: if the address of the
variable is not taken, then memory does not need to be allocated for it and its
value can be inlined in the assembly code.

# Storage Class Specifiers Summary

Here's a short summary of which storage class specifiers are valid in which part
of a program, and what difference they make compared to omitting the
storage class specifier. As we said earlier, there can be at most one storage
class specifier by declaration.

Storage class specifiers valid for block-scope variable declarations:

- none: automatic duration, no linkage
- `auto` (never required)
- `register` (compiler hint)
- `static` (static duration)
- `extern` (static duration; copy previous linkage)

Storage class specifiers valid for parameter declarations:

- none: automatic duration, no linkage
- `register` (compiler hint)

Storage class specifiers valid for file-scope variable declarations:

- none: static duration, external linkage
- `extern` (copy previous linkage, else external linkage)
- `static` (internal linkage)

Storage class specifiers valid for file-scope function declarations:

- none: static duration; copy previous linkage, else external linkage
- `extern` (same as none)
- `static` (internal linkage)

Storage class specifiers valid for block-scope function declarations (useless):

- none: static duration; copy previous linkage, else external linkage
- `extern` (same as none)

Finally, note that the `extern` storage class specifier prevents a declaration
from being a tentative definition.

# Summary

So in summary, each declaration has:
- a scope: block, function, function prototype, or file
- a duration: automatic or static
- linkage: no linkage, internal linkage, or external linkage

Refer to the [intro](#intro) for a short definition of these three concepts.

One can determine the linkage and duration of any declaration using only three
rules (most prioritary rule first):

- Within functions, declarations without `extern` have no linkage.

- Within functions, declarations without `extern` or `static` have automatic
  duration. Any other declaration, at any scope, has static duration.

- Within a compilation unit, objects have internal linkage if there is a
  declaration with the `static` storage class specifier. This declaration must
  happen before any `extern` declaration, and there cannot be any declaration
  without storage class specifier (or a compilation error ensues). Otherwise,
  they have external linkage.
  
Finally, for a variable to be defined there should be exactly one declaration
with an initializer; or, failing that, at least one declaration without
`extern`.

# If we could do it over...

Perhaps the most obvious flaw of the scheme is that `static` at file scope bears
no relationship with `static` at block scope. One of the two should have a
different name.

Second, the interplay of `extern`, `static` (at file-scope), and no specifier
(at file-scope) is too complex.

We could describe the behaviour of `extern` as follows:

    if (first declaration for same object was static)
        static linkage
    else
        external linkage

While no-specifier (at file-scope) means:

    if (object is a function
            && first declaration for same object was static)
        static linkage
    else
        external linkage

The reason for making the lack of a specifier act like `extern` for functions is
that functions don't have tentative definitions.

Why do we even need tentative definitions? The only advantage I see is that one
can declare a variable only in a header file and get a definition for it. The
gain in convenience is so small that I'd propose to get rid of it.

At that point, we don't need "no specifier" anymore, and can force all of our
declarations to be either `extern` or `static`. Let's pick one as the default.
`static` seems better suited, since it does not pollute the namespace of other
compilation units: other compilation units can still declare an object with the
same identifier and external linkage.

Let's also get rid of the fact that `extern` "copies" the previous linkage. I
can see no case where it would be necessary.

The scheme ends up simple enough: only add `extern` to declarations of symbol
one wants to export or import to/from other compilation units. If we were not
bound by the fact that C uses header files that are generally included both in
the exporting and importing compilation unit, we could even split `extern` into
`import` and `public` to make things clearer.

# Clarifying Intent

Since many of us are stuck with C, here are a few macros and guidelines on how
to use them to make things clearer. It roughly follows the scheme proposed in
the last section, except that we can't make `static` the default, or statically
check that the scheme is used properly.

- `#define import extern` - for declarations in header files & declarations in C
  files to be imported from other compilation units
- `#define public` - for declaratons in C files to be exported to other
  compilation units
- `#define private static` - for declarations in C files local to the
  compilation unit
- `#define local   static` - for block-scope variables that should persist
  accross function invocations

All file-scope declarations should be qualified by one of `import`, `public` or
`private`. Within a compilation unit, all declarations for an object should have
the same specifier. The only exception is that for a single object there can be
one declaration with `import` in the header file, and one with `public` in the C
file. Block-scope declarations can use `import` or `local`.

# Sources

- [The C Book, Chapter 8](http://publications.gbdirect.co.uk/c_book/chapter8/declarations_and_definitions.html)
- [The C Standard (*)](http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- Experimentations with GCC and MSVC

(*) This is for C11, but these things haven't changed in a long time.
