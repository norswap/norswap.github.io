---
title: "Random Generation Testing"
layout: post
---

At its core, testing is the process of building redundancy in order to ward off
errors. When you write usual unit tests, you're comparing the output of your
code with the output of your brain, given the same inputs.

I always found testing profoundly unpleasant. It's hard to select the proper
inputs to root out all possible issues. One way to look at it is that good
testing should exercise all possible paths through the program. That is of
course impossible — but we could narrow it down to a representative sample,
e.g. where loop repetitions of n > 2 are considered identical. You still get
combinatorial explosion. This is in fact the major limitation in [symbolic
execution].

Test coverage is an even further approximation. Instead of considering paths
through the program, we *just* want to ensure that tests run every piece of code
at least once. That doesn't give you a whole lot of guarantees. And yet,
reaching a high percentage of test coverage in tests already seems like a really
hard challenge for most software teams.

[symbolic execution]: https://en.wikipedia.org/wiki/Symbolic_execution

Besides a few obvious edge cases, selecting inputs is hard, because the most
interesting inputs are those we probably wouldn't pick, reflecting blind spots
in our implementation. I'm a perfectionnist, and just good enough at programming
to realize how bad I really am. The realization that I'm leaving a whole lot
untested always eats at me when I write traditional unit tests.

**But fear not, for I have the cure.**

The fundamental weakness of testing is that we even have to select the inputs.
We have to select inputs because we're comparing the program against our brains,
which we of course cannot "run" during a test suite. Instead, results for
pre-selected inputs have to be hardcoded in the test suite. What if we compared
our program to another program instead? If you are re-implementing an existing
system or protocol, then you're all set! Otherwise, you need to write the second
implementation yourself.

Multiple objections could be raised. The first one: if your test fails, how do
you know which program is at fault? Good one: you don't. You have the same
problem with brain-computed results though. When you run your test for the first
time, how do you know whether the program or the expected results are wrong?
Usualy, you double check. But it is true this is more of a problem when
comparing two program, because these kinds of test tend to go much much further.

Another objection: you're doing the work twice! In theory, yes. In practice, you
can cast by the wayside a whole lot of non-essential requirements in the second
implementation: performance, deployment, durability (writing to a DB),
resiliency (logging, transactions) and probably more, in order to focus on
"business logic". In fact the second implementation should be as naive and
simple as possible, to minimize the chance you made a mistake there (but do see
the caveat in the next objection). As a side benefit, you might gain some
understanding by writing the second implementation. Finally, consider the time
it would take to write regular tests. For some teams, it's not rare that it
approaches or exceeds 50% of the total development time.

Third objection: aren't you likely to reproduce the same mistakes in both
implementations. That is a danger, yes. Multiple steps can be taken to avoid
this. One is to make the second implementation as simple as possible. Another is
to have two separate people write both implementations (also great to make
hidden assumptions come to light). Yet another is to write the two
implementations in radically different styles: purely functional, logical, using
another architecture (but while keeping it as simple as possible within that
style).

Once you have logic redundancy, you are free from the tyranny of input
selection. You can input anything, the the same result should come out of the
end of both programs. Hence, the next logical step is to randomly generate
this input.

This is perhaps the trickiest part of the process: you have to ensure that the
random generation process is able to generate most interesting inputs (our
*representative sample* from earlier), and that the combination of probabilities
does not make some of these inputs as likely as the second coming of the
dinosaurs. Of course, the more complex your input, the harder this is. However,
I'm currently applying this method to genreate whole <acronym title="Abstract
Syntax Trees">ASTs</acronym>, so it's unlikely to ever be *too* hard.

If you get this right, you can run the tests — which generates inputs forever,
runs both programs and compares their outputs — and get confidence in your
implementation(s) proportional to the running time. Even if you don't get it
entirely right, you're unlikely to do worse than hand-selected scenarios, you'll
just eschew some interesting types of inputs.

> Invert, always invert.

Let's now look at an interesting variation on that theme. This applies when
there is a one-to-one (or almost one-to-one) mapping between your input and your
output. So you can go from input to output, and then back from output to input.

The idea is that instead of building a second implementation, you build the
inverse of the implementation (taking outputs to inputs). Then, instead of
generating inputs, you generate outputs, take them back to inputs with the
inverse program, and back again with the actual program, and check that the
final outputs match the generated outputs. It's also possible to go inputs →
outputs → inputs instead, depending on what makes the most sense. As an added
benefit, the inverse is often useful in its own right, or downright necessary.

I applied this approach to test [the lexer I wrote about recently], here are
[the tests].

[the lexer I wrote about recently]: /reusable-lexer
[the tests]: https://github.com/norswap/core0/tree/cea49b103f86b260df46fee67e01940d1b2a1634/test/core/lexer

