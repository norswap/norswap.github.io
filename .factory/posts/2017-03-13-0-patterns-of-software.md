---
title: "Patterns of Software: Highlights"
layout: post
---

Last month, I finished reading the book Patterns of Software by Richard Gabriel
(available for free [here \[pdf\]][pospdf]). It's a very interesting read, and I
recommend it to everyone who cares about the craft of writing software.

[pospdf]: https://www.dreamsongs.com/Files/PatternsOfSoftware.pdf

I didn't really know what to expect going into the book. The first part explains
architect Scott Alexanders' vision of patterns and pattern languages, and makes
a parallel with programming. It's miles away from the [gang of four], which is
just as well. The second part speaks about Gabriel's own personal experiences. I
didn't expect that, but it was nevertheless captivating. The book ends with an
expanded version of Gabriel's [Worse is Better] thesis.

[gang of four]: https://en.wikipedia.org/wiki/Design_Patterns

Below, I highlight some of my take-aways from the book. Most of the excerpts
come from the first part of the book and from the final chapter.

----

### Reuse vs Compression

> Object-orientation promotes reuse through inheritance, but that is most
> properly called compression: the logic is not encapsulated but interspersed.
> It's still there, but now it's implicit. True reuse would be using library
> functions. Compression is easier than true reuse because you don't have to
> think the interface as carefully.

<!------>

> Compression is the characteristic of a piece of text that the meaning of any
> part of it is “larger” than that particular piece has by itself. This
> characteristic is created by a rich context, with each part of the text
> drawing on that context—each word draws part of its meaning from its
> surroundings.

<!------>

> Such webs are examples of compression: The meaning of an expression written in
> the context of the web is determined by the contents of the entire web. If you
> need to change another part of the web, your compressed expression might
> change its meaning, what it does, or even whether it works at all. So when we
> build our tight inheritance hierarchy in object-oriented fashion—weblike or
> pyramid style — we might be falling into this trap.

----

### Habitability and Piecemeal Growth

> It's more important for code to be habitable than clear or beautiful.
> Habitable means it can be extended easily and that new people can get to run
> with the code easily. Perfect clarity is intimidating: it's hard to improve.
> If everything is interlocked too tightly, with no overhang on which to hang
> extension, the program will be hard to extend, even though it is arguably
> perfect. Abstraction is over-valued because a completed program full of the
> right abstractions is beautiful. But most programs are by definition never
> completed.

<!------>

> Habitability is the characteristic of source code that enables programmers,
> coders, bug-fixers, and people coming to the code later in its life to
> understand its construction and intentions, and to change it comfortably and
> confidently.

<!------>

> Piecemeal growth is the process of design and implementation in which software
> is embellished, modified, reduced, enlarged, and improved through a process of
> repair rather than of replacement.

----

### Pattern Languages


According to Gabriel, pattern languages failed in (brick and mortar)
architecture because in addition to having the right process, you have to be an
artist, to manipulate the language artistically.

----

### Symmetries

The book discusses symmetries in the context of rug-weaving, but it think the
notion can apply to software as well. Code with local symmetry is easier to
read. Repeating patterns are pleasant, and many instantiation of the same
principles can make a codebase more familiar.

----

### Language Design & Adoption

> Aesthetic principles and design goals don’t excite me, because often they have
> nothing to do with how people really program (habitability and piecemeal
> growth) but more often reflecting mathematical or abstract considerations and
> look-Ma-no-hands single-mechanism trickery. One cannot deny, however, that a
> small set of principles and goals applied to designing a small language
> usually results in a consistent concise language.

<!------>

> Languages are accepted and evolve by a social process, not a technical or technological one.

A language is minimally acceptable if it solves a new problem or make certain
tasks easier.

> Early adopters are trying to hit a home run with new technology to make the
> career moves or corporate improvements they crave.

----

### Productivity & Impact

Gabriel recount the story of the Borland Quattro Pro for Windows, who was
tremendously productive.

One of the most peculiar things this team did was having multi-hours meeting
each day to gvie overview of changes and define the interfaces.

> A manager should be like the sweeper in curling: The sweeper runs ahead of the
> stone and sweeps away debris from the path of the stone so that the progress
> of the stone will be smooth and undisturbed.

<!------>

