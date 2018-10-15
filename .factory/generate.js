const marked      = require('marked')
const matter      = require('gray-matter')
const moment      = require('moment')
const escape_html = require('escape-html')
const tmp         = require('tmp-promise')
const fsp         = require('fs').promises
const mkdirp      = require('mkdirp-promise')
const watcher     = require('@atom/nsfw')
const path        = require('path')

// --------------------------------------------------------------------------------

function Post (date, filename, permalink, meta, content) {
    this.date = date
    this.filename = filename
    this.permalink = permalink
    this.meta = meta
    this.content = content
}

// --------------------------------------------------------------------------------

const url               = 'http://norswap.com'
const posts_per_page    = 15
const atom_posts        = 10

// --------------------------------------------------------------------------------

// Forces the last file written by ribosome to be flushed.
process.on('exit', () => {
.   /!stdout()
});

// --------------------------------------------------------------------------------
// Post Tracking

// Tracks the lowest post that changed, so that we only regenerate the feed and
// the index pages if we need to.
let lowest_post_change = Infinity

// Posts are sorted in newest-first order: so reverse filename order, because
// filenames start with their date followed by a daily counter.
let posts

// When building incrementally, fill with boolean to indicate whether there is
// still a source file for the post at the same index (= true).
let post_exists

// Returns the index of the post with the given filename within `posts` or the location at which it
// should be inserted.
function find_post (filename)
{
    let low  = 0
    let high = posts.length

    while (low != high)
    {
        const mid  = Math.floor((high + low) / 2)
        if (posts[mid].filename > filename)
            low = mid + 1
        else
            high = mid
    }

    return low
}

// Insert `post` into `posts`, keeping it sorted and avoiding duplicates by
// filename.
function insert_post (post)
{
    const i = find_post(post.filename)
    lowest_post_change = Math.min(i, lowest_post_change)

    // Skip content for posts for which it is not required elsewhere.
    if (i >= atom_posts) {
        if (post.meta.layout != 'brief')
            post.content = ''
    // The content of the last atom post might no longer be required.
    } else if (posts.length > atom_posts) {
        const last = posts[atom_posts]
        if (last.meta.layout != 'brief') last.content = ''
    }

    if (i < posts.length && posts[i].filename == post.filename) {
        posts[i] = post
        post_exists[i] = true
    } else {
        posts.splice(i, 0, post)
        post_exists.splice(i, 0, true)
    }
}

// Removes the post with the given filename from `posts`, if it exists.
function remove_post (filename)
{
    const i = find_post(filename)
    lowest_post_change = Math.min(i, lowest_post_change)

    if (i < posts.length && posts[i].filename == filename)
    {
        posts.splice(i, 1)

        // Regenerate the content for one post that might now be needed to round
        // out the atom feed.
        if (i < atom_posts && posts.length >= atom_posts) {
            const last = posts[atom_posts - 1]
            if (last.meta.layout != 'brief')
                generate_page('post', last.filename, false)
        }
    }
}

async function parse_post_cache()
{
    posts = JSON.parse(await fsp.readFile('posts.json'),
                       (k,v) => k == 'date' ? moment(v) : v)

    post_exists = new Array(posts.length).fill(false)

}

async function write_post_cache()
{
    if (lowest_post_change < Infinity)
        await fsp.writeFile('posts.json', JSON.stringify(posts, null, '\t'))
}

// --------------------------------------------------------------------------------
// Page Generation

function permalink (type, filename)
{
    switch (type) {
        case 'post':
            return filename.slice(13, -3) // strip date, counter and extension
        case 'page':
            return filename.slice(0, -3); // strip extension
        case 'draft':
            return 'draft-' + filename.slice(0, -3) // strip extension
    }
    throw "unknown page type"
}

async function generate_page (type, filename, incremental) // relative filename
{
    const src_loc = type + 's/' + filename
    const plink = permalink(type, filename)
    const dst_loc = `../${plink}/index.html`
    const src_time = (await fsp.stat(src_loc)).mtimeMs

    if (incremental) {
        const dst_time = await fsp.stat(dst_loc).then(x => x.mtimeMs, _ => 0)
        if (src_time < dst_time) {
            if (type == 'post')
                post_exists[find_post(filename)] = true
            return
        }
    }

    const date = moment(filename.slice(0, 10), 'YYYY-MM-DD')
    const layout = type == 'draft' ? 'post' : type
    const obj = matter(await fsp.readFile(src_loc, {encoding: 'utf-8'}))
    const meta = obj.data
    if (meta.title) meta.title = escape_html(meta.title)
    const content = marked(obj.content)
    await mkdirp('../' + plink)
.   /!output(dst_loc)
.   /!include('page.dna')
    console.log(`Created ${dst_loc}`)
    if (type == 'post')
        insert_post(new Post(date, filename, plink, meta, content))
}

async function generate_pages (type, incremental)
{
    const promises = []
    for (filename of await fsp.readdir(type + 's')) {
        if (filename[0] == '.') continue
        promises.push(generate_page(type, filename, incremental))
    }
    return Promise.all(promises)
}

// Note: incremental builds will only call this for posts.
async function delete_page (type, filename)
{
    const dir = '../' + permalink(type, filename)
    // catch in case already deleted
    await fsp.unlink(dir + '/index.html').catch(e => {})
    await fsp.rmdir(dir).catch(e => {})
    console.log(`Deleted ${dir}`)
    if (type == 'post')
        remove_post(filename)
}

// --------------------------------------------------------------------------------
// Generate Index Pages & Atom Feed

