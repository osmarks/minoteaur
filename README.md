# minoteaur

A wiki-style personal note-taking application, because I find a graph structure more useful than hierarchical notes.
Written in Typescript using Express.js as a web framework with PostgreSQL for data storage, and requires no client-side JS to function (some may be added in the future for optional interactivity).

## Instructions for use

1. Install dependencies (`npm install`)
2. Compile the stylus stylesheets to regular CSS (`npm run build:styles`)
3. Create a `.env` file containing `DB=[connection string for database]`
4. Run `index.ts` (I recommend `ts-node`)
 
The app will then initialize its databases and run a webserver on port 8030. 
If you plan to expose this to the Internet, I suggest using a reverse proxy with some sort of authentication mechanism, especially as it allows HTML embedding in Markdown.

## Features

* Categorization of pages (not much use right now).
* Syntax highlighting via [highlight.js](https://highlightjs.org/).
* Support for Markdown + wikilinks (via `markdown-it`).
* Revision history for pages.
* Mobile support (everything but category modification, editing).

## Todo

* Add ability to view pages by category.
* Clean up the code.
* Add search functionality.
* Make revision logs nicer and less spammed.
* Nicer editor (good mobile support, limited syntax highlighting like the GitHub one).
* Theming.
* File upload (e.g. for embedding images). I think files should be treated similarly to regular pages (same DB table, at least) but with a `type` field (MIME type, with extra options for different wiki page types?), and with a direct-raw-link option for embedding.
* Nicer Markdown editor.
* Use client-side JS instead of the somewhat horrible system of disguised forms.
* DokuWiki-like namespacing (it does that with `:` in page names - possibly implement using the category (should rename this to tags) system).
* Templating/scripting for pages (probably hard, but pretty important in lieu of actual plugin support or something).
