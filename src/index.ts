import express = require ("express")
import expressPromiseRouter from "express-promise-router"
import SQL from "sql-template-strings"
import diff = require("fast-diff")
import morgan = require("morgan")
import MarkdownIt = require("markdown-it")
import Wikilinks = require("markdown-it-wikilinks")
import { format, distanceInWordsStrict } from "date-fns"
import slugify from "slugify"
import hljs = require("highlight.js")

import { many, one, query } from "./db"

const app = expressPromiseRouter()

// Produce a nice timestamp with a human-readable offset and actual time
const prettyTimestamp = timestamp => `${distanceInWordsStrict(new Date(), timestamp, { addSuffix: true })} (${format(timestamp, "HH:MM:ss DD/MM/YYYY")})`

// Redirect to the normalized version of a page name
const redirectToSlug = (name, res) => {
    const slug = slugify(name)
    if (slug !== name) {
        res.redirect(slug)
    }
}

const sendError = (res, title, status, error) => res.status(status).render("error", { error, title })

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    sendError(res, "Internal Server Error", 500, process.env.NODE_ENV === "production" ? err : err.stack)
}

app.get("/", async (req, res) => {
    // Get all pages, in alphabetical order.
    const pages = await many(SQL`SELECT DISTINCT ON (name) name, updated FROM pages ORDER BY name ASC, updated DESC`)
    pages.forEach(page => {
        page.timestamp = prettyTimestamp(page.updated)
    })
    res.render('index', { title: 'Index', pages })
})

// As explained in the SQL schema (001-pages.sql), find latest revision of selected page.
const getPage = name => one(SQL`SELECT * FROM pages WHERE name = ${name} ORDER BY updated DESC LIMIT 1`)

const wikilinks = Wikilinks({
    uriSuffix: "",
    generatePageNameFromLabel: slugify
})
const md = new MarkdownIt({
        html: true,
        highlight: (str, lang) => {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return `<pre class="hljs"><code>${hljs.highlight(lang, str).value}</code></pre>`;
                } catch (_) {}
            }
        
            return "";
        }
    })
    .use(wikilinks)
const renderMarkdown = x => md.render(x)

app.get("/view/:name", async (req, res) => {
    const name = req.params.name
    redirectToSlug(name, res)
    const page = await getPage(name)

    // If the page being viewed does not exist, redirect to the edit page to create it
    if (!page) {
        res.redirect(`/edit/${name}`)
    }

    res.render("view-page", {
        title: `Viewing ${name}`,
        ...page,
        content: renderMarkdown(page.content)
    })
})

app.post("/add-category/:name", async (req, res) => {
    const name = req.params.name
    const page = await getPage(name)
    const newCategory = slugify(req.body.newCategory)
    const newCategories = page.categories
    if (newCategory === "") {
        sendError(res, "Invalid Category Name", 400, "The category's name must not be empty.")
    }
    if (!newCategories.includes(newCategory)) {
        newCategories.push(newCategory)
    }
    query(SQL`INSERT INTO pages VALUES (${name}, ${page.content}, ${newCategories}, DEFAULT)`)
    res.redirect(`/view/${name}`)
})

app.post("/remove-category/:name", async (req, res) => {
    const name = req.params.name
    const page = await getPage(name)
    const category = req.body.category
    const newCategories = page.categories
    const index = newCategories.indexOf(category)
    if (index > -1) {
        newCategories.splice(index, 1)
    }
    query(SQL`INSERT INTO pages VALUES (${name}, ${page.content}, ${newCategories}, DEFAULT)`)
    res.redirect(`/view/${name}`)
})

app.get("/random", async (req, res) => {
    // Select a single page, randomly.
    const result = await one(SQL`SELECT name FROM (SELECT DISTINCT name FROM pages) AS all_page_names ORDER BY RANDOM() LIMIT 1`)
    res.redirect(`/view/${result.name}`)
})

app.get("/edit/:name", async (req, res) => {
    const name = req.params.name
    redirectToSlug(name, res)
    const page = await getPage(name)

    res.render("edit-page", {
        // If a page does not exist, say Creating instead of Editing
        title: `${page ? "Editing" : "Creating"} ${name}`,
        name,
        content: page ? page.content : ""
    })
})

app.post("/edit/:name", async (req, res) => {
    const name = req.params.name
    redirectToSlug(name, res)
    const currentPage = await getPage(name)
    const newContent = req.body.content
    // Only add revision if there was actual change
    if (!currentPage || currentPage.content !== newContent) {
        // Insert a new revision containing the page's name and new content, and either the categories it already has or none.
        await query(SQL`INSERT INTO pages VALUES (${name}, ${newContent}, ${currentPage ? currentPage.categories : []}, DEFAULT)`)
    }
    res.redirect(`/view/${name}`)
})

const difference = (xs, ys) => xs.filter(x => !ys.includes(x))

app.get("/revisions/:name", async (req, res) => {
    const name = req.params.name
    redirectToSlug(name, res)
    // Get all revisions of selected page
    const revisions = await many(SQL`SELECT * FROM pages WHERE name = ${name} ORDER BY updated ASC`)

    // Generate diffs between the current revision and previous revision
    let last = { content: "", categories: [] }
    revisions.forEach(revision => {
        revision.diff = diff(last.content, revision.content)
        revision.categoriesAdded = difference(revision.categories, last.categories)
        revision.categoriesRemoved = difference(last.categories, revision.categories)
        revision.timestamp = prettyTimestamp(revision.updated)
        last = revision
    })
    revisions.reverse()
    
    res.render("view-page-revisions", {
        title: `Viewing revisions of ${name}`,
        name,
        revisions
    })
})

const server = express()
server.set('view engine', 'pug')
server.use(morgan("short"))
server.use(express.urlencoded({ extended: false }))
server.use(app)
server.use("/static", express.static("./static", {
    maxAge: "2h"
}))
server.use(errorHandler)
server.use((req, res) => sendError(res, "Not Found", 404, `The page ${req.path} was not found. Try one of the links at the top or go back.`))
server.listen(8030, () => console.log("Listening on port 8030"))