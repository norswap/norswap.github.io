---
layout: post
title: "How Cannon Works"
---

This was originally a [tweet thread][thread] that I have reproduced here for
discoverability and archive purposes (the copy was done on 23 October 2022).

[thread]: https://twitter.com/norswap/status/1502085000967061504

I've only slightly reformatted the text (mostly links), otherwise this is the
original version.

--------------------------------------------------------------------------------

With the Cannon bug bounty out, it's time for me to take my best stab at
describing what it is, and how it works.

Cannon is our next-gen EVM-equivalent fault proof system. It's what will keep
your funds secure when you use Optimism. Read to know more!

![](op-cannon.png)

1/44 What to expect?

- Recap on optimistic rollups / fault proofs
- Short history of fault proofs at Optimism
- Most thorough explanation of Cannon (fault proofs?) to ever grace Twitter — quite technical, but approachable
- My longest twitter thread to date

LET'S FUCKING GO

2/ Optimistic rollups in brief: users send txs to sequencer. Sequencer executes
transactions and creates L2 blocks. It also (a) "rolls up" transaction into
batches submitted to L1 (as calldata) and (b) submits output hashes (which we'll
equate to L2 block hashes here) to L1.

3/ Validators follow the L1 chain, get txs from batches, re-execute them, and
compare the resulting block hashes to the ones submitted by the sequencer.

If there's a mismatch, they challenge the incorrect block hash via a *fault
proof*. This is where Cannon comes in.

4/ (I'm simplifying on purpose here, you can also send L1-to-L2 and L2-to-L1
txs, such as deposits and withdrawals. But this is isn't crucial to this
explanation.)

5/ A rollups' fault proof system is a way to prove on the L1 chain (i.e.
*trustlessly*) that processing the txs from an L2 block doesn't yield the block
whose hash was submitted by the sequencer.

6/ (Crucially, the L2 block includes the state root: a hash of the L2 state
after executing the txs in the block. This will typically be apple of discord.)

7/ The easiest way to perform a fault proof is to re-execute the whole block on
L1. This is what Optimism's previous fault system attempted to do.

Unfortunately, this system had many issues.

8/ To keep costs manageable, every block carried a single transaction. This
would have had very bad consequences for the scalability of the rollup in the
long term. Not to mention, it's very different from how L1 does things.

9/ Second, [interpreting] EVM bytecode onchain is just too expensive.

[interpreting]: https://en.wikipedia.org/wiki/Interpreter_(computing)

This led to the original OVM: a system to deploy L2 bytecode as L1 bytecode.

10/ The original OVM design works well for simple things, but not when "context"
is needed. For instance, you can't translate the L2 NUMBER opcode (returning
block height) to the L1 NUMBER opcode! These opcodes needed to be translated
into calls to special contracts.

11/ Similar issues played out for things like L2 contract calls.

Replacing opcodes & calls by larger EVM routines & contract calls also meant
that the max size of contracts on L2 was smaller the max L1 contract size!

12/ (And indirectly this also caused the choice of requiring a patched Solidity
compiler. Though it must be said other designs were possible there.)

13/ The original OVM design was a good first attempt, but it was also clear it
wasn't a good long term solution.

14/ After the team (h/t [@karl\_dot\_tech][karl] [@ben_chain][ben]) &
[@realGeorgeHotz][george] came up with the idea for Cannon, it was decided to
drop the old fault proof system to start from a sane foundation. This was the
OVM 2.0 re-genesis.

[karl]: https://twitter.com/karl_dot_tech
[ben]: https://twitter.com/ben_chain
[george]: https://twitter.com/realgeorgehotz

