---
layout: post
title: "Optimism Bedrock vs Arbitrum Nitro"
---

This is a really nerdy breakdown of the differences between [Optimism Bedrock 🗿](https://github.com/ethereum-optimism/optimism/blob/develop/specs/overview.md) and [Arbitrum Nitro 🚀](https://github.com/OffchainLabs/nitro).

This is all sourced from my reading of the [Nitro whitepaper](https://github.com/OffchainLabs/nitro/blob/master/docs/Nitro-whitepaper.pdf), and my intimate sensual knowledge of the Bedrock design.

This actually started a Twitter thread, but grew way way too big for that.

This gets very technical. If you want to follow & get confused, I recommend referring to the [Bedrock overview](https://github.com/ethereum-optimism/optimism/blob/develop/specs/overview.md) and [my presentation on our Cannon fault proof system](https://twitter.com/norswap/status/1552454352316547076), and of course the [Nitro whitepaper](https://github.com/OffchainLabs/nitro/blob/master/docs/Nitro-whitepaper.pdf).

**With this out of the way, let's dive in!**

First of all, the whitepaper is great and was a pleasure to read. I recommend checking it out for all interested.

Going into this, my impression was that Bedrock and Nitro share roughly the same architecture, with some smaller differences.

The paper by and large confirms this. Still, there are quite a few differences, including a few I didn't expect. These are what this thread is about!

# (A) Fixed vs variable block time

One of the most interesting and consequential things is that Nitro will work like the current version of Optimism, which has one block per transaction, and variable time between blocks.

We moved away from this because it was a departure from how Ethereum works, and a pain point for devs. Bedrock will have "real" blocks with a fixed block time of 2 seconds.

Irregular block times make quite a few common contracts wonky, because they keep time using blocks instead of the timestamp. This notably includes the Masterchef contract for distributing LP rewards that originated with Sushiswap.

I'm not sure why these contracts keep the time with blocks instead of timestamps! Ethereum miners have some leeway in manipulating timestamps, but clients will by default not build upon blocks that are too far away from the wallclock time (15s in Geth), so no problem.

Anyway, on Optimism this caused the [StargateFinance](https://stargate.finance/) incentives to run out months ahead of other chains, because they didn't account for this peculiarity!

The "one block per transaction" model has other issues. First, it's a lot of overhead for storing the chain (one block header per tx). Second, it means the state root needs to be updated after each individual transaction.

Updating the state root is a pretty expensive operation, whose cost is amortized when done over multiple transactions.

# (B) Geth as a library or as the execution engine

Nitro uses Geth "as a library" which is minimally modified with hooks to call the proper functionality.

In Bedrock, a minimally modified Geth runs standalone as the "execution engine" which receives instructions from the rollup node in the same way the execution layer receives instructions from the execution layer in Eth2. We even use the exact same API!

This has some important consequences. First we’re able to use other clients than Geth, applying a similar minimal diff on top of them. This is not just theory, we already have [Erigon](https://github.com/protolambda/erigon/tree/optimism) pretty much ready.

Second, this lets us reuse the whole Geth (or other client) stack, include at the networking layer, which enables things like peer discovery and state sync, without almost any additional dev work.

# (B) State storage

Nitro keeps some state ("the state of ArbOS") inside a special account (itself stored within the Arbitrum's chain state), using a special memory layout to map keys to storage slots.

(This is purely architecture, with no user impact.)

Bedrock doesn't really have much state in that sense, and what little it has is stored in ordinary EVM contracts (to be fair, you could implement the ArbOS state layout using the EVM, though that's not what I think they are doing).

When determining/executing the next L2 block, a Bedrock replica looks at:

- the header of the head of the L2 chain
- data read from L1
- some data in EVM contract on the L2 chain, currently only the L1 fee parameters

In Bedrock, nodes can crash and immediately gracefully restart. They don't need to maintain an extra databases, because all the necessary information can be found in L1 and L2 blocks. I assume Nitro works the same (the architecture makes this possible).

It's however apparent that Nitro does a little more bookkeeping work than Bedrock.

# (C) L1 to L2 message inclusion delay

Nitro processes L1 to L2 messages (what we call "deposited transactions" or just "deposits") with a 10 minutes delay. On Bedrock, they should usually be with a small confirmation depth of a few blocks (maybe 10 L1 blocks, so about 2 minutes).

We do also have a parameter called "sequencer drift" that allows the timestamp of an L2 block to drift ahead of its L1 origin (L1 block that marks the end of the L1 block range from which batches and deposits are derived).

We still have to decide the final value but we're leaning towards 10 minutes also, meaning the worst case is 10 minutes. However, this parameter is meant to ensure liveness of the L2 chain during temporary loss of connection to L1.

Usually however, deposits will be included immediately after the confirmation depth.

The Nitro paper mentions that this 10 minutes delay is to avoid the deposits from disappearing on L1 due to a re-org. This made me curious about an aspect that the paper does *not* talk about, and which is: how does the L2 chain handles L1 re-org. I think the answer is it doesn't.

This isn't unreasonable: post-merge there is an L1 finality delay of about 12 minutes. So if it's okay for deposits to lag 10/12 minutes behind, then this design works.

Because Bedrock tracks closer to L1, we need to handle L1 re-orgs by re-orging L2 if needed. The confirmation depth should avoid this happening too often.

Another minor difference there is that if the Nitro sequencer does not include a deposit after 10 minutes, you can "force include" it via an L1 contract call.

On Bedrock, this is not necessary: it's invalid to have an L2 block without including the deposits of its L1 origin.

And because L2 can only be 10 minutes (sequencer drift) ahead of the origin, a chain that does not include deposits after 10 minutes is invalid, will be rejected by validators and challengeable by the fault proof mechanism.

# (D) L1-to-L2 messages retry mechanism

Nitro implements "retryable tickets" for L1-to-L2 messages. Say you're bridging, the L1 part of the tx could work (locking your tokens) but the L2 part could fail. So you need to be able to retry the L2 part (maybe with some more gas) or you've lost your tokens.

Nitro implements this in the ArbOS part of the node. In Bedrock, this is all done in Solidity itself.

If you use our L1 cross-domain messenger contracts to send a transaction to L2, the transaction lands in our L2 cross-domain messenger which will record its hash, making it retryable. Nitro works the same way, it's just implemented in the node.

We also expose a lower-level way to do deposits, via our L1 Optimism Portal contract.

This doesn't give you the safety net of the L2 cross-domain messenger retry mechanism, but on the flip side, it means you can implement your own app-specific retry mechanism in Solidity. Pretty cool!

# (E) L2 fee algorithm

On both systems, fees have an L2 part (the execution gas, similar to Ethereum) and an L1 part (cost of L1 calldata). For its L2 fee, Nitro uses a bespoke system, while Bedrock re-uses EIP-1559. Nitro has to do this because they have the aforementioned 1 tx/block system.

We still have to tune the EIP-1559 parameters to make it work well with the 2 second block time. Today, Optimism charges a low & flat L2 fee (the L1 fee is 99% of the price anyway). I think we might have surge pricing too, but it never kicks in in practice.

An advantage of reusing EIP-1559 is that it should make it marginally easier for wallets and other tools to compute fees.

The Nitro gas-metering formula is pretty elegant though, and they seem to have put a lot of thought it.

# (F) L1 fee algorithm

What about L1 fees? This is a bigger difference. Bedrock uses backward-looking L1 basefee data. This data is pretty fresh, because it is delivered via the same mechanism as deposits (i.e. it's almost instant).

Because there's still a risk that the L1 fee will spike, we charge a small multiplier of the expected cost.

Fun fact: this multiplier (which we have lowered multiple times since launching the chain) is where all the current sequencer revenue come from! With EIP-4844, this will shrink, and revenues will come from (UX-preserving) MEV extraction instead.

Nitro does something rather much more complicated. I don't claim to understand all the intricacies of it, but the basic gist is that they have a control system that gets feedback from how much fees were actually paid on L1.

This means sending transaction back from L1 to L2 with this data. If the sequencer underpaid, it can start charging users less going forward. If it overpaid, it can start charging users more.

As an aside, you may wonder why we need to transmit fee data from L1 to L2. It's because we want the fee scheme to be part of the protocol, and open to challenge by fault proofs. Otherwise, rogue sequencers could DoS the chain by setting arbitrarily high fees!

Finally, transaction batches are compressed in both systems. Nitro charges the L1 fee based on an estimation of how well the transaction will compress. Bedrock currently doesn't do this, though we plan to.

Not doing this worsens the perverse incentive to cache data in L2 storage, leading to problematic state growth.

# (G) Fault proof instruction set

Fault/fraud proofs! Quite a few differences between what Nitro does and how Cannon (the fault proof system we're currently implementing to sit on top of Bedrock) will work.

Bedrock compiles to the MIPS instruction set architecture (ISA), Nitro compiles to WASM. They seem to do quite a few more transformation on the output than we do, owing to compiling to a subset of WASM which they call WAVM.

For instance, they replace floating point (FP) operations by library calls. I suspect that they didn't want to implement the gnarly FP operations in their on-chain interpreter. We do this too, but the Go compiler takes care of it for us!

Another example: unlike most ISA that only has jumps, WASM has proper (potentially nested) control flow (if-else, while, etc). The conversion from WASM to WAVM removes this to go back to jumps, again probably for the sake of interpreter simplicity.

They also compile a mix of Go, C & Rust to WAVM (in different "modules"), while we do Go only. Apparently WAVM allows "the languages' memory management not to interfere", which I interpret as each WAVM module getting its own heap.

Something I'm curious about: how they deal with concurrency and garbage collection. We're able to avoid concurrency fairly easily in minigeth (our stripped down geth) so maybe that part is easy (more on how Bedrock and Nitro use geth at the end of this article).

However, one of the only transformation we do on MIPS is to patch out garbage collection calls. This is because garbage collection uses concurrency in Go, and concurrency and fault proofs don't go well together. Does Nitro do the same thing?

# (H) Bisection game structure

The Bedrock fault proof will work on a run of minigeth that verifies the validity of a state root (actually an [output root](https://github.com/ethereum-optimism/optimism/blob/ab7ed0d43d77d2fd6723d0f4b9b056daca94071f/specs/proposals.md#l2-output-root-proposals-specification)) posted to L1. Such state roots are not posted frequently, and a such encompass the validation of many blocks/batches.

The bisection game in Cannon is played on the execution trace of this (long) run.

In Nitro, on the other hand, state roots are posted with each set of batches (*RBlock*) posted to L1.

The bisection game in Nitro is split in two parts. First find the first state root that challenger and defender disagreee on. Then, find the first WAVM instruction they disagree on in the validator run (which only validates a single transaction).

The trade-off is more hashing during Nitro execution (see (A) above), but less hashing during the fault proof: each step in the bisection game over an execution trace requires submitting a Merkle root of the memory.

Structure the fault proof like this also reduces the concern that memory will balloon in the validator, potentialy exceeding the 4G memory limit we currently have for running MIPS.

This isn't a hard problem to fix, but we need to be careful in Bedrock, whereas there is probably no chance that validating a single transaction can ever approach the limit.

# (I) Preimage oracle

The validator software used for fault proofs need to read data from L1 and L2. Because it will ultimately "run" on L1 (though only a single instruction), the L2 itself needs to be accessed via L1 - via the state roots & block hashes posted to L1.

How do you read from the state or chain (whether L1 or L2)?

A Merkle root node is a hash of its children, so if you can request a preimage, you can traverse the whole state tree. Similarly, you can traverse the whole chain backwards by requesting the preimage of a block header. (Each block header contains the hash of its parent.)

When executing on-chain, these preimages can be presupplied to the WAVM/MIPS interpreter in advance. (When executing off-chain, you can read the L2 state directly!)

(Note that you only ever need to access one such preimage, because on-chain you only execute one instruction!)

So that's how you read from L2, both on Nitro and Bedrock.

You need to do something similar for L1 however. Because transaction batches are stored in L1 calldata, which is not accessible from L1 smart contracts.

Nitro stores the hashes of its batches in an L1 contract (which is why their "Sequencer Inbox" is a contract and not an EOA like for Bedrock). So they at least need to do that, I'm not sure why it wasn't mentionned.

In Bedrock, we don't even store the batches hash (leading to some gas savings). Instead, we walk back the L1 chain using the L1 block headers, then walk down the transaction Merkle root to find the batches in the calldata.

(Again, on-chain, at most a single preimage needs to be supplied.)

Section 4.1 ends with a paragraph that reminds us that [Arbitrum invented the "hash oracle trick"](https://twitter.com/EdFelten/status/1488632545457618952). Credit where credit is due. Insecurity shouldn't be a reason to forget about the Arbitrum team's contributions!

# (J) Large preimages

The paper also tells us that the fixed upper bound for an L2 preimage is 110kb, but does not quote the figure for L1.

In Cannon, we have something called "the large preimage problem", because one of the potential preimage to invert is the receipts preimage, which contains all the data emitted by Solidity events ("logs" at the EVM level).

In the receipts, all the log data is concatenated together. This means an attacker could emit a ton of logs, and create an incredibly large preimage.

We need to read logs because we use them to store deposits (L2-to-L1 messages). This is not strictly necessary: Nitro avoids the issue by storing a hash of the message (it's more complicated than this, but the end result is the same).

We don't store a hash because of the significant cost to compute and store it. Around 20k gas to store and 6 gas per 32 bytes to compute. An average transaction is about 500 bytes, making a batch of 200 transactions cost about 20k gas to hash as well. At 2k$ ETH and 40 gwei basefee, the extra hashing and storage costs 3.2$. At 5k$ ETH and 100 gwei that's 20$.

Our current plan to solve the large preimage problem is to use a simple zk-proof to prove the value of some bytes within the preimage (since that's all an instruction needs to access in practice).

# (K) Batches & state roots

Nitro ties batches with state roots very strongly. They post a set of batches in an *RBlock* which also contains a state root.

Bedrock on the other hands posts its batches separately from the state roots. The key advantage is again reduced cost to posting batches (no need to interact with a contract or store data). This lets us post batches more often, and state roots less often.

Another consequence is that with Nitro, should an RBlock be challenged, the transactions it contains will not be replayed on the new chain.

In Bedrock, we're currently debating what to do in the case where a state root gets challenged: replay old transactions, or full rollback? (The current implementation implies a full rollback, but it’s likely to be changed before fault proofs are rolled out.)

# (L) Misc

Smaller, less consequential differences:

**(i)** Nitro allows individual transactions posted by the sequencer to be "garbage" (invalid signatures, etc). To minimize the changes to Geth, we always throw out batches that contain any garbage.

The sequencer is always able to find those in advance, so lingering garbage entails either misbheaviour or bug. The sequencer runs the same code as the fault proof, so their definitions of what's invalid should be identical.

**(ii)** Nitro introduces precompile contracts, notably for L2-to-L1 message passing. We currently don't use any precompiles, preferring them "pre-deploys", i.e. actual EVM contracts that exist at special addresses from the genesis block.

Turns out we can do what we need just fine in the EVM, and this makes the node logic slightly simpler. We're not religiously opposed to precompiles though, maybe we'll need one at some point.

**(iii)** The Nitro fault proof does a d-way dissection. The proof-of-concept Cannon implementation uses a bisection, but we'll probably move to a d-way dissection too.

There is a very nice formula in the paper that explains the optimal value of *d* based on fixed and variable costs. I wish they had included concrete examples of how they estimate these costs in practice however!

# Coda

No grand conclusion! Or rather: draw your own :)

If you enjoyed this, follow me [on Twitter](https://twitter.com/norswap) for
more of the same and be notified of new articles.
