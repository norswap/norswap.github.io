---
layout: post
title: "My Research: A Personal Perspective"
---

Even though it's what I spend most of my time on, I don't often post about my
research.

One reason is that I am still a perfectionnist and I feel bad about
posting something which isn't as complete as I'd like it to be.

I know that, supposedly, communicating about your ongoing research is supposed
to be beneficial. Frankly, I have yet to see evidence of that, beyond the
benefit of organizing your thoughts. It might just be that my field (parsing) is
quite small, and everyone is busy on his own thing.

A second issue is that my research project has evolved quite a bit over the
years, as has the way I came to evaluate my research results.

Anyway, today I want to do a quick tour of all my research so far. This will
include some (very high-level) technical details as well as my unfiltered
feelings on my work. It will be fairly intermingled, but feel free to skip what
doesn't interest you.

## Prelude

I actually started a PhD in networking; the topic was improving Software Defined
Networks (SDN). Over the course of a year, I grew disillusioned with SDN and
realized the difficulties to do practical research on that topic. I'm not saying
the field is bogus at all, there is very high quality research there — but
clearly the field wasn't well matched to me.

At that point I had gotten a scholarship from the national science foundation,
and so my next move was to switch my topic and my adviser.

What I really wanted to do was experiment with programming language design. To
do this I had a grandiose, over-ambitious idea that was both a language feature
in its own right, and a way to enable cheap experimentation with language design
later down the line.

The goal was to make a truly extensible language. The details were of course not
hammered out, but you can think about it as taking macro a step further, to
enable not only local changes, but global program transformations. These
transformations had to compose gracefully, and work within a typed language too.

Some people warned me about the over-ambitious part, and I knew they were right.
Nevertheless, that idea was kind of the "true north" that would guide my
research direction. So I starting on my path, with the first thing I needed: a
parser.

The motiviation to rolling my own parser was that the grammar of the language
would have to change dynamically, depending on included extensions. It seemed
like an important piece of infrastructure to get full control on, and I had
written my own parser before... how hard could this be?

Well, in the end my thesis only focuses on parsing, so it looks like it was
rather hard after all :)

For the rest of this post, let me walk you through the various papers I wrote
and projects I undertook

## "SDLoad: An Extensible Framework for SDN Workload Generation"

