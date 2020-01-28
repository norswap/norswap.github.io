---
layout: post
title: The Big Nutrient Spreadsheet
---

As part of my journey into weightlifting ([1], [2], [3], [4]), I've been
increasingly interested in nutrition.

[1]: /weight-training
[2]: /weight-training-2
[3]: /weight-training-3
[4]: /weight-training-4

I thought to push this a bit further and try to figure out which nutrients I'm
getting in my diet, which I'm lacking, and how I can remedy that. I didn't quite
get around to that last part, but here are my results so far, as well as the
tech I built to help me (spoiler: it's a spreadsheet).

## (Essential) Nutrients

What does our body [actually need]?

- Fat (actually [essential fatty acids])
- Proteins (actually [essential amino acids])
- [Essential Vitamins] (13 of them)
- [Essential Minerals] (15 of them)

Additionally, [some substances][conditional] can be synthesized by our bodies but can be
(should be?) ingested directly, for instance [choline].

Some other substances are non-essential but you really want to have them, most
notably fibers.

And finally, yet other substance are non-essential but might have beneficial
effects, such as various [antioxidants].

And, it goes without saying, adequate calorie intake and hydration.

In this article I'm going to focus on the vitamins and the minerals

Why? First, it's more likely to have deficiency in those. It's also much harder
to reach the recommended daily intake values. Nevertheless, I've included some
remarks on fats in an [Appendix 1].

[essential fatty acids]: https://en.wikipedia.org/wiki/Essential_fatty_acid
[essential amino acids]: https://en.wikipedia.org/wiki/Essential_amino_acid
[actually need]: https://en.wikipedia.org/wiki/Nutrient#Essential_nutrients
[Essential Vitamins]: https://en.wikipedia.org/wiki/Vitamin#Recommended_levels
[Essential Minerals]: https://en.wikipedia.org/wiki/Mineral_(nutrient)#Roles_in_biological_processes
[conditional]: https://en.wikipedia.org/wiki/Nutrient#Conditionally_essential_nutrients
[choline]: https://en.wikipedia.org/wiki/Choline
[antioxidants]: https://en.wikipedia.org/wiki/Antioxidant
[Appendix 1]: #app1

## The Nutrient Spreadsheet

The goal was simple. First, to make a spreadsheet were each row was a food, and
each column was a nutrient. Second, to have a way to autofill the nutrient
values from some online database to avoid tediously copying ~30 values into a
spreadsheet for each food item I was interested in.

You can view the resulting spreadsheet with some food items [here][spreadsheet].

I used the same setup as [when I made a Fitbit spreadsheet][fitbit-sheet]: there
is an Observable notebook with controls that help filling the spreadsheet.

In particular, you get a food item you're interested in from [Food Data Central]
(or FDC for the hip kids — it's the best nutrient database I could find,
maintained by the US Department of Agriculture) and then instruct the notebook
to export the nutrient values to a row in the spreadsheet.

Unfortunately, FDC does not track *every* essential nutrients. I reviewed the
essential nutrients it does not cover, to make sure nothing too important was
left out — the result of that analysis is in [Appendix 2](#app2) (It's quite
interesting, I might extend the analysis to all essential nutrients sometime.)
Basically, you should be fine for all the nutrients not covered, especially if
you drink milk regularly. If not, maybe just check your iodine intake.

If you want to make your own spreadsheet, it's also possible! Fork this
[Observable notebook][public-notebook] and follow the instructions under the
"Setup" heading to create your own.

[spreadsheet]: https://docs.google.com/spreadsheets/d/1f9kR2aJmVRCyRsmB-CXURuy2Y4zkysuoNfl9uOM7NLw/edit?usp=sharing
[fitbit-sheet]: https://norswap.com/fitbit-google-sheets/
[Food Data Central]: https://fdc.nal.usda.gov/index.html
[public-notebook]: https://observablehq.com/@norswap/nutrition-spreadsheet

## Misc Remarks: Nutrients & Bio-Availability

An obvious question about this kind of analyzis is: are nutrients the only thing
that matters? To which I'd tend to answer "mostly, but".

First, some non-essential nutrients are quite important (such as fibers, as we
mentionned before). And because we can subsist on essential nutrients doesn't
mean we can't benefit from non-essential nutrients, or even non-nutrients such
as antioxidants.

Second, the co-occurence of nutrients and other substances matters a great deal.
In particular, it determines [bioavailability]: how much of the nutrients
present in food we can actually absorb, as well as how fast they can be absorbed
(the two being sometimes interrelated). For instance, liquid foods will be
absorbed much faster.

This is a factor to keep in mind when considering supplements, though a bit of
careful googling will help you a great deal. [For instance][curcumine], you'll
learn never to buy a curcumin supplement that doesn't also include piperine or
some lipids, because otherwise you won't actually absorb most of it.

(An important point to make is that you don't actually absorb all the nutrients
in real food either, and the intake recommendations do take this into account.)

In general, it's hard to know what matters and how (much) it will impact health.
I belabored this point in [my article about red meat][red meat]. If you have no
deficiencies, do not consume lots of well-known harmful substances (e.g. trans
fats) and keep your bodyfat in check, it's going to be very hard to ascertain if
(for instance) eating whole foods is going to be much better than drinking
[Soylent] in the long run.

[bioavailability]: https://en.wikipedia.org/wiki/Bioavailability
[curcumin]: https://examine.com/supplements/curcumin/
[red meat]: /red-meat/
[Soylent]: https://en.wikipedia.org/wiki/Soylent_(meal_replacement)

---

And that's it for today!

I still have to actually analyze what nutrients I am getting and not getting and
how I could fix the situation. I'm hoping to report on that at some point, but
it's not currently super high in my list of priorities.

---
---

<div id=app1></div>

## Appendix 1 - Notes on (The Many Kinds of) Fats

**Disclaimer:** These are just compiled notes from my own googling and
wikipedia'ing. They mostly reflect "the generally accepted idea" — I wouldn't
even go as far as to say "the scientific consensus", which I haven't research
(because it's harder).

There is a complex hierarchy of different kinds of fat:

- [Saturated Fat](https://en.wikipedia.org/wiki/Saturated_fat)
- [Unsaturated Fat](https://en.wikipedia.org/wiki/Unsaturated_fat)
    - [Monounsaturated Fat](https://en.wikipedia.org/wiki/Monounsaturated_fat)
        - [Omega-7 Fatty Acid](https://en.wikipedia.org/wiki/Omega-7_fatty_acid)
        - [Omega-9 Fatty Acid](https://en.wikipedia.org/wiki/Omega-9_fatty_acid)
    - [Polyunsaturated Fat](https://en.wikipedia.org/wiki/Polyunsaturated_fat)
        - [Omega-3 Fatty Acid](https://en.wikipedia.org/wiki/Omega-3_fatty_acid)
        - [Omega-6 Fatty Acid](https://en.wikipedia.org/wiki/Omega-6_fatty_acid)
    - [Trans Fat](https://en.wikipedia.org/wiki/Trans_fat)

Each category further includes multiple kinds of fatty acids.

Despite this variety, only two kinds of fatty acids are essential:
alpha-linolenic acid (ALA, an Omega-3) and linoleic acid (LA, an Omega-6 — note
the missing "n" when compared to ALA). We can synthesize the rest from those
two.

The consensus regarding fat is that the unsaturated fats are the "healthy" fats.
Saturated fats are not inherently bad, but increased consumption is linked with
heart disease (though [the studies are sometimes
contradictory][saturated-reviews]). Trans fats are mostly artificial, and those
artificial trans fats should be avoided as their consumption is strongly linked
to heart disease.

In general, Omega-3 are regarded as having a variety of health benefits, though
(a) [a lot of these claims are shaky][shaky-o3], and consuming a lot of omega-3
does not seem to procure additional advantages.

Besides ALA, the other two kinds of Omega-3 deserve a mention, namely EPA and
DHA (I'll spare you the full names). Both can be synthesized from ALA though at
low rates (8%) and the ability decreases with age, so it might be a good idea to
get them from your diet.

There is also some talk of optimal ratios between Omega-3 and Omega-6, though
without much substantiation. A typical western diet has 14-25 more Omega-6
compared to Omega-3, while some people advocate a 4:1 or even 1:1 ratio.

The 1:1 ratio seems crazy to me, as only some fishes and seafood (such as salmon
and mackerel) as well as some seeds (chia, flax) have more Omega-3 than Omega-6.
There are a couple others ([big list here][ratios]).

To top it off, it's quite hard to find precise ratios for animal sources,
because it depends on nutrition. For instance, beef will vary between a 2:1
ratio for grass-fed beef to 6:1 for grain-fed beef (I also found the
alternatives figures of 1:1 and 4:1, respectively).

In Belgium at least, finding what your beef is being fed is also quite hard. I
researched nutrition for the "Belgian blue bull" breed, and they seem to be fed
mostly beetroot and hay, depending on the seasons. This opens even more
questions: what is the nutritive impact of beetroots? Of hay ("grass-fed" beef
is allowed hay, but is it different from the stuff the cows graze from the
ground?).

As a side note, while finding omega-3 and omega-6 values is hard, it's almost
impossible to find usable nutritive values for omega-7 and omega-9.

It's probably a good idea to get more Omega-3, but there is scant evidence and
little urgence here.

Finally, we can talk about Cholesterol. Cholesterol is a lipid, but is not a
"fat" (which are chemically triglycerides).

There's HDL cholesterol ("good cholesterol") and LDL cholesterol ("bad
cholesterol", whose excess is likely to cause arterial narrowing). Like
omega-3/6, the key here might be in the ration between both. It also seems that
omega-3 and omega-7 could help with lowering LDL / increasing HDL.

Again, I haven't researched this. Someone on the LessWrong slack made the case
that high LDL wasn't bad if other markers (like omega-3/6 ratio) were okay. Just
googling for it you'll find [this][ldl-bad]:

> Consistent evidence from numerous and multiple different types of clinical and
> genetic studies unequivocally establishes that LDL causes atherosclerotic
> cardiovascular disease.

and [that][ldl-good]:

> High LDL-C is inversely associated with mortality in most people over
> 60 years. This finding is inconsistent with the cholesterol hypothesis (ie,
> that cholesterol, particularly LDL-C, is inherently atherogenic). [...]

At least, this suggests to me that *maybe* the story is not as simple as "LDL =
bad". Other factors may be at play, and correlations may pollute the studies.

[saturated-reviews]: https://en.wikipedia.org/wiki/Saturated_fat#Association_with_diseases
[shaky-o3]: https://en.wikipedia.org/wiki/Omega-3_fatty_acid#Health_effects
[ratios]: https://en.wikipedia.org/wiki/Fatty_acid_ratio_in_food
[ldl-bad]: https://academic.oup.com/eurheartj/article/38/32/2459/3745109
[ldl-good]: https://bmjopen.bmj.com/content/6/6/e010401

<div id=app2></div>

## Appendix 2 - Vitamins & Minerals Not Covered by FDC

FDC tracks most of the essential nutrients (and then some), but not all. Let's
talk quickly about these forgotten children.

#### Chloride (Cl)

Yes, it's the stuff they put in swimming pool, but it's also about 60% of what
table salt (NaCl) is made of by weight. The recommended daily intake is 2.3g and
you probably get that by salt only.

#### Chromium (Cr)

The recommended daily intake is 35 mcg (or μg — a microgram). The estimated
intake for European adults is 57-83 mcg/day while another study found that the
average for Mexican adults was 30 mcg/day. It's hard to get accurate estimate of
this element for food items because it depends very strongly on the soil used to
grow plants and the feed given to animals. Anyhow, your intake of this mineral
should be fine.

#### Fluoride (F-)

Yes, that's the stuff they put in toothpaste (or sometimes in the water supply
in the US). It's good for your teeth and bones... and after a cursory search I
couldn't really find what else it's good for. The recommended daily intake is 4
mg, and toothpaste will have at least 1000 ppm (part per million) of it — hence
about 1 mg of fluoride per gram of toothpaste. Black tea has about 0.8 mg/cup.
It's otherwise pretty rare and maybe that's good because this stuff isn't good
in excess. Just wash your teeth at least once a day and you'll be fine.

#### Iodine (I−)

The recommended daily intake is 150 mcg. Salmon has 28 mcg/100g. Seaweed
contains **tons** of it — kombu kelp up to 3k mcg/g, while wakame seaweed (the
neon green one you can get on the side at the Japanese) contains 40-60 mcg/g.
Yes, those figure are per *gram*. Milk also has a lot, about 250 mcg per liter.
Iodine is needed by the thyroid (at least 70 mcg to avoid problems).

#### Molybdenum (Mo)

Average daily intake varies between 120 and 240 mcg/day, which is higher than
dietary recommendation of 45 mcg, so don't worry too much about it. It's in
small amount (5-10 mcg) in many, many things, but there's a ton in liver (150
mcg / 100g) and a lot in cereals, bread, rice & almonds (20-30 mcg/100g).

#### Vitamin B12 (Cobalamine)

The recommended daily intake is 2.4 mcgg. Milk has 0.5 mcg/100mL. It's also
found in an [energy drink] I favor.

[energy drink]: https://fic.colruytgroup.com/productinfo/en/cogo/1828040
