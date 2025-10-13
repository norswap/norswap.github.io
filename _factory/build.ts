import fs from "fs-extra"
import { readdir } from "fs/promises"
import matter from "gray-matter"
import { marked } from "marked"
import { gfmHeadingId } from "marked-gfm-heading-id"
import * as nunjucks from "nunjucks"
import { join } from "path"

// NOTE: Marked always escapes things like quotes, even when not necessary
// https://github.com/markedjs/marked/issues/269
// This does not cause any issues, but it is surprising.

marked.use(gfmHeadingId()) // adds #this-is-the-title id attributes to h1, h2, ...
nunjucks.configure({ autoescape: false })

// ---------------------------------------------------------------------------------------------------------------------
// Constants / Config

const DOMAIN            = "https://norswap.com"
const POSTS_PER_PAGE    = 15
const ATOM_POSTS        = 15
const PAGES_DIR         = "pages"
const POSTS_DIR         = "posts"
const DRAFTS_DIR        = "drafts"
const PAGE_TEMPLATE     = "templates/page.template"
const INDEX_TEMPLATE    = "templates/index.template"
const ATOM_TEMPLATE     = "templates/atom.template"
const OUTPUT_DIR        = ".."
const ASSETS_DIR        = "top"
const PAGE_FILENAME    = "index.html"
const CONTENT_FILENAME = "raw.txt"

// Global option for website generation
const options = {
    // Whether to force regenerate all pages (default: false)
    rebuild: false,
    // Whether to delete a previously generated page if its source is missing (default: true)
    cleanOrphans: true,
}

// ---------------------------------------------------------------------------------------------------------------------
// Types

enum PageType {
    PAGE = "PAGE",   // top-level page, not in feed
    POST = "POST",   // article, in feed
    DRAFT = "DRAFT", // draft article, not in feed
    INDEX = "INDEX", // home page + feed index page
}

type PageBase = {
    // Path relative to ./_factory
    srcPath: string
    // The page's slug (e.g. SLUG in https://norswap.com/SLUG)
    slug: string
}

type Post = PageBase & {
    pageType: PageType.POST
    // Display date for the post
    date: Date
    // Relative ordering of posts made the same day, starting at 0
    index: number
    // Cached rendered content for display on the index page.
    content?: Content
}

type Draft = PageBase & {
    pageType: PageType.DRAFT
    // Cached rendered content for display on the index page.
    content?: Content
}

type Content = {
    layout: "post" | "brief"
    title: string
    body?: string // only for briefs
}

type Page = PageBase & (
    | { pageType: PageType.PAGE }
    | { pageType: PageType.INDEX }
    | Post
    | Draft
    )

type PageTemplateParamsBase = {
    pageType: PageType
    slug: string
    body: string
    active: (pageName: string) => "active" | ""
}

type PageTemplateParamsPost = PageTemplateParamsBase & {
    title: string
    date: string
}

// ---------------------------------------------------------------------------------------------------------------------
// Utils

type Maybe<T, E = unknown> =
    | { ok: T, error?: undefined }
    | { ok?: undefined, error: E }

async function tryPromise<T, E = unknown>(promise: Promise<T>): Promise<Maybe<T, E>> {
    try {
        return { ok: await promise }
    } catch (error) {
        return { error: error as E }
    }
}

function formatDate(date: Date): string {
    // e.g. 17 Jan 2025
    return date.toLocaleDateString('en-GB', { day: "2-digit", month: "short", year: "numeric" })
}

// ---------------------------------------------------------------------------------------------------------------------
// State

const slugsToPages: Map<string, Page> = new Map()
const posts: Post[] = []

// ---------------------------------------------------------------------------------------------------------------------

async function main() {
    if (process.argv.length > 2) {
        const command = process.argv[2]
        if (command === "rebuild") options.rebuild = true
    }
    await iteratePages(PAGES_DIR)
    await iteratePages(POSTS_DIR)
    await iteratePages(PAGES_DIR)
    await iteratePages(DRAFTS_DIR)
    if (options.cleanOrphans) await cleanOrphans()
    posts.sort((a, b) => b.date.getTime() - a.date.getTime() || b.index - a.index) // most recent first
    await buildIndex()
    await buildAtom()
    await copyAssets(ASSETS_DIR, OUTPUT_DIR)
}

