---
title: "A website for your project with Github"
layout: post
---

Github has a thing called [Github Pages] that lets you publish a static HTML
website directly from your github repository. It's quite handy, but I'm not
really convinced with the documentation. So here goes the super-duper easy guide
on how to add Github Pages to your existing project and manage it easily.

[Github Pages]: https://pages.github.com/

Run the following commands:

    mkdir pages
    cd pages
    git init .
    git remote add origin git@github.com:USERNAME/REPO.git
    git checkout --orphan gh-pages
    git commit --allow-empty -m "initial empty commit (pages)"
    git push -u origin gh-pages
    
Finally, add `/pages/` to the `.gitignore` file for your project.

What it does: basically it clones your repo inside the `pages` directory and
immediately switches to an empty, commit-less branch called `gh-pages` (as
required by Github).

Github simply serves any file within the `gh-pages` branch to the brower through
`USERNAME.github.io/PROJECT/`. If you've set up a custom domain name with
Github, this domain will be used instead of `USERNAME.github.io`.

When inside the `page` directory, you can make changes to your website, commit
them and publish them with `git push`.
