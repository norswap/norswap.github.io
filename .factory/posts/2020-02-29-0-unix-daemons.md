---
title: "Shell Deep Dive: Easy Unix Daemons (on macOS too)"
layout: post
---

I've been setting up my new work machine recently, and while doing so I
encountered an interesting challenge.

I wanted to setup a proxy to the company's VPN as a daemon. Here was my feature
wishlist:

- Runs in the background.
- Starts at startup or login.
- Can be manually killed / relaunched.
- Output visible (e.g. via log files).
- Restarts automatically if it stops for some reason.

Now, there are daemons systems build into most OSes. For macOS this is `launchd`
(for "launch daemon"). On Linux it's most likely than not `systemd`, though are
other systems, like the venerable `sysvinit` and `OpenRC`.

Even before starting however, I knew (from reputation and past personal
experiences) that those systems sucked mightily. The less I had to deal / rely
on them, the better. But I'll expand on that [later](#startup).


In the end I did actually use `launchd` to launch at startup. I'm not providing
details for linux, but [look here for pointers about systemd][systemd-tips] (and
by the same occasion note that I'm right: this is a mess).

[systemd-tips]: https://unix.stackexchange.com/questions/233468/how-does-systemd-use-etc-init-d-scripts

## Running in the Background

Your daemon system will run jobs in the background for you. Nevertheless it's
quite interesting to take a small detour to see how one can run a job in the
background from the user shell. In fact this is how I stumbled upon the
backbone of my solution.

The obvious way is to append `&` at the end of your command. This runs in the
background, but the command is now a child of the current shell, and will be
terminated along with the shell.

The traditional approach in this case is to do something like `nohup <command> &
disown`. [Here is a very thorough explanation of that command.][nohup-explain]
But basically: `disown` just removes the command from the list of the shell's
job while `nohup` redirects the terminal output to a file called `nohup.out` in
the current directory (or you can just redirect it yourself), as well as closes
terminal input. Using either `disown` or `nohup` (or both) will prevent the
command from being killed when the shell is killed (it prevents the sending of
the `SIGHUP` signal ("signal hang up"), which is "a signal sent to a process
when its controlling terminal is closed").

[nohup-explain]: https://unix.stackexchange.com/a/148698

So this works rather nicely.

But I have an even better solution: use `screen`.

In short, `screen` lets you start a virtual shell that you can "attach" to a
real shell, or "detach" from. So you can use it to run a command in its own
shell, which you can recall at will, in any real shell.

The advantages of `screen` is that you can use it for job control. We couldn't
have used normal shell job control (using the command `jobs`) because it is
shell-specific (not shared between different shell instances). So you can't use
it as soon as you close the original shell used to run the command. And if you
want to kill the command at that point, you need to find out its PID and use
`pkill`.

But with `screen`, you can do this, from any shell:

```bash
$ screen -dm <command>           # start command in background
$ screen -dm -S <name> <command> # ... and give it a specific name
$ screen -ls                     # list all running screens
$ screen -r <name>               # (re)attach to the given screen
$ screen -S <name> -X quit       # kill the given screen
```

Since some of those are not super intuitive, I propose the use of the following
aliases and functions:

```bash
alias sjobls='screen -ls'
alias sjoba='screen -r'
alias sjobmk='screen -dm -S'

sjobk() {
    screen -S $1 -X quit
}
```

Final tip: when you attach to the screen, it's `ctrl+a d` (or `cmd+a d` on mac)
to detach.

## Repeating the Command

To repeat a command in `bash`, with 3 seconds of delay between each execution,
you'd normaly do:

```bash
while true; do <command>; sleep 3; done
```

Which you can turn into the following function:

```bash
repeat() {
    while true; do $1; sleep 3; done
}
```

**IMPORTANT POINT:** Making a function was a mistake. This is also valid for
other functions that will be presented later. It should be a script to be put
somewhere on the path instead. Why?

1. By making it a script, you can use a shebang (`#!`) to specify the shell
   (`bash`, `zsh`, ...) used to run it, making it usable whatever shell you
   decide to run as a user.

2. Functions are normally not inherited by sub-shells. In Bash, it's actually
   possible to export them anyway by using `export -f <function>`. And as we'll
   see later, we really want to use subshells.

This remark, aside, there is a couple improvements we might want to make to our
function.

First, we'd like to be able to pass an optional argument specifying the duration of
  the delay between two command runs.

Second, we'd like the command to be not only a simple command, but also a whole
pipeline (including pipes `|` and redirects `>`). But if we try the naive way,
we'll rune into a parser issue.

Consider the command `echo "x" | cat -n`. This prints `1 x` to standard output
(`-n` is the option for line numbering). Then try running `repeat echo "x" | cat
-n`. This *should* output `1 x` multiple times. Instead it prints `1 x`, then `2
x`, then `3 x`, etc. This is because the command is interpreted as `(repeat echo
"a") | cat` and not `repeat (echo "a" | cat)` (note the use of parentheses here
is not valid Bash syntax).

How to pass a pipe then? We have to quote it, then pass it as a parameter to
`bash -c`. e.g. `repeat 'echo "a" | cat -n'` This is by no means perfect — it
gets annoying when dealing with commands that already have multiple level of
quotations: for instance `echo "'a'"` should have been quoted as `'echo
"\'a\'"'`. But it's still a good step forward.

With all the considerations factored in, we get the following function:

```bash
repeat() {
    local OPT OPTIND OPTARG T=3
    while getopts ":t:" OPT; do
        case $OPT in
            t)  T=$OPTARG;;
            \?) echo "Usage: repeat [-t <Time interval in seconds>] <command>";
                return;;
        esac
    done
    shift $((OPTIND - 1))
    while true; do bash -c "$*"; sleep $T; done
}
export -f repeat
```

For a brief description of argument handling: the option string `:t:` says that
to disable getopt's normal error output (first colon `:`): we'll do it ourselves
with the `\?` option. The `t:` part says we expect an optional argument `t` that
takes a value (the second colon `:`). The variable `OPT` receives the option
letter in the loop, while `OPTARG` received the option value (if any). `OPTIND`
is set the index of the next (unprocessed) argument. The loop stop when all
options have been processed. The `shift $((OPTIND - 1))` removes all processed
options from the list of arguments (accessible via `$*`, `$@` and `$1`, `$2`,
...). Check [this tutorial][getopts-tut] for more information.

[getopts-tut]: https://sookocheff.com/post/bash/parsing-bash-script-arguments-with-shopts/

An important note on `bash -c "$*"`: `"$*"` will expand to all remaining
arguments, *quoted as a single parameter*. In this way, `repeat` can be used
with or without quoting whenever supported: `repeat echo "x"` or `repeat 'echo
"x" | cat -n'` (using pipes while not quoting still doesn't work).

The alternative to `"$*"` is `"$@"` which expands to the same arguments, but
quoted individually. Since `bash -c` expects a single argument, this wouldn't
work when used without quotes. We'll however use `"$@"` later!

## Getting The Process' Output

A simple way to get the process' output even though it runs in the background is
simply to redirect it. Because of how we built it, this is even compatible with
our `repeat` function.

But if we're going to use `screen`, we can simply attach to the screen and see
what's going on.

This has, however, two slight issues:

- The logs are lost in case the machine shuts down. Here, simply using the `tee`
  command ([manpage][mantee]) works: `<command> | tee logfile` enables us to
  benefit from both logs and screen output.

[mantee]: http://man7.org/linux/man-pages/man1/tee.1.html

- If the command terminates, then the screen shuts down and the output is lost.
  Not necessarily a problem if you log, but it is if you don't.

(At this point, I'll note that for my proxy I don't really care about long-time
logs, I just want to be able to know what's happening *right now*, sometimes.
Also proper log management requires some thought, as "just append forever" might
work in practice, but it makes fussy me shudder.)

To solve that second issue, I introduced a function called `remain`, which would
take a command as parameter (much like `repeat`) and run a shell once that
command exited.

You can actually achieve that quite easily with just `<command>; bash`, as long
as the command exits by itself. By hitting `ctrl+c` in the screen (and thus
sending `SIGINT`), you'll shut down the whole chain, just like in a regular
shell.

But imagine you want to kill the command, while still being able to peruse the
output in the shell? (Again, quite relevant to my use case: stop trying to
connect to the proxy, but let me see what's going on.) Well that's possible too:

```bash
remain() {
    trap "echo Interrupted by user" SIGINT
    bash -c "$*"
    exec bash
}
export -f remain
```

This traps `SIGINT`, making it echo a message rather than letting it kill the
screen. We run our command using `bash -c` (again, to enable passing whole
pipelines to the function). We end by `exec bash` which makes the process
becomes bash. We could just have written `bash` there instead, this is just a
tiny bit more economical.

## Quoting Woes

It's time for a little confession: `repeat` and `remain` are not entirely robust
as-is.

Consider that we want to use `remain` with `repeat`:

```
remain repeat 'echo "x" | cat -n'
```

What happens is that the `bash -c "$*"` line in `remain` expands to something
equivalent to `bash -c 'repeat echo "x" | cat -n'` — the outer quotes have been
stripped! This will misbeheave in `repeat`, producing the wrong `1 x`, `2 x`
(etc) output rather than straight `1 x` each time.

We cannot "just" use `"$@"` instead of `"$*"` either: `bash -c "$@"` would
expand to `bash -c 'repeat' 'echo "x" | cat -n'` — but `bash -c` expects a
single argument!

**Important note:** I'm slighlty simplifying here. In particular here, `bash -c
"$@"` would not *literally* expand to `bash -c 'repeat' 'echo "x" | cat -n'`.
Instead the shell would perform expansion and the result would be an
interpretation like "invoke `bash` with three parameters of value `-c`, `repeat`
and `repeat' 'echo "x" | cat -n` on which no further expansion must be
performed". Otherwise, `"$@"` wouldn't work with parameters containing single
quotes!

The solution is to re-insert the quotes manually. for this we introduce a
function called `quote_args`, which takes a series of arguments and sets `ARGS`
to the concatenation of all those arguments with quotes inserted around each of
them (excepted when there is a single argument).

```bash
quote_args() {
    ARGS=''
    # single argument: output directly
    if [[ $# -eq 1 ]]; then
        ARGS="$1"
        return
    fi
    # multiple arguments: quote each and output
    for ARG in "$@"; do
        ARGS+="'$ARG'"
    done
}
export -f quote_args
```

Why add exception for single arguments? Consider the following examples given
that we always quote even on single args:

```bash
always_quote_args echo hello

bash -c "$ARGS"
# 1.    "expansion": bash -c "'echo' 'hello'"
#       output: "hello"

bash -c $ARGS
# 2.    "expansion": bash -c 'echo' 'hello'
#       output: ""

always_quote_args 'echo hello'

bash -c "$ARGS"
# 3.    "expansion": bash -c "'echo hello'"
#       output: bash: echo hello: command not found

bash -c $ARGS
# 4.    "expansion": bash -c 'echo hello'
#       output: "hello"
```

(*Expansion* is quoted because again, bash does not expand to a textual
representation, but to an internal representation tracking "words".)

We would like behaviour 1 and 4, meaning we need to know the number of arguments
to know whether to quote `$ARGS`. So we move this choice into `quote_args`
itself and now we should just always quote `$ARGS`.

This is not always "correct" depending on what you need to do, but it's good for
commands like `bash -c` that expect a command as a single argument. As always,
the key is to understand what this is doing so you can reason about it.

Now that we have `quote_args`, we can patch `repeat` and `remain` with it:

```bash
repeat() {
    local OPT OPTIND OPTARG T=3
    while getopts ":t:" OPT; do
        case $OPT in
            t)  T=$OPTARG;;
            \?) echo "Usage: repeat [-t <Time interval in seconds>] <command>";
                return;;
        esac
    done
    shift $((OPTIND - 1))
    quote_args "$@"
    while true; do bash -c "$ARGS"; sleep $T; done
}
export -f repeat

remain() {
    trap "echo Interrupted by user" SIGINT
    quote_args "$@"
    bash -c "$ARGS"
    exec bash
}
export -f remain
```

So in our initial example (`remain repeat 'echo "x" | cat -n'`), we end up with
`ARGS` containing `'repeat' 'echo "x" | cat -n'`. Using `"$ARGS"` within
`remain` then produces a single argument where the individual arguments are
properly quoted: `"'repeat' 'echo "x" | cat -n'"`. (Note that in this case we
are literally expanding to that, and that `quote_args` is not meant to be used
with arguments that contain literal single quotes!) Within `repeat`, the single
argument is note quoted again and passed to `bash -c` directly. It works!

## Putting the Pieces Together

Now that we have a repeating mechanism and one to be able to preserve the
output, we still need to combine those things together, and then to combine them
with `screen`.

Let's consider a simpler but useful case first. If we want to use `screen` for
job control, it'd make sense to have a command that:

1. Calls `remain` so that we can check on the output after the job is "done".
2. Can take pipes just like we did in `repeat` and `remain`, and not just a
   single command. Additionally, `screen` can't normally take Bash function
   calls as parameter (that's because it passes its arguments to `exec`, not
   `bash`). Our fix will allow that.

For this simple(r) case, I'm making a function called `sjob` (for "screen job")
that takes an optional `-n` option to set the job name (equivalent to `screen`'s
own `-S` parameter) and (a) parameter(s) to specify the command, similar to
`remain` and `repeat`.

```bash
sjob() {
    local OPT OPTIND OPTARG N=sjob
    while getopts ":n:" OPT; do
        case $OPT in
            n)  N=$OPTARG;;
            \?) echo "Usage: sjob [-n <Name>] <command>";
                return;;
        esac
    done
    shift $((OPTIND - 1))
    quote_args "$@"
    screen -dm -S $N bash -c "remain $ARGS"
}
export -f sjob
```

You can see all our previous tricks: option handling, `quote_args` and a direct
call to `remain`.

Now for the full shebub, we also want to throw `repeat` in the mix. Since this
is going to be run by some kind of init system (`launchd`, `systemd`, ...), we
also want to make sure that the command is only run once even if the function is
called multiple times. We'll use a unique name + `screen -ls` to ensure that.

```bash
daemon() {
    local OPT OPTIND OPTARG T=3 N=daemon
    while getopts ":n:t:" OPT; do
        case $OPT in
            t)  T=$OPTARG;;
            n)  N=$OPTARG;;
            \?) echo "Usage: daemon [-n <Name>] [-t <Time interval in seconds>] <command>";
                return;;
        esac
    done
    shift $((OPTIND - 1))
    # Only run if the daemon by this name is not already running.
    (screen -ls | grep -q $N) && return
    sjob -n $N repeat -t $T "$@"
}
export -f daemon
```

Note that this doesn't use `quote_args`: `sjob` can handle that, and we use
`"$@"` meaning the arguments we receive (minus the processed options) will be
passed as "as-is" and not unduly split because of stripped quotes.

## Calling at Startup (mac-only)

<div id=startup />

Only one step remains: actually running our `daemon` function with the command
as parameter on startup.

In a better world, we'd just need to plop down a script in a directory, and be
done with it. That's what most Linux distribution *attempt* to do (typically the
directory is `/etc/init.d`). However, here is [the skeleton] for what you're
supposed to do in Debian and "I can't even" — there is just too much ceremony to
be handled upfront.

[the skeleton]: https://gist.github.com/mrowe/8b617a8b12a6248d48b8

Ideally, you should be able to just run every script in the directory, period.
Need to log? Add that in your script. Need to relaunch the command if it dies?
Add that in your script (e.g. `repeat`). This skeleton strikes me as very
un-unixy.

For sure this is probably very robust, and you might want system daemons to use
such a system. For 99% of the things *I* want to run at startup, this is
massively overkill.

But this is mac we're talking about, so we're not even there. Instead you have
to configure a *stupid xml file*.

<div class=nsep></div>

So here is my plan: if I'm going to go through these pains once, I might as well
make so that the script being run runs all scripts in a given directory (in my
case I chose `~/startup`).

I followed [this guide][launchd-guide] (warning: not fully trustworthy, for
instance it has you setup a system-level daemon instead of user-level, which is
a bad idea), and you can refer to [this very handy reference][launchd-ref]. But
for those who want the short of it (at least at the time of writing), keep
reading.

[launchd-guide]: https://medium.com/@fahimhossain_16989/adding-startup-scripts-to-launch-daemon-on-mac-os-x-sierra-10-12-6-7e0318c74de1
[launchd-ref]: https://www.launchd.info/

What you'll want to do is create a `.plist` file. I called mine
`com.startup.plist`, after the previous tutorial.

At this point you get a choice: make it a "LaunchDaemon" (system-level, run at
boot time) or a "LaunchAgent" (user-level, run on logon). If you going to run
Bash, you most certainly want a LaunchAgent (otherwise your commands will end up
being run as root, in a root shell, which for one does not inherit your Bash
profile). LaunchDaemons also have a bunch of restriction on file permissions,
path of programs/scripts being run (can't be in home directories), ...

LaunchAgents must be created in `~/Library/LaunchAgents` (run only for the
current user) or `/Library/LaunchAgents` (run for all users). For LaunchDaemons,
it's `/Library/LaunchDaemons` (there are also other dirs for the system's own
agents and daemons, see [the ref][launchd-ref]).


Personally, I like to keep my config files together, so I've set this up as a
symlink, and it works. The file itself will need to have read permissions, so
`chmod 644 com.startup.plist`.

Here is what the content of the file should be:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PATH</key>
      <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:</string>
    </dict>
    <key>Label</key>
    <string>com.startup</string>
    <key>Program</key>
    <string>/Users/norswap/bin/startup</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>LaunchOnlyOnce</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/startup.stdout</string>
    <key>StandardErrorPath</key>
    <string>/tmp/startup.stderr</string>
  </dict>
</plist>
```

