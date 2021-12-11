---
layout: post
title: "The Essence of Blockchains"
---

What are blockchains for? Why are they useful?

**I contend that the essence of blockchain is that they are decentralized trust
engines.**

Decentralized trust has a lot of benefits, but the one I'm personally excited
about is that it enables **permissionless innovation**.

Below I explain what the hell I mean by *decentralized trust* and
*permissionless innovation*.

## Who do you trust?

Whenever you perform some action online, you're always implicitly trusting some
entity.

For instance, if you run a computation on Amazon Web Service (AWS), or even in
Google Sheets, you trust Amazon and Google not to alter the result of the
computation.

If you host files on Dropbox, you trust Dropbox not to alter their content, and
to not arbitrarily destroy your backup.

You trust that Google won't return you completely fabricated search result to
get you to take some specific decision (e.g. a purchase) that is in their
interest. (They certainly influence search results, but they don't (yet?)
fabricate them.)

You trust that your bank won't take your money. You trust that your insurer will
actually compensate you in case of accident.

You might also trust all of these companies with the privacy of your data.

Etc, etc...

You might object that these companies won't do these shady things. They stand to
lose a lot, including reputation, customers, future revenues, etc! As for banks
and insurances, they are heavily regulated.

That's true — although I will say these companies have gotten away with a
surprising number of things. But more importantly it means you can only deal
with entities that either (a) have something to lose or (b) comply with draconic
and time-consuming regulations — and mostly that means big entrenched companies.
We'll explore this when we talk about *permissionless innovation*.

Also consider that companies might be *forced* to do something, probably by some
government.

## "Decentralized" trust?

The fundamental proposition of blockchains is the following: **What if you did
not have to trust a single entity, a single company?**

In blockchains, there is a network of *nodes* (aka *verifiers*, *validators*,
*stakers*, *miners*, ...) that verify the operations of the blockchains. As long
as a majority of these nodes are honest (e.g. 50% of them, this changes between
blockchains), you can trust that anything that happens on the blockchain follows
the rules of the blockchain. And dishonesty has dire consequences for validators
— because of sunk costs, or because of explicit penalties.

This changes your trust assumption from trusting a single entity to trusting
that a majority of validators are honest.

The more validators there are, the less collusion is likely. Said otherwise, the
more decentralized the system is, the less trust you need to put in the system.

It is also of paramount importance that anyone be able to become a validator of
the network. Otherwise, the network is really controlled by the gatekeeper of
the validation rights. This is less easy than it sounds — you have to make
validation costly enough, otherwise an attacker could just spin a huge number of
nodes and take over the network — a [sybil attack]. Preventing sybil attacks is
the main technical breakthrough of blockchain technology. I explain the
solutions (proof-of-work and proof-of-stake) in my article: [**Freaking
blockchains: How do they work?**][blockchains]

[sybil attack]: https://en.wikipedia.org/wiki/Sybil_attack
[blockchains]: /blockchain-how

## Applications & Trade-Offs

Let's go back to our examples. Am I saying that blockchains will supersede AWS,
Google Sheet, Google Search, Dropbox, banks and insurances?

Not necessarily.

In reality, there is a trade-off. Nothing is truly trustless or riskless.
Running most web apps on AWS is really fine, because the risk that Amazon is
going to manipulate your results is close to zero, and the downside if they do
is very low. Even if you're running with a brand-new competitor, you're not
risking all that much.

But for some applications, trust and security are a really big deal. In
particular, where money is concerned. It's not by accident that finance is
stringently regulated. And similarly, it's not an accident that most popular
applications of blockchains right now deal with money. It's doubly important
when you're dealing with anonymous blockchain developers with no pre-existing
reputation (more on this in the section on permissionless innovation).

<!--

Since we mentionned Dropbox, I will mention there are a few blockchains
specialized in storage, like [Arweave] and [Filecoin]. These are very useful if
censorship is a concern ([example][hong-kong]).

Privacy-wise, blockchains are not there yet, at least for computation. In most
blockchain, transactions are public! It's already possible the hide the
transactions using [zero-knowledge proofs][zkp], however the resulting
blockchain state modification is public. you are only "protected" by the
pseudonimity of your blockchain address, but that is a weak kind of protection.
This is a topic of ongoing research.

[Arweave]: https://www.arweave.org/
[Filecoin]: https://filecoin.io/
[hong-kong]: https://www.reuters.com/article/us-hongkong-security-apple-daily-blockch-idCAKCN2E00JP
[zkp]: https://en.wikipedia.org/wiki/Zero-knowledge_proof

-->

## Permissionless Innovation

Finally, we come to what is to me the most exciting consequence of decentralized
trust: *permissionless innovation*.

