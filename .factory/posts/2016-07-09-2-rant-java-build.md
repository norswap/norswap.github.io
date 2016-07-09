---
layout: post
title: "Micro-Rant: Java Build Systems"
---

Ant is Make in XML.

Maven is an over-engineered, yet castrated build system. You can't do
fundamental stuff (such as specifying which version of Java you want to use or
**moving files** without importing a plugin or calling Ant. Want to do something
slightly different? Build you own plugin (this process is more painful than it
sounds). On the plus side, Maven does have a handy (but not best-in-class)
dependency system, which is why we still have to suffer it.

Gradle allows custom build tasks (**finally!**). It's also huge, bloated, and
comes with a [70-chapters manual][gradman] that still manages to be lacunary and
confusing. Understanding Gradle is not the work of an afternoon but of weeks.

[gradman]: https://docs.gradle.org/current/userguide/userguide.html

Scala is not served better. To think sbt once stood for "simple build
tool" (now retconned to "scala build tool") is enough to choke on the irony.

[One might as well build Java using Make.](/build-java-with-make)

## Hope?

[Kobalt][kobalt] is a sane build system for Kotlin & Java by Cedric Beust (the
author of TestNG). However it's still in its infancy.
  
[pluto][pluto] is a prototype from academia ([related paper][pluto-paper])
that enables incremental, minimal, and safe builds (no need to `make clean`).
You can't really use it as is, but the idea only asks to be picked up.

[kobalt]: http://beust.com/kobalt/
[pluto]: http://pluto-build.github.io/
[pluto-paper]: http://www.informatik.uni-marburg.de/~seba/publications/pluto-incremental-build.pdf
