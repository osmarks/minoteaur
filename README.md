# minoteaur

A wiki-style personal note-taking application, because I find a graph structure more useful than hierarchical notes.
Written in Typescript using Express.js as a web framework with PostgreSQL for data storage, and requires no client-side JS to function (some may be added in the future for optional interactivity).

## Instructions for use

1. Install dependencies (`npm install`)
2. Compile the stylus stylesheets to regular CSS (`npm run build:styles`)
3. Create a `.env` file containing `DB=[connection string for database]`
4. Run `index.ts` (I recommend `ts-node`)
 
The app will then initialize its databases and run a webserver on port 8030. If you plan to host this publicly, I suggest using a reverse proxy with some sort of authentication mechanism.

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
* Make editor work nicely on mobile.
* Theming.