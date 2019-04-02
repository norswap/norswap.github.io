---
layout: post
title: "Language Design Notes"
---

I'm starting a new series on (more or less) disjointed notes on programming
langauge design and related concepts.

This is the work-in-progress index to the series, which also gives a bit more
context about each post.

### [0. A Map of Polymorphism](/polymorphism)

The original impetus for the series was to write about a couple ideas I had for
language design. The first idea was to use [typeclasses] extensively, but freed
of their Haskell shackle.

As a way to introduce the topic, I wrote an overview of the different types of
polymorphisms. This ended up quite disjointed from what I have now written on
typeclasses (I'm not done yet). Nevertheless, it's not too shabby as a reference
on polymorphism, so here goes!

[typeclasses]: https://en.wikipedia.org/wiki/Type_class

### [1. A Precise Typeclass Scheme](/typeclass-scheme)

As I started thinking about typeclasses more, I found the need to write down
some form of specification of the system I was imagining, so that I could refer
to different parts of the design, and see if the whole was consistent.

I found the need to be fairly precise. Or maybe I just got carried away... but I
think the precision really helps throw in relief the small details that
threatens the consistency and elegance of the whole. Anyhow, this ended up
looking more like a specification than a nice explanative article, although I
tried to include enough examples.

It's not perfect, but as [discussed earlier], I want thing to move forward, so
here it is!

[discussed earlier]: /more-content/
