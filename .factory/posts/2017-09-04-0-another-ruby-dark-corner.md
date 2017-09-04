---
title: "Another Ruby Dark Corner"
layout: post
---

The other day, my colleague Benoit was faced with a strange problem in his Ruby
code. Here is a greatly simplified version of the code that caused the problem:

```Ruby
class A
    def foo
        p :A
    end
end

class B < A
end

module F
    def foo
        super
        p :F
    end
end

method = F.instance_method(:foo)
B.send(:define_method, :foo, lambda { |*args|
    method.bind(self).call(*args)
})

B.new.foo
```
    
What do you think the last line does?

It seems like it should print `:F`, then `:A`. `B#foo` becomes bounds to a
lambda, inside which we call `F#foo` with `self` bound to `self` from the
lambda.

Since the lambda is then bound to `B#foo`, it would stand to reason to think
that the `super` from `F#foo` would invoke `A#foo`. But here's the rub: it
invokes `B#foo` recursively.

And so it turns out that the last line fails with `SystemStackError: stack level
too deep`.

Of course, the code is actually needlessly complicated. You could do this:

```ruby
method = F.instance_method(:foo)
B.send(:define_method, :foo, method)
```

And — plot twist — this actually works fine.

Why? I have no idea. And nothing in
the [Ruby's Dark Corners](/ruby-dark-corners) series can explain it. And of
course, [Ruby doesn't have a specification](/ruby-specification-problem).

Interestingly, this also works:

```ruby
B.send(:define_method, :foo, lambda { |*args| super(*args); p :F })
```
    
This seems to suggest that the fact that the container of `super` should be
bound directly to the method, and that indirections have an effect. At the same,
the `super` call is still able to figure out the correct method name to call in
the presence of indirections, so the behaviour makes very little sense to me.

(This was tested with Ruby 2.3 on Windows and Ruby 2.4 on Mac OS)
