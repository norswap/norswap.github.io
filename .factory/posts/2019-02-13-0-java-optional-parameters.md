---
layout: post
title: "Elegant Optional Arguments in Java"
---

Today, an adventure in programming in the in-between, not quite programming in
the small, not quite in the large either.

The problem is that we would like to have a Java method (or constructor) with
optional parameters: parameters who take default value as arguments if not
supplied.

The standard way to do this would be to generate overloads with only a subset of
arguments. This is of course exponential in the number of optional parameters:
with four of them, we're already generating 16 overloads! It's also dependent on
optional parameters not sharing the same type, and requires one to remember the
ordering of parameters.

A better solution: create a configuration object to hold all optional arguments.
This is good, but shifts the issue of optional parameters to the instantiation
of the configuration object. One solution is have a no-argument constructor and
use setters to specify the non-default values. This can be relatively terse and
elegant by means of the [builder pattern].

[builder pattern]: https://dzone.com/articles/design-patterns-the-builder-pattern

It's also possible to forego the configuration object and store the
configuration directly on the concerned object. But there is the risk to clutter
the object, muddling the public interface of the class. It's better to separate
concerns so that configuration data is separate from other fields ("work data",
stored items, ...).

And there you have it, if you require more than one or two optional parameters,
or you feel the set of optional parameters may grow, consider whipping up
configuration object with the builder pattern!
