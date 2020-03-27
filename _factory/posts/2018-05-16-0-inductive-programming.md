---
title: "Inductive Programming: A New Approach"
layout: post
---

In the context of a job interview, I was asked to write a small paper outlining
a research direction to tackle a problem in the field of *Inductive Programming*
— essentially how to generate programs from examples. Here it is reproduced for
your reading pleasure.

## The Problem

Devise an approach to automatically generate programs which solve programming
challenges, the like of which are used in hiring interviews, or listed on
programming challenge websites (e.g. Project Euler).

In particular, to generate a program we can use (1) a natural-language textual
description of the problem to solve (including descriptions of the input and
output), (2) a set of input/output (I/O) examples and (3) a piece of skeleton
code for the solution.

## State of the Art

The area of program generation from examples is known as *Inductive Programming*
or *Inductive Program Synthesis*. We also consider other forms of *Program
Synthesis*, where a higher-level (formal) specification of the problem may be
given.

The introductory paper by Gulwani et al. [1] is rather useful to get a sense of
what the field is about. It further points to three surveys of the field [2, 3,
4]. The survey by Kitzelmann [4] is particularly useful, as it divides the field
into three tried-and-true approaches: *analytical-functional*, *inductive logic
programming* and *generate-and-test*. Another survey by Gulwani et al. [5], has
its own classification, which largely overlaps with that of Kitzelmann. In
particular, it introduces the *constraint-solving approach*, which includes
inductive logic programming.

Let's note that classification is sometimes tricky, as many approaches accross
categories use elements of search, constraint-solving and statistics.

Below, I offer a brief summary of the advantages, drawbacks and results of
different approaches as I understood them. Beware that this is written after a
cursory literature review, by someone who is unexperienced in the field. It may
be wrong in some signifiant regard.

**The analytical-functional approach** works well with "symbolic" problems where
the structure of the input and output is significant: e.g. simple list
processing problem such as the *reverse* function. The state of the art in this
approach is Igor2 [6], a system that mixes the analytical-functional approach
with search principles (cf. *generate-and-test*). Igor2 is able to induce the
insertion sort and quicksort algorithms, albeit slowly for the later (~63s on
the test setup versus ~0.2s for insertion sort).

**The constraint-solving approach** usually (but not always) makes use of a SAT
or SMT solver. A representative example is Rosette [7]. It is able to generate
relatively specialised programs, such as specifications for an HTML scraper.
This approach does however struggle with complex loops and recursion.

*Inductive Logic Programming* (ILP) is a form of constraint-solving. ILP
techniques are based on first-order predicate logic and typically generate
Prolog programs. They use some form of solving in order to produce Prolog rules
that enables the derivation of a set of facts (~ the output). From what I could
gather, they're generally not more powerful than Igor2.

**The generate-and-test approach** is based on the idea of generating many
candidate programs and testing them against a specification or a set of I/O
pairs. Typically, a fitness function is used to guide the search, and the
algorithms are genetic in nature: promising candidate solutions are mutated and
crossed to generated new candidates. The approach is in principle very general,
but slow in practice.

Gulwani et al. [5] call this the *stochastic search approach* and offer the
following definition:

> The stochastic synthesis approaches learn a distribution over the space of
> programs in the hypothesis space that is conditioned on the specification, and
> then sample programs from the distribution to learn a consistent program. The
> goal of these techniques is to use the learnt distribution to guide the search
> of programs that are more likely to lead to programs that conform with the
> specification.

A major representative of this approach is ADATE [8], which is able to induce
programs that sort lists, insert nodes in a binary search tree, or generate all
permutations of a list. However, the generation process takes at least hours and
up to 9 days.

Another idea is to use a set of higher-order functions (*map*, *fold*, etc...)
as primitives. The assumption is that most programs can be more tersely
expressed using these, leading to a reduction in search space that makes it
practical to enumerate all possible programs. This approach is notably
implemented in MagicHaskeller [9]. In practice, the results are very limited
(the examples given in the paper are *nth*, *map* and *length*).

A third notable example is SyGuS (for Syntax-Guided Synthesis) [10]. SyGuS uses
SMT solving to check the conformance of a candidate solution to a specification.
In case of failure, it outputs a counter-example. Correctness on previously
encountered counter-examples is then used to derive the fitness function that
guides the search. Another key idea is the ability to supply a syntactic
restriction on the program search space. For instance, if we were searching for
a matrix-multplication routine for 2x2 matrices, we could submit the syntactic
restriction that candidate solutions must use only 7 multiplication operations.

SyGuS is evaluated using bit-twiddling problems (transformations of bit
vectors). This is a quite limited set of problems, that has the advantage to fit
the nature of SMT solving (which is a generalization of SAT solving — based on
the boolean satisfiability problem). The generated programs are relatively
simple, and the results are rather inconclusive beyond this class of problems.

