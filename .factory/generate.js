const marked      = require('marked');
const matter      = require('gray-matter');
const moment      = require('moment');
const escape_html = require("escape-html");
const tmp         = require('tmp-promise');
const fsp         = require('fs').promises;

// TODO: remove looking for work from about

function Post (date, filename, permalink, meta, content) {
    this.date = date
    this.filename = filename
    this.permalink = permalink
    this.meta = meta
    this.content = content
}

const url   = "http://norswap.com";
const posts = [];

// --- Generates Posts, and fill `posts`

async function generate_page (type, filename) // relative filename
{
    var date = moment(filename.slice(0, 10), "YYYY-MM-DD");
    var layout = type == "draft"
        ? "post"
        : type;
    var permalink = type == "post"
        ? filename.slice(13, -3) // strip date, number and extension
        : filename.slice(0, -3); // strip extension
    if (type == "draft")
        permalink = "draft-" + permalink;
    var src_loc = type + "s/" + filename;
    var str = await fsp.readFile(src_loc, {encoding: "utf-8"});
    var obj = matter(str);
    var meta = obj.data;
    if (meta.title) meta.title = escape_html(meta.title);
    var content = marked(obj.content);
    if (type == "post")
        posts.push(new Post(date, filename, permalink, meta, content));
    await fsp.mkdir("../" + permalink);
.   /!output("../" + permalink + "/index.html")
.   /!include("page.dna")
}

async function generate_pages (type)
{
    const promises = [];
    for (filename of await fsp.readdir(type + "s"))
        if (filename[0] == '.') continue;
        else promises.push(generate_page(type, filename));
    return Promise.all(promises);
}

const posts_promise = generate_pages("post");

// --- Generate Index Pages & Atom Feed

function range(n) {
    return Array(n).fill().map((_, i) => i + 1);
}

const posts_per_page = 15;

async function generate_index_page (page, num_pages)
{
    var layout = "home";
    var tmp_file = await tmp.tmpName();
.   /!output(tmp_file)
.   /!include("home.dna")
.   /!stdout() // forces the temp file to be flushed
    var content = await fsp.readFile(tmp_file, {encoding: "utf-8"});

    if (page == 1) {
.       /!output("../index.html")
    } else {
        await fsp.mkdir("../" + page);
.       /!output("../" + page + "/index.html")
    }

    var meta = { title: "" + page } // NOT USED
.   /!include("page.dna")
}

async function generate_index_pages_and_atom()
{
    await posts_promise;
    // sort in descending filename order (newest (biggest date) first)
    posts.sort((a, b) => a.filename > b.filename ? -1 : 1);

    var num_pages = Math.floor((posts.length - 1) / posts_per_page) + 1;

    for (page of range(num_pages))
        generate_index_page(page, num_pages);

.   /!output("../atom.xml")
.   /!include("atom.dna")
}

generate_index_pages_and_atom();

// --- Generate Pages & Drafts

generate_pages("page");
generate_pages("draft");

// --- Forces the last written file to be flushed

process.on('exit', () => {
.   /!stdout()
});
