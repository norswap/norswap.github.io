---
layout: post
title: "How rollups scale Ethereum"
---

From the [overview](https://hackmd.io/ZJR05zr-SP-tm1D9aqKJaA):

> Ethereum's limited resources, specifically bandwidth, computation, and
> storage, constrain the number of transactions which can be processed on the
> network, leading to extremely high fees. Scaling Ethereum means increasing the
> number of useful transactions the Ethereum network can process, by increasing
> the supply of these limited resources.

But how do rollups increase these resources? To understand this, we first need
to give some details about layer-1 (L1) Ethereum.

## State in L1 Ethereum

The size of the L1 state [as per summer 2021][size-src] was around 35GB.
However, during execution, the state needs to be stored in a [Merkle Patricia
Tree][MPT] (MPT), which takes the effective stored size to 100GB. This size is
expected to grow by 50GB per year, assuming the Ethereum [gas limit] stays
constant. These amounts does not even include historical state, some of which
**must** be kept to be able to process [chain reorganizations][reorg]. A node
must also keep at least some recent block header data.

Currently, core developers are not increasing the gas limit because we expect
higher throughput to cause faster state growth.

Still these numbers are manageable. 4TB SSD drives can be purchased for 400$ or
less. So why don't we just increase the gas limit?

[size-src]: https://youtu.be/LjGPCX2V1qk?t=267

## Why not increase the gas limit?

There are two reasons. The first is a commitment to keep Ethereum as
decentralized as possible, which includes making it possible for as many people
as possible to validate the network. We could increase the gas limit and require
every validator to spend a few thousand dollars to participate and this wouldn't
really decrease the security of the network. However, the same kind of reasoning
could be repeatedly applied to take us to a situation where you'd need to rent
in a data center to validate the network. This is extremely undesirable, because
it would let a small number of majority actors (e.g. staking pools) collude with
very few people noticing.

Let me give just one possible scenario. A majority cabal of staking pools could
claim to run a jointly-developed custom client, which so happened to have a
"subtle bug" that associates of the pools are able to exploit for profit. The
few remaining honest actors need to detect and then identify the problem — are
the pools or the other validators correct? The pools could make this
investigation difficult, and by the time the "bug" surfaces, the chain has moved
on so far that a fork becomes unthinkable. The pools can maintain plausible
deniability by claiming this was an innocent bug.

Like a lot of things in the blockchain space, this is a social problem as much
as a technical one. One reason more eyes on the chain is better is because it
can cause more outcry in case of fraud, and give legitimacy to the correct fork.

The second reason we don't want to increase the gas limit is [light clients].
Light clients are clients that can validate the network but are not required to
store the state. Instead they can request the state from the network and
validate it against state roots stored in recent block headers. Light clients
allow reducing the reliance on centralized state providers like Infura.

[MPT]: https://github.com/norswap/nanoeth/tree/master/src/com/norswap/nanoeth/trees/patricia#readme
[gas limit]: https://ethereum.org/en/developers/docs/gas/#what-is-gas-limit
[reorg]: https://www.paradigm.xyz/2021/07/ethereum-reorgs-after-the-merge/
[light clients]: https://www.parity.io/blog/what-is-a-light-client/

> **Aside: how light clients work**
>
> A light client needs to start with a trusted block header (either coming from
> an initial sync or trusted source). Let's assume that this hash is a
> semi-recent block hash, updated each time you use your light-client-enabled
> wallet. Then, the next time you use your wallet, you need to get all the block
> headers between that trusted header and the current head of the chain. There
> are solutions to validate these headers in both proof-of-work and
> proof-of-stake, but let's focus on the latter, as it is Ethereum's future.
>
> To verify a block header, you'll need to determine that the block was indeed
> signed by known Ethereum validators (stakers). The validator data is small
> enough that it could be kept locally, or you can request it from the network
> and validate it against the trusted block header.
>
> Once you're caught up with the chain (which should be fast unless you haven't
> opened your wallet in months/years), you can speculatively execute
> transactions locally, or even execute whole new blocks yourself. During these
> executions, you'll need to request the state from the network, which you can
> again validate against the state Merkle root in the most recent block header.
>
> This state can even be obtained from a centralized provider. The difference is
> that you do not need to trust him anymore: now you can verify the state
> against block headers, and you run the computations yourself.

Light clients are expected to run on user's machines (laptops, cell phones) and
only sporadically (e.g. when using a wallet). Clearly this puts a limit on
storage, computation and bandwidth. The storage is solved by getting the state
from the network, but this further constrains bandwidth.

Increasing the gas limit too much would overwhelm light-client's ability to
catch up and keep up with the chain, in terms of bandwidth and computation.

Finally, light clients help keep Ethereum decentralized by creating more
validators. Light clients associated with wallets are a formidable deterrent
because it means these wallets won't transact on fraudulent chains, even if they
are supported by a majority of miners/stakers. Vitalik Buterin makes this point
[here][vitalik-users].

[vitalik-users]: https://vitalik.ca/general/2021/05/23/scaling.html#its-crucial-for-blockchain-decentralization-for-regular-users-to-be-able-to-run-a-node

## Enter Rollups

I first want to acknowledge the fact that how rollups scale Ethereum — while
preserving its security guarantees — is not as straightforward as it is often
made out to be.

The scaling property of rollups falls out from two facts:

1. A rollup needs orders of magnitude less validators than L1 to maintain its
   security. As long as a single honest validator does its job, the network will
   remain secure.
2. State growth can be spread between multiple independent rollups.

Let's look at (1) first. In an [optimistic rollup], the rollup will be secure if
there is always a validator that can submit a fraud proof for every detected
sequencer fraud. Therefore, it is okay to increase the requirements needed to
run these validators, as long as motivated entities and individuals are able to
run them. Note also that many entities have a vested interest in running these
validators, because they derive value from the rollup: data and insight
providers like Infura, The Graph, Dune Analytics; as well as projects building
on top of the rollup. Unlike in my "evil staking pools" scenario, a majority of
bad actors is no longer able to get away with fraud!

In a [zk rollup], you do not need validators at all for security (you might need
them for data availability however, depending on the architecture of the
rollup), but you need to trust the code of the zk verifier smart contract. While
no external validators are needed, the requirements on the prover (the zk
pendant of the sequencer) are extreme, as building the zk proofs is very costly.

Regarding (2), this lets different validators verify different parts of the
state, hence not imposing the burden of the extra state of every rollup on every
validator. Because of (1), we know that it's okay for each rollup to have many
less validators than L1. This is also the insight behind [sharding] — though in
this case the reduced validator requirement does not apply and is solved with
[random committee selection] instead.

[optimistic rollup]: https://vitalik.ca/general/2021/01/05/rollup.html
[zk rollup]: https://vitalik.ca/general/2021/01/05/rollup.html
[sharding]: https://ethereum.org/en/eth2/shard-chains/
[random committee selection]: https://vitalik.ca/general/2021/04/07/sharding.html

## In Summary

We can't just raise the gas limit to scale Ethereum, because that would raise
hardware requirements for validators, and the chain needs to be validated as
broadly as possible to avoid a collusion of majority actors. It would also
preclude the introduction of light clients to break our reliance on centralized
data providers.

Rollups help scale Ethereum because they require order of magnitude less
validators than L1 to stay secure (via the use of fraud proofs or zero-knowledge
proofs), hence the requirements for validators can be increased. Additionally,
the state growth between multiple rollups that can be validated separately.