15/ (I wasn't at Optimism at that time and wasn't consulted, but these names are
pretty terrible. The OVM 1.0 (just like Arbitrum's AVM) is only a VM in the most
abstract sense — it's a modified instruction set translated to run on the EVM.
The OVM 2.0 is not a VM in any sense.)

16/ So how does Cannon prove a \[txs → block hash\] mismatch if it does not
execute the whole block on chain?

The solution is in two parts:

1. The challenge game
2. The single step execution

17/ The challenge game is a binary search over the execution trace of the "fault
proof program".

In our case that program is one that, in first approximation, takes the L2 chain
state and some transactions as inputs and emits an L2 block hash.

18/ George called this program "minigeth".

In reality its input is a set of L1 blockhashes, and the input will be a set of
L2 blockhashes. I'll skip the details here as they get into the weeds of
Optimism Bedrock and not super relevant.

19/ The important thing is that the input L1 blockhashes are a *commitment* to
all the inputs we actually care about: the L2 state and the transactions. We can
prove these things against the blockhash. For instance, we can prove that a
batch was posted to one of these L1 blocks.

20/ To retrieve the transactions & L2 state, minigeth uses a component called
"the preimage oracle".

This is a generic component that lets you go from a hash to a preimage. This is normally
[impossible][preimage] to compute for cryptographic hashes.

[preimage]: https://en.wikipedia.org/wiki/Preimage_attack

21/ So the trick will be to get these [hash → preimage] mappings from somewhere.
I'll explain later how the preimage oracle is implemented on & off-chain. But
take it for granted for now.

22/ So we have minigeth with our preimage oracle (which btw entirely replaces
geth's usual database).

We compile this to some instruction set, and execute it for our L1 blocks. This
yields an execution trace, which is the list of every instruction executed
during the execution.

23/ During the challenge game, both the challenger and the sequencer do this,
and then perform a binary search to find the first instruction whose result they
disagree on.

24/ It's a binary search because they start by looking a the result of the
instruction 1/2 of the way through. If they disagree, they'll look at the
instruction 1/4 of the way through, otherwise the instruction 3/4 of the way
through, etc...

25/ They'll keep narrowing the range until they zero in on a single instruction
they disagree on.

(Note that the challenger and the sequencer don't actually need to agree on the
size of the execution trace.)

26/ What's the "result of an instruction"? What do they agree/disagree on? It's
simply a [Merkle root][Merkle] of a snapshot of the minigeth's memory!

[Merkle]: https://en.wikipedia.org/wiki/Merkle_tree

27/ George decided to compile minigeth to [MIPS]. So every step in the
execution trace is a MIPS instruction.

[MIPS]: https://en.wikipedia.org/wiki/MIPS_architecture

Why MIPS? It was one of the simplest instruction for which to implement an
interpreter on-chain, and Go can natively compile to MIPS!

28/ To do all of the above, we need to be able to run minigeth off-chain, to (1)
get the execution trace and (2) generate MIPS memory snapshots.

This is done by running the MIPS minigeth binary on the QEMU CPU emulator, and
hooking into the emulator.

29/ Off-chain (in MIPS-on-QEMU), the preimage oracle is implemented via calls to
a JSON-RPC endpoint (i.e. querying an Ethereum node). In minigeth, each oracle
use is tagged with its type, so we know which JSON-RPC call to emit.

30/ (The most common JSON-RPC call is "eth_getProof", used very creatively to
retrieve storage slots and trie nodes.)

31/ Alright, so the challenger and sequencer have agreed to disagree on a single
instruction.

Next comes the single step execution.

The goal is to execute that single instruction, on the L1 chain.

32/ For this, we need:

1. An on-chain MIPS interpreter to interpret any instruction
2. Any location in MIPS memory that the instruction might read
3. Any preimage that the instruction might request

33/ (1) was simply written by George.

For (2), we already have a Merkle root of a memory snapshot taken right before
the instruction (from the challenge game). We can use it to prove any memory
location we might need to supply.

34/ For (3), we simply presupply the \[hash → preimage\] mapping by supplying
the preimage, and then the hash is derived on-chain.

Note that minigeth off-chain is also instructed to save all the \[hash →
preimage\] mappings it uses, so we have those handy.

35/ Obviously, "preimage requests" are not a native MIPS instruction. Instead,
it's encoded as a read to a pre-defined memory location, which "magically" has
the preimage of the hash that was previously written at another pre-defined
memory location.

36/ This behaviour is implemented in the MIPS interpreter on-chain, and in the
QEMU hooks off-chain.

37/ Alright, so finally we can use our pre-supplied memory and preimages to run
the single MIPS instruction on the on-chain MIPS interpreter. This yields a new
memory snapshot Merkle root, which can be compared to the root asserted by the
challenger.

38/ If its Merkle root is the same, the challenge is valid, and the challenger
wins.

We haven't talked about this here, but in this case the challenger would receive
the sequencer's "bond" as a reward.

39/ And that's most of what there is to it!

‼️ A very important note before I give you some further reading.

The current implementation of Cannon DOES NOT allow you to challenge L2 blocks.
Instead, it's a proof-of-concept that allows you to challenge L1 blocks.

40/ So minigeth is currently a program that takes a blockhash as input and
verifies the validity of that block by re-executing it on top of the previous
state.

Obviously, no L1 block should ever be invalid, meaning no challenge should ever
succeed.

41/ At least that's the theory we're putting on the line in our [bug bounty
program][bounty]. Break this assumption and make 50k$ !

[bounty]: https://immunefi.com/bounty/optimismcannon/

42/ That was a looong thead, but I still had to simplify quite a bit and ommit
some details.

So, were can you learn more about Cannon? I'm glad you ask!

43/

- There's the [github repository][github]
- [A high-level overview][overview]
- A more detailed overview][detailed]

[github]: https://github.com/ethereum-optimism/cannon
[overview]: https://github.com/ethereum-optimism/optimistic-specs/wiki/Cannon-High-Level-Overview
[detailed]: https://github.com/ethereum-optimism/optimistic-specs/wiki/Cannon-Overview

44/ Now, go forth and spread the chant

cannon cannon cannon

Cannon! Cannon! Cannon!

CANNON CANNON CANNON
