---
layout: post
title: "Velodrome and why it's a superior system for incentivizing liquidity"
---

This was originally a [tweet thread][thread] that I have reproduced here for
discoverability and archive purposes (the copy was done on 24 October 2022).

[thread]: https://twitter.com/norswap/status/1533991540896321536

I've only slightly reformatted the text (mostly links), otherwise this is the
original version.

--------------------------------------------------------------------------------

1/54🧵 Thread on [@VelodromeFi][twitter] and why it's a superior system for incentivizing
liquidity.

[twitter]: https://twitter.com/VelodromeFi

2/ Liquidity is super important for project tokens. A lack of liquidity makes
the token price too volatile. It also prevents investors for exiting, which
makes them wary to invest in the first place.

3/ (And more cynically, such a liquidity pool also doubles as another use case
for the token, to prevent excessive selling.)

4/ The problem is that, for unpegged pairs, being a liquidity provider (LP)
sucks, because of impermanent loss (IL). Price goes up? You would have been
better holding and not LPing. Price goes down? Same thing.

5/ As an LP, you are the counterparty of adversely selected trades. You end up
owning more tokens when price decreases, and less tokens when price increases.

6/ The IL numbers are not egregious, but can easily outpace fee APY. You can
play with this app to get a sense:
[https://baller.netlify.app/](https://baller.netlify.app/)

7/ For this reason, projects need to incentivize liquidity. Usually, this is
done by bestowing tokens on LPs, to increase APY and make IL risk worthwhile.

8/ In this context, Velodrome and its predecessors/competitiors ([@CurveFinance][curve] +
[@ConvexFinance][convex], [@solidlyexchange][solidly]) offer two things:

[curve]: https://twitter.com/CurveFinance
[convex]: https://twitter.com/ConvexFinance
[solidly]: https://twitter.com/solidlyexchange

1. A marketplace for liquidity: no need to roll you own pools & incentive logic,
   easy to advertise to prospective LPs

9/

2. The opportunity to purchase 1$ worth of incentive for less than 1$ worth of
   project token.

10/ How does that work? Every voting period (one week for Velodrome), token
rewards ($VELO) are emitted and distributed amongst the LPs of the liquidity
pools on velodrome.

11/ The amount of rewards per pool is decided by a vote. A pool receives an
amount of reward proportional to its share of the total vote. To vote, users
have to lock their $VELO (for up to 4 years, longer locks beget more voting
power).

12/ Multiple strategies are possible. Projects can just acquire $VELO directly
and lock it: this lets them direct a stream of future emissions to their pools.
The point being for the price paid for $VELO will be less than the value of all
future emissions.

13/ This can also be good if projects are more confident about the future price
of $VELO than of their own token's. Instead of printing more and more token for
liquidity rewards (creating a death spiral), they can simply rely on the
emissions.

14/ Alternatively, they can "bribe" existing lockers for their votes, by
assigning them rewards in their project tokens. This can be appealing to
projects, even early on, because they don't need to sell a big chunk of project
token at once to finance the purchase of $VELO.

15/ Here too, there is a possibility to get 1$ of $VELO LP reward for less than
1$ of project token bribe.

To make a profit (and ignoring at the moment fees and rebases), lockers want to
earn more per locked $VELO than the dilution created by the $VELO emissions.

16/ Each emitted $VELO dilutes holders by (1 / (oldTotalSupply + 1)). So the
minimum non-dilutive bribe per $VELO bribed is (veloPrice \* veloEmitted \* (1 /
(oldTotalSupply + 1)).

17/ If every $VELO was locked and its vote was bribe-sensitive, you'd have to
bribe one $VELO worth per $VELO emitted.

The key to capital efficiency for projects here is that not all $VELO is locked
(only ~50% atm, I expect this to increase).

18/ Furthermore, not every locker is bribe-sensitive: project that bought $VELO
to incentivize their pool will not vote on other pools.

Also $VELO locked for less than 4 years does not get maximum voting power.

19/ Therefore, in the worst/best case (depending on whose perpective you adopt),
projects get a discount by diluting non locked $VELO, bribe-insensitive $VELO,
and (to a smaller extent) short-duration $VELO lockers.

20/ We should also mention that $VELO lockers also benefit from a "rebase":
token accrued every voting period that are supposed to protect them from
dilution. The rebase amount for each voting period is given by this formula:

21/ (veVELO.totalSupply ÷ VELO.totalsupply)³ × 0.5 × Emissions

So if half of all $VELO is locked, lockers will collectively received 1/16
(6.25%) of all emissions as extra $VELO. This would be 36% at 90% locked and 50%
at 100% locked.

22/ Why do I say "supposed" above? Well [just like in OlympusDAO][olympus], rebases just
make you run in place faster.

[olympus]: https://twitter.com/norswap/status/1498358050620514304

However, they do have the net effect of diluting non-locked $VELO faster
compared to locked $VELO.

23/ Note that bribe-insensitive $VELO lockers (usually projects) are not
necessarily worse for wear: as stated above, the purchasing assumption was that
the total value of future emissions would exceed the initial purchase price.

24/ $VELO non-lockers could also be alright, assuming they are $VELO LPs (the
only other use case for $VELO at the moment) and that sufficient emissions are
directed toward their pool.

25/ The (veloPrice \* veloEmitted \* (1 / (oldTotalSupply + 1)) formula (which
actually needs to be adjusted for the rebase!) from above merely represents a
level of interest for bribes.

26/ This level is not particularly an attractor however. Prices could be lower
if there too much emissions compared to projects appetite for liquidity rewards.

If that's not the case, the bribes total should be higher as projects compete
for these emissions.

27/ In fact, if the demand for incentives outpaces the $VELO emissions, this
should in theory drive the bribe per $VELO emitted close to the price of $VELO.
Or even slightly above — as there is value in the convience of a turnkey
liquidity mining solution.

28/ Note here that $VELO being locked has an impact. If it wasn't, then bribes
being below the level of interest above for too long (because demand for
liquidity reward is too low) would cause people to sell $VELO.

29/ A falling $VELO price cause the total values of emissions to fall, which
would bring it back towards demand.

That system would be self-regulating, which the current one isn't because of the
lock. I'm not sure which one is actually better for the long-term price of the
token!

30/ So we've just described a system where projects save money, lockers make
money and LPs (include $VELO LPs) make money.

Have we broken financial common sense? Is this a good old ponzu? Who foots the
bill?

31/ For one, users via fees, which accrue to the lockers. But that's far from
the whole story in the short/medium-term.

Instead I think most of these profits come from the value of the $VELO token
itself.

32/ Just like $BTC (or in fact $USD) are not "backed" by anything, so is $VELO.
i.e. there is no redemption guarantee beyond what you can get on the market
(within the limitation of available liquidity, underscoring again why this is so
important).

33/ Instead, a good tokenomics analysis must look at reflective loops,
especially under extreme conditions.

34/ So what could go wrong? The price could tank. (e.g. as a bear market rolls
around)

35/ One bad thing about $VELO (and $CRV) is that its cashflows are mostly
effectively denominated in $VELO. i.e. the willingness of projects to bribe is
proportional to the market value of of emissions. So when the $VELO price tanks,
so should bribes.

36/ The iron rule (in a rational world...) is that the total value of bribes
should never exceed the value of $VELO emitted through the vote of bribed
lockers (+ a small premium representing the usefulness of the service, and
eventually some inertia).

37/ Now if the total bribe value is lower than the emitted $VELO (through bribed
lockers), then the total bribe value does not need to decrease.

However I would rate this unlikely in the long term, if we consider a situation
where the price just decreased significantly.

38/ (Somewhat similarly, projects saving money on accumulated $VELO depends on
the value of all future emissions.)

39/ This is somewhat mitigated by the fact that fees are independent of $VELO
price. This could help moderate downdrafts, or at least help establish a price
zone where $VELO is "cheap".

40/ This is a place where Velodrome (& Solidly) markedly improve on Curve, as
the fees accruing to the lockers brings price-independent value to the token.

41/ As an interesting data point, over the past 14 days, [Votium bribes for
Convex lockers][votium-bribes] were ~7.6M while [total curve fees][curve-fees]
were ~1.1M.

[curve-fees]: https://dune.com/mrblock_buidl/Curve.fi
[votium-bribes]: https://dune.com/rplust/Vote-Locked-Convex-Token-(vlCVX)-Bribes

42/ Another moderating force on the downside is that projects may be driven to
accumulate when the price decreases.

Why would they do this?

43/ For one, the original thesis remains unchanged: since emissions are
denominated in $VELO, the savings remains similar given a flat price.

(And even better if they anticipate the price slump to be temporary.)

44/ The second reason is that the drop in price likely saturated the bribe
capacity it wasn't already (see "iron rule" above). Emissions can no longer be
purchased without overspending. Accumulating $VELO is the only avenue left to
secure discounted liquidity rewards.

45/ (In this case, by amortizing the initial purchase over time via the value of
future emissions.)

46/ So as you can see, there are some moderating factors on the downside, and no
downwards spiral type effects.

47/ However I don't love that returns are mostly $VELO denominated. This means
that outside of periods of very low price (where fees effectively set a floor)
and periods of accumulation, the price is mostly beholden to external forces
(macro & cycles).

48/ That being said, it's quite possible that we are entering one such period of
accumulation as Velodrome just launched and Optimism is growing rapidly.

49/ There are many other interesting things I'd love to think & talk about on
the subject of Velodrome (e.g. how $VELO is locked as veNFT and what that
entails, or what a Convex-style layer could look like), but this is already
super long, so I'll stop here.

50/ I hope I did convince you that Velodrome is a good liquidity incentive
system, and that it at least deserves your attention!

51/ Obviously, none of this is financial advice. Don't trust what a random
internet stranger has to say, validate.

Disclaimers: I have small positions in both $VELO and $CRV/$CVX. I also worked
with the Velodrome team in my capacity as an OP Labs employee.

52/ A few useful links to conclude:

- [Dune dashboard with TVL & usage metrics](https://twitter.com/jpn_memelord/status/1533080509462487049)
- [vfat Velodrome farming calculator](https://vfat.tools/optimism/velodrome/)
- [Emission schedule](https://docs.velodrome.finance/tokenomics#emission-schedule)
