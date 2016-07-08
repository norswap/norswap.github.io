---
layout: post
title: "In Defence of Checked Exceptions"
tags:
- java
---

I had a minor epiphany recently. I realized that checked exceptions are great.
Until then I supported the hip opinion that checked exceptions are a design
mistakes, and that all exceptions should be unchecked.

The first step on my path to enlightenment was to realize the different use
cases for checked and unchecked exceptions. Java Practices [says it best][jp]:

> Unchecked exceptions represent defects in the program (bugs) - often invalid
    arguments passed to a non-private method. To quote from The Java Programming
    Language, by Gosling, Arnold, and Holmes: "Unchecked runtime exceptions
    represent conditions that, generally speaking, reflect errors in your
    program's logic and cannot be reasonably recovered from at run time."

> Checked exceptions represent invalid conditions in areas outside the
    immediate control of the program (invalid user input, database problems,
    network outages, absent files).

Ideally, all unchecked exceptions can be removed from your program without
causing problems. They are just a debugging aid in pinpointing what went wrong
when you made a mistake. Under this assumption, unchecked exceptions should
never be handled: the program is incorrect and should crash and burn. Or at
least, the component (~ a blob of features) should. It's good form to insulate
other components from the failure of a component, if they can still perform
usefully without it.

On the other hand, you can't prevent checked exceptions from occuring, they are
outside your sphere of control. Hence the need to ensure that are handled
correctly.

This seems to make sense. So why are people so fiercely opposed to checked
exceptions?

Well imagine that you are writing some code, and you make a call to a method
that throws a checked exception. You have two choices: add a `throws` clause to
your method, or wrap the method call in a try-catch block. The right thing to do
is to use try-catch if you can handle the exception at that level, otherwise to
add a `throws` clause. In practice, the `throws` clause is almost always the
right thing to do. Yet, adding a `throws` clause is tedious, because it must be
propagated to all the callers of the current method. It's much easier to add a
try-catch block even though there's nothing we can do about the exception, and
so ignore it silently, leading to a loss of information in case of failure.

People who oppose exceptions have either performed this kind of abuse, or have
been bitten by the consequences of other people doing it. I am not making this
up, it's quite obvious from pieces like [this one][eckel] and it's explained in
great length [here][so].

Summarized: people don't want exceptions because they are going to be abused by
lazy programmers.

I can also think of another reason why exceptions might be frustrating to use:
people don't understand the distinction between checked and unchecked exceptions
as spelled out above, and so create frustrating APIs. Even Sun has been guilty
of this: should [NoSuchMethodException][nosuch] really be a checked exception?
Probably not.

Finally, I'll note that it's sometimes allowable to cheat a little bit. If
you're writing a component with a well-delimited interface, you could for
instance eschew checked exceptions if all the exceptions are going to be handled
at the API boundary and no cleanup needs to be performed. You're trading off
some safety for some typing. Just be aware that you are making the trade-off.

In conclusion, do use checked exception, but use them properly: define checked
exceptions only for areas outside the programmer's control; and don't silently
swallow checked exceptions.

[jp]: http://www.javapractices.com/topic/TopicAction.do?Id=129
[eckel]: http://www.mindview.net/Etc/Discussions/CheckedExceptions
[so]: http://stackoverflow.com/a/614494/298664
[nosuch]: https://docs.oracle.com/javase/8/docs/api/java/lang/NoSuchMethodException.html