Finally, the generate-and-test approach also includes techniques based on neural
networks. Gulwani et al. [5]:

> The proposed approaches can be divided into two categories: i) program
> induction, and ii) program synthesis. The neural architectures that perform
> program induction learn a network that is capable of replicating the behavior of
> the desired program, whereas the neural systems that perform program synthesis
> return an interpretable program that matches the desired specification
> behavior.

As an example of program synthesis, DeepCoder [11] uses a deep learning
algorithm to learn features from I/O pairs. The result is a way to map any set
of I/O pairs to a probability distribution. The distribution indicates how
likely it is that a programming language component will be present in a program
that turns input into output.

The results are quite limited in applicability. In particular, DeepCoder works
with an ad hoc programming language that is very high-level and very limited.
The language processes vectors and only has a very small number of built-in
functions. The approach is also very limited in the program size: The evaluation
is done on programming problems whose solution is a 5-statements program.

However, the technique can still be useful in practical cases, with some
relaxations. Microsoft Excel uses FlashFill [12], a technique that is roughly
similar to that of DeepCoder, but relies on a manually crafted set of heuristics
(*clues*) in order to derive the feature set. Flashfill is used to infer Excel
formulas matching the user intent. Because these formulas do not feature loops
or recursion, and because they draw on a set of primitive functions, the
expressivity is roughly on par with constraint-solving approaches like Rosette
[7], although the success rate is much better, thanks to clues. FlashFill does
not feature neural networks, but a version that does replace manual clues with
neural networks has been devised [13]. It is able to pass 38% of the original
FlashFill benchmarks. One major limitation regards the size of the generated
programs, currently limited to 13 (presumably, 13 functions).

## First Thoughts

My first thoughts upon hearing the problem was that it was impossible. That's
too strong a claim, as there are no obvious theoretical impossibilities. Since
then, I've somewhat revised my opinion. I still think the problem is incredibly
ambitious and hard, but there might be ways to do much better than the state of
the art, if one stumbles upon a breakthrough technique.

As seen in the small literature review above, there is quite a bit of work on
program synthesis, and the results fall quite short of the mark as I understand
it — which is to tackle even relatively challenging programming tasks.

If we consider a more modest objective, then arguably current systems might
already be good enough. Igor2 [6] being able to infer a quicksort in 60 seconds
**is** impressive. The question is then: What goal do we want to reach? What is
the benchmark for success?

It is doubtful that incremental improvements over existing techniques can lead
very far. Popular techniques have been combined to some success (again, Igor2 is
a case in point). This means that if we want to solve the problem, we need to
try something new. But that is, of course, a much bigger research risk.

## Divide And Conquer

Clearly, the area of inductive programming is active and already
well-researched. I don't think I can come up with a worthy research direction
without spending a few weeks in the literature and talking with people well
acquainted with the topic.

But what about dividing the problem into parts and trying to solve each part
individually? That might be easier. Let's cheat!

My suggestion is that, instead of working from a natural language description,
we work from a formal, unambiguous, specification. We would still use examples
as well. My idea for this part of the solution looks roughly like a compiler,
which is maybe not a surprise given my background in language engineering.

Then, as a second step, we could try to derive a formal specification from the
natural-language specification. It is probably impossible to do this very well —
given the ambiguity of natural language — but maybe we can still extract a
partial specification, or extract many candidate specifications, over which we
can conduct a search.

## Ambiguity

A few words on one of the big problems facing us: ambiguity. It occurs at
multiple levels in the problem.

First, inductive programming based on examples is inherently ambiguous, given
that there are infinitely many semantically distinct programs that can match
the I/O pairs.

In fact, a simple program mapping example inputs to outputs is a solution. Of
course, that's typical overfitting. We'd like a solution that, for instance, can
generate a program matching all I/O pairs when only given any set containing
half of the pairs as input. Some similar notion is probably defined in the
literature, but I am not familiar with it.

Still, this leads to an interesting question: What are the properties of the
program that we want to generate, given that there are many that fit the bill?
Probably we want something approaching the simplest solution. And probably, we
can approximate this by the program size.

Second, natural language is naturally ambiguous. From what I know (and looked
up) on Natural Language Processing (NLP) [14], it's already not trivial to
acquire an unambiguous parse tree from an English text. Moreover, within that
parse tree, references (e.g., pronouns) are quintessentially ambiguous. Humans
usually use the available context to disambiguate, although even that is not
always enough. Should we even assume that such a parse tree is available, we are
faced with the daunting task of assigning *meaning* to the words that make up
the tree. This probably requires some kind of semantic network that relates the
words to one another and to programming language concepts. Creating such a
network by hand is possible but unpleasant and very time-consuming. Generating
it from existing text is probably as difficult as the problem we're trying to
solve in the first place.

