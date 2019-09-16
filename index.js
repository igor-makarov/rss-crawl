const supercrawler = require("supercrawler");
const fs = require('fs');
const DbUrlList = require('./DbUrlList');
const finder = require('find-rss');

const scanRoot = new URL('https://www.specificfeeds.com/')

var crawler = new supercrawler.Crawler({
	urlList: new DbUrlList({
		db: {
			database: "crawler",
			username: "root",
			password: "password",
			sequelizeOpts: {
				dialect: 'sqlite',
				storage: '_site/crawler.sqlite'
			}
		}
	}),
	interval: 10,
	concurrentRequestsLimit: 200,
});

crawler.setMaxListeners(100)

crawler.addHandler("text/html", function (ctx) {
	var urls = supercrawler.handlers.htmlLinkParser()(ctx);
	var roots = new Set()
	for (url of urls) {
		for (p of ['/']) {
			try {
				let r = new URL(p, url).toString()
				if (!roots.has(r)) {
					roots.add(r)
				}
			}	catch (ex) {}
		}
	}

	return [...roots].concat(urls);
});

crawler.addHandler(supercrawler.handlers.robotsParser());
crawler.addHandler(supercrawler.handlers.sitemapsParser());
crawler.on("crawlurl", function (url) {
  // console.log(`Crawl URL: ${url}`);
});

var startTime = Date.now()
var found = 0
crawler.on("crawledurl", function (url, errorCode, statusCode) {
  // console.log(`Crawled URL: ${url}, ${errorCode} ${statusCode}`);
	let parsed = new URL(url)
	if (parsed.pathname === '/') {
		finder(url).then(rss => {
			for (feed of rss) {
				found += 1;
				fs.appendFile('_site/rss.txt', feed.url + "\n", e => { });
				console.log(`RSS: total: ${found} avg speed: ${found/((Date.now() - startTime)/1000)} per second ${feed.title} ${feed.url}`);
		}
		}).catch(e => {})
	}
});
crawler.on("urllistempty", function () {
  // console.warn("The URL queue is empty.");
});
crawler.on("handlersError", function (err) {
  console.error(err);
});

crawler.getUrlList()
  .insertIfNotExists(new supercrawler.Url(scanRoot.toString()))
  .then(function () {
    return crawler.start();
  });