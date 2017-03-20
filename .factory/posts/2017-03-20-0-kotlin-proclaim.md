---
title: "The Most Useful Kotlin Function"
layout: post
---

Two years ago, I wrote a posted called [The Most Useful Java Function][java].
This was rather tongue-in-cheek, as the function in question lets you cast from
a type to another, inferring the target type and suppressing unchecked cast
exceptions.

[java]: /java_caster

Nevertheless, it is useful remarkably often.

With Kotlin however, you can step up your game to a whole new level.
Introducing `proclaim`:


```kotlin
val list: Collection<Int> = ArrayList(list(1, 2, 3))
proclaim(list as ArrayList<Int>)
val x = list[0] // works
```

The trick here is actually not `proclaim`. It's the fact that Kotlin has "smart
casts" which are essentially a form of flow typing.

The type inferencer reasons out that if the cast `list as ArrayList<Int>`
succeeds, then it means that `list` is indeed an `ArrayList<Int>`. And since
`list` is a `val`, its value can't change. So in the rest of the body where the
cast appears, list is "smart-casted" to `ArrayList<Int>`.

Here is a possible definition for `proclaim` (0 run-time overhead besides the
cast):

```kotlin
@Suppress("UNUSED_PARAMETER", "NOTHING_TO_INLINE")
inline fun proclaim (cast: Any)
    = Unit
```

Let's get the obvious out of the way: of course this can be misused.

On the other hand, just like the casting function, it is handy surprisingly
often. Type systems just aren't powerful enough to be able to figure some things
we know to be true in our code. Especially that of Java and Kotlin.

I'm not giving any examples: by their nature they would be short and easily
rewritten to accomodate the type system. But if you genuinely want to know, you
can search the net for "(path-)dependent types" use case or examples. Keep in
mind that's just a subset of what we can't express in Java/Kotlin though.