On computation-centric blockchains, like [Ethereum](https://ethereum.org/en/),
the network certifies computation, and the code of the computation is a public
smart contract stored on the blockchain, you can trust the contract to do what
its code says, nothing more and nothing less.

This means that *anybody* can deploy a new smart contract, and other people can
use it as long as they trust the code. The contract author does not need to have
resources, a reputation or even to comply with regulations (1) to deploy his
contract, or for you to trust that the contract will be executed faithfully.

(1) He *has to*, legally speaking, but blockchains being novel, it's unclear
which rules apply in the first place. Such [FUD] would normally stifle
innovation — but not on the blockchain where the barrier to entry is low, and
many developers are anonymous.

[FUD]: https://en.wikipedia.org/wiki/Fear,_uncertainty,_and_doubt

This is super exciting! It has already led to numerous innovations in the
financial realm, such as [automated market makers][amm] (AMM), as well as many
new forms of clever incentivization mechanisms such as [liquidity mining],
[liquidity purchases via bonding][ohm], and more.

[amm]: https://www.paradigm.xyz/2021/04/understanding-automated-market-makers-part-1-price-impact/
[liquidity mining]: https://academy.shrimpy.io/post/what-is-liquidity-mining
[ohm]: https://www.okex.com/academy/en/olympusdao-protocol-owned-liquidity-defi-reserve-currency-ohm

Besides brand new constructions, it also makes opportunities available to
everyone that were previously available only to a few. Option protocols such as
[Lyra] make it possible for everyone to profit from market-making the option
market: a process where the *market maker* sells an option, which is hedged by
the underlying, in order to pocket the option premium. (If this is Chinese to
you, see my articles on [options] and on [gamma squeezes].) Previously, this
lucrative and relatively safe opportunity reserved to big investment banks.
On-chain, everyone can add their money to a pool and participate!

And this is just an example amongst many. Another one would be [lending to
overcollateralized borrowers][lending].

[Lyra]: https://docs.lyra.finance/
[options]: /options/
[gamma squeezes]: /gamestop/
[lending]: https://medium.com/coinmonks/what-is-liquidation-in-defi-lending-and-borrowing-platforms-3326e0ba8d0

Hopefully, more areas can benefit from this innovative drive besides finance.
One area that looks promising at the moment is gaming. Increasingly, game
development is financed by the sales of in-game assets (skins, character
customizations, convenience features, ...). One could be hesitant to buy into a
relatively unknown game. Using the blockchain to encode these assets incurs many
benefits: it can be made certain that they won't disappear at the whim of the
developer, that they are tradeable without the developer investing any resources
to make them so. Even better, another developer could decide to reuse the
assets, and give them a function within his own game.

> I think the use of blockchain in gaming is at the same stage where
> [peer-to-peer] (P2P) technology used to be some 20 years back. P2P had a
> terrible reputation as a thing used only to download copyrighted material. Yet
> only a few years later it became a common way to distribute big games and their
> updates, proving invaluable at handling the load on release day.

[peer-to-peer]: https://en.wikipedia.org/wiki/Peer-to-peer

Or maybe crypto gaming doesn't work out. Who knows? There are **many** other
areas in which people are building on the blockchain at the moment. Most
projects will fail, but those who succeed might create immense value (I'm
talking about usefulness, not money), and these wouldn't have gotten built
without the blockchain.

## Conclusion

I'll simply recap the thesis: blockchain are decentralized trust engines.
Instead of trusting a single service provider, you trust a majority of the
validators to be honest — and they are incentivized to be.

On decentralized computation blockchains like Ethereum, this enable anybody to
deploy a smart contract, and anybody else to trust that the code will be
executed faithfully (it still requires reading and understanding the code!).

This enables permissionless innovation: anybody can innovate, not only big
companies with a reputation, or with government sign-off — even when money is
involved.

It also enables anybody to port existing constructions to the blockchain, for
all to take advantage of (e.g. option market-making).

Hopefully, these innovations will spread outside finance in the future.

## PS

The subject seems to be momentous, and here are two excellent recent pieces that
harp on the value of decentralization:

- [Avoiding Internet Centralization][AIC] talks about the importance of
  decentralizing the internet's infrastructure, but many of its arguments are
  valid arguments against centralization in general. (It also makes clear that
  blockchains aren't really the solution for low-level internet infrastructure.)
- [Is Web3... anything?][web3any] is similar to this post and explains
  blockchains as "a protocol/architecture for near-trustless commitments".

[AIC]: https://mnot.github.io/avoiding-internet-centralization/draft-nottingham-avoiding-internet-centralization.html
[web3any]: https://www.chris-granger.com/2021/12/09/is-web3-anything/
