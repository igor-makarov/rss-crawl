const supercrawler = require("supercrawler");
const fs = require('fs');

var crawler = new supercrawler.Crawler({
	urlList: new supercrawler.RedisUrlList({
		redis: {
			host: "127.0.0.1",
			port: "6379",
		},
		delayHalfLifeMs: 10,
	}),
	interval: 10,
	concurrentRequestsLimit: 200,
});

crawler.addHandler("text/html", function (ctx) {
	var urls = supercrawler.handlers.htmlLinkParser()(ctx);
	var roots = new Set()
	for (url of urls) {
		try {
			let r = new URL('/', url).toString()
			if (!roots.has(r)) {
				roots.add(r)
			}
		}	catch (ex) {}
	}

	return [...roots].concat(urls);
});

crawler.addHandler("text/html", function (url) {
	var urlObj = new URL(url.url);
	return [new URL('/', urlObj).toString()];
});

var startTime = Date.now()
var found = 0
crawler.addHandler("application/rss+xml", function (context) {
	found += 1;
	fs.appendFile('rss.txt', context.url + "\n", e => { });
  console.log(`RSS: avg speed: ${found/((Date.now() - startTime)/1000)} per second ${context.url}`);
});
crawler.addHandler(supercrawler.handlers.robotsParser());
crawler.addHandler(supercrawler.handlers.sitemapsParser());
crawler.on("crawlurl", function (url) {
  // console.log(`Crawl URL: ${url}`);
});
crawler.on("crawledurl", function (url, errorCode, statusCode) {
  // console.log(`Crawled URL: ${url}, ${errorCode} ${statusCode}`);
});
crawler.on("urllistempty", function () {
  // console.warn("The URL queue is empty.");
});
crawler.on("handlersError", function (err) {
  console.error(err);
});

crawler.getUrlList()
  // .insertIfNotExists(new supercrawler.Url("https://stratechery.com/"))
  .insertIfNotExists(new supercrawler.Url("http://www.specificfeeds.com/"))
  .then(function () {
    return crawler.start();
  });