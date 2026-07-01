---
layout: post
title: "Safe human-friendly multi-agent setup"
---

Like everyone else I've been playing with agents.

But I had two problems:

1. I didn't want to `--dangerously-skip-permissions` and give Claude access to my entire computer unsupervised.
   Besides regular agent stupidity, [prompt injections][injections] are a thing.
2. I couldn't safely run two agents or more on the same repo.

[injections]: https://owasp.org/www-community/attacks/PromptInjection

I also wanted a solution that would let me edit and run the code on my machine, even if the agent runs inside a VM or
container.

This seems like a common set of issues and requirements. But the only thing I could find that satisfied all of them was
[workmux], which forces you into using tmux (which I didn't want).

[workmux]: https://workmux.raine.dev/

I figured rolling out my own solution would be easy (and for once, it was), and would teach me something (it did).
So here we go!

To bake this solution we need:

- [Git worktrees][worktrees], to get one checkout of the codebase to each agent (we'll also give them their own branch).
- A virtualization or containerization solution to run the agents inside. I went with [Dev Containers] and their
  [CLI][devcli], which runs containers on Docker.
- Judicious use of mount volumes on the container so that we can share the code between host and container, but
  isolate OS-specific bits.
- Some command glue to make everything easy to operate.

[worktrees]: https://git-scm.com/docs/git-worktree
[Dev Containers]: https://containers.dev/
[devcli]: https://github.com/devcontainers/cli

## Notes on Containerization

There's many ways to build the containerization. I landed on Dev Containers as the first thing I tried, and it seems as
easy to set up as those kind of things are going to get.

One area of note is security. On macOS Docker runs your containers inside a VM. On Linux, it uses a suite of isolation
tech to shield them from your system. Containers outside a VM are notoriously less secure in practice — the attack
surface for an escape is much higher, and it's much easier to shoot yourself in the foot with misconfiguration. So if
you're manning Linux and you want optimal security, you might want to look into alternatives. That being said, to purely
defend against mistakes and prompt injections, this much is probably enough.

Even on macOS, there's a single VM for all containers. You might want to isolate every worktree in its own container to
avoid accidental cross-agent interference.

Dev Containers are a standard for tools to setup and become aware of a container in which the code can be built and run.
As such, some IDEs (VS Code, JetBrains, ...) can set up and connect to the container for you. They install a copy of the
IDE inside the container and connect with a light client on the host. So while the UI is on the IDE, everything
meaningful is running in the container (this is called "remote development").

This capability was initially appealing to me, but now I don't care about it. Because the code is mirrored between host
and guest, and dependencies are isolated, I prefer to just edit on my host and run commands on the guest.

Note that IDEs can also connect to any container via SSH instead for remote development. You will actually need this
instead of the built-in dev container support if you want to open multiple sessions (one per worktree for instance).

## Example Walkthrough

Okay, let's see what the setup looks like in practice. I will link to a repo where I'm cooking some experiment (pinning
the links to a commit for posterity).

### Dev Container

The Dev Container setup is done inside the [`.devcontainer`] directory.

[`.devcontainer`]: https://github.com/norswap/evmetal/tree/e630a7c447b4365e25438851a7bef68c109ca21e/.devcontainer

`devcontainer.json` specified the attached Dockerfile, the resources we want to allocate, setting a few names so that
things are nice and tidy inside the VM and inside Docker. There's a built-in feature for getting Node.js and one to run
the SSH daemon. The other dependencies are installed via a `RUN` command in the Dockerfile.

The username is `vscode` because we use a Microsoft Debian base image that comes with this non-root user by default.
SSH will run on port 2222.

We mount the host's `id_rsa` public key (so that it can be allowed to SSH into the container), as well as a
`node_modules_volume` to isolate dependencies between host and container.

In our repo, `node_modules` in the root and in every worktree is symlinked to `node_modules_volume/{root,
wt-<worktree>}`. On the host, `node_modules_volume` is a regular directory, while on the container it is a volume,
meaning guest and container manage their dependencies separately.

We also mount create dedicated volumes for the Claude Code and JetBrains settings. These persist when the container
image is being rebuilt which avoids us having to reauthenticate Claude and redownloading the (hefty) IntelliJ backend
every time the image is rebuilt. (This is if you want to use remote development and can be skipped otherwise.)

Finally, we can specify VS Code extension that need to exist container-side. Host-side extensions can still be used, but
some (typically those that need to run binary tools) need to be installed server-side. (Again, only relevant for remote
development).

The `post-create.sh` script is referenced in the `Dockerfile`  and runs inside the container after it has been created &
spun up and is used to setup the shared volumes and files.

The `Dockerfile` installs some dependencies, including Claude and the [Playwright] MCP server so that Claude can debug webapps
from inside the container.

[Playwright]: https://playwright.dev/

With this devcontainer setup, we can use the following command (although the repo wraps them in makefile commands which
we'll review shortly):

- bring the container up or down with `devcontainer {up,down} --workspace-folder .`
- rebuild the image with `devcontainer up --workspace-folder . --remove-existing-container`
- run a shell or claude in the image with `devcontainer exec --workspace-folder . {bash, claude --dangerously-skip-permissions}`

Once spun up you can connect by SSH via `vscode@localhost:2222`, and you can connect your IDE for remote development. On
VS Code use the [Remote SSH] extension, on JetBrains IDE look for the "File > Remote Development..." menu.

[Remote SSH]: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh

### Worktrees & Makefile

The repo's [`makefile`] exposes the following commands:

[`makefile`]: https://github.com/norswap/evmetal/blob/e630a7c447b4365e25438851a7bef68c109ca21e/makefile

- `make dev.{up, down}` — bring the dev container up or down
- `make dev.tear` — bring the dev container down and delete it (named volumes persist)
- `make dev.rebuild` — rebuild the dev container
- `make dev.shell` — open a shell in the container (if run from a worktree dir, open the shell in the corresponding worktree on the container)
- `make dev.claude` — opens claude in the container (same comment for worktrees)
- `make tree name=<NAME>` — create a new worktree at `.worktrees/<NAME>` on branch `wt/<NAME>`
- `make rmtree name=<NAME>` — remove the worktree at `.worktrees/<NAME>` (the branch is preserved)
- `make trees` — list all worktrees

Additionally, the makefie is aware of our system to isolate dependencies (`node_modules`) between host and container.
`make setup` (sets up the repo) and `make nuke` (delete all outputs and dependencies) ensure that the `node_modules`
symlink are setup properly, as described in the previous section.

## Coda

And that's it. Worktrees, containerization with judicious use of volumes, and some glue commands. That's all you need to
safely isolate your agents from one another and from your system, while retaining the ability to build and run both on
the host and the container. Have fun hacking!

<script type="module">
  import hljs from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/highlight.min.js";
  import json from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/languages/dockerfile.min.js";
  import dockerfile from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/languages/dockerfile.min.js";
  import bash from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/languages/dockerfile.min.js";
  import makefile from "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/es/languages/dockerfile.min.js";
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("dockerfile", dockerfile);
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("makefile", makefile);
</script>