---
layout: post
title: "ZK Rollups vs Optimistic Rollups"
---

This was originally a [tweet thread][thread] that I have reproduced here for
discoverability and archive purposes (the copy was done on 23 October 2022).

[thread]: https://twitter.com/norswap/status/1494763568843132931

I've only slightly reformatted the text (mostly links) and updated the line of
code statistics.

--------------------------------------------------------------------------------

1/ At EthDenver, people keep asking me on my perspective on optimistic rollups
vs zkRollups. Unfortunately, zkRollups have managed to occupy the whole
narrative space, so here's a take that is a bit more nuanced!

2/ The first advantages of zkRollups is a lower L1 calldata part of the fee.
There a two important caveats:

- The advantage is probably less than you think, see [this thread to understand why][less].
- Optimistic rollups have an advantage in non-calldata L1 cost, and in L2 cost.

[less]: https://twitter.com/norswap/status/1494456477246844928

3/ A zkRollup needs to run the prover for every transaction, which has massive
overheads (~ 10000x). On the other hand, [Cannon]'s MIPS-compiled validator has
10x overhead, and this would disappear if we ran it on MIPS hardware.

[Cannon]: https://github.com/ethereum-optimism/cannon/

4/ zkRollups also need to verify the zk proof on chain, which entails L1 gas
costs on top of the calldata. The next version of Optimism (Bedrock) is going to
be almost 100% calldata cost.

5/ We're working hard to lower L1 calldata costs for all rollups. We want to
help bring "blob-carrying transactions" to Ethereum in the Shangai hardfork.

See Vitalik Buterin's [explanation of blobs][blobs] for more details.

[blobs]: https://notes.ethereum.org/@vbuterin/blob_transactions

6/ With blobs, calldata costs would likely lower 1Norswap 🏴‍☠️🔴✨
@norswap
·
Feb 1800x (since rollups would be
the only ones seriously competing for this calldata space).

Suddenly, non-calldata costs would become dominant, and opRollups would have the
upper hand!

7/ To be fair, this would likely revert in the long term as rollups become the dominant way to transact.

But it's still not clear to me that zkRollups will necessarily be cheaper, and
it's downright doubtful they will be significantly cheaper.

8/ As an aside, blobs are like a primitive version of "danksharding" (named after the wonderful @dankrad
), which is itself an easier version of full sharding. Find all about this
[here][danksharding].

[danksharding]: https://notes.ethereum.org/@hww/workshop_feb_2022

9/ The second advantage of zkRollups is the absence of a withdrawal period.

This advantage is also a curse. You might know that Optimism recently paid the
[largest bug bounty][bounty] in history (2M$) for an infinite money bug.

[bounty]: https://twitter.com/optimismFND/status/1491821983796895747

10/ But if the bug had been exploited, the withdrawal period would have allowed
us to rollback the chain to mitigate the damage.

11/ At the moment this is possible because the system is permissioned (as are
all rollups), but in the future, some form of governance could easily take this
decision within 7 days.

12/ Economic bridges provide enough liquidity for most uses, and would be rekt
in case of such a hack, but they do not have enough liquidity for an attacker to
drain the chain.

13/ If this happened on a zkRollup instead, the exploiter could just immediately
drain the whole rollup.

The zkProof wouldn't save you: it's happy to prove a buggy program/contract ran correctly.

14/ What about some advantages of opRollups?

For one, they're much simpler to understand and audit.

They are only a handful of people in the world capable of auditing the zk prover and verifier logic.

15/ Not only that, but optimistic designs can be incredibly tiny and elegant.

In Bedrock, we're on track to implement the system with [less than one thousand
lines of code on top of Geth][changes].

[changes]: https://github.com/ethereum-optimism/op-geth

16/ The node itself (the part responsible for deriving the L2 chain from L1) is
less than 20k lines of code.

We could probably cut that a lot if we weren't using Go and its notoriously
verbose error-checking 😁

17/ To be clear, I like zero knowledge proofs. We're not shy about using them,
if and when it makes sense.

e.g. I'm thinking about using a zkProof to aggregate ECDSA signatures & reduce
our calldata size. (Hit me up if you know how!)

18/ I wish a lot of success to our zk competitors. The improvement they make to
the technology is a net positive for all of us.

But to claim that ZK is the only way in the future (and even moreso, the only
way now) is intellectually dishonest. The truth is much more nuanced.

19/ tl;dr

- opRollups are cheaper on non-calldata cost
- opRollups will be cheaper with blobs transactions
- long-terms fees are less clear, but there shouldn't be a huge difference
- the withdrawal period is a protection against attacks
- opRollups MUCH easier to audit