So a precise interpretation of the natural-language description is off. We
could, instead, try to mine it for hints about the specification. It's not
difficult to imagine we could employ machine learning techniques to extract some
meaning from the description. For instance, a correlation between the presence
of the word "sorted" and the presence of a sort component in the solution.

This is similar to what DeepCoder [11] does, but with the I/O examples. It uses
deep learning to learn to correlate some features in the examples with
programming language constructs. This correlation (which takes the form of a
probability distribution for various programming language constructs) is then
used to guide a local search on the space of programs.

And indeed, we could also add the natural-language description as a second
source of heuristics to guide the local search. My feeling is that this is not
anywhere near enough to make significant progress on the problem.

There is another approach, which is to translate between the natural and the
formal language, possibly reusing existing machine learning techniques*. This is
what I suggested as a second step in the previous section. The result is still
ambiguous, but much more readily exploitable assuming we manage to make good on
the first problem — generating code based on the I/O examples and a formal
specification.

<div style="float:left; height: 50px; width: 20px;">*</div>
<p>
There is a vast literature on the topic, including many papers related to
Google Translate [15] — arguably the state of the art solution in machine
translation.
</p>

<div style="page-break-after: always;"></div>

## From Specification to Program

My proposed first step in the research would be to devise a way to turn a formal
specification into a program.

It's actually very easy to come up with a terrible solution to this problem:
generate a program that enumerates all possible outputs, then filter using the
specification. This solution is incredibly inefficient, but maybe it can serves
as the basis for something better.

First off, we can probably use part of the specification to constrain the
generated outputs. The outputs must probably conform to a precise shape, which
may also be related to the input (e.g. one line of output per line of input).

Some parts of the specification might be naturally ammenable to be translated
into a constructive algorithm — as opposed to simply filtering out bad
solutions. For instance, the assertion that `y == f(x)` where `y` is a part of
the output and `x` a part of the input could be translated immediately as `y =
f(x)`, assuming it is the only thing that constrains `y`.

I also expect that, starting from our initial program, we can
backward-propagated some of the constraints to the enumeration logic itself.
Some of the constraints could be translated into assertions used to prune the
search tree, or invariants to be maintained. Static analysis and optimization
techniques from compiler engineering should be relevant here.

The big question is how far we can push these efforts. Can we generate enough
stub code and optimize away enough of the search that we end up with an program
that does *little enough* guessing?

If we can't, all is not lost. We can still use this as a correct-by-construction
candidate solution, and use it as a starting point for a local search in the
space of programs. Within that search, we could exploit knowledge about the
specification to make smart guesses as to what to change. We can use our I/O
pairs to validate that the mutated program is still considered correct, as well
as fresh inputs, whose corresponding output must satisfy the specification. The
goal of the search is to derive a program that is simpler and more efficient.

As a side note, it is not possible to check candidate programs against the
specification directly, as per Rice's Theorem: "all non-trivial semantic
properties of programs are undecidable". It would probably be worthwhile to
check a computability theory handbook to see if there are no other impossibility
results that could orient our efforts.

For the search in program-space, we can use the whole bag of tricks from the
*generate-and-test* approach, notably fitness functions and genetic algorithms.
But other, more specific methods could also be tried: using higher-order
functions as building blocks, syntactic restrictions, ...

Other classical AI techniques can be handy. I'm thinking notably of simulated
annealing, where we first *increase entropy* by allowing a certain amount of
*noise*. In our case, we allow the initially-correct program to get worse,
because we want to move away from that solution towards a shorter/more
efficient/cleaner one; and then we progressively cool things down, trying to
zero in on new correct solution.

## Defining The Specification Language

A key concern in the proposition made above is the shape of the specification
language. According to me, two concerns are in tension.

First, the language should as broad and expressive as possible. The goal is to
make it easy to write the specifications — otherwise, they won't get written at
all. This is also beneficial because it makes extracting formal specifications
from a natural-language document easier, as we may have constructs that better
reflect the natural-language explanation.

Second, the language should be a good basis for the kind of code generation and
constraint propagation proposed in the previous section.

There is some inherent contradiction between these two goals: if the
specification language is bigger, it will neccessarily includes multiple many
ways to specify the same constraint, some of which will be less amenable to code
generation or constraint propagation. It would be interesting to study this in
order to make an informed decision on what to include in the specification
language.

An interesting source of inspiration is the Z Notation [16], which mixes set
theory, lambda calculus and first-order predicate logic.

<div style="page-break-after: always;"></div>

## Fuzzy Specifications & Natural Language

The second part of my solution calls for a way to acquire a formal specification
from the natural-language specification and/or the examples.

From examples, a partial specification can be obtained by looking for
relationships between input and output that are consistent accross all I/O
pairs. If the example set is too small, overfitting could be a danger.

