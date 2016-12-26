---
title: "Sync Your IntelliJ Settings Between Machines"
layout: post
---

I recently learned that it was possible to share one's IntelliJ settings between
multiple machines.

## Basic Setup

To do so, first install the [Settings Repository plugin][plugin]. Then, follow
these [instructions]. **However**, do not complete step 3 (which seems
inconsistent with the actual UI), but instead, redo step 2 on each machine on
which you want to sync your settings (except you should use "overwrite local" or
"merge" instead of "overwrite remote").

It's done! The settings should sync automatically, but you can force a re-sync
by using an action of the `VCS > Sync Settings` menu.

## Keybinding Troubles

I use IntelliJ on both Windows and MacOS. 

As you may know, Macs keyboard have this layout on the bottom left of the last row:

    fn | control | alt | command

On the other hand, classical IBM-style keyboard (which I use on my Windows
 machine) have this layout:

    control | win | alt
    
Moreover, in MacOS, most shortcuts where `control` is used on Windows use
`command` instead.

I like to keep things as similar as possible, which is why I inverted `command`
and `control`on MacOS (in `System Preferences > Keyboard > Modifier Keys...`).

But now I have an issue in IntelliJ: I want keybinds that use `control` on
Windows to use `command` on MacOS, and vice-versa. IntelliJ is not able to make
this conversion for me.

What I ended up doing was building two scripts: `kbd_mac_to_win.sh` and
`kbd_win_to_mac.sh` (you can find them along with my IntelliJ
config [here][scripts]).

These scripts take the MacOS / Windows version of the keymap file, and convert
it to the equivalent in the other OS by converting between `control` and
`command` keys (note that internally, IntelliJ calls the `command` key `meta`).

## A Failed Attempt to Automate Things

This is good and well, but running these commands each time I make a change to
my keybindings gets tiresome quickly.

So I tried to automate it using git hooks. I succeeded, but only when using
`git` on the command line. My suspicion is that IntelliJ uses some kind of
library that do not execute hooks.

Nevertheless, I wrote the explanation while developing it on the command line,
so here it is anyway. It at least taught me how git hooks work, as well as the
[smudge / clean] feature (which I didn't end up using).

### Automating with Git Hooks

I use a pre-commit and a post-commit hook. This was based off an idea I found
[on Stack Overflow].

I've pushed the hooks to the [same repository][scripts] as my settings (look for
the files named `pre-commit` and `post-commit`). To install them, you need to
copy or symlink them to the `.git/hooks` directory of your repository.

The solution is not perfect. Namely if both the Windows and the Mac keymap have
changed, the script will give up and ask you to resolve the conflict manually.
Still, it works well enough for my purposes.

### Locating the IntelliJ Settings Repository

To install this stuff, you'll need to locate your settings repository.

For IntelliJ 2016.3 (and presumably, it's similar for most other versions)
lives in
`C:\Users\<USERNAME>\.IdeaIC2016.3\config\settingsRepository\repository` on
Windows.

On MacOS, it's `/Users/<USERNAME>/Library/IdeaIC2016.3/settingsRepository/repository`.

[instructions]: https://www.jetbrains.com/help/idea/2016.3/sharing-your-ide-settings.html
[plugin]: https://plugins.jetbrains.com/idea/plugin/7566-settings-repository
[scripts]: https://github.com/norswap/intellij-settings
[on Stack Overflow]: http://stackoverflow.com/a/12802592/298664
[smudge / clean]: https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes#Keyword-Expansion
