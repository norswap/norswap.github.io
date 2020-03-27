---
title: "Simple Math: Permutations and Combinations"
layout: post
---

In today's post, I want to (re-)introduce some simple math that most people
learn in high school, but forget quicly: permutations and combinations.

Permutations and combinations allow you to answer questions like: In how many
ways can I order a set of distinct items? If I take K of those items, how many
combinations of them are there? Then we will go a bit further and see how to
deal with repetition (putting back an item after selecting it), multisets (sets
in which there are multiple copies of the same item, like a pit that would hold
4 red balls, 3 blue balls and 2 green balls) and picking from different sets.

---

## Sets of Distinct Items

Imagine you have a set of distinct items. This could be a deck of cards, or a
pit containing uniquely numbered balls. We will look at the number of ways to
pick items out of this set, with and without taking ordering into account.

One basic rule: Once an item has been picked from the set, it can't be picked
again.

We will look at three questions:

- **Permutations**
  
  How many ways are there to order all items in the set?
  
  For instance, for a set of three balls {1, 2, 3}, there are six way to order
  them: 123, 132, 213, 231, 312, 321.
  
- **k-Permutations**

  How many ways are there to order *k* items picked from a set?
  
  For instance, for a set of three balls {1, 2, 3}, there are 6 ways to order
  two of them: 12, 13, 21, 23, 31, 32.
  
- **(k-)Combinations**

  How many ways are there to pick *k* items picked from a set?
  
  For instance, for a set of three balls {1, 2, 3}, there are 3 ways to pick two
  of them: {1, 2}, {1, 3} and {2, 3}.

Let's now give the formula and intuition for how to answer these questions.

### Permutations

There are `n!` ways to order the elements of a set of size *n*.

`n!` means the [factorial] of n. The factorial of 3 is `3 * 2 * 1 = 6`. The
factorial of 5 is `5 * 4 * 3 * 2 * 1 = 120`, etc. The factorial of 0 is 1.

**Intuition:** Imagine we have to order 3 balls {1, 2, 3}. First we pick one ball
and we have three to choose from, so that's three possibilities. Next we pick
another ball, and there are only two left to choose from. This means that for
each choice we made when picking the first ball, there are two further
possibilities for the second ball, so that's `3 * 2 = 6` possibilities. Finally
there is only one ball left to pick: we have no choice. This means there are `3!
= 3 * 2 * 1 = 6` ways to order the three balls.

[factorial]: https://en.wikipedia.org/wiki/Factorial

### k-Permutations

The are `P(n, k) = n! / (n-k)!` ways to order *k* items picked from a set of
size *n*. For other mathematical notations, see [here][permu-notation].

[permu-notation]: https://en.wikipedia.org/wiki/Permutation#k-permutations_of_n

**Intuition:** We start by considering all `n!` permutations of the set. But we
are only interested in the *k* first items of these permutations. Amongst all
permutations, there are multiple that start with the same *k* items. How many of
these are there?

Well, the permutations that have the same first *k* items must have a different
permutations of their *n-k* last items. With the formula for permutations, we
know there are `(n-k)!` ways to form permutations of a set of *n-k* items.

So by dividing the total number of permutations (`n!`) by the number of
permutations of the last *n-k* items (`(n-k)!`), we only keep one permutation
per possible k-permutation, and that is our answer.

### (k-)Combinations

The are `C(n, k) = n! / (k! * (n-k)!)` ways to pick *k* items from a set of size
*n*. For other mathematical notations, see [here][combi-notation].

[combi-notation]: https://en.wikipedia.org/wiki/Combination#Number_of_k-combinations

**Intuition:** We start from the `n! / (n-k)!` k-permutations of the set. These
have the right size, but they take ordering into account. This means the
combinations are counted multiple times, with different ordering. How many
ordering of each combination are there?

A combination is just a subset of size *k* of the whole set. With the formula
for permutations, we know there are `k!` ways to order the items of this set.

So by dividing the number of k-permutations (`n! / (n-k)!`) by the number of
permutations (`k!`) for each combination, we end up getting the number of
combinations!
  
--- 
  
## Sets of Distinct Items, with Repetition

By repetition, we mean that we change the basic rule of the last section: once a
item has been picked from the set, we put it back and are free to pick it again,
as many times as we like.

This time, looking at the number of permutations of a whole set doesn't make
sense anymore, as we put back each item after picking it.

Let's look at the other two questions in the presence of repetitions:


### k-Permutations with repetitions (or n-tuples)

There are `n^k` ways to order *k* items from a set of size *n*, with repetition.

**Intuition**: each time we pick an item, we have *n* possibilities, and these
possibilities just multiply for each item we pick.

For instance, for a set of two balls {1, 2}, there are `2^3 = 8` ways to pick 3
balls: 111, 112, 121, 122, 211, 212, 221, 222.

### (k-)Combinations with repetitions (or k-multicombination or multisubset)

There are `CC(n, k) = C(n+k-1, k) = (n+k-1)! / (k! * (n-1)!)` ways to pick *k*
items from a set of size *n*, with repetition. For the proper mathematical
notation, see [here][multicombi-notation].

[multicombi-notation]: https://en.wikipedia.org/wiki/Combination#Number_of_combinations_with_repetition

**Intuition:** This formula is rather harder than the rest, and so the intuition
is a bit more indirect.

The idea is that each k-multicombination can be seen as a sequence of *k* stars
and *n-1* separating bars. Basically, the bars define *n* separated intervals
(for instance `1|2|3`). Each interval corresponds to an item in the set, and the
number of stars (zero or more) in that interval corresponds to the number of
times that item was picked from the set.

So for instance, `***|*||*` represents a way to pick 5 (*k*) items from a set of
4 (*n*) items. In this particular solution, the first item is picked thrice, the
third not at all, and the other two only once.

So if we want to know the number of k-multicombinations, the problem reduces to
that of counting the number of such sequences. The sequences will have length
*n+k-1*, and there are as many sequences as ways to pick the position of the *k*
stars within the sequence. That is a combination! In particular, it is `C(n+k-1,
k)`, and the rest is just applying the combination formula.

---

## Picking From Multiple Sets

Before we get to the somewhat harder problem of picking in sets that contains
multiple copies of the same items, let's see what happens when we pick from
multiple distinct sets.

We want to answer questions like: how many ways are there to pick 3 balls from
my first pit containing 10 balls, and 4 balls from my second pit containing 8
balls.

It's very simple: since picking from each set is independent, we just compute
the two combinations, then multiply them: we can pair any combination from the
first set with a any combination from the second set.

The same works for permutations, and we can even mix the two kinds. Just
remember: when two number of possibilities are independant (all combinations of
the two set of possibilities are valid), you can just multiply them.

---

## Multisets

In what follows, we consider multisets: sets that have repeated items.

We always consider a multiset of size *n* containing *m* kind of items, such
that there are *k1*, *k2*, ..., *km* copies of the first, second, ..., last
item. Note that `k1 + k2 + ... + km = n`.


### Permutations of Multisets

There are `n! / (k1! * k2! * ... * km!)` ways to order the elements of a
multiset.

This formula is also called the "multinomial coefficient".

**Intuition**: There would be `n!` ways to order the items of the multiset, if
we considered each item to be unique.

Let's consider the first kind of items (let's say "red balls"). All
configurations that have red balls in the same positions are identical. For each
of our `n!` permutations, how many have the red balls in the same position,
except with different red balls? This is equivalent to asking to asking how many
ways there are to distribute the red balls in the "red slots". This is the same
as asking how many ways there are to order all the red balls, which is a simple
permutation: `k1!` ways.

Now we know there are `n!/k1!` permutations in which we do not distinguish
between the red balls, but still distinguish between all the other balls
individually. To obtain, the final result, the same process must be performed
for each kind of ball, successively divising until we obtain the final formula:
`n! / (k1! * k2! * ... * km!)`.

### k-Permutations of Multisets

This is **much** more complicated than what we'd seen so far. A formula can be
derived, but it is unwieldy.

I will still try to give some intuition, but if you're after easy to use
formulas, feel free to skip this.

Observe that if we pick *k* items from our multiset such that `k < k1, k < k2,
..., k < km`, then the problem is essentially that of k-permutations with
repetition, and there are thus `m^k` such permutations. The reason is that we
can never run out of any kind of item.

When this condition doesn't hold anymore, we would like to still start from
`m^k` hypothetical permutations, but remove from this total the permutations
where we picked more of a kind of item than there were in the multiset. This
seems easy, but there is a problem: some of the permutations that have too many
of the first kind of items may also have too many of the second kind of item. We
should not remove them twice!