async function generate_index_page (posts, page, num_pages)
{
    const layout = 'home';
    const tmp_file = await tmp.tmpName();
.   /!output(tmp_file)
.   /!include('home.dna')
.   /!stdout() // forces the temp file to be flushed
    const content = await fsp.readFile(tmp_file, {encoding: 'utf-8'});
    let output = ''

    if (page == 1) {
        output = '../index.html'
    } else {
        await mkdirp('../' + page);
        output = `../${page}/index.html`
    }

    const meta = {} // unused, but avoid compile-time error
.   /!output(output)
.   /!include('page.dna')
    console.log(`Created ${output}`)
}

async function generate_index_pages_and_atom ()
{
    const num_pages = Math.floor((posts.length - 1) / posts_per_page) + 1
    const lowest_page = Math.floor(lowest_post_change / posts_per_page) + 1

    for (let i = lowest_page; i <= num_pages; ++i)
        generate_index_page(posts, i, num_pages)

    if (lowest_post_change < atom_posts) {
.       /!output('../atom.xml')
.       /!include('atom.dna')
        console.log('Created ../atom.xml')
    }
}

// --------------------------------------------------------------------------------

async function build (incremental)
{
    generate_pages('page', incremental)
    generate_pages('draft', incremental)
    await parse_post_cache()

    await generate_pages('post', incremental)

    if (incremental)
        // Delete posts whose source have been deleted.
        await Promise.all(
            Array.from(post_exists.entries())
                .filter(([i, val]) => !val)
                .map(([i, val]) => delete_page('post', posts[i].filename)))

    generate_index_pages_and_atom()
    await write_post_cache()
}

// --------------------------------------------------------------------------------

async function create (dir, file)
{
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const kind = dir.slice(0, -1)
            await generate_page(kind, file)
.           /!stdout()
            break
        case 'top':
            await fsp.copyFile(`${dir}/${file}`, `../${file}`)
                .then  (_ => console.log(`Created ../${file}`))
                // On Windows (at least), renames will cause a creation event on
                // the old file, causing this to fail. Don't emit a message.
                // https://github.com/Axosoft/nsfw/issues/26
                .catch (e => console.log(e.message))
            break
    }
}

async function rename (dir, old, cur)
{
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const type = dir.slice(0, -1)
            const old_loc = '../' + permalink(type, old)
            const cur_loc = '../' + permalink(type, cur)
            await fsp.rename(old_loc, cur_loc)
                .then  (_ => console.log(`Moved ${old_loc} to ${cur_loc}`))
                .catch (e => console.log(e.message))
            break
        case 'top':
            await fsp.rename(`../${old}`, `../${cur}`)
                .then  (_ => console.log(`Moved ../${old} to ../${cur}`))
                .catch (e => console.log(e.message))
            break
    }
}

async function unlink (dir, filename)
{
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const type = dir.slice(0, -1)
            await delete_page(type, filename)
            break
        case 'top':
            await fsp.unlink(`../${filename}`)
                .then  (_ => console.log(`Deleted ../${filename}`))
                .catch (e => console.log(e.message))
            break
    }
}

function debounce (events)
{
    const map = {}
    // eliminate duplicate events
    events.forEach(it => map[JSON.stringify(it)] = it)

    for (event of Object.values(map))
    {
        // On Windows (at least), renames will cause a creation event on the old
        // file. Here we delete it. (https://github.com/Axosoft/nsfw/issues/26)
        // It also generates a modify event on the the new file, which we also
        // delete.
        if (event.action == watcher.actions.RENAMED) {
            const create_old = {
                action: watcher.actions.CREATED,
                directory: event.directory,
                file: event.oldFile
            }
            const modify_new = {
                action: watcher.actions.MODIFIED,
                directory: event.directory,
                file: event.newFile
            }
            delete map[JSON.stringify(create_old)]
            delete map[JSON.stringify(modify_new)]
        }
        // On Windows (at least), creations also cause a corresponding modification.
        else if (event.action == watcher.actions.CREATED) {
            const modify = {
                action: watcher.actions.MODIFIED,
                directory: event.directory,
                file: event.file
            }
            delete map[JSON.stringify(modify)]
        }
    }

    return Object.values(map)
}

async function watch()
{
    await parse_post_cache()
    let lock = Promise.resolve()
    const cwd = path.resolve('.')
    const watching = await watcher(path.resolve(cwd), async (events) => {
        let resolve
        const old_lock = lock
        lock = new Promise((r, _) => resolve = r)
        await old_lock
        let promises = []
        for (event of debounce(events)) {
            const path = event.directory.replace(/\\/g, '/') // normalize
            const dir  = path.split('/').last()
            if (dir == '.factory') continue
            switch (event.action) {
                case watcher.actions.CREATED:
                case watcher.actions.MODIFIED:
                    promises.push(create(dir, event.file))
                    break
                case watcher.actions.DELETED:
                    promises.push(unlink(dir, event.file))
                    break
                case watcher.actions.RENAMED:
                    promises.push(rename(dir, event.oldFile, event.newFile))
                    break
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises)
            await Promise.all([
                generate_index_pages_and_atom(),
                write_post_cache()])
            lowest_post_change = Infinity
            console.log('') // skip a line before next set of events
        }
        resolve()
    },
    {debounceMS: 1000}) // bogus events tend to be fired, even so

    watching.start()
}

// --------------------------------------------------------------------------------

switch (process.argv[2]) // assumes node <script> <arg>
{
    case 'build':
        build(true)
        break
    case 'rebuild':
        build(false)
        break
    case 'watch':
        watch()
        break
}

// --------------------------------------------------------------------------------
// NOTES
//
// # Potential Improvements:
//
// - Make incremental build also track the deletion of pages and assets (not
//  only posts).
//
// - Watching does not recursively track the changes in the top/ directories
//   (only direct changes).