This is verbose but actually pretty straightforward. Notice the log files. The
program being run is my `startup` script:

```
#!/bin/bash
P=/Users/norswap/startup
for file in $P/*
do
    $file
done
```

The shebang (`#!/bin/bash`) is actually important and `launchd` will complain
if it's not present.

And here is an example of file in `~/startup`, namely the one I use to run my
VPN (with confidential details redacted).

```
#!/bin/bash -l
daemon -n proxyvpn 'echo <password> | openconnect --script-tun \
    --script "ocproxy -D 9999" -u <username> -passwd-on-stdin <vpn address>'
```

Two notes. First off, don't write your password in a readable bash script unless you want
your local sysadmin to berate and/or murder you.

Second, note how the script specifies `bash -l` after the shebang to get a
"login shell" — login shell source `.bash_profile` while other don't, and that's
where we defined our `daemon` function!

If you want to know more about the different types of shell (login, interactive)
and how Bash decides which config file to source, read this [life-saving guide
on shell initialization][shell-init].

[shell-init]: https://github.com/rbenv/rbenv/wiki/Unix-shell-initialization

<div class=nsep></div>

You'll probably want to test all of this. To do so you can run:

```
launchctl load -w ~/Library/LaunchAgents/com.startup.plist
```

The `-w` option ignores some file where the agent can be disabled for some
nefarious reasons. I didn't need it, but it doesn't hurt either.

