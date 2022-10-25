---
layout: post
title: "AMM Meditations 🍃"
---

This was originally a [tweet thread][thread] that I have reproduced here for
discoverability and archive purposes (the copy was done on 25 October 2022).

[thread]: https://twitter.com/norswap/status/1548122970903654411

I've only slightly reformatted the text (mostly links), otherwise this is the
original version.

--------------------------------------------------------------------------------

1/ I wonder how many people realize a volatile-vs-stable AMM position is an
anti-leveraged position whose value varies with the square root of the change in
price of the volatile asset. (In exchange for this reduced exposure, you get
yield.)

2/ If the price of ETH is multiplied by X (e.g. X=4 or X=1/4), the value of an
ETH-USD position will be multiplied by sqrt(X) (e.g. 2 or 1/2).

3/ Why? Because of the x\*y=k equation. Assuming x is the volatile and y is the
stable: If x is multipled by X (selling a bunch of the volatile), y must be
divided by X such that x\*X\*y/X=k.

4/ The price of the volatile is given by y/x. After selling the volatile:
(y/X)/(x\*X) = (y/x)/X^2.

The value of the LP position is initially 2\*y. After selling the volatile:
2\*y/X.

So the price is divided X^2, but the LP position value only by X.

5/ However, the impermanent loss is only (1 + X)/2 - sqrt(X), because only half
of the initial LP position's value was in the volatile asset.

(This number is a multiplier of initial LP position value.)

6/ How bad does impermanent loss get?

On the up side, ~2.5% for a 50% price increase, ~8.5% for a 2x, 50% for a 4x.

On the down side, ~4.2% for a 50% price decrease (halving), 12.5% for a 75%
decrease (price divided by 4).

7/ Notice the asymmetry: you lose less on the down side, but that's because you
can never lose more than 50% of the initial LP value (if you held and the
volatile went to 0, you'd be left with 50c on the dollar).

8/ You can ask google [to plot this function][plot] btw (make sure to zoom out
the plot).

[plot]: https://www.google.com/search?q=(1%2BX)/2%20-%20sqrt(X)

9/ Note that these numbers are slightly different (larger) than what you'd get
with a calculator like [https://baller.netlify.app](https://baller.netlify.app),
because they're multiplier (%) of the initial LP position value, whereas the
calculator gives you a % of the asset value if held.

10/ Anyway, what do these numbers mean? It means that if you expect that the
price could move 4x up or down, you should be getting 50% APY. In a world where
$ETH can do that, so can most tokens.

11/ But who's getting that? Maybe if you're lucky and you're super early to a
good project. Otherwise LPing on a inflationary shitcoin that is slowly or
not-so-slowly going to 0 — but then you have another problem.

12/ LPing a a volatile-stable pair is a a sucker's game, and I do not get why
people do it.

UniV3 was going to fix this, but [it's not clear anybody is consistently beating
impermanent loss in ETH-USDC][ethusdc] (500M+ TVL).

[ethusdc]: https://twitter.com/0xdoug/status/1512296324036759557

13/ On the other hand, stock market (order book) market makers consistently make
money. On-chain liquidity that does not rely on off-chain agents IS NOT A SOLVED
ISSUE.