Let's call *TM1*, *TM2*, ..., *TMm* the number of permutations where there are
Too Many of the 1st, 2nd, ..., mth item. Computing these values is not trivial:
for each *TMi*, we have to sum all k-combinations of *x* items amongst *k*, for
all *x* such that `ki < x <= k`.

When we have two kind of items, the simplified formula is: `m^k - TM1 - TM2 +
TM(1,2)`.

The meaning of *TM(1,2)* here is "number of of permutations where there are too
many of the first kind of item AND too many of the second times of item". Those
permutations are actually substracted twice (once via *TM1*, once via *TM2*) and
so need to be added back.

What about three kind of items? It's `m^k - TM1 - TM2 - TM3 + TM(1, 2) + TM(1,
3) + TM (2, 3) - TM(1, 2, 3)`

We now have three combinations of item kinds to consider. But after adding back
these permutations, we still aren't done! Consider the permutations where we
have too many of all three kind of items. We have removed them thrice (*TM1*,
*TM2*, *TM3*) and added them back thrice (*TM(1, 2)*, *TM(1, 3)*, *TM(2, 3)*),
so we need to remove them one final time (*TM(1, 2, 3)*).

The more kinds of items you have, the crazier it gets. Not to mention that all
these *TM* values are hairy to compute by themselves. Still easy stuff for a
computer to do, but don't try this by hand.

This principle of removing and adding back duplicates is known as [The
Inclusion-Exclusion Principle][inex]

[inex]: https://en.wikipedia.org/wiki/Inclusion%E2%80%93exclusion_principle

### k-Permutations of Multisets with Repetition

This is actually easy! Because repetition is allowed, it doesn't matter how many
of each kind of item there is. The answer is thus the same as the number of
k-permutations with reptition for a set that would have only one of each kind of
item: `k^m` (where *m* is the number of kinds of items).

However, there is a pitfall: while all `k^m` k-permutations are possible, they
aren't all equiprobable — they don't all have the same probability to be
selected randomly. The probabilities for each k-permutation will depend on the
number of items of each kind.

### k-Combinations of Multisets

This has just the same problem as counting the number of k-permutations of a
multiset, the only difference being we do not consider ordering.

The reasoning is much the same, so I shall say no more of it.

### k-Combinations of Multisets with Repetition

This, in turn, can be obtained in much the same way as the number of
k-permutations of multisets with repetition.

Namely, there are `CC(m, k) = C(m+k-1, k) = (m+k-1)! / (k! * (m-1)!)` such
k-combinations. And again, not all of them are equiprobable.

---

## Probabilities

Combinations and permutations are often used for deriving the probability that a
class of event will occur.

The general recipe goes something like this:

1. Derive the number of configurations that match the class of events (e.g.
   drawing three heart cards from a full deck of cards)
   
2. Derive the total number of configurations (e.g. the number of ways to draw
   three cards from a full deck of cards)

3. The ratio between (1) and (2) is your probability.

So to take our example, there are `C(52, 3)` ways to draw three
cards out of a full 52-cards deck. There are `C(13, 3)` ways to pick three
hearts cards from all heart cards in the deck, so that's also the number of
scenarios in which we pick three cards from our full deck.

So there is a `C(13, 3) / C(52, 3) = 0.013 = 1.3%` probabability to pick 3 heart
cards from a full deck.

Remember you can multiply scenarios if they are independent in order to get the
total number of scenarios. This corresponds to an AND within a scenario. For
instance, the probability to draw three red cards and three black cards from a
full deck. (Answer: `C(26, 3)^2 / C(52, 6)`)

You can also add scenarios when they are independent. This corresponds to an OR
within the scenario. Example: There are 12 balls in a bag, 3 of them are red, 4
of them are green and 5 of them are blue. We randomly take out 3 balls from the
bag at the same time. What is the probability that all three balls are of the
same colour? (Answer: `(C(5, 3) + C(4, 3) + C(3, 3)) / C(12, 3)`.

Beware of scenarios that are not independant. For instance, if you search the
probability to draw four cards, three of which are red, and one of which is a
figure, you can't just multiply the probability to pick three red cards and the
probability to pick a figure: the figure might be one of your red cards!

There are ways around these issues, and we already mentionned the [The
Inclusion-Exclusion Principle][inex]. I'm afraid that in intricate cases, there
is no substitute for some thinking.

---

More information:
- [Combinations][combination]
- [Permutations][permutation]

[combination]: https://en.wikipedia.org/wiki/Combination
[permutation]: https://en.wikipedia.org/wiki/Permutation