You might see stuff about a `start` command that can in the place of `load`.
That didn't work for me (but it might be because my `plist` file is too
primitive).

Similarly, you might read about the `unload` command, but for me it always said
that the agent wasn't loaded. I guess that whenever if you use an agent to run a
script that returns, the agent is not considered to be "loaded".

Now, if you do need to debug issues with `launchd`, you can first check the
`/tmp/startup.stdout` and `/tmp/startup.stderr` specified in the plist file.

You can also run `tail -f /var/log/system.log` before you run the `load` command
in another shell. This will give you messages such as the following if things go
wrong.

```
Service could not initialize: 19D76: xpcproxy + 15636
com.apple.xpc.launchd[1] (com.startup[2355]): Service exited with abnormal code: 78
```

## Parting Thoughts

When I started my "quest" for a quick daemon setup, I didn't think it would end
taking as much time, nor require me to go so deep (but then, getting lost in the
depths seems like a recurring theme on this blog and in my life).

Truth be told, this was a lot of fun. The issues I encountered were just right
for my skill level to solve.

That being said, this still shows how arcane shell logic, and especially the
Bash language can be. I've said to whomever could hear that I prefer to use some
scripting language (Ruby, Python, Javascript) rather than Bash.

I didn't take my own advice because I thought this would be as simple as
cobbling a couple of commands together. Ha ha.

Would it have been easier with a proper language though? Well, it would have
alleviated the quoting issues. While the issue is not super difficult and the
fix is simple, understanding and debugging it took quite some time. Option
handling would also probably haven been slightly easier. A lot of the other
difficulties were shell-specific though, so I'm not so sure it would have bought
*so much* time in this case.

Finally, if you absolutely have to work in Bash, you could do worse than check
the [Pure Bash Bible] to see if it includes a recipe for whatever you're trying
to achieve. I'm also re-plugging the [shell initialization guide][shell-init].

[Pure Bash Bible]: https://github.com/dylanaraps/pure-bash-bible
