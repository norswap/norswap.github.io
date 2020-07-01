---
title: "A ps / pkill / pgrep Alternative"
layout: post
---

As I was prepping my new computer, and [toying with unix daemons], I found
myself checking on running processes regularly, and occasionally killing them. I
also found myself being quite frustrated with the tools provided by the system
for this purpose.

[toying with unix daemons]: /unix-daemons/

## Checking Processes

To check what a process is up to (or if it is running at all), you'd run a
command like this (here, assuming I'm interested in the status of the `sleep`
process):

```bash
$ ps aux | grep sleep
# norswap    58694   0.0  0.0  4399328    728 s006  S+    2:26PM   0:00.00 grep sleep
# norswap    58686   0.0  0.0  4268240    576 s003  S+    2:26PM   0:00.00 sleep 300
```

This is an incantation I've personally memorized a long time ago. I didn't even
remember what those `aux` flags meant.

(As it turns out, omitting the dash (`-`) toggles legacy mode, in which `u`
displays more info. `a` and `x` work like they do with a dash, respectively
displaying processes from all users and showing processes that are not attached
to a controlling terminal.)

This is less than ideal. For one, the output includes a line that matches the
`grep` command itself!

Here is the remedy, where `grep -v` excludes matching lines (and no, there is no
easy way to merge the two `grep` commands):

```bash
$ ps -ax | grep -v " grep " | grep foobar
```

Frankly, not something you'd want to type each time.

Another thing that bothers me is: what are all these numbers and letters? Do I
care?

Let's start by omitting our legacy `u` option. Then, by default (at leasts on
stock macOS Catalina!), you'll get the following fields:

```bash
$ ps ax | head -1
#  PID   TT  STAT      TIME COMMAND
```

You should know what the `PID` is (the process ID), `TT` is an identifier for
the controlling terminal (e.g. `s006`) or `??` if there are no controlling
terminal.

The `STAT` column lists flags that gives information on the status of the
process. Info about which can be found under the "state" heading when running
`man ps` on my mac:

```none
state     The state is given by a sequence of characters, for example, ``RWNA''.
          The first character indicates the run state of the process:

  I       Marks a process that is idle (sleeping for longer than about 20 seconds).
  R       Marks a runnable process.
  S       Marks a process that is sleeping for less than about 20 seconds.
  T       Marks a stopped process.
  U       Marks a process in uninterruptible wait.
  Z       Marks a dead process (a ``zombie'').

  Additional characters after these, if any, indicate additional state information:

  +       The process is in the foreground process group of its control terminal.
  <       The process has raised CPU scheduling priority.
  >       The process has specified a soft limit on memory requirements and is currently
          exceeding that limit; such a process is (necessarily) not swapped.
  A       the process has asked for random page replacement (VA_ANOM, from vadvise(2), for
          example, lisp(1) in a garbage collect).
  E       The process is trying to exit.
  L       The process has pages locked in core (for example, for raw I/O).
  N       The process has reduced CPU scheduling priority (see setpriority(2)).
  S       The process has asked for FIFO page replacement (VA_SEQL, from vadvise(2), for
          example, a large image processing program using virtual memory to sequentially
          address voluminous data).
  s       The process is a session leader.
  V       The process is suspended during a vfork(2).
  W       The process is swapped out.
  X       The process is being traced or debugged.
```

There is a different output (probably Linux) [listed in this StackOverflow
answer][so-state] that you might find handy.

[so-state]: https://askubuntu.com/questions/360252/what-do-the-stat-column-values-in-ps-mean#360253

The `TIME` column: the CPU time the process has consumed since it started, in
`<hours>:<minutes>.<second>` format.

And finally the `COMMAND` itself.

## The System Has You Covered... Maybe?

So of course, the double `grep` thing is insane. I think some people might have
some point have recognized this. What did these good souls do? Come up with
`pgrep`, of course!

```bash
$ pgrep sleep
# 58686
```

The number printed out is the PID of matched processes. That `pgrep sleep`
command is approximately equivalent to the following full pipe:

```bash
$ ps -ax | grep -v " grep " | grep sleep | awk '{ print $1 }'
# 58686
```

