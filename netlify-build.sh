#!/bin/sh

>&2 echo "$NETLIFY_CACHE_DIR"
mkdir _site
node index.js