-- Pages have revision history, and this is modelled by allowing multiple page entries with the same name so long as they have different updated times.
-- This makes it easy to update a page (by inserting a new row with the new data) and relatively easy to retrieve the current version.

CREATE TABLE pages (
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    categories TEXT[] NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
    PRIMARY KEY (name, updated)
);