But not exactly. On the plus side, it's slightly more robust, for instance it
wouldn't ignore entries in the very unlikely scneario where entries of interest
contain the " grep " string. `pgrep` just ignores its own process and that's it.

Also, by default `pgrep` only matches on the program name and not on the
arguments.

On the other hand, you've now lost all ability to get any other information
about the process, which sucks.

Pointedly, it even sucks if all you want to do is find the PID of a process in
order to kill it! You might have caught the wrong process, but since its name is
not displayed, you'll never find out. And if your query matches more than one
process, you don't have any visual feedback on how to refine the search.

Ok, so `pgrep` does have a `-l` flag that will print out the name of the process
(and the arguments if `-f`, which makes it match on the arguments as well, is
given). But there are no flags to retrieve any other piece of information.

## Killing Processes

Once you have the PID, it's quite easy. Just `kill -9 <PID>`.

One way to do it is to run a `grep` (or `pgrep`) command and copy the PID by
hand.

Another way is use some piping:

```bash
$ ps -ax | grep sleep # identify process
$ ps -ax | grep sleep | grep -v " grep " | awk '{ print $1 }' | xargs kill -9 # kill it
```

Adding `awk '{ print $1 }'` outputs the first column (the PIDs), while `xargs`
transmits them to `kill -9` as arguments.

Or using `pgrep`:

```bash
$ pgrep -l sleep # identify process
$ pkill !* # kill it
```

Here the trick is `!*` which passes the same arguments as the previous command
 (`pgrep`) to `pkill`. `pkill` is `pgrep`'s cousin, which instead of printing
 the matched PIDs, kills them.

Of course, we could also have used `xargs kill -9` here.

## An API, and a Tool

`pgrep` and `pkill` kinda work, but they lose something nice about the original
`ps`: it can be used to get a lot of information about a process, not just its
PID and name.

Essentially, what we would like is a command that is able to:

