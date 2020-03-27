---
title: "Ruby's `super` Keyword Weirdness"
layout: post
---

The other day, my colleague Benoît was faced with a strange problem in his Ruby
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

This also works:

```ruby
B.send(:define_method, :foo, lambda { |*args| super(*args); p :F })
```

That's interesting and wasn't covered in
the [Ruby's Dark Corners](/ruby-dark-corners) series can explain it. And of
course, [Ruby doesn't have a specification](/ruby-specification-problem).

I have an hypothesis: when a "callable" (unbound method, lambda, ...) is
directly bound to a method, then any `super` reference in the callable are
correctly bound to that method. However, if `super` is called through at least
one level of indirection (in our example above, we have a lambda that calls a
method), then `super` simply calls the regular method (that is the "lowest" one
in the class hierarchy), no matter what method it was reached from.

(This was tested with Ruby 2.3 on Windows and Ruby 2.4 on Mac OS)
