---
title: "A Reusable Lexer"
layout: post
---

I'm writing a small programming language — codename [Core 0] — in order to try
out multiple ideas I have in language design and compiler implementation (which
is fortunate, as that happens to be my research topic).

[Core 0]: https://github.com/norswap/core0

The first step in that journey was to write a lexer. A lexer (aka tokenizer) is
a system that turns a textual input into a stream of tokens. Typical tokens:
numbers, identifiers, keywords, operators, ...

While parsing can handle characters directly, going through a lexer has multiple
advantages (which, it should be said, I failed to appreciate in the past).
First, it helps performance by avoiding to match the same token again and again.
Second, it helps error reporting, but supplying a less granular unit of content.

I wanted to design the lexer to be reusable, by which I mean that it shouldn't
be tied to any specific language. In particular, I wanted to avoid hardwiring a
particular choice of keywords and operators in the lexer. This is not to say the
lexer can handle all languages, far from it. Reuse by copy and modification is
fine for me. In fact, I think much harm has been done by insisting on components
that can be reused in any situation without modifications.

It's frequent for lexers to be specified as a set of regular expressions (one
regex per token type) and to assume that the lexer always takes the longest
match at the current position. The implementation is typically not done like
that for performance reasons, but rather it's structured as a big ole
character-level switch loop.

I could have followed the regex approach but I didn't really see the point, so I
wrote an English [specification] for the lexer, making each token type mutually
exclusive (so that there is never an ambiguity). That was a useful exercise to
crystallize my thoughts. I also included a series of restrictions on valid token
streams that follow naturally from the tokens definitions. For instance, an
identifer cannot directly follow another identifier, otherwise the lexer would
have generated a single, longer identifier instead.

[specification]: https://github.com/norswap/core0/blob/master/src/core/lexer/_README.md

An interesting decision I made is that the lexer always generates a stream of
tokens, for every input. To do so, there is a *garbage* token type that
encapsulates spans of characters that cannot be attached to a token. Typically,
these are non-ascii characters that are not part of a comment or litteral.

The implementation is in Java but it follows a rather weird — almost C-like —
style. The reason is that eventually I want to bootstrap the Core 0 compiler
(write it in itself). Because of that, I want to keep the implementation as
simple and decoupled from Java's idiosyncracies as possible. I also don't expect
that Core 0 will be object-oriented. For the same reason, I also didn't use any
libraries, including the standard libraries. There are a few exceptions, but I
encapsulated them neatly in their own functions.

You can check out [the code here](https://github.com/norswap/core0/commit/cea49b103f86b260df46fee67e01940d1b2a1634).

Stay tuned for a description of the testing methodology I use to test the lexer,
and further infos on Core 0's implementation.