[🔗 link to paper (PDF)](http://norswap.com/pubs/hotsdn2014.pdf)

This is actually an extended abstract I made while I was still working on
networking.

In a nutshell, this was a framework to generate "stuff" — graph of objects
really. I built it from scratch and then employed it to generate descriptions of
SDN workload (so basically a sequence of network events).

The generation is random, modulo constraints that the user can supply, either as
filtering code, or as custom generators. It was also possible to define and use
different statistical distribution, assign weights to certain events, etc.

The generation approach is not novel at all, as are all things so general and
abstract. The goal was not actually to make a great contribution, but rather to
build a tool to would have been useful later in my thesis (as planned at the
time) and maybe even to other researcher. Well, that didn't really pan out,
albeit it might have been used in some later research project (I'm not sure).

Nevertheless, the idea of generating inputs stayed with me, and I now use it
regularly to do testing, as [described in this blog post][random gen].

[random gen]: http://norswap.com/gen-testing/

## "Parsing Expression Grammars Made Practical"

[🔗 link to paper (PDF)](http://norswap.com/pubs/sle2015.pdf)

This was the first paper I wrote after switching my topic, and I wrote it rather
quickly (in about three months). I got a big surge of initial motivation from
this.

Basically the paper, which was submitted as a "tool paper" presents a parsing
framework based on *Parsing Expression Grammars* (PEG), a relatively recent grammar
formalism.

Later in my PhD I would come to dismiss this paper as "not really much", but now
I have newfound appreciation for it.

The paper basically has three contributions:

1. It presents a general algorithm to allow left-recursion in PEG grammars,
   something that the formalism doesn't normally allow.
  
2. It presents a modification of that algorithm that enables to handle
   precedence and associativity, given that grammar rules have been properly
   annotated.
   
3. It shows how to customize different aspects of the parse process with
   arbitrary code.
   
Contribution 1, arguably the most intersting to someone reading the paper, is
actually 95% work from Chris Seaton in his master thesis (something I made
super clear in the paper). But burried in his master thesis, the technique had
never received the exposure it deserved.

Contribution 3 is the start of a theme that would continue throughout my thesis:
the fact that if the execution model is defined precisely enough, it becomes
easier to extend with new features.

In the end, I think the value in the paper is not where it pretends to be. The
tool has little importance, more intersting are the techniques I used, that
could be reused in other tools. Having a paper that explains how you can do
left-recursion and explicit precedence and associativity with PEG — that's
useful.

Unfortunately, the paper is not as readily findable as I would have wished. I
have come to rue its name, which is both cocky and not very informative on the
content of the paper. I probably should take the time to link that paper from a
few places of interest.

## "Taming Context-Sensitive Languages with Principled Stateful Parsing"

[🔗 link to paper (PDF)](http://norswap.com/pubs/sle2016.pdf)

This paper grew out of the first one rather opportunistically. Basically I
noticed a pattern in how I dealth with various kind of "state" within my parser
when backtracking (input position, tables, ...). The idea was then to generalize
that to any kind of user-defined state.

Having user-defined state that can guide the parse is rather useful, as it
turns. It can be used to express grammars that feature *context-sensitivity*,
something parsers don't normally allow. Explaining context-sensitivity is rather
hard, but the simplest example is probably the issue of recall: recalling some
piece of input later. For instance in XML, opening and closing tags have to
match: `<a>x</a>` is valid but not `<a>x</z>`.

So the paper basically explains how you can have state in your parser, in a way
that is safe despite the presence of backtracking. I also provided an
implementation of the approach.

This paper has probably been my major research effort so far, although I have
good hopes that it will be topped by what I'm working on right now.

All told, this took me a good year of work. Its first incarnation was submitted
at OOPSLA in Jan. 2016, then reworked and submitted (and subsequently accepted)
at SLE in June 2016.

I think this is good and useful research. In the end, the solution is almost
disappointingly simple; but it didn't start out simple, it took me great pains
to get there. Someone smarter than me, or at least more mindful of his work,
would probably have completed this much faster than me, but in the end I am not
disappointed with the result.

My problem with this paper lays on another dimension: that of strategy and
carreer development.

The problem that this approach solves is real, and yet it is tiny at the same
time. Most languages are 99+ % not context-sensitive, but the context-sensitive
parts will really annoy the hell of you when you get to it. Most often this is
worked around with various hacks, and — you know what — most of the time this is
good enough.

Does that mean we shouldn't have a principled solution? Of course not. It just
means it's a solution to a minor problem instead of a major one. Frankly,
expecting to come up with major work a few months after entering a field might
be a sign of unbridled hubris on my parts — but I'm just relating how feel (or
at least felt for a long time).

The question is then: did I have better alternatives? I'm not sure, really.

## Uranium & Semantic Analysis

Before getting to the next published paper, let's actually get to the project
that occupied the intervening year, but didn't actually lead to any publication.

At that point, it was quite clear I wouldn't be able to develop even a
significant part of the extensible language during my thesis. My plan was to
reframe the thesis' objective as "improving compiler toolchains", with the idea
that this might eventually help bring about the extensible language, or really
anything language-related I wanted to experiment with.

During that year, I worked on a framework dubbed *Uranium* that would make it
easier to write the semantic analysis stage of a compiler. Semantic analysis is
notably what takes care of name resolution (associating identifiers and
declarations) and typing.

Uranium ended up looking a lot like [attribute grammars]: a way to derive the
values of attributes associated with AST nodes. Besides shedding the historical
baggage (which could be considered a good or a bad thing), the framework also
took inspiration for the classical type system formal notation, which makes use
of inference rules. In line with the rest of my work, these rules were going to
be written using arbitrary code, in order to enable maximum flexibility.

Basically, the way of it is that you define inference rules that derive the
values of attributes given the availability of some other attributes, and the
framework was going to order all this stuff for you. It works in a bottom-up
manner, trying to derive all attributes, instead of the top-down manner that
characterize most attribute grammar implementations.

The framework itself ended up being rather simple, both in concepts and
implementation. I used the Java language as a use case, to try out if I could
express non-trivial semantics using it. And this is where the problems begin.

Java is a big language, with a lot of edge cases and ambiguities. But it is by
no means alone — I think the same can be said of almost every language that we
can qualify as "mainstream".

Here are some difficulties I ran into:

- I was too ambitious. I wanted the framework to be fully incremental, meaning
  it could start deriving meaning even with missing information (~declarations),
  and could react to updated information. This added a lot of complexity while I
  was still early in the design stage. I ended up getting rid of that
  requirement.
  
- I had to take care of location and loading Java classes: I did not just look
  at source files and assume the program did not use any standard library. While
  I think it is miles easier in Java than in, say, C or C++, it still was a
  non-trivial implementation effort.
  
- It's hard to resolve identifier chains. First, you have to disambiguate what
  is a value, what is a class, and what is a package. For instance, let's assume
  we have determined that `java.util.List` refers to a type; `java` could be
  either a class or part of a package name. The Java rule is that if `java` can
  be resolved to a class, the whole chain will be resolved assuming that (and
  potentially fail). In order to know whether `java` is a class, you need to
  know all the classes in the current package, the local classes, as well as all
  the system classes that are available by default.
  
- In addition to their inherent ambiguity, identifier chains also posed problems
  in their interactions with the framework. The right way to model identifier
  chains is to make the resolution of each element in the chain dependent on the
  previous element. However, I had represented identifier chains as a single AST
  node holding a list, so instead I relied on a concept of *continuation*: an
  inference rule could report that it needed more information to proceed, and
  the framework would re-try the rule once the information became available. An
  identifier chain would emit one such continuation (one at a time) per
  identifier.

In the end, the lesson was that the effort to implement the inference rules and
the surrounding support infrastructure for a single language dwarfed the effort
of building the inference framework. It's a bit hard to sell an improvement that
only saves you 10% of the effort. With the approach being novel, it probably
could have flied; but with attribute grammars looming in the background, no
dice.

To give you, an idea, in addition to just the rules, the Java system needed:

- Model of source elements (essentially more precise version of the AST nodes,
  which could also hold extra information, for instance related to name
  resolution). These models needed to come in three flavours, because there are
  three ways to acquire the information of a class: through a source file,
  through a bytecode class, or through reflection.
  
- Building a scope tree to represent lexical scoping and determine which
  declarations where visible where.
  
- Fairly precise typing hierarchies and sub/supertyping algorithms.

- The class location and loading mechanism already discussed before.

That's a lot! In comparison the framework was minimal in complexity and the only
big change that it needed was the addition of the *continuation* concept
mentionned earlier.

The problem was that it was hard to migrate complexity from the Java
implementation into the framework, because the framework was supposed to be
agnostic about the language it was used to implement. For instance, I could have
implemented utilities that made typing much easier to implement... but then I
would have had to tie to framework to a certain idea of how typing is supposed
to work. That approach is more in line with how language workbenches (like
[Spoofax]) work, and there is nothing wrong with that, it's just not what I was
trying to build.

So, ultimately faced with the prospect of continuing to pour work into a
hard-to-sell blackhole of a use-case, I decided to write off the project and
pivot onto something different.

The failure is still fresh, and so my outlook might not yet be good enough.
Nevertheless, I think that the mistake I made in this case was badly
overestimating the problem, as well as misunderstanding its nature.

I did look at some semantic analysis code, and I saw these big tangled messes.
My conclusion was that there should be a simpler, more structured way to go
about things. However I failed to consider that the problem might have been a
matter of *programming in the small*: that some refactoring as well as good
documentation could have helped tremendously.

It also wasn't really clear to me what part of the complexity
was [intrinsic][bullet] and which part was [accidental][bullet]: I think I
overestimated the second.

What could have have done to seize up the problem better? Probably try to write
semantic analysis code without any framework, to get an intuitive sense of where
the issues lay. This is something I had done for parsing (writing a parser by
hand), although my purpose at the time was not to learn about the difficulties
in parsing.

[attribute grammars]: https://en.wikipedia.org/wiki/Attribute_grammar
[Spoofax]: http://www.metaborg.org/en/latest/
[bullet]: https://en.wikipedia.org/wiki/No_Silver_Bullet

## Red Shift: Procedural Shift-Reduce Parsing

[🔗 link to paper (PDF)](http://norswap.com/pubs/sle2017.pdf)

I initially wanted to publish something about Uranium at SLE 2017, but clearly
that was not going to fly. As I re-read the call for paper, I noticed that this
year they were accepting 4-page "vision papers" that outlined a vision for an
early stage idea. That was for me the opportunity to revisit an idle thought I
had during the preceding year.

The idea was about finding the converse of <acronym="Parsing Expression
Grammars">PEGs</acronym> for bottom-up parsing. PEGs can be seen as a
formalization of the way people naturally write top-down parsers by hand. So how
did people write bottom-up parsers by hand, and how could I formalize or package
that?

Surprisingly, I found very little about hand-written bottom-up parsers, yet I
saw how it could make sense. The paper is precisely about that: how to write
bottom-up parsers by hand, and the potential benefits of doing so.

Namely, in the approach I envisionned, there were two big benefits:

1. The parser was permissive and so would parse as much as possible, even in the
   presence of errors. The trick is that the parser recognizes low-level
   structures first, and builds them up into higher-level structures (e.g. from
   literals to expressions to statements to functions).
   
2. It would enable better error reporting, as the partial structures we build up
   during the parse could be used to provide context.

I cranked the paper out in less than two weeks, also building a small prototype
to confirm my ideas were not completely out of whack. To paraphrase a well-known
mass-murderer: "There are years where nothing happens; and there are weeks where
years happen."

## What I'm Doing Now

The last paper was the inflexion point I needed to pivot away from the Uranium
project. Instead, I launched into what I'm currently doing, which is build up
this idea into a proper framework.

My handmade bottom-up parsers made use of *reducers*: bits of code that look 
at the parse stack and perform a reduction if some condition holds.

I realized that said conditions were almost always equivalent to performing a
regular expression match over the tokens and AST nodes on the parse stack.
Hence, my first step was to built a library ([skelex]) to perform that part of
the work.

The next part will be to build the framework proper, which orchestrates the
regular expression matching and the nodes reductions. I'm still working on the
design, so there is not much I can say right now, but stay tuned :)

[skelex]: https://github.com/norswap/skelex
