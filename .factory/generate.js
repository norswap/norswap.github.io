var marked      = require('marked');
var matter      = require('gray-matter');
var moment      = require('moment');
var escape_html = require("escape-html");
var tmp         = require('tmp');
var fs          = require('fs');

function range(n) {
    return Array(n).fill().map((_, i) => i + 1);
}

function Post (date, permalink, meta, content) {
    this.date = date
    this.permalink = permalink
    this.meta = meta
    this.content = content
}

var url = "http://norswap.com";
var posts = [];

// --- Generates Posts, and fill `posts`

var layout = "post";
for (filename of fs.readdirSync("posts")) {
    var str = fs.readFileSync("posts/" + filename, {encoding: "utf-8"});
    var date = moment(filename.slice(0, 10), "YYYY-MM-DD");
    var permalink = filename.slice(13, -3);
    var obj = matter(str);
    var meta = obj.data;
    if (meta.title) meta.title = escape_html(meta.title);
    var content = marked(obj.content);
    posts.push(new Post(date, permalink, meta, content));
    fs.mkdirSync("../" + permalink);
./!output("../" + permalink + "/index.html")
./!include("page.dna")
}

// --- Generate Index Pages

posts.reverse();
var posts_per_page = 15;
var num_pages = Math.floor((posts.length - 1) / posts_per_page) + 1;
var layout = "home"

for (page of range(num_pages)) {
    var tmpFile = tmp.tmpNameSync();
./!output(tmpFile)
./!include("home.dna")

    if (page == 1) {
./!output("../index.html")
    } else {
        fs.mkdirSync("../" + page);
./!output("../" + page + "/index.html")
    }

    var content = fs.readFileSync(tmpFile, {encoding: "utf-8"});

./!include("page.dna")
}

// --- Generate atom.xml

./!output("../atom.xml")
./!include("atom.dna")

// --- Generate Pages

var layout = "page";
for (filename of fs.readdirSync("pages")) {
    var str = fs.readFileSync("pages/" + filename, {encoding: "utf-8"});
    var permalink = filename.slice(0, -3);
    var obj = matter(str);
    var meta = obj.data;
    if (meta.title) meta.title = escape_html(meta.title);
    var content = marked(obj.content);
    fs.mkdirSync("../" + permalink);
./!output("../" + permalink + "/index.html")
./!include("page.dna")
}

// --- Generate Draft Pages

var layout = "post";
for (filename of fs.readdirSync("draft")) {
    var str = fs.readFileSync("draft/" + filename, {encoding: "utf-8"});
    var date = moment();
    var permalink = filename.slice(0, -3);
    var obj = matter(str);
    var meta = obj.data;
    if (meta.title) meta.title = escape_html(meta.title);
    var content = marked(obj.content);
    fs.mkdirSync("../" + permalink);
./!output("../" + permalink + "/index.html")
./!include("page.dna")
}