async function iteratePages(dirPath: string): Promise<void> {
    dirPath = "./" + dirPath
    for (const file of await readdir(dirPath)) {
        if (file === ".keep") continue

        const srcPath = join(dirPath, file)
        const page = parsePagePath(srcPath)
        if (!page) {
            console.warn(`WARNING: File ${srcPath} does not match expected pattern`)
            continue
        }

        slugsToPages.set(page.slug, page)
        if (page.pageType === PageType.POST) posts.push(page)

        const srcTime = (await fs.stat(srcPath)).mtimeMs
        const dstDir = join(OUTPUT_DIR, page.slug)

        // This caches html rendering for posts, which we need to generate index pages & feed.
        const contentPath = join(dstDir, CONTENT_FILENAME)
        const contentStat = await tryPromise(fs.stat(contentPath))
        // For non-posts this gets srcTime and will never be generated.
        const contentTime = contentStat.ok?.mtimeMs || (page.pageType === PageType.POST ? 0 : srcTime)

        // This will be the full html page.
        const dstPath = join(dstDir, PAGE_FILENAME)
        const dstStat = await tryPromise(fs.stat(dstPath))
        const dstTime = dstStat.ok?.mtimeMs || 0

        if (!(options.rebuild || srcTime > contentTime || srcTime > dstTime)) {
            // No need to regenerate the page. If the page is a post, read its content for index/feed generation.

            if (page.pageType === PageType.POST)
                page.content = (await fs.readJSON(contentPath)) as Content

            continue
        }

        console.log(`Building ${srcPath}`)
        await fs.mkdirp(dstDir)

        const parsed = matter(await fs.readFile(page.srcPath))
        const title = parsed.data.title
        const layout = parsed.data.layout
        const body = (await marked(parsed.content)).trim()
        const date = page.pageType === PageType.POST ? formatDate(page.date) : ""
        const content: Content = { layout, title, body }
        const isPostLike = page.pageType === PageType.POST || page.pageType === PageType.DRAFT

        if (isPostLike) {
            page.content = content
            if (options.rebuild || srcTime > contentTime)
                await fs.writeFile(contentPath, JSON.stringify(content))
        }

        if (options.rebuild || srcTime > dstTime) {
            const rendered = nunjucks.render(PAGE_TEMPLATE, {
                title,
                date,
                body,
                active: (name: string) => name === title ? "active" : "",
                slug: page.slug,
                pageType: page.pageType
            } satisfies PageTemplateParamsPost)
            await fs.writeFile(dstPath, rendered)
        }
    }
}

function parsePagePath(srcPath: string): Page | null {
    const match = srcPath.match(/^(.+)\/(.+)\.md$/)
    if (!match) return null
    const [, dir, basename] = match
    let slug = basename
    const pageType = (() => {
        switch (dir) {
            case PAGES_DIR:     return PageType.PAGE
            case POSTS_DIR:     return PageType.POST
            case DRAFTS_DIR:    return PageType.DRAFT
            default:            return null
        }
    })()
    if (!pageType) return null
    if (pageType === PageType.POST) {
        const match = basename.match(/^(\d{4})-(\d{2})-(\d{2})-(\d+)-(.+)$/)
        if (!match) return null
        const [, year, month, day, indexStr, actualSlug] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const index = parseInt(indexStr)
        return { pageType, srcPath, slug: actualSlug, date, index }
    }
    return { pageType, srcPath, slug }
}

