---
layout: post
title: "The Most Useful Java Function"
tags:
- java
- java-tricks
---

Warning: title may contain hyperbole.

Without further ado:

    public class Caster
    {
        @SuppressWarnings("unchecked")
        public static <T> T cast(Object obj)
        {
            return (T) obj;
        }
    }

Now you can write:

    List<Object> x = objectList("cthulhu");
    functionExpectingStringList(Caster.cast(x));

instead of:

    List<Object> x = objectList("cthulhu");
    @SuppressWarnings("unchecked")
    List<String> y = (List<String>) x;
    functionExpectingStringList(y);

So, it does two things: (1) automatically infer the destination type and (2)
avoid an intermediate variable declaration, which you need if you want to ignore
the resulting "unchecked cast" warning. This warning appears when the cast can't
be checked at run-time, as is the case when casting between types that differ in
their generic type parameters.

The type inference part will only work with Java 8 and higher. The definition of
`cast` is valid on Java 5 and higher however, and you still get benefit (2).

In the cases where the type cannot be inferred, you need to specify it
explicitly:

    Object x = "cthulhu";
    functionExpectingString(Caster.<String>cast(x));

It also holds up remarkably well when using multiple casts with generics:

    static <T> void takeArrayListPair(ArrayList<T> a, ArrayList<T> b) {}

    static void test()
    {
        List<String> x = new ArrayList<>();
        List<Integer> y = new ArrayList<>();

        takeArrayListPair(Caster.cast(x), Caster.cast(y));
        // x and y are casted to ArrayList<Object>
    }
