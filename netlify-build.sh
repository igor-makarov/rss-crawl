#!/bin/sh

mkdir _site
( 
  cd _site
  curl -O "https://rss-crawler.netlify.com/crawler.sqlite"
  curl -O "https://rss-crawler.netlify.com/rss.txt"
)
node index.js