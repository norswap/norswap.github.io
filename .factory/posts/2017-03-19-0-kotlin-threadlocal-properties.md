---
title: "Thread-Local Properties in Kotlin"
layout: post
---

The [Kotlin] language has a feature called [Delegated Properties]. It basically
lets you delegate a getter (and optionally a setter) to an object that
implements the `getValue` (and optionally the `setValue`) method.

[Kotlin]: https://kotlinlang.org/
[Delegated Properties]: https://kotlinlang.org/docs/reference/delegated-properties.html

I haven't had much use of the feature, but I just found something very nifty
that could be done with it: create thread-local properties.

Here's an example of what you can do:

```kotlin
import norswap.utils.thread_local.*

class Test
{
    val _i = 0
    val i by _i
    
    val j by thread_local(0)
}
```

This creates two counters, `i` and `j` that are backed by instances of
[`ThreadLocal<Int>`]. In the first case we specify the instance explicitly,
while in the second case the `ThreadLocal` instance is created implicitly, given
a default value (0 here).

[`ThreadLocal<Int>`]: https://docs.oracle.com/javase/8/docs/api/java/lang/ThreadLocal.html

And now for the implementation:

```kotlin
package norswap.utils.thread_local
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class ThreadLocalDelegate<T> (val local: ThreadLocal<T>)
: ReadWriteProperty<Any, T>
{
    companion object {
        fun <T> late_init ()
            = ThreadLocalDelegate<T>(ThreadLocal())
    }

    constructor (initial: T):
        this(ThreadLocal.withInitial { initial })

    constructor (initial: () -> T):
        this(ThreadLocal.withInitial(initial))

    override fun getValue
            (thisRef: Any, property: KProperty<*>): T
        = local.get()

    override fun setValue
            (thisRef: Any, property: KProperty<*>, value: T)
        = local.set(value)
}

typealias thread_local<T> = ThreadLocalDelegate<T>

operator fun <T> ThreadLocal<T>.provideDelegate
        (self: Any, prop: KProperty<*>)
    = ThreadLocalDelegate(this)
```

Let's do a quick rundown. The `ThreadLocalDelegate` class does what it says on
the tin: it delegates all attempts to read or write the property to the
`ThreadLocal` instance.

What is more interesting is the different way you can instantiate the delegate:
you can pass it a `ThreadLocal` instance (primary constructor), an initial
value, or a function that compute the initial value. The companion object also
has a function `late_init()` that lets you create a delegate with no initial
value.

Now we could use `ThreadLocalDelegate` like this:

```kotlin
val num by ThreadLocalDelegate(0)
val str by ThreadLocalDelegate<String>.late_init()
```

But that's quite a mouthful, so there is a typealias `thread_local` to make
things look nicer.

Finally, the `provideDelegate` operator function tells Kotlin how to create a
delegate from a `ThreadLocal` instance. That's how we could do `val i by _i` at
the top of the post.

Aaand that's pretty much it for today :)
