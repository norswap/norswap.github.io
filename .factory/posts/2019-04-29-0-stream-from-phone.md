---
title: "Streaming Music From Phone to Computer"
layout: post
---

I keep my full music library (50+ GB of music) synced with the external SD card
on my (Android) phone. Occasionaly, it is handy to stream music to a computer.
Notably, my work laptop only has a 256GB of disk, so streaming lets me save
space, not to mention avoid syncing pains.

It's not incredibly obvious how to do this however, even after some quick
googling. Hence this post.

## The Simple Solution

This works well on home wifi networks.

We're going to use the DLNA/UPnP protocols to stream from our phone to a computer.

On my (Android) phone, I use the [Hi-Fi Cast] app. It's basically a music player
with the ability to stream to media servers (including [Chromecast], which is
also handy to stream to TVs).

On the computer, you'll need to install [Kodi]. Normally, Kodi is used more to
stream from the computer to other devices (typically a Smart TV) but here we
want to stream **to** Kodi. This is going to take some simple configuration.

We're going to follow the instructions from [here][upnp-client]:

> To turn on XBMC's UPnP client, in Kodi go to Settings -> Services -> UPnP and
> enable "Allow control of Kodi via UPnP".

Note you need to be at least in "Standard" configuration mode (not "Basic") to
do this, and enabling UPnP (on the same page) is a pre-requisite.

Aside: If you'd like to stream from your computer to your phone *while picking what to
play from your phone*, you can enable "Share my libraries" (you need to import
some media into Kodi, otherwise this is useless).

Now, in Hi-Fi cast go to the menu -> Playback Devices. Your computer should
appear with the name "Kodi (\<computer name\>)". Select it and enjoy streaming
to your computer.

What if it doesn't work? There might be some OS configuration options to set.
In particular, on Windows, "Control Panel -> Network and Sharing Center ->
Advanced sharing settings -> Media Streaming" might be relevant.

Another class of issues relate to the network you're on. If you have control of
the network configuration (i.e. the configuration of your internet router) and
are technically literate, you can try to see if there is anything fishy going on
there.

I wanted to stream my music not only at home, but also at work, where this naive
setup didn't work. Making it work there is the object of the next section.

[Hi-Fi Cast]: https://play.google.com/store/apps/details?id=com.findhdmusic.app.upnpcast
[Chromecast]: https://en.wikipedia.org/wiki/Chromecast
[Kodi]: https://kodi.tv/
[upnp-client]: https://kodi.wiki/view/UPnP/Client

## Streaming on Restricted Networks

I wanted to stream my music at work (I work at a University). The simple
solution didn't work. Obviously, the network had some kind of restriction on
protocols or ports being used.

After [some advanced investigation foo][investigation], I managed to figure out
the problem.

Basically, the auto-discovery protocol was blocked on the campus network. Which
is quite understanble really — I can imagine some kind of broadcasting is
involved, which isn't optimal when you're tight on bandwidth.

The solution is then to directly input the address of the playback device (the
computer's IP address + the port on which Kodi listens for incoming streams),
which is supported by Hi-Fi cast (under "Playback Devices", select the drop-down
("...") menu and then "Add UPnP Renderer").

But what is this address? That's where I had to [investigate][investigation].

Ultimately I ended up scanning my machine (a Mac) for listening ports by running
the command `sudo lsof -i -n -P | grep TCP`. This turned out that Kodi was
listening on 1912, 1655, and 9090, with 1655 being the one we are interested in.

The renderer address to add to Hi-Fi Cast is thus `http://<ip>:1655/`. The IP
address should be the local one (on campus we actually have public IPs!).

You can find your local IP (probably you want IPv4 — something like
"192.168.0.42") by running `ifconfig` on Mac and looking for "en0". On Windows,
run `ipconfig /all` and look for "Local Area Connection".

[investigation]: https://forum.kodi.tv/showthread.php?tid=341162

## Alternatives

If that doesn't work, an alternative is to set up some kind of server on your
phone to serve files, and to connect to it with your computer.

I used the excellent [Servers Ultimate] app for this (it's a trial and costs 9€
after that — it's probably possible to fish for alternatives though!).

Two kind of servers that work are "FTP Server" (not native nor proxy!) and
"WebDAV Server". I ran them with the default options, on ports 2121 and 8484
(respectively). Of the two, FTP worked on both Windows and Mac while I couldn't
get WebDAV to work on Windows.

(In case you'd be tempted to try an SMB server, don't. Unless your device is
rooted, you can't select the default port (455) because Android forbids
listening on ports in the 0-1024 range. Windows (and apparently, Linux?) won't
be able to connect to it. Mac is reported to work, but it didn't work for me
with Servers Ultimate... It did work with [another app] though, but I still had
issues. I think I had to create user accounts, and the Mac wouldn't disconnect
the network share, I had to issue a [`umount` command].)

Don't forget to change the directory you want to share — you probably don't want
to make your whole phone accessible, esp. if you're not gonna set a password.

I wanted to share a directory on my SD card, and for that I had to find its
exact path (which you can do using a disk usage application like [this
one][disks]). For me the SD card was at `/storage/0000-0000`.

Once the server is running you can access it by typing its address + port in the
Explorer address bar. e.g. `ftp://192.168.0.101:2121/` for FTP. On Mac, in the
Finder you need to do "Go > Connect to Server..." and enter the same thing.

For WebDav, on Mac you use `http` (or `https` if you use SSL): e.g.
`http://192.168.0.101:8484/`. I couldn't make it work on Windows, but in theory
you'd type `\\192.168.0.101@8484\DavWWWRoot\` (the last part is important and is
a special Windows keyword). If you use SSL, you need to write
`\\192.168.0.101@SLL@8484\DavWWWRoot\` instead. [More instructions
here][webdav-win].

And that's it — happy listening!

[Servers Ultimate]: https://play.google.com/store/apps/details?id=com.icecoldapps.serversultimate&hl=en
[disks]: https://play.google.com/store/apps/details?id=com.mobile_infographics_tools.mydrive
[webdav-win]: https://www.webdavsystem.com/server/access/windows/
[another app]: https://play.google.com/store/apps/details?id=fr.webrox.landrive
[`umount` command]: https://apple.stackexchange.com/questions/256209/