1. Match processes using any of its properties (or "fields" as I called them
   before. `pgrep` and `pkill` can do this (via various flags).
2. Display properties of interest. `ps` can do this (via its `-o` flag).

Moreover I'd like a tool I can use at the command line easily. It should have
good defaults and enable frequent workflows easily, while supporting
customization.

But I'd also like it to be a building block, either as a way to query processes
which I can use in elaborate scripts, or as a reusable component for other
interactive commands. As we'll see, there are a few niceties we can add to that
effect (match coloring, output truncation, ...).

I made this tool, and named it `nps` (of course).

## `nps`: Basic Features

(Wanna see the code? [It's here.][nps-gist])

I want the command to match only my processes by default, but always also the
processes that don't have controlling terminals. The same switch as regular `ps`
(`-a`) can be added to get the processes from all users.

By default I only want the PID and the command name, because that's what I care
about 99% of the time. But I want the ability to request other informations,
this is done through the `-o` flag followed by a comma-separated set of field
specifiers described in `man ps`, the whole list of which can be obtained by
running `ps -L` or `nps -l`. So if you just need the PID, you'd use `-o pid`. If
you just need to lookup some frequently used info, I included the verbose `-v`
flag, which acts like the `ps -j` flag, though implemented in terms of `-o
'user, pid, ppid, pgid, sess, jobc, state, tt, time, command'`, which are the
displayed fields.

In terms of matching, the command defaults to case-insensitive matching for
faster typing, but case-sensitivity can be obtained with the `-s` flag. `nps`
matches on the command name and PID, but it's possible to specify the matching
criteria using the `-m` flag (whose argument is similar to that of the `-o`
flag). As a special case, if you specify `-m pid`, `nps` only matches on entire
PIDs, as it's pretty much useless to match only part of the PID.

## Improving Output

Further improvements are concerned with output. `nps` detects whether its output
is directed towards a terminal, and if that's the case enable `grep` output
colorization so that you can quickly identify what was matched. You can also
specify the `--color` flag which forces colorizaton even when `nps` is piped to
a file or other process (this will leave terminal color codes in the output).

Similarly, `nps` follows after `ps` and clips command names if the output is a
terminal. However, this too can be controlled: use `--full` to always output
full command names, and `--clip` to always clip them. Note that the clip length
depends on the size of the terminal `nps` is running in!

Another related concern use is the inclusion of a header. By default, `ps` will
include a line with the name of all fields (columns) on display. This can be
useful on the terminal when displaying a lot of fields (e.g. `nps -v`) but not
otherwise, and while used in scripts it's a nuisance to be parsed away. `nps`
hides the header by default, but it can be included back with the `--header`
option.

## Killing Processes with `nps`

Killing processes? Easy peezy, lemon squeezy, just add the `-k` flag:

```bash
$ nps -k sleep
# 60772 sleep 300
```

`nps` still prints the matched processes, which it also kills. Note it may fail
to kill the matched processes! If the exit code is 0 when using `-k`, it means
that all matched processes were killed (or that no process was matched).

As an aside, it's rather difficult to make the decision of what to return when
no process is matched. On the one hand, all *matched* processes (i.e. none) were
successfully killed. On the other hand, if you emit the command, you might
expect it to kill something. I opted for to return 0 when no process is matched
with `-k` (while usually it would be 1), because it makes the command
[idempotent], a very useful property when writing scripts.

[idempotent]: https://en.wikipedia.org/wiki/Idempotence

It might be slightly better if `nps` reported on exactly which process were
killed and which lived on, though re-running `nps` (without `-k`) can easily
help determine which process are still alive, so all in all not a crucial
feature.

## Argument Processing

It's interesting to look at how `nps` processes it's arguments. Unlike most
commands, options can be freely mixed with regular arguments (which are passed
to `grep` for matching purposes). One advantage is that if you want to kill a
process, you can first verify your query, then kill the process by appening the
`-k` flag:

```bash
$ nps foobar
# 59325 sleep 300
# # (press up, type ' -k')
$ nps foobar -k
# 59325 sleep 300
```

If you use an unknown flag (e.g. `-z` or `--foobar`), `nps` will display its
help and exit with code 1. But what if you want to match flags — a totally
reasonable thing to do? Then you need to put those flags at the end, *after* the
special `--` separator:

```bash
$ nps -- -li
# 2043 bash -li
#  519 bash -li
```

I think it would be *slightly* better if one could still have regular options
after. We could imagine to bracket sensitive options with `--`: `nps -- -li --
-k`, but then we also need a way to specify we want to match `--` itself,
probably as a special flag (e.g. `--sep`). This is a pretty big change to the
script for little benefits, so I'm holding out for now.

All the "search" arguments are collected in order and merged (separated by a
whitespace). So in reality, it doesn't really make sense to have more than one,
though it can be convenient to type `nps sleep 300` rather than `nps 'sleep
300'`.

## Regular Expressions, and Return Code

The final search parameter (obtained through argument processing as described in
the last section) will be used as a [Posix extended regular expression
(ERE)][ERE].

This is something to keep in mind when you special characters which might need
to be quoted. For instance, to search for an interrogation mark: `nps '\?'`.

For instance, the following command will match and highlight all string literals
in running commands arguments:

```bash
$ nps '".*"'
```

[ERE]: https://www.regular-expressions.info/posix.html

As for the return code, `nps` returns 0 if it matched processes, 1 otherwise.
This is different when using the `-k` flag, as discussed above.

## Potential Pitfalls

`nps` was only tested on macOS Catalina, and given how finicky these things are,
it's almost sure not to work out of the box on Linux.

In particular, the `script` command appears different in [Linux][script-linux]
than in [macOS][script-macos].

[script-linux]: http://man7.org/linux/man-pages/man1/script.1.html
[script-macos]: https://www.unix.com/man-page/mojave/1/script/

## Getting `nps`

[`nps` can be found in this Gist][nps-gist]. Because it's short, I'm also
joining a copy below:

[nps-gist]: https://gist.github.com/norswap/3506d2b46102c2f32f18acced0ecd798

```bash
#!/bin/bash

### --- Constants ---

SCRIPT_CMD='script -q /dev/null'
TAIL_CMD='tail -n +2'

### --- Parameters ---

ALL=''     # flag to match all users process
CASE='-i'  # flag for case-insensitive matches
KILL=0     # if 1, kill matched processes

# ps fields to match on
MATCH_FIELDS='-o pid,command'

# ps fields to output
OUTPUT_FIELDS='-o pid,command'

# command used to strip the header (or not)
STRIP_HEADER="$TAIL_CMD"

if [[ -t 1 ]]; then
    COLOR='--color=always'  # whether to colorize output
    CLIP="$SCRIPT_CMD"      # command to clip command names (or not)
else
    COLOR='--color=none'
    CLIP=''
fi

### --- Help ---

help() {
    echo -e "Usage: nps <opts or search terms> [-- <search terms>]\n" \
    "  Print processes.\n" \
    "    -a: include processes from [a]ll users\n" \
    "    -s: case-sensitive match\n" \
    "    -k: [k]ill the mached processes\n" \
    "    -h: print this [h]elp and exit\n" \
    "    -l: print the [l]ist of selectable fields and exit\n" \
    "    -m <fields>: specify comma-separated list of field to [m]atch on\n" \
    "       If specifying only '-m pid', only matches entired PIDs. \n" \
    "    -o <fields>: specify comma-separated list of fields to [o]utput\n" \
    "    -v: [v]erbose output, equivalent to\n" \
    "        -o 'user, pid, ppid, pgid, sess ,jobc, state, tt, time, command' \n" \
    "    --color: [c]olorize output even when piping to programs\n" \
    "    --header: include fields (columns) header in output\n" \
    "    --full: output full command name even if stdout is a terminal\n" \
    "    --clip: output clipped command name even if stdout is not a terminal\n" \
    "    --version: print version and exit\n";
}

### --- Arg Parsing ---

POSITIONAL=()
while [[ $# -gt 0 ]]; do case "$1" in
    -a)  ALL='-a';;
    -s)  CASE='';;
    -v)  OUTPUT_FIELDS="-o user, pid, ppid, pgid, sess, jobc, state, tt, time, command'";;
    -o)  OUTPUT_FIELDS="-o $2"; shift;;
    -m)   MATCH_FIELDS="-o $2"; shift;;
    -k)  KILL=1;;
    -l)         ps -L; exit;;
    -h|--help)  help; exit;;
    --)         shift; break;;

    --color)    COLOR='--color=always';;
    --header)   STRIP_HEADER='cat';;
    --full)     CLIP='';;
    --clip)     CLIP="$SCRIPT_CMD";;
    --version)  echo 2020.03.22; exit;;
    -*)         help; exit 1;;

     *)  POSITIONAL+=("$1");;
    esac
    shift
done
set -- "${POSITIONAL[@]}" "$@" # restore positional parameters

### --- Match PIDs ---

filter_header_and_grep() {
    $TAIL_CMD | grep -v "$(which nps)" | grep -v " grep "
}
select_pids() {
    grep $CASE -E -- "$*" | awk '{ print $1 }'
}

# if matching on PID only, only match whole PIDs
[[ "$MATCH_FIELDS" == "-o pid" ]] && MATCH_FIELDS=-"p $*"

# find matching PIDs
PIDS="$(ps -x $ALL "$MATCH_FIELDS" | filter_header_and_grep | select_pids "$*")"

# when no process is found: exit with 1, or with 0 when the -k flag is set
[[ "$PIDS" == '' ]] && { [[ $KILL == 1 ]]; exit $?; }

### --- Output ---

highlight_matches() {
    if [[ "$*" == '' ]]; then cat; else grep $COLOR $CASE -E "($*)|$"; fi
}

# print with requested fields + highlighting
# the tr command cleans up the script command output
$CLIP ps -x "$OUTPUT_FIELDS" -p $PIDS | tr -d '\r' | $STRIP_HEADER | highlight_matches "$*"
EXIT=$?

### --- Kill ---

# kill matched processes if requested
if [[ $KILL == 1 ]]; then
    kill -9 $PIDS
    EXIT=$?
fi

exit $EXIT
```

<link href='https://cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/themes/prism-tomorrow.min.css' rel='stylesheet' />
<script
src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/components/prism-core.min.js'></script>
<script
src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.19.0/plugins/autoloader/prism-autoloader.min.js'></script>
