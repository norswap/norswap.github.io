---
layout: post
title: "The Intuition For React"
---

The other day, I found [this article] ("Virtual DOM is pure overhead") on
[Hacker News] and started reading it. Halfway through, [React] finally clicked
for me.

[this article]: https://svelte.dev/blog/virtual-dom-is-pure-overhead
[Hacker News]: https://news.ycombinator.com/item?id=19950253
[React]: https://reactjs.org/

See, I don't do web programming, but I keep abreast of tech news, notably via
hacker news and web frameworks always feature heavily. If you had asked me
before what React was I could have given a generic answer ("something something
fronted framework something something state"), but I couldn't have explaine why
we actually needed React, what it improved compared to using vanilla Javascript.

Well, basically, the idea is that when some event occurs (e.g. the user performs
some input) the state of the page/application is going to change (probably
through the effect of an event listener). When that happens, you might have to
redraw part of the page layout.

That's when things can start to become hairy. If your application is complex,
there might many possible configurations for the layout, and so many ways in
which the layout could change.

A common approach to these kind of problems is to model the application as a
state machine, with each state change represented as a state transition. This
approach works, but doesn't scale too well to complex applications — the state
machine gets too complex, it doesn't fit into your head anymore.

**The idea behind React then is**: stop *changing* the layout. Instead,
re-render the whole layout from the state each time the state changes.

That way, you don't have to worry about handling each possible change in each
possible application state: instead you just write component that know how to
render themselves given the state they are given.

Of course, re-rendering on every change would be pretty slow, so React uses a
"Virtual DOM" (just a tree mimicking the real [DOM]) and compares that to the
real DOM, only replacing parts of the layout that have actually changed.

[DOM]: https://www.w3.org/TR/WD-DOM/introduction.html

That's pretty simple. I thought: well isn't that explained on [the official
website][React]?

Well actually it does a pretty good job:

> **Declarative**
>
> React makes it painless to create interactive UIs. Design simple views for
> each state in your application, and React will efficiently update and render
> just the right components when your data changes.
> 
> Declarative views make your code more predictable and easier to debug.
> 
> **Component-Based**
> 
> Build encapsulated components that manage their own state, then compose them
> to make complex UIs.
> 
> Since component logic is written in JavaScript instead of templates, you can
> easily pass rich data through your app and keep state out of the DOM.

But it doesn't explain that the purpose of this "efficient re-rendering" is to
avoid having to keep track of the current layout yourself and change it in a
legitimate way, which quickly becomes error prone.

And that's it for today!

--------------------------------------------------------------------------------
**Post Scriptum**

The topic of the [article][this article] itself is pretty interesting in its
own right. So is the discussion at [Hacker News].

In reeeal condensed, the article says that because the optimal manual change to
the DOM is going to be faster than diffing + a sub-optimal DOM change performed
by React, the virtual DOM is pure overhead. It's right, but leaves out the fact
that all that is done for managing complexity.

The article is written by Rich Harris, the author of [the Svelte
framework][svelte] — and sell Svelte's ability to basically manage complexity
but at the same time generate the optimal change at build-time.

[svelte]: https://svelte.dev/

The discussion makes other interesting points regarding the genesis of React.
Because the algorithm is fickle I'm gonna be quoting the discussion here:
	
> *oraphalous*:
>
> I think this article - and many of the comments on this thread are forgetting
> the context of how DOM manipulation was typically done when the virtual DOM
> approach was introduced.
> 
> Here's the gist of how folks would often update an element. You'd subscribe to
> events on the root element of your component. And if your component is of any
> complexity at all - first thing you'd probably do is ask jQuery to go find any
> child elements that need updating - inspecting the DOM in various ways so as
> to determine the component's current state.
> 
> If your component needed to affect components higher up, or sibling to the
> current instance - then your application is often doing a search of the DOM to
> find the nodes.. and yes if you architect things well then you could avoid a
> lot of these - but let's face it, front end developers weren't typically
> renown for their application architecture skills.
> 
> In short - the DOM was often used to store state. And this just isn't a very
> efficient approach.
> 
> This is what I understood the claim that VDOMs are faster than the real DOM
> meant - and the article is pretty much eliding this detail.
> 
> As far as I'm aware React and its VDOM approach was the framework that
> deserves the credit for changing the culture of how we thought about state
> management on the frontend. That newer frameworks have been able to build upon
> this core insight - in ways that are even more efficient than the VDOM
> approach is great - but they should pay homage to that original insight and
> change in perspective React made possible.
> 
> I feel this article and many of the comments here so far - fail to do that -
> and worse, seem to be trying to present React's claim of the VDOM faster than
> the DOM as some kind of toddler mistake.
	
> jasonkester:
> 
> > the DOM was often used to store state.
> 
> Every once in a while I'm reminded that I'm mostly disconnected from the way
> "most" people build things. Thanks for this insight. It finally explains why I
> hear people talking down about "jQuery developers", if that was something that
> people actually did.
> 
> But wow. I've been building javascript-heavy web stuff since the mid 90's and it
> had never occurred to me to do that. You have your object model, and each thing
> had a reference back to its DOM node and some methods to update itself if
> necessary. All jQuery did was make it less typing to initially grab the DOM node
> (or create it), and give you some shorthand for setting classes on them.
> 
> It also explains why people liked React, which has always seemed completely
> overcomplicated to me, but which probably simplified things a lot if you didn't
> ever have a proper place to keep your data model.
> 
> I can't imagine I was the only one who had things figured out back then,
> though. The idea you're talking about sounds pretty terrible.

> onion2k:
> 
> Bare in mind that most people using jQuery weren't writing JavaScript
> applications. They were writing backend-driven applications with jQuery
> enhancements, so there was no real concept of frontend 'state' that was
> separate to the DOM itself. If your frontend code needed to work with 'state'
> like form values or element attributes you had to read them, and because there
> could be multiple separate bits of code working with the same form or element
> you had to write values back to the DOM so the next bit of code had the
> correct 'state'.
> 
> The thing that changed to make frontend development improve dramatically was
> hash based routing with ajax, and later the introduction of the history API.
> That caused frontend development to have a need to retain state between
> 'pages', so then was a need to find a better way to store it than using DOM
> attributes.

> Udik:
>
> > the thing that changed to make frontend development improve
> > dramatically was hash based routing with ajax...
> 
> I think that what's changed is simply that people realized that it's way less
> messy to use the backend only as a data source (with ajax calls), and leave
> everything else to the frontend. The cognitive overhead of having the server
> producing html with some implicit state, then updating that state interactively,
> and then losing everything again by posting the whole page to the server, was
> simply unbearable.
> 
> When I started building web applications in 2004 I had some experience in
> writing desktop apps: I simply created a js library to create and destroy UI
> elements, and wrote "desktop" apps running in the browser.

Isn't all that positively enlightening?
