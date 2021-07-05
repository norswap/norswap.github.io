const marked      = require('marked')
const matter      = require('gray-matter')
const moment      = require('moment')
const escape_html = require('escape-html')
const tmp         = require('tmp-promise')
const fsp         = require('fs').promises
const fse         = require('fs-extra')
const chokidar    = require('chokidar')
const npath       = require('path')
const touch       = require('touch')

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
    throw 'unknown page type'
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
    let content = marked(obj.content)
    // Make relative URLs relative to the root.
    // These are any URs not starting with a protocol, not _blank, and not
    // starting with a slash.
    content = content.replace(/(href|src)="(?!([^"]*?:\/\/|_blank|\/))/g, `$1="/${plink}/`);
    await fse.mkdirp('../' + plink)
    console.log(`${dst_loc}: ${meta.title}`)
.   /!output(dst_loc)
.   /!include('page.dna')
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
        await fse.mkdirp('../' + page);
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
.       /!stdout() // flush
        let atom = await fsp.readFile('../atom.xml');
        atom = atom.toString().replace(/(src|href)=&quot;\//g, '$1=&quot;https://norswap.com/');
        await fsp.writeFile('../atom.xml', atom);
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

function top_relpath(dir, base)
{
    dir = dir.replace(new RegExp('top/?'), '')
    return dir == '' ? base : `${dir}/${base}`
}

async function create (dir, base)
{
     if (dir.startsWith('top')) {
        const relpath = top_relpath(dir, base)
        await fsp.copyFile(`${dir}/${base}`, '../' + relpath)
            .then  (_ => console.log('Copied to ../' + relpath))
            .catch (e => console.log(e.message))
        return
    }
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const kind = dir.slice(0, -1)
            await generate_page(kind, base)
.           /!stdout()
            write_post_cache() // potentially wasteful
            break
    }
}

async function unlink (dir, base)
{
    if (dir.startsWith('top')) {
        const relpath = top_relpath(dir, base)
        await fsp.unlink('../' + relpath)
            .then  (_ => console.log('Deleted ../' + relpath))
            .catch (e => console.log(e.message))
        return
    }
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const type = dir.slice(0, -1)
            await delete_page(type, base)
            break
    }
}

async function create_dir (dir, base)
{
    if (!dir.startsWith('top')) return
    const path    = `${dir}/${base}`
    const relpath = top_relpath(dir, base)
    await fse.copy(path, '../' + relpath)
        .then  (_ => console.log('Copied dir to ../' + relpath))
        .catch (e => console.log(e.message))
}

async function unlink_dir (dir, base)
{
    if (!dir.startsWith('top')) return
    const relpath = top_relpath(dir, base)
    await fsp.rmdir('../' + relpath, {recursive: true})
        .then  (_ => console.log('Deleted dir ../' + relpath))
        .catch (e => console.log(e.message))
}

async function watch()
{
    await parse_post_cache()

    const processor = async (event, path) =>
    {
        path = path.replace(/\\/g, '/')
        const split = path.split('/')
        const is_top_path = path.startsWith('top/')

        if (split.length > 2 && !is_top_path) {
            console.log('Illegal directory nesting: ' + path)
            return
        }

        const base = split.last()
        const dir  = npath.dirname(path)

        switch (event) {
            case 'add':
            case 'change':
                await create(dir, base)
                break
            case 'unlink':
                await unlink(dir, base)
                break
            case 'addDir':
                await create_dir(dir, base)
                break
            case 'unlinkDir':
                await unlink_dir(dir, base)
                break
        }
    }

    const paths = ['top', 'posts', 'pages', 'drafts']
    const options = {ignoreInitial: true, awaitWriteFinish: true, cwd: '.'}
    const watcher = await chokidar.watch(paths, options)
        .on('add',          path => processor('add',        path))
        .on('change',       path => processor('change',     path))
        .on('unlink',       path => processor('unlink',     path))
        .on('addDir',       path => processor('addDir',     path))
        .on('unlinkDir',    path => processor('unlinkDir',  path))
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
// # TODO
//
// - Make incremental build also track the deletion of pages and `top/` content
//   (not only posts).
//      - We cannot simply a simple 'sync' like-mechanism for `top/` - it
//        couldn't handle deletions since the root also contains things
//        generated from posts.
//
// - Deleting a top directory with files in it causes errors to be printed.
//   Fine for now.
//
// - Since the FS watcher does not process by batch anymore, we can't regenerate
//   the index and atom like we did before.
//      - Like we did before = at the end of a batch ??
//      - Either we lock every processor run, sequentializing all I/O (my guess:
//        will change nothing).
//      - Or we rebuild the index separately (good solution).
//      - BUT the post cache now contains stale data...
//          - hackfix: source is touched (see "hackfix" above)
//          - probably want to rethink this cache thing in the long run
//
// - In watch mode, we write the post cache on every post update.
//   This is potentially wasteful. Alternatives:
//      - Use a sqlite database instead.
//      - Collect all changed files, install an interrupt handler and have it
//        touch every file at interrupt time. This way we will know the cache
//        content are stale, at the feeble cost of rebuilding a perfectly good
//        file. Use the `touch` function for this.
//
// - ribosome.js streams its changes to file, causing live-server to pickup many
//   small changes. This can't even be worked around by setting a higher wait
//   time, as the individual changes are still picked up and just bundled
//   together.
//      - Can only be fixed by getting rid of ribosome.
//
// - this error
// (node:28088) UnhandledPromiseRejectionWarning: Error: EPERM: operation not permitted, open '../unix-daemons/index.html'
//     at Object.openSync (fs.js:440:3)
//     at Object.writeFileSync (fs.js:1281:35)
//     at Object.appendFileSync (fs.js:1327:6)
//     at C:\Dropbox\code\web\.factory\generate.js.rna:124:24
//     at Array.forEach (<anonymous>)
//     at Block.write (C:\Dropbox\code\web\.factory\generate.js.rna:116:23)
//     at C:\Dropbox\code\web\.factory\generate.js.rna:196:15
//     at Array.forEach (<anonymous>)
//     at close (C:\Dropbox\code\web\.factory\generate.js.rna:195:22)
//     at Ribosome.stdout (C:\Dropbox\code\web\.factory\generate.js.rna:176:9)
//
// - old comment
//   "The move logic is incorrect, when you change the date of a post by renaming it."
