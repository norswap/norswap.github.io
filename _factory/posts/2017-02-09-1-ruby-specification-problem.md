---
title: "Ruby's Specification Problem"
layout: post
---

I'm start a series of post about [Ruby's Dark Corners][dark corners]. Here I
would like to talk about the reason for these posts: that despite its
popularity, Ruby is thoroughly under-documented.

[dark corners]: /ruby-dark-corners

Here is a look at some questions I'm answering in my [dark corners] series:

- What combination of parameters are legal in method definition?
- How are arguments assigned to parameters when calling a method?
- How are ancestors ordered when using `include`?
- How do we know what name refers to?

It looks like stuff that should be well-understood, but it isn't. The [official
documentation] doesn't cover these topics and doesn't do so in enough depth.
Sometimes, it is even downright misleading. For each these topics them, I
couln't find any blog article that was even remotely close from telling the
whole story.

[official documentation]: http://ruby-doc.org/core-2.4.0/

The behaviour of Ruby is very much implementation-defined. An [ISO standard] is
available, but it covers Ruby 1.8, which is at this point rather old (the
current version is 2.4). For each of the three topics I'm covering, new versions
change the semantics and/or bring new details to the story. Another artifact of
importance is the [Ruby Spec Suite], a test suite that is used by alternative
implementations to verify they comply with the official implementation. A test
suite is just what it is however, I haven't found it very useful as a tool to
understand how things work (e.g. try to understand linearization by reading
[`super_spec.rb`] and [`include_spec.rb`]). Popular books like *Ruby under a
Microscope* and *Metaprogramming in Ruby* don't have the answers either.

[`super_spec.rb`]: https://github.com/ruby/spec/blob/master/language/super_spec.rb
[`include_spec.rb`]: https://github.com/ruby/spec/blob/master/core/module/include_spec.rb

Ultimately, there are two sources of truth: dive in the source code of [MRI]
(Matz' Ruby Implementation — the official implementation) or experiment with the
interpreter. I chose the later, more as a matter of fact than as a well-planned
strategy. It is entirely possible I made some mistake in the way I interpreted
the rules, but it will put you closer to the truth than anything you can find
online.

[ISO standard]: https://www.ipa.go.jp/files/000011432.pdf
[Ruby Spec Suite]: https://github.com/ruby/spec
[MRI]: https://github.com/ruby/ruby

As a concluding remark, I want to emphasize that I'm not picking on Ruby. It's a
language I really like, and the situation is much the same in many other
languages. Nevertheless that's not a reason to be satisfied with the status quo,
and my [Ruby's Dark Corner][dark corners] series is my humble contribution to
that.
