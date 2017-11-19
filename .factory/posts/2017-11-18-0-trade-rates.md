---
layout: post
title: "Simple Math: Trade Rates"
---


While I was driving on the highway the other day, I was thinking: "how much time
would I shave off if I drove at 150 km/h instead of at 120 km/h?"

It seems like that should have a very simple answer, but I wasn't able to come
up with it immediately. Here are insights I gained after thinking a bit more
about that question.

## Trade Rates

First off, let us state that speed is a trade rate. From a human perspective,
speed allows you to trade time for distance.

In general a trade rate is a ratio `X/Y` that states how much of a thing A we
can trade for a thing B:

```
 X   A
--- --- = 1
 Y   B
 
X A = Y B
```

So naturally, 120 km/h allows us to trade an hour for 120 kilometers.

## Trade Rates Multiplications

Going from 120 km/h to 150 km/h, we add 30 km/h. That is precisely the quartier
of the base speed.

Hence: 150 = 120 \* (1 + 1/4) = 120 \* 5/4

Let's see how this affects our trade rate equations:

```
 5   120   km
--- ----- ---- = 1
 4    1    h
 
5 * 120 km = 4 h

150 km = 1 h
```

As expected, we can now trade one hour for 150 kilometers. But what if we want
to keep 120 km on the left side of that equation? Say we actually have to drive
for 120 km, how much time do we save?


```
5 * 120 km = 4 h

120 km = 4/5 h = 38 m
```

We gained 1/5 of an hour, so 12 minutes.

That's interesting: we increased our speed by a quarter, but only reduced the
time by a fifth. This is actually more intuitive when the numbers become larger:
double your speed, halve the required time, which corresponds to +100% speed for
-50% time.

The thing to keep in mind is that we're messing with the *trade rate*. Given a
fixed speed, time and distance mirror one another: double the distance, double
the time, and vice-versa.

Another interesting thing: by multiplying the speed by 5/4, keeping the distance
fixed, we ended up multiplying the time by 4/5. The symmetry between those
numbers is not random. In fact we can generalize.

If we multiply a trade rate `X/Y` with units `A/B` by a fraction `u/z`, then either:

- We can trade `u/z` times the A for the same amount of B.

- We can trade `z/u` times the B for the same amount of A.

The math is fairly simple:

```
 u   X   A
--- --- --- = 1
 z   Y   B
 
 u
--- X A = Y B
 z
       z
X A = --- Y B
       u
```

## Trade Rates Increases

We can think about this in another way. Multiplying the speed by 5/4 was
actually multiplying it by (1 + 1/4), so we can see this as an 1/4 increase in
speed.

Clearly, when your speed increase by one quarter, you can drive one quarter more
kilometers in an hour.

It's less intuitive from the other side: when your speed increases by 1/4, how
much does the time spent decrease? We already know the answer is 1/5, but how to
find this without going through the whole development?

First we need a side property.

**Side Property: Numerator Swap**

(I have no idea how this property is called in reality, or whether it even has a name)

```
   X             Y
------- = 1 - -------
 X + Y         X + Y
```

Proof:

```
   X       X + Y     X + Y       X
------- = ------- - ------- + -------  (1)
 X + Y     X + Y     X + Y     X + Y
 
                 Y
        = 1 - -------                  (2)
               X + Y
```

In (1) we simply add and remove `(X+Y)/(X+Y)`.

In (2), the first term becomes 1, while the `X` in the second and third terms
have different signs and cancel each other out.


**End Side Property**

Okay so we wanted to know how to get that 1/5 diminution in time from the 1/4
(`u/z` if we abstract) increase in speed.

Here is the development:

```
      u    X   A
(1 + ---) --- --- = 1
      z    Y   B
      
 z + u
------- X A = Y B           (1)
   z

         z
X A = ------- Y B           (2)
       z + u
       
              u
X A = (1 - -------) Y B     (3)
            z + u
```

In (1), we pass `Y B` to the other side, and we replace `1` by the equivalent
`z/z`, leading to the simplified `(z + u) / z`.

In (2), we just pass that term to the other side.

In (3), we use our side property and get our final form.

In our speed example, `u/z = 1/4`, so `u = 1` and `z = 4`. We can see that `u /
(z + u)` is indeed 1/5, and as the equation shows, that is the portion that the
quantity of B gets reduced by.

The gist of this is: add the numerator to the denominator.

- 1/4 `>>` 1/5
- 2/3 `>>` 2/5
- 3/4 `>>` 3/7

Easy peasy!

## Diminishing Returns

One final interesting observation: there is a diminishing return on trade rate
increase (assuming you're on the right side of the equation).

This is obvious with speed. Double the speed, halve the time spent to go the
same distance. Double the speed again, halve the time again.

Imagine our base speed is 60 km/h and we have precisely 60 km to go until our
destination. If we change our speed to 120 km/h, we gain 30 minutes in travel
time.

But if we were driving at 120 km/h, and we change our speed to 240 km/h, we only
gain 15 minutes (half of our 30 minutes travel time at 120 km/h).

So if you're driving at 60 km/h, and you add 60 km/h, you gain 30 minutes. But
if you immediately add 120 km/h more, you only gain 15 minutes!

Again, this is because we're changing the rate. Given a fixed speed, adding more
time will yield a linear increase in distance travelled.

---

That's it for today. Drive safe!
