---
layout: post
title: "Building a static website with Ribosome and Node.js"
---

I've transitioned the website from [Jekyll][jekyll] to a custom system based on
[Ribosome][ribosome]. I wasn't updating the website very regularly, and each
time I picked it up again, I had to spend an hour or so battling the
particularly horrible Ruby dependencies on Windows.

Ribosome is essentially a templating engine driven by a script language
(JavaScript, Python or Ruby &mdash; I went with Javascript). It takes a js/py/rb
script as input, which also contains lines starting with a dot. The script is
run, but whenever a dotted line is encountered, it is sent to an output file. It
supports embedded expression within dotted lines, special directives to change
the file to which the output is redirected and include other files. This makes
it possible to generate your whole website from a single script
([have a look at mine][script]).

Something I really like about Ribosome is how it respects whitespace, resulting
in really nice-looking output, unlike most templating engines (have a look at
the html for this page). It's [block layouting][block] capability is also quite
handy.

I'm also very pleased about the Node.js ecosystem. I was really easy to find
libraries to [parse YAML front matter][yaml], [parse Markdown][markdown],
[manipulate dates][dates], [escaping html][escape] and
[create temporary files][tmp]. They were easy to use too.

All in all, updating the website was a surprisingly pleasant experience.
Ribosome in particular is great, I encourage you to try it.

[jekyll]: https://jekyllrb.com/
[ribosome]: http://ribosome.ch/
[script]: https://github.com/norswap/norswap.github.io/blob/master/.factory/generate.js
[yaml]: https://www.npmjs.com/package/gray-matter
[markdown]: https://www.npmjs.com/package/marked
[dates]: http://momentjs.com/
[escape]: https://www.npmjs.com/package/escape-html
[tmp]: https://www.npmjs.com/package/tmp
[block]: http://ribosome.ch/documentation.html#advanced-layout-management