async function cleanOrphans() {
    for (const entry of await readdir(OUTPUT_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const dir = entry.name
        if (dir.startsWith(".") || dir.startsWith("_")) continue
        if (dir.match(/^\d\d?$/)) continue // skip post listings

        const pageExists = slugsToPages.has(dir)
        const assetsExist = await fs.exists(join(ASSETS_DIR, dir))

        if (!assetsExist) {
            if (!pageExists) {
                // No page, no assets, remove output directory.
                console.log(`Removing orphan page ${dir}`)
                await fs.rmdir(join(OUTPUT_DIR, dir), { recursive: true })
            }
            // Page exists, but there is not associated assets, move to next entry.
            continue
        }

        // Assets exist, check every file under the associated output directory.
        const files = await readdir(join(OUTPUT_DIR, dir))
        let deleted = 0
        let indexDeleted = false
        for (const file of files) {
            const assetExists = await fs.exists(join(ASSETS_DIR, dir, file))
            const isIndex = file === "index.html" || file === "raw.txt"

            if (!isIndex && !assetExists) {
                console.log(`Removing orphaned asset ${dir}/${file}`)
                await fs.rm(join(OUTPUT_DIR, dir, file))
                ++deleted
            }

            if (isIndex && !pageExists && !assetsExist) {
                console.log(`Removing orphaned page ${dir}/${file}`)
                await fs.rm(join(OUTPUT_DIR, dir, file))
                ++deleted
                indexDeleted = true
            }
        }
        if (indexDeleted && deleted < files.length)
            console.warn(`WARNING: Assets still exist at ${ASSETS_DIR}/${dir} delete manually if appropriate.`)
        if (deleted === files.length)
            await fs.rmdir(join(OUTPUT_DIR, dir))
    }
}

async function buildIndex() {
    const pagePosts = posts.map(post => ({
        slug: post.slug,
        date: formatDate(post.date),
         ...post.content,
    }))
    let page = 1
    let slug = "" // initial value will be omitted in `join(...)` calls

    for (let i = 0; i < pagePosts.length; i += POSTS_PER_PAGE) {
        const postsSlice = pagePosts.slice(i, i + POSTS_PER_PAGE)
        const body = nunjucks.render(INDEX_TEMPLATE, { page, posts: postsSlice })
        const rendered = nunjucks.render(PAGE_TEMPLATE, {
            slug,
            body,
            pageType: PageType.INDEX,
            active: (name: string) => name === "Home" ? "active" : "",
        } satisfies PageTemplateParamsBase)

        console.log(`Building index page ${page}`)
        await fs.mkdirp(join(OUTPUT_DIR, slug))
        await fs.writeFile(join(OUTPUT_DIR, slug, "index.html"), rendered)

        ++ page
        slug = page.toString()
    }
}

async function buildAtom() {
    const atomPosts = posts.slice(0, ATOM_POSTS).map(post => ({
        slug: post.slug,
        date: post.date.toISOString(),
        title: post.content!.title,
        // Replace absolute (/) links with the domain name, for feed readers who can't handle it.
        body: post.content!.body?.replace(/(src|href)=&quot;\//g, `$1=&quot;${DOMAIN}/`),
    }))
    const rendered = nunjucks.render(ATOM_TEMPLATE, {
        domain: DOMAIN,
        posts: atomPosts,
    })
    console.log(`Building atom.xml`)
    await fs.writeFile(join(OUTPUT_DIR, "atom.xml"), rendered)
}

async function copyAssets(srcDir: string, dstDir: string) {
    for (const entry of await readdir(srcDir, { withFileTypes: true })) {
        if (entry.isFile()) {
            const srcPath = join(srcDir, entry.name)
            const dstPath = join(dstDir, entry.name)
            const srcTime = (await fs.stat(srcPath)).mtimeMs
            const dstTime = (await tryPromise(fs.stat(dstPath))).ok?.mtimeMs || 0
            let dirExistsForSure = false
            if (srcTime > dstTime) {
                if (!dirExistsForSure) {
                    await fs.mkdirp(dstDir)
                    dirExistsForSure = true
                }
                console.log(`Copying new or updated asset ${srcPath}`)
                await fs.copy(srcPath, dstPath, { overwrite: true })
            }
        } else if (entry.isDirectory()) {
            await copyAssets(join(srcDir, entry.name), join(dstDir, entry.name))
        } else {
            // e.g. symlinks are not supported
            console.warn(`WARNING: Non-file non-directory entry: ${srcDir}/${entry.name}`)
        }
    }
}

await main()