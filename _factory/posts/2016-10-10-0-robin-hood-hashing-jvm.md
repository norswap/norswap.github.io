---
title: "Robin Hood Hashing on the JVM"
layout: post
---

Robin Hood Hashing, despite its name, isn't a hashing technique, but rather a
way to implement [linear-probing hash tables][lph].

In the classical linear probing implementation, whenever a hash table slot is
already taken (due to hash collision), you probe ahead until you find an empty
slot. When the hash table is highly loaded, this can lead to entries being
stored far away from their preferred position.



Robin Hood Hashing features a notion of *displacement*. The displacement of an
entry is the distance between its actual position and its preferred position.
Furthermore, we call *probe count* the number of probed slots in order to find a
free slot. When inserting an entry, the final probe count is the diplacement.

When inserting an entry A using Robin Hood Hashing, if you encounter an entry B
whose displacement is smaller than the probe count, you insert A in B's
position, and relocate B further in the table (following the same rules).

The result is that the displacements of all entries in the map tend to even out.
The length of the longest displacement tends to increase as the load increase
but very slowly (around 6 for a load of 0.9 &mdash; see
[this paper (pdf)][paper1]).

The technique is actually quite old. It was first [published in 1986][paper2].
As for me, I first become aware of Robin Hood Hashing through
[a post by Sebastian Sylvan][rhh3]. Emmanuel Goossaert also has two posts
([one][rhh1], [two][rhh2]) analyzing and then improving the technique. If you're
looking for further information, I highly recommend these posts.

I was interesting in a more pragmatic question: could I use Robin Hood Hashing
and get a boost in performance? In particular, how would it perform on the JVM,
where I do most of my work these days?

I implemented two versions of the algorithm ([source]). The first versions
stores entry objects in the table (hence requiring an extra indirection for each
probed slot). The second version used two tables: the first one was an array of
integers, where each table entry occupies two array entries. The first array
entry is the hash, the second is the displacement. The second table is an array
of objects. Here too, each table entry occupies two array entry. The first array
entry is the key, the second is the value. The theory is that most of the time,
when probing, you only need to check the hash and the displacement. Having those
in the primary table avoids extra indirection (and hence cache misses).

Disappointingly enough, the performance delta between both techniques is too
small to be meaningful. In general however, the technique is almost as fast as
Java's [`HashMap`][hashmap] implementation. With some performance tweaking, I
believe it would be possible to close the gap. Be warned that my measurements
are very wonky. Nevertheless they gave me confidence enough to come to two
conclusions:

- Robin Hood Hashing is practical and fast enough to rival separate-chaining
  hash table implementation (like Java's `HashMap`) on the JVM.
  
- However, it is not significantly faster either, and so it's probably not worth
  the trouble of maintaining my own implementation.
  
Note this says nothing about the relative performance of Robin Hood Hashing and
separate-chaining on other platforms than the JVM.
  
And off course, you should totally perform you own measurements. You can get
started from [my own code][source]. If anyone has more data to add to the
discussion, make sure to share it in the comments.

[lph]: https://en.wikipedia.org/wiki/Linear_probing
[rhh1]: http://codecapsule.com/2013/11/11/robin-hood-hashing/
[rhh2]: http://codecapsule.com/2013/11/17/robin-hood-hashing-backward-shift-deletion/
[rhh3]: http://www.sebastiansylvan.com/post/robin-hood-hashing-should-be-your-default-hash-table-implementation/
[paper1]: http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.130.6339
[paper2]: https://cs.uwaterloo.ca/research/tr/1986/CS-86-14.pdf
[hashmap]: https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html
[source]: https://github.com/ncellar/robinmap