It's not quite clear to me how to mine the relationships from I/O pairs. An idea
is to train a neural network as an oracle that indicates whether a new I/O pair
is *valid*, that is to say, consistent with the training set of legitimate I/O
pairs, a proxy for satisfying the specification. We could then train a second
neural network to derive formal relationships based on the oracle itself. Such a
two-part architecture is featured in Neural FlashFill [13]. The idea is very out
there, however.

The other (potentially complementary) option is to use the natural-language
specification to guess at the formal specification. As discussed before,
"traditional" (i.e., non-statistical) NLP is probably too arduous. However, given
a big enough corpus of specifications available both in natural-language and
formal versions, we can statistically learn a way to translate between both.
This would work similarly to translation between two natural-languages (e.g.,
what Google Translate does). It might be possible to retool these efforts
towards our goal. A potential problem here is to find or produce this "big
enough" corpus of natural and formal specifications.

In any case, we must be ready to deal with mistakes in the generated
specification, and our proposition so far assumed that the specification was
correct. Fortunately, there is something very easy and effective we can do:
simply run the generated specification against our I/O examples, and
see if the specification is satisfied. If not, it cannot possibly be correct,
and the invalid parts can be discarded.

Furthermore, we can generate many candidate solutions — the translation process
being inherently statistical — and perform a search on those.

Even incorrect specifications have value, as we can perform a local search that
mutates the specifications to try to find adjacent correct specifications. Here
too, fitness functions and genetic algorithms could be helpful.

<div style="page-break-after: always;"></div>

## Summary

Given that (1) current inductive programming techniques results are
underwhelming with respect to our goal and (2) non-statistical NLP techniques
can hardly help us, I propose a two-pronged approach to tackle our challenge.

First, devise a way to generate programs based on a correct formal specification
of the problem. For this, I suggest using techniques from statical analysis and
compiler optimizations. We would tackle the generation process both forward, by
constructively generating code from amenable specification fragments; and
backwards, by propagation constraint into our code — initially a simple
enumeration routine.

Second, manage to extract a formal specification from the natural-language
specificaton of the problem and from the initial set of I/O examples. For this,
I propose to exploit statistical NLP techniques to "translate" between English
and our formal specification language.

The whole proposal is of course a rather wild shot in the dark. But it is
different enough from previously-proposed approaches to have a chance — with
some luck — to yield some low-hanging fruits, or maybe even — with luck **and**
diligence — to go further than existing approaches.

## References

1. Gulwani, Sumit, et al. "Inductive programming meets the real world."
   Communications of the ACM 58.11 (2015): 90-99.

2. Hernández-Orallo, José. Deep knowledge: Inductive programming as an answer.
   Dagstuhl TR 13502, 2013.

3. Flener, Pierre, and Ute Schmid. "An introduction to inductive programming."
   Artificial Intelligence Review 29.1 (2008): 45-62.

4. Kitzelmann, Emanuel. "Inductive programming: A survey of program synthesis
   techniques." International workshop on approaches and applications of
   inductive programming. Springer, Berlin, Heidelberg, 2009.

5. Gulwani, Sumit, Oleksandr Polozov, and Rishabh Singh. "Program synthesis."
   Foundations and Trends® in Programming Languages 4.1-2 (2017): 1-119.

6. Kitzelmann, Emanuel. "Analytical inductive functional programming."
   International Symposium on Logic-Based Program Synthesis and Transformation.
   Springer, Berlin, Heidelberg, 2008.

7. Torlak, Emina, and Rastislav Bodik. "A lightweight symbolic virtual machine
   for solver-aided host languages." ACM SIGPLAN Notices. Vol. 49. No. 6. ACM,
   2014.

8. Olsson, Roland. "Inductive functional programming using incremental program
   transformation." Artificial intelligence 74.1 (1995): 55-81.

9. Katayama, Susumu. "Systematic search for lambda expressions." Trends in
   functional programming 6 (2005): 111-126.

10. Alur, Rajeev, et al. "Syntax-guided synthesis." Formal Methods in
    Computer-Aided Design (FMCAD), 2013. IEEE, 2013.

11. Balog, Matej, et al. "Deepcoder: Learning to write programs." arXiv
    preprint arXiv:1611.01989 (2016). (To be published at ICLR 2017)

12. Gulwani, Sumit. "Automating string processing in spreadsheets using
    input-output examples." ACM SIGPLAN Notices. Vol. 46. No. 1. ACM, 2011.

13. Parisotto, Emilio, et al. "Neuro-symbolic program synthesis." arXiv preprint
    arXiv:1611.01855 (2016).

14. Mote, Kevin. "Natural Language Processing-A Survey." arXiv preprint
    arXiv:1209.6238 (2012).

15. https://research.google.com/pubs/MachineTranslation.html
    Consulted on the 20th April 2018.

16. Abrial, J. et al. "The Z Notation: A Reference Manual." (1998).
