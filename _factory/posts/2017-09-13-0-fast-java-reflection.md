---
title: "Java Reflection, 1000x Faster"
layout: post
---

A few weeks ago I got to make some of my code 1000 times faster, without
changing the underlying complexity! As the title implies, this involved making
Java reflection calls faster.

Let me explain my use case as well, because it's relatively general, and a good
example of why one would use reflection in the first place.

I had an interface (representing a tree node) and a slew of classes (100+)
implementing this interface. The trick is that the tree is heterogeneous, each
node kind can have different numbers of children, or store them differently.

I needed some code te be able to walk over such a composite tree. The simple
approach is to simply add a `children()` method to the interface and implement
it in every kind of node. Very tedious, and boilerplaty as hell.

Instead, I noted that all children were either direct fields, or aggregated in
fields holding a collection of nodes. I could write a small piece of code that,
with reflection, would work for every node kind!

I've put up [a much simplified version of the code on Github][code]. I will link
the relevant parts as we go.

### Initial Code

[code]: https://gist.github.com/norswap/09846a75092f49a7f1cbf1f00f85e9b6

Here is the version I came up with: [`WalkerDemoSlowest.java`]

[`WalkerDemoSlowest.java`]: https://gist.github.com/norswap/09846a75092f49a7f1cbf1f00f85e9b6#file-walkerdemoslowest-java

It's fairly straightforward: get the methods of the node's class, filter out
those that are not getters, then consider only that return either a node or a
collection of node. For those, invoke the method, and recursively invoke `walk`
on the children.

Will anyone be surprised if I tell them it's very slow?

### Caching

There is a simple tweak we can apply that makes it much faster however: we can
cache the methods lookup.

Here is the caching version: [`WalkerDemoSlow.java`]

[`WalkerDemoSlow.java`]: https://gist.github.com/norswap/09846a75092f49a7f1cbf1f00f85e9b6#file-walkerdemoslow-java

It's really the same except that for each class implementing `Node`, we create a
`ClassData` object that caches all the relevant getters, so we only have to look
them up once. This produces a satisfying ~10x speedup.

### LambdaMetafactory Magic

Unfortunately, this was still way too slow. So I took to Google, which turned
out this [helpful StackOverflow question][so].

[so]: https://stackoverflow.com/questions/19557829/faster-alternatives-to-javas-reflection

The accepted answers proposes the use of [`LambdaMetafactory`], a standard
library class that supports lambda invocations in the language.

[`LambdaMetafactory`]: https://docs.oracle.com/javase/8/docs/api/java/lang/invoke/LambdaMetafactory.html

The details are somewhat hazy to me, but it seems that by using these facilities
we can "summon the compiler" on our code and optimize the reflective access into
a native invocation. That's the working hypothesis anyhow.

Here is the code: [`WalkerDemoFast.java`]

[`WalkerDemoFast.java`]: https://gist.github.com/norswap/09846a75092f49a7f1cbf1f00f85e9b6#file-walkerdemofast-java

Now, in my code, this worked wonders, unlocking another 100x speedup. While
writing this article however, I wanted to demonstrate the effect with some code
snippet, but didn't manage to. I tried to give the interface three sub-classes,
and to give them bogus methods to be filtered out, to no avail. The second and
third version of the code would run at about the same speed.

I re-checked the original code -- all seemed good. In my original code, the
trees are Abstract Syntax Trees (AST) derived by parsing some source files.
After fooling around some more, I noticed different results if I limited the
input to the first 14 source files.

These files are relatively short (few 10s of lines) and syntactically simple.
With only those, the second and third version would run at about the same speed.
But add in the 15th file (a few 100s of lines) and the second version would take
a whopping 36 seconds while the third version would still complete in 0.2
seconds, a ~700x difference.

My (somewhat shaky) hypothesis is that if the scenario is simple enough, the
optimizer notices what you are doing and optmizes away. In more complex cases,
it exhausts its optimization budget and falls back on the unoptimized version
and its abysmal performance. But the optimizer is devious enough that crafting a
toy example that would defeat it seems to be quite the feat.

### LambdaMetafactory Possibilities

I'm somewhat intrigued about what is possible with `LambdaMetafactory`. In my
use case, it works wonders because reflection calls are much more expensive than
a simple cache lookup. But could it be used to optmize regular code in
pathological cases as well? It seems unlikely to help with [megamorphic call
sites], because the compiled method handle has to be retrieved somehow, and the
cost of that lookup would dwarf the gains.

But what about piecing together code at run time, and optimizing it? In
particular, one could supply a data structure and an interpreter for that data
structure, and "compile" them together using `LambdaMetafactory`. Would it be
smart enough to partially evaluate the code given the data structure, and so
turn your interpreter into the equivalent "plain" code?

Incidentally, that is exactly the approach taken by the [Truffle framework],
which runs on top of the Graal VM, so there is definitely something to the idea.
Maybe something precludes it with the current JVM, hence requiring the GraalVM
modification?

In any case, there is something to be said in favor of making these capabilities
available as a library, which could be used in "regular programs" (i.e. not
compilers). Writing a simple interpreter is often the easiest approach to some
problems.

[megamorphic call sites]: http://insightfullogic.com/2014/May/12/fast-and-megamorphic-what-influences-method-invoca/

[Truffle framework]: https://github.com/graalvm/graal
