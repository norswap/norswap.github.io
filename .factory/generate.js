const marked      = require('marked')
const matter      = require('gray-matter')
const moment      = require('moment')
const escape_html = require('escape-html')
const tmp         = require('tmp-promise')
const fsp         = require('fs').promises
const mkdirp      = require('mkdirp-promise')
const watcher     = require('@atom/nsfw')
const path        = require('path')

// TODO: posts manifest
//  when creating / modifying posts, must load page manifest
//  if it doesn't exist -> create it
//  to create it, read every post
//  save: title, link, date, layout, content for briefs, content for $atom_posts most recent posts
//  generate pages & atom from this manifest
//  updating manifest + regenerate pages/atom:
//      if the entry for a link would be changed

// TODO: directories nested within 'top'

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
const posts             = []
const posts_per_page    = 15
const atom_posts        = 10

// --------------------------------------------------------------------------------

// Forces the last written file to be flushed.
process.on('exit', () => {
.   /!stdout()
});

// --------------------------------------------------------------------------------
// Page Generation

function permalink (type, filename)
{
    switch (type) {
        case 'post':
            return filename.slice(13, -3) // strip date, number and extension
        case 'page':
            return filename.slice(0, -3); // strip extension
        case 'draft':
            return 'draft-' + filename.slice(0, -3) // strip extension
    }
    throw "unknown page type"
}

async function generate_page (type, filename) // relative filename
{
    var date = moment(filename.slice(0, 10), 'YYYY-MM-DD')
    var layout = type == 'draft' ? 'post' : type
    var plink = permalink(type, filename)
    var src_loc = type + 's/' + filename;
    var str = await fsp.readFile(src_loc, {encoding: 'utf-8'});
    var obj = matter(str);
    var meta = obj.data;
    if (meta.title) meta.title = escape_html(meta.title);
    var content = marked(obj.content);
    if (type == 'post')
        posts.push(new Post(date, filename, plink, meta, content));
    await mkdirp('../' + plink);
    let loc = `../${plink}/index.html`
.   /!output(loc)
.   /!include('page.dna')
    console.log(`Created ${loc}`)
}

async function generate_pages (type)
{
    const promises = [];
    for (filename of await fsp.readdir(type + 's'))
        if (filename[0] == '.') continue;
        else promises.push(generate_page(type, filename));
    return Promise.all(promises);
}

// --------------------------------------------------------------------------------
// Generate Index Pages & Atom Feed

function range(n) {
    return Array(n).fill().map((_, i) => i + 1);
}

async function generate_index_page (page, num_pages)
{
    var layout = 'home';
    var tmp_file = await tmp.tmpName();
.   /!output(tmp_file)
.   /!include('home.dna')
.   /!stdout() // forces the temp file to be flushed
    var content = await fsp.readFile(tmp_file, {encoding: 'utf-8'});

    if (page == 1) {
.       /!output('../index.html')
    } else {
        await mkdirp('../' + page);
.       /!output('../' + page + '/index.html')
    }

    var meta = { title: '' + page } // NOT USED
.   /!include('page.dna')
}

async function generate_index_pages_and_atom (posts_promise)
{
    await posts_promise;
    // sort in descending filename order (newest (biggest date) first)
    posts.sort((a, b) => a.filename > b.filename ? -1 : 1);

    var num_pages = Math.floor((posts.length - 1) / posts_per_page) + 1;

    for (page of range(num_pages))
        generate_index_page(page, num_pages);

.   /!output('../atom.xml')
.   /!include('atom.dna')
}

// --------------------------------------------------------------------------------

function build_all()
{
    const posts_promise = generate_pages('post');
    generate_index_pages_and_atom(posts_promise);
    generate_pages('page');
    generate_pages('draft');
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

async function unlink (dir, file)
{
    switch (dir) {
        case 'posts':
        case 'pages':
        case 'drafts':
            const type = dir.slice(0, -1)
            const loc = '../' + permalink(type, file)
            await fsp.unlink(loc)
            console.log(`Deleted ${loc}`)
            break
        case 'top':
            await fsp.unlink(`../${file}`)
                .then  (_ => console.log(`Deleted ../${file}`))
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
    }

    return Object.values(map)
}

async function watch()
{
    const cwd = path.resolve('.')
    const watching = await watcher(path.resolve(cwd), events => {
        for (event of debounce(events)) {
            const path = event.directory.replace(/\\/g, '/') // normalize
            const dir  = path.split('/').last()
            if (dir == '.factory') continue
            switch (event.action) {
                case watcher.actions.CREATED:
                case watcher.actions.MODIFIED:
                    create(dir, event.file)
                    break
                case watcher.actions.DELETED:
                    unlink(dir, event.file)
                    break
                case watcher.actions.RENAMED:
                    rename(dir, event.oldFile, event.newFile)
                    break
            }
        }
    })
    watching.start()
}

// --------------------------------------------------------------------------------

switch (process.argv[2]) // assumes node <script> <arg>
{
    case 'build':
        build_all()
        break
    case 'watch':
        watch()
        break
}

// --------------------------------------------------------------------------------
