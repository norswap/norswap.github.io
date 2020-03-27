---
layout: post
title: "Static Website Generation, Incrementally"
---

The piece of Javascript that generates this very website has to be one of the
most zen piece of code I ever wrote. I wrote about it in [an article back in
2016][original]. It has served me well since, and hasn't broken on me the way
that I would have expected something written in Ruby to do.

[original]: http://norswap.com/ribosome-static-site/

Yet not all was perfect. The whole website took mabye 15-20 seconds to generate,
and complete generation was the only option.

With that in mind, it was my project to implement incremental generation: only
re-generate the parts of the content that have actually changed. I also wanted a
*watch* feature: the ability to auto-regenerate content whenever I saved a
source file.

I've achieved these objectives, and this blog post is about that. Before I dive
in, however, a remark with the benefit of hindsight. Should I have done this at
all? The *watch* feature had to be done, but otherwise, if my objective was to
speed up generation, maybe I should have gone and figured exactly why the
generation process was so slow... because 15-20 seconds for ~50 blog posts is
VERY slow, even for Javascript. I haven't done that, but I think I should have.

Now for the good part. [Here's the resulting code.][code]

[code]: https://github.com/norswap/norswap.github.io/blob/f643a18ef7681ecfc176265ae66629decc19ec1e/.factory/generate.js

The process started with a lot of refactoring: pounding what was essentially a
linear script into functions that could be reused.

## Async/Await Fun

As part of that refactoring, I also made sure that all the calls that touched
the file systems were now using [promises with async and await][async]. This was
mostly for fun and my own education, because [Ribosome] — the templating library
I use — is fully synchronous. I also think it might be responsible for the slow
execution times (or maybe just my use of it which involve writing then reading
to a temp file once per post), but that's an investigation for another day.

[async]: https://javascript.info/async
[Ribosome]: http://sustrik.github.io/ribosome/

I think async is great however, although there were a few pitfalls I fell right
in. As you may know, using async functions guarantees linear execution without
crazy callback pyramid of doom... if you use the `await` keyword! It's easy to
forget it and it causes no warning (by design, this is not a complain).

Async also required me to get ... creative in one instance. The package I use
for watching the file system takes a callback to which it supplies an array of
events that occured since last time the callback was called. The problem is that
this callback is never `await`ed, even if it returns a promise. As such, if you
do async stuff within that callback (and I did), it's very possible that the
package will fire another callback before the last one finished processing. This
was not acceptable to me: each set of filesystem changes had to be fully
processed before the processing of the nex tone began.

Here is how I solved it:

```Javascript
async function watch()
{
    let lock = Promise.resolve()
    ...
    const watching = await watcher(..., async (events) => {
        let resolve
        const old_lock = lock
        lock = new Promise((r, _) => resolve = r)
        await old_lock
        ...
        // process events
        ...
        resolve()
    })
    watching.start()
}
```

Basically, each invocation of the callback creates a "lock" object, which is an
unfullfilled promise. It then waits on the previous lock to be fullfilled. Only
when it has finished processing does if fullfill (`resolve`) its own lock.
Notice that since code is never executed in parallel, it's perfectly safe to use
a "global" variable to save the last lock. Each successive callback invocation
creates a copy of the last lock then replaces it with its own. This ensures that
only a single callback may be waiting on a lock, and thus there is no data race:
the callbacks are serialized neatly, each waiting on the previous callback's
lock to be fullfilled.

## Incremental Index Pages

Architecturally, the big challenge was how to regen index pages without having
to reprocess every blog post ever.

The problem occurs for instance when you add a new post: all the index pages
have to have their post shifted backwards one unit. Reparsing the HTML would
have been a possibility, although I didn't once contemplate it. It's still a bit
ugly in my mind as the HTML page is a product, not a source. But it might
actually have worked.

What I ended up doing instead is create a file called `posts.json` that
serialized all the needed post data. This includes title, date, layout type, as
well as content for (a) posts that need to appear in the [atom feed] and (b)
posts whose layout is `brief`, i.e. posts whose content appears directly on the
index pages.

[atom feed]: /atom.xml

I also pushed the vice further, and only regenerated the index pages that
actually needed to. For instance, if I removed the very first post, only the
last index page would have to be regenerated. I didn't push this as hard as I
could have: for instance renaming a post will also cause all subsequent index
pages to be regenerated, when there is really no need to.

## Filesystem Watching Frustrations

The only frustrating thing I had to deal with was the filesystem watching
libraries.

This was further compounded by a dumb mistake of my own which made my whole
prior evaluation of libraries irrelevant. I don't even remember what it was I
did, but it caused me to think the libraries were malfunctioning while it was me
that was actually being a dumbass.

Anyway, here are the libraries that I considered, and should reconsider at some
point in the future:

- [Chokidar]
- [nsfw]
- [@atom/watcher]
- [fb-watchman]

There is also the built-in `fs.watch`, but the [Chokidar] page reports that it
has a slew of issues, which I am inclined to believe.

I ended up going with `nsfw` as it was the one I had setup when I finally
understood my mistake. However I cannot recommend it, it works quite shittily,
at the very least on Windows. Amongst the issue I had to contend with and hack
around:

- Duplicate events.
- File renaming causes a creation event on the old file and a modify event on
  the new file (in addition to the renaming event).
- File creation also causes a modify event on the created file (in addition to
  the creation event).

These may just be `fs.watch` issues that `nsfw` didn't guard against though...

`nsfw` also has different dependencies for Windows and MacOS, which causes some
trouble for me, as I have my code on Dropbox so that I may seamlessly switch
from my laptop to my desktop without requiring a dirty commit (it's on Git as
well, don't worry).

Also note that the `@atom/watcher` is different from the original `watcher` lib,
which doesn't build anymore. I think the build script is the only thing that has
been altered however.

`fb-watchman` required an OS-specific software install outside of NPM.

One of the tools required some Windows build tools to be installed globally (you
could install it locally, but it's huge). Another one (or the same, I don't
remember) required a flag to ask for Python 2.7.

All in all, this was a bit of a headache.

If you were to try one of those, my hunch and the above tells me to go with
Chokidar.

[Chokidar]: https://www.npmjs.com/package/chokidar
[nsfw]: https://www.npmjs.com/package/nsfw
[@atom/watcher]: https://www.npmjs.com/package/@atom/watcher
[fb-watchman]: https://www.npmjs.com/package/fb-watchman