> An isolated good success can be better than a string of mediocre successes.

----

### Poetry

Reading poetry is a good way to appreciate good fiction writing, and to become
better at writing in general.

> First, modern and contemporary poetry is about compression: Say as much in as
> few words as possible. Poets avoid adjectives, adverbs, gerunds, and
> complicated clausal structure. Their goal is to get the point across as fast
> as they can, with the fewest words, and generally with the constraint of
> maintaining an easily spoken verbal rhythm.
>
> Second, poets say old things in new ways. When you read good poetry, you will
> be amazed at the insights you get by seeing a compressed expression presenting
> a new way of looking at things.
>
> Third, poets love language and write sentences in ways you could never
> imagine. I don’t mean that their sentences are absurd or unusual—rather, the
> sentences demonstrate the poet’s keen interest in minimally stating a complex
> image or point.

----

### Software Development Models

Richard Gabriel is well known for his famous essay on [Worse is Better].

[Worse is Better]: https://www.dreamsongs.com/RiseOfWorseIsBetter.html

The *Worse is Better* model is explained in the book, but Gabriel expands on how
the model is highly market-efficient.

> It takes less development time, so it is out early and can be adopted as the
> de facto standard in a new market area.

<!------>

> If it has some value, it will be ported or adopted and will tend to spread
> like a virus. If it has value and becomes popular, there will be pressure to
> improve it, and over time it will acquire the quality and feature-richness of
> systems designed another way, but with the added advantage that the features
> will be those the customers or users want, not those that the developers think
> they should want.

<!------>

> Worse-is-better takes advantage of the natural advantages of incremental
> development. Incremental improvement satisfies some human needs. When
> something is an incremental change over something else already learned,
> learning the new thing is easier and therefore more likely to be adopted than
> is something with a lot of changes. To some it might seem that there is value
> to users in adding lots of features, but there is, in fact, more value in
> adding a simple, small piece of technology with evolvable value.

<!------>

> One of the key characteristics of the mainstream customer is conservatism.
> Such a customer does not want to take risks; he (let’s say) doesn’t want to
> debug your product; he doesn’t want to hit a home run so he can move up the
> corporate ladder. Rather, he wants known, predictable improvement over what he
> is doing today with his own practices and products. He wants to talk to other
> folks like himself and hear a good story. He doesn’t want to hear how someone
> bet it all and won; he wants to hear how someone bought the product expecting
> 10% improvement and got 11%. This customer is not interested in standing out
> from the crowd, particularly because of a terrible error in his organization
> based on a bad buying decision.

<!------>

> The ideal of the free market supports this kind of growth. If you decide to
> spend a lot of resources developing a radical innovation product, you may be
> throwing away development money. Why bet millions of dollars all at once on
> something that could flop when you can spend a fraction, test the ideas,
> improve the ideas based on customer feedback, and spend the remainder of money
> on the winning evolution of the technology? If you win, you will win more,
> and, if you lose, you will lose less. Moreover, you will be out there ahead of
> competition which is happily making the right-thing mistake.

<!------>

> When you put out small incremental releases, you can do it more frequently
> than you can with large releases, and you can charge money for each of those
> releases. With careful planning you can charge more for a set of improvements
> released incrementally than the market would have borne had you released them
> all at once, taking a risk on their acceptance to boot. Moreover, when you
> release many small improvements, you have less risk of having a recall, and
> managing the release process also is easier and cheaper. With incremental
> improvement, the lifetime of an idea can be stretched out, and so you don’t
> have to keep coming up with new ideas. Besides, who wants to base one’s
> economic success on the ability to come up with new ideas all the time?

Sounds familiar?

> The ideal situation is that your proprietary value is small compared with the
> total size of your product, which perhaps can be constructed from standard
> parts by either you or your customers or partners.

<!------>

> Wade’s Maxim: No one ever made money by typing.

<!------>

> What this means in our context is that you cannot try to build too large and
> complex product by yourself—you need to get parts from other places if your
> product is complex, and you must make your value clear and apparent, and it
> must be a simple decision for a customer to use your technology.

----

### Epilogue

> In software engineering—if there really be such a thing—we have worked
> thoroughly on Firmness, some during the last 10 years on Commodity, and none
> on Delight.

Clearly that has changed some. But have we gone far enough?
