const RealWorld = {
    Amazon: { icon: "📦", color: "#ff9900" },
    Facebook: { icon: "📘", color: "#1877f2" },
    Netflix: { icon: "🎬", color: "#e50914" },
    PostgreSQL: { icon: "🐘", color: "#336791" },
    MySQL: { icon: "🐬", color: "#00758f" },
    Steam: { icon: "🎮", color: "#66c0f4" },
    Fastly: { icon: "⚡", color: "#ff282d" },
    GitHub: { icon: "🐙", color: "#6e5494" },
    "Stack Overflow": { icon: "📚", color: "#f48024" },
    Instagram: { icon: "📷", color: "#c13584" },
    "Twitter / X": { icon: "🐦", color: "#1d9bf0" },
    Wikipedia: { icon: "📖", color: "#888888" },
    Stripe: { icon: "💳", color: "#635bff" },
    YouTube: { icon: "▶️", color: "#ff0000" },
    "The Internet (DNS)": { icon: "🌐", color: "#0f9d58" },
    Cassandra: { icon: "👁️", color: "#1287b1" },
    "Hacker News": { icon: "🗞️", color: "#ff6600" },
    Google: { icon: "🔎", color: "#4285f4" },
    Memcached: { icon: "🧱", color: "#3f7f3f" },
    "Martin Kleppmann": { icon: "🔐", color: "#7f8c8d" },
    Redis: { icon: "🟥", color: "#dc382d" },
    Cloudflare: { icon: "☁️", color: "#f38020" },
    Kubernetes: { icon: "☸️", color: "#326ce5" },
    Microsoft: { icon: "🪟", color: "#0078d4" },
    LinkedIn: { icon: "💼", color: "#0a66c2" },
    "Game studios": { icon: "🏆", color: "#8e44ad" },
    Researchers: { icon: "🎓", color: "#16a085" }
};

function addRealWorld(key, who, source, steps) {
    if (!Stories[key]) return;
    steps.forEach(step => Stories[key].steps.push({ ...step, real: { who, source, ...RealWorld[who] } }));
}

addRealWorld("1.1", "Amazon", "Greg Linden (ex-Amazon), 2006", [
    { say: "Real life: Amazon measured that every extra 100 milliseconds of page load cost about 1% of sales. Answering from a cache instead of the database is one of the main ways to win those milliseconds back.", rename: { user: "Shopper", app: "Amazon.com", db: "Product DB" }, set: { cache: "product page data" }, undim: ["db"], move: ["app", "cache", "fast read", "hit"], flash: ["cache", "100 ms = 1% sales", "hit"], clock: "" }
]);
addRealWorld("1.1", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Facebook does this billions of times per second. Its memcache tier holds trillions of items, so the databases see only a small share of all reads.", rename: { user: "Users", app: "Web servers", cache: "memcache", db: "MySQL" }, set: { cache: "trillions of items" }, move: [["user", "app", ""], ["app", "cache", "", "hit"]], flash: ["cache", "billions / sec", "hit"] }
]);

addRealWorld("1.2", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Real life: this exact pattern runs Facebook. Their paper calls it a demand-filled look-aside cache: check memcache, read MySQL on a miss, then fill memcache.", rename: { user: "Facebook user", app: "Web server", cache: "memcache", db: "MySQL" }, set: { cache: "profile:42", db: "source of truth" }, move: ["app", "cache", "get", "miss"], then: ["app", "db", "SELECT", "miss"], clock: "" },
    { say: "And when data changes, Facebook deletes the key instead of updating it, exactly like the Remove fix you just saw. Deletes are safe to repeat.", move: ["app", "cache", "DELETE", "warn"], set: { cache: "deleted" }, flash: ["cache", "DELETE ON WRITE", "warn"] }
]);

addRealWorld("1.3", "The Internet (DNS)", "RFC 1035; Meta and Cloudflare posts, October 2021", [
    { say: "Real life: DNS is a giant cache with TTLs. Your resolver keeps a website's address for as long as the owner's TTL says, so most lookups never reach the owner's servers.", rename: { app: "Your phone", cache: "DNS resolver", db: "Facebook DNS" }, set: { cache: "facebook.com, TTL left" }, undim: ["db"], move: ["app", "cache", "where is facebook.com?", "hit"], flash: ["cache", "CACHED ANSWER", "hit"], clock: "" },
    { say: "October 2021: Facebook's DNS servers became unreachable. Cached answers kept working for a while, but as TTLs ran out, Facebook, Instagram and WhatsApp disappeared for about six hours.", set: { cache: "TTL expired" }, dim: ["db"], move: ["cache", "db", "retry", "danger"], flash: ["db", "UNREACHABLE", "danger"] }
]);

addRealWorld("1.4", "Memcached", "Memcached documentation; used at Facebook and Wikipedia", [
    { say: "Real life: memcached servers at Facebook and Wikipedia get a fixed amount of RAM. When it is full they evict the least recently used items, and operators watch the eviction counter to know when to add memory.", rename: { app: "Web servers", cache: "memcached" }, set: { cache: "RAM full: evicting LRU" }, move: ["app", "cache", "new item"], flash: ["cache", "EVICTIONS RISING", "warn"] }
]);

addRealWorld("2.1", "Facebook", "Facebook engineering, RFC 8246 (2016-2017)", [
    { say: "Real life: Facebook's JavaScript files have a version hash in their names, so they never change. Browsers still kept asking 'has it changed?'. Facebook proposed Cache-Control: immutable, and those wasted requests disappeared.", rename: { page: "facebook.com", browser: "Browser cache", server: "Facebook CDN" }, set: { browser: "app.3f9a.js immutable" }, move: ["page", "browser", "app.3f9a.js", "hit"], flash: ["browser", "NO REQUEST", "hit"], dim: ["server"], clock: "" }
]);
addRealWorld("2.1", "Steam", "Valve statement, December 2015", [
    { say: "The opposite mistake: on Christmas Day 2015 a caching change at Steam made account pages cacheable, and about 34,000 users' personal details were shown to other people.", rename: { page: "Steam user B", browser: "Steam cache", server: "Steam store" }, undim: ["server"], set: { browser: "user A's account page!" }, move: ["page", "browser", "my account", "danger"], flash: ["browser", "PRIVACY LEAK", "danger"] }
]);

addRealWorld("2.2", "GitHub", "GitHub REST API docs, conditional requests", [
    { say: "Real life: GitHub's API sends ETags. Tools that poll it send If-None-Match, and a 304 answer does not count against the hourly rate limit, so they can check often for free.", rename: { browser: "CI bot", server: "api.github.com" }, set: { browser: "ETag \"abc\"", server: "repo unchanged" }, move: ["browser", "server", "If-None-Match", "warn"], then: ["server", "browser", "304, not counted", "hit"], flash: ["server", "FREE CHECK", "hit"] }
]);

addRealWorld("2.3", "Hacker News", "Hacker News operator comments", [
    { say: "Real life: when Hacker News is busy, logged-out visitors get cached pages while logged-in users get fresh personal ones. Anonymous pages are the easiest to cache because everyone sees the same thing.", rename: { user1: "Logged out", user2: "Logged out", middleware: "HN page cache", controller: "HN server" }, set: { middleware: "front page copy" }, undim: ["controller"], move: [["user1", "middleware", "", "hit"], ["user2", "middleware", "", "hit"]], flash: ["middleware", "SERVED FROM CACHE", "hit"] }
]);

addRealWorld("2.4", "Wikipedia", "Wikimedia technical documentation", [
    { say: "Real life: Wikipedia serves most anonymous article views as cached HTML. When someone edits an article, its cached copies are purged, like evicting a tag here.", rename: { u1: "Reader", u2: "Reader", u3: "Editor", cache: "Edge cache", controller: "MediaWiki" }, undim: ["controller"], set: { cache: "article HTML" }, move: ["u3", "controller", "edit", "warn"], then: ["controller", "cache", "purge", "danger"], after: { cache: "article purged" }, flash: ["cache", "PURGED", "warn"] }
]);

addRealWorld("2.5", "Netflix", "Netflix Open Connect documentation", [
    { say: "Real life: Netflix puts its own cache servers, Open Connect boxes, inside internet providers. Popular shows are copied there in quiet hours, so nearly all video streams from a box near you.", rename: { tokyo: "Netflix viewer", tokyo2: "Neighbour", edge: "Open Connect", origin: "Netflix (AWS)" }, set: { edge: "inside your ISP", origin: "far away" }, move: ["tokyo2", "edge", "play", "hit"], dim: ["origin"], flash: ["edge", "STREAMED LOCALLY", "hit"] }
]);
addRealWorld("2.5", "Fastly", "Fastly incident report, June 2021", [
    { say: "CDNs can fail too: on 8 June 2021 a hidden bug at Fastly made sites like Amazon, Reddit and gov.uk return errors for about an hour.", rename: { edge: "Fastly CDN", origin: "Big websites" }, undim: ["origin"], set: { edge: "bug triggered" }, move: ["tokyo", "edge", "GET", "danger"], flash: ["edge", "503 ERRORS", "danger"] }
]);

addRealWorld("3.1", "Amazon", "AWS DynamoDB Accelerator (DAX) documentation", [
    { say: "Real life: Amazon DynamoDB Accelerator (DAX) is a read-through cache. Your code talks only to DAX; on a miss DAX fetches from DynamoDB itself, and repeat reads drop from milliseconds to microseconds.", rename: { cache: "DAX", db: "DynamoDB" }, set: { cache: "empty" }, move: ["app", "cache", "GetItem"], then: ["cache", "db", "DAX loads it", "miss"], after: { cache: "item cached" }, flash: ["cache", "µs next time", "hit"] }
]);

addRealWorld("3.2", "Amazon", "AWS DynamoDB Accelerator (DAX) documentation", [
    { say: "Real life: for item writes DAX is write-through: the write goes to DynamoDB, then into the cache, so the next read is fast and fresh.", rename: { cache: "DAX", db: "DynamoDB" }, move: ["app", "db", "PutItem $250"], then: ["app", "cache", "update", "hit"], set: { db: "$250" }, after: { cache: "$250" }, flash: ["cache", "WRITE-THROUGH", "hit"] }
]);
addRealWorld("3.2", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Facebook chose write-around: update MySQL, then delete the memcache key. With thousands of code paths writing data, deleting is simpler than computing the right new value everywhere.", rename: { cache: "memcache", db: "MySQL" }, move: ["app", "db", "UPDATE"], then: ["app", "cache", "DELETE", "warn"], set: { db: "$300" }, after: { cache: "empty" } }
]);

addRealWorld("3.3", "YouTube", "Widely reported YouTube behavior, 2012-2015", [
    { say: "Real life: YouTube view counts famously froze near 301 for years while views were verified and added in batches, then jumped. Huge counters are collected fast and written to the database later.", rename: { app: "YouTube", cache: "Live counter", queue: "Pending views", db: "Public count" }, set: { cache: "views pouring in", queue: "verifying...", db: "301 views" }, move: ["queue", "db", "batch update", "accent"], after: { db: "12,804 views", queue: "empty" }, flash: ["db", "JUMPED", "accent"], clock: "" }
]);

addRealWorld("3.4", "Netflix", "Netflix Tech Blog, personalization architecture, 2013", [
    { say: "Real life: Netflix computes much of your personalized homepage ahead of time and stores it in caches like EVCache. When you open the app, the rows are already waiting.", rename: { user: "You", cache: "EVCache", db: "Recommender" }, set: { cache: "your rows, ready" }, move: ["db", "cache", "precomputed", "accent"], then: ["user", "cache", "open app", "hit"], flash: ["cache", "INSTANT", "hit"], clock: "" }
]);

addRealWorld("4.1", "Stack Overflow", "Nick Craver, \"Stack Overflow: The Architecture, 2016\"", [
    { say: "Real life: Stack Overflow serves one of the busiest sites on the internet with around nine web servers. They all share Redis, so one server's cached result is instantly everyone's.", rename: { lb: "HAProxy", a: "Web 1 of ~9", b: "Web 2 of ~9", redis: "Shared Redis" }, set: { a: "uses Redis", b: "uses Redis", redis: "question data" }, move: [["a", "redis", "", "hit"], ["b", "redis", "", "hit"]], flash: ["redis", "SHARED BY ALL", "hit"] }
]);

addRealWorld("4.2", "Twitter / X", "Raffi Krikorian, \"Timelines at Scale\", QCon 2013", [
    { say: "Real life: Twitter has described keeping home timelines in Redis. A new tweet's id is pushed into followers' cached timelines, so opening your timeline is one fast Redis read.", rename: { app: "Tweet service", redis: "Timeline Redis", db: "Tweet store", app2: "Your timeline" }, undim: ["redis"], set: { redis: "timelines (tweet ids)" }, move: ["app", "redis", "push tweet id"], then: ["app2", "redis", "read", "hit"], flash: ["redis", "ONE READ", "hit"] }
]);

addRealWorld("4.3", "Google", "Protocol Buffers and Apache Thrift histories", [
    { say: "Real life: Google built Protocol Buffers, and Facebook built Thrift, to turn objects into small, fast bytes. When you send billions of messages, every byte saved is saved billions of times.", rename: { obj: "Google service", json: "Protobuf", zip: "Binary bytes", redis: "Network" }, set: { json: "schema + fields", zip: "small" }, move: ["obj", "json", "encode"], then: ["zip", "redis", "send", "hit"], flash: ["zip", "COMPACT", "hit"] }
]);

addRealWorld("4.4", "Stack Overflow", "Nick Craver, \"Stack Overflow: The Architecture, 2016\"", [
    { say: "Real life: Stack Overflow uses these two levels: an in-memory cache on every web server in front of a shared Redis, and Redis Pub/Sub tells all servers to drop stale local copies.", rename: { a: "Web server 1", b: "Web server 2", redis: "Redis (L2)", db: "SQL Server" }, set: { a: "L1 in memory", b: "L1 in memory", redis: "shared" }, move: ["redis", "b", "pub/sub: clear", "accent"], flash: ["a", "L1 HIT", "hit"] }
]);

addRealWorld("5.1", "Instagram", "Instagram Engineering, 2011", [
    { say: "Real life: Instagram needed to map about 300 million photo ids to user ids. Plain string keys would have used about 21 GB of RAM; grouping them into small hashes needed about 5 GB.", rename: { app: "Instagram", hash: "Hash buckets" }, set: { hash: "1,000 ids per hash" }, move: ["app", "hash", "HSET bucket id user"], flash: ["hash", "21 GB → 5 GB", "hit"] }
]);

addRealWorld("5.2", "Stripe", "Stripe Engineering, \"Scaling your API with rate limiters\", 2017", [
    { say: "Real life: Stripe described protecting its payments API with Redis-based rate limiters shared by all API servers. GitHub does the same and tells you how many requests you have left each hour.", rename: { client: "API client", api: "Stripe API", redis: "Redis limiter" }, set: { redis: "too many this second" }, move: ["client", "api", "burst", "danger"], then: ["api", "client", "429", "danger"], flash: ["api", "PROTECTED", "hit"], clock: "" }
]);

addRealWorld("5.3", "Stack Overflow", "Nick Craver, \"Stack Overflow: The Architecture, 2016\"", [
    { say: "Real life: Stack Overflow publishes a message when data changes, and every web server drops its local copy. One broadcast keeps a whole farm of in-memory caches correct.", rename: { a: "Web 1", b: "Web 2", c: "Web 3", d: "Web 4", redis: "Redis Pub/Sub" }, set: { redis: "" }, move: ["a", "redis", "changed", "accent"], then: [["redis", "b", "clear", "accent"], ["redis", "c", "clear", "accent"], ["redis", "d", "clear", "accent"]] }
]);
addRealWorld("5.3", "Martin Kleppmann", "Martin Kleppmann, \"How to do distributed locking\", 2016", [
    { say: "And the lock trap is famous: Martin Kleppmann showed that a paused process can outlive its Redis lock. His advice: use fencing tokens or database constraints when correctness really matters.", flash: ["redis", "use fencing tokens", "warn"] }
]);

addRealWorld("5.4", "Amazon", "AWS ElastiCache documentation", [
    { say: "Real life: Amazon ElastiCache, Azure Cache and Redis Cloud run Redis with replicas in different data centers and automatic failover, because a lost cache can overwhelm the database behind it.", rename: { app: "Your app", primary: "Primary (zone a)", r1: "Replica (zone b)", r2: "Replica (zone c)" }, undim: ["primary"], set: { primary: "managed", r1: "", r2: "" }, move: [["primary", "r1", "copy"], ["primary", "r2", "copy"]] }
]);

addRealWorld("6.1", "MySQL", "MySQL Server Team, \"Retiring Support for the Query Cache\", 2017", [
    { say: "Real life: MySQL's old query cache worked like a group token: any write to a table threw away every cached result for that table. Under heavy writes this caused contention, so MySQL removed it in version 8.0.", rename: { db: "MySQL", grp: "Query cache" }, set: { grp: "cached results" }, move: ["db", "grp", "INSERT: wipe all", "danger"], flash: ["grp", "REMOVED IN 8.0", "danger"] }
]);
addRealWorld("6.1", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Facebook drives deletes from the database itself: daemons called mcsqueal read MySQL's commit log and delete the matching memcache keys, catching every single write.", rename: { del: "memcache" }, move: ["db", "del", "commit log → DELETE", "accent"], set: { del: "always fresh" }, flash: ["del", "MCSQUEAL", "hit"] }
]);

addRealWorld("6.2", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Real life: Facebook hit this exact race. Their fix, leases, gives a reader a token on a miss. A delete in between invalidates the token, so the late stale write is refused. Leases also cut one peak from about 17,000 to 1,300 database queries per second.", rename: { reader: "Web (miss)", writer: "Web (write)", db: "MySQL", cache: "memcache" }, set: { cache: "lease revoked" }, move: ["reader", "cache", "set + old lease", "danger"], flash: ["cache", "REFUSED", "hit"], clock: "" }
]);

addRealWorld("7.1", "Wikipedia", "MediaWiki PoolCounter documentation", [
    { say: "Real life: when Michael Jackson died in June 2009, millions opened his Wikipedia article while editors kept changing it. Every edit invalidated the cache and many servers re-rendered it at once. Wikipedia added PoolCounter so only one renders while the rest wait.", rename: { u1: "Reader", u2: "Reader", u3: "Reader", u4: "Reader", app: "Wikipedia", db: "Renderer" }, set: { app: "M. Jackson article" }, move: [["u1", "app", ""], ["u2", "app", ""], ["u3", "app", ""], ["u4", "app", ""]], then: ["app", "db", "1 render", "hit"], flash: ["app", "POOLCOUNTER", "hit"] }
]);

addRealWorld("7.2", "Cassandra", "Bigtable paper (OSDI 2006), Cassandra docs", [
    { say: "Real life: Cassandra and Google Bigtable keep a Bloom filter for every data file on disk. Before reading a file they ask the filter, and 'definitely not' means the slow disk read is skipped.", rename: { bad: "Read row X", bloom: "File filter", cache: "Memtable", db: "Disk" }, set: { bloom: "one per file" }, move: ["bad", "bloom", "row X?"], flash: ["bloom", "SKIP THIS FILE", "hit"] }
]);

addRealWorld("7.3", "Facebook", "Facebook, \"More Details on Today's Outage\", 2010", [
    { say: "Real life: in September 2010 an invalid configuration value made every Facebook client think its cached copy was bad, and all of them queried the databases at once. Facebook was down for about 2.5 hours.", rename: { app: "All web servers", cache: "Cached config", db: "Databases" }, set: { cache: "value looks invalid" }, move: [["cache", "db", "", "danger"], ["cache", "db", "", "danger"], ["cache", "db", "", "danger"], ["cache", "db", "", "danger"]], flash: ["db", "OVERWHELMED", "danger"], clock: "" }
]);

addRealWorld("7.4", "Twitter / X", "Raffi Krikorian, \"Timelines at Scale\", QCon 2013", [
    { say: "Real life: when an account with tens of millions of followers tweets, that one tweet is read an enormous number of times within minutes. Twitter has described treating such accounts specially because they create hot spots.", rename: { a: "Twitter server", b: "Twitter server", redis: "Cache node", db: "Tweet store" }, set: { redis: "celebrity tweet", a: "", b: "" }, move: [["a", "redis", "", "danger"], ["b", "redis", "", "danger"]], flash: ["redis", "HOT KEY", "danger"] }
]);
addRealWorld("7.4", "Stack Overflow", "Nick Craver, \"Stack Overflow: The Architecture, 2016\"", [
    { say: "The usual cure, used by Stack Overflow: keep popular items in each server's own memory, so the shared cache only sees a trickle.", rename: { a: "Web server", b: "Web server", redis: "Redis" }, set: { a: "L1: hot item", b: "L1: hot item", redis: "calm" }, flash: [["a", "L1 HIT", "hit"], ["b", "L1 HIT", "hit"]] }
]);

addRealWorld("7.5", "PostgreSQL", "PostgreSQL documentation, pg_stat_database", [
    { say: "Real life: PostgreSQL counts its own cache hits (blks_hit versus blks_read). DBAs usually expect about 99% on read-heavy systems; when the ratio drops, queries start hitting disk.", rename: { app: "PostgreSQL", meter: "pg_stat_database", dash: "DBA dashboard" }, set: { dash: "buffer hits 91%" }, move: ["app", "meter", "blks_hit"], then: ["meter", "dash", "ratio"], flash: ["dash", "INVESTIGATE", "warn"] }
]);

addRealWorld("7.3-restart", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Real life: when Facebook brings up a new, empty memcache cluster, misses are filled from a warm cluster instead of the databases, so the cold cache never hammers MySQL.", rename: { redis: "New cluster" }, set: { redis: "filling from warm cluster", db: "protected" }, flash: ["db", "SAFE", "hit"] }
]);

addRealWorld("1.1-speed", "Google", "Marissa Mayer (Google), Web 2.0 Summit 2006", [
    { say: "Real life: Google found that making search results half a second slower led to about 20% fewer searches. Users feel every step down this list.", rename: { app: "Google search" }, flash: ["app", "0.5 s = 20% fewer searches", "danger"] }
]);
addRealWorld("1.1-key", "Steam", "Valve statement, December 2015", [
    { say: "Real life: the same kind of mix-up hit Steam in December 2015. Cached account pages were shown to the wrong people, exposing about 34,000 users' details.", rename: { anna: "Steam user A", ben: "Steam user B", cache: "Steam cache" }, set: { cache: "A's page served to B" }, move: ["ben", "cache", "my account", "danger"], flash: ["cache", "WRONG USER", "danger"] }
]);
addRealWorld("1.2-reference", "Memcached", "Memcached documentation", [
    { say: "Real life: memcached and Redis store bytes, not objects, so every reader gets its own fresh copy and this bug cannot happen there. It is a trap specific to in-process caches like IMemoryCache.", rename: { cache: "memcached" }, set: { cache: "stores bytes" }, move: [["cache", "code1", "own copy", "hit"], ["cache", "code2", "own copy", "hit"]] }
]);
addRealWorld("1.3-lazy", "Redis", "Redis documentation, EXPIRE", [
    { say: "Real life: Redis works the same way. Expired keys are deleted when someone touches them, plus a background job that tests random keys with a TTL several times per second.", rename: { cache: "Redis" }, set: { cache: "lazy + random sampling" }, flash: ["cache", "SAME IDEA", "accent"] }
]);
addRealWorld("1.4-lru", "Redis", "Redis documentation, key eviction", [
    { say: "Real life: Redis does not track the exact LRU order, which would cost memory. It samples a few keys (5 by default) and evicts the oldest among them. Close to perfect LRU, much cheaper.", rename: { cache: "Redis (allkeys-lru)" }, set: { cache: "sample 5, evict oldest" }, flash: ["cache", "APPROXIMATE LRU", "accent"] }
]);
addRealWorld("2.1-private", "Cloudflare", "Cloudflare documentation, default cache behavior", [
    { say: "Real life: this is why Cloudflare, by default, caches static files like images, CSS and JavaScript but not HTML pages. HTML is only cached when you explicitly decide it is safe.", rename: { cdn: "Cloudflare", server: "Your site" }, set: { cdn: "images, CSS, JS only" }, flash: ["cdn", "HTML NOT CACHED", "hit"] }
]);
addRealWorld("2.2-ifmatch", "Kubernetes", "Kubernetes API concepts, resourceVersion", [
    { say: "Real life: Kubernetes uses the same idea. Every object has a resourceVersion, and an update based on an old version is rejected with a conflict, so two controllers never silently overwrite each other.", rename: { anna: "Controller A", ben: "Controller B", server: "Kubernetes API" }, set: { server: "resourceVersion 42" }, move: ["ben", "server", "update v41", "danger"], flash: ["server", "409 CONFLICT", "danger"] }
]);
addRealWorld("2.3-pieces", "Wikipedia", "Wikimedia technical documentation", [
    { say: "Real life: Wikipedia has the same split. MediaWiki only sends cache headers; separate cache servers in front of it (Varnish, now Apache Traffic Server) actually store and serve the pages.", rename: { user: "Readers", mw: "Edge cache", ctrl: "MediaWiki" }, undim: ["mw"], set: { mw: "stores pages", ctrl: "sends headers" }, move: ["user", "mw", "article", "hit"], flash: ["mw", "SERVED", "hit"] }
]);
addRealWorld("2.4-tags", "Fastly", "Fastly documentation, surrogate keys", [
    { say: "Real life: Fastly calls tags 'surrogate keys'. A site tags every page that shows a product, then purges all of them worldwide with one API call when the product changes.", rename: { admin: "Purge API" }, undim: ["p1", "p2", "p3"], set: { p1: "key: product-42", p2: "key: product-42", p3: "key: product-42" }, move: [["admin", "p1", "purge", "danger"], ["admin", "p2", "purge", "danger"], ["admin", "p3", "purge", "danger"]] }
]);
addRealWorld("2.5-purge", "GitHub", "Common practice on sites like GitHub (hashed asset names)", [
    { say: "Real life: because purges never reach browsers, sites like GitHub put a content hash in their CSS and JavaScript file names. A change creates a new file name, so nobody ever needs a purge.", rename: { browser: "Browser", edge: "CDN", you: "Deploy" }, set: { browser: "app-8f3c.css", edge: "app-91ab.css (new)" }, move: ["browser", "edge", "new name", "hit"], flash: ["edge", "NO PURGE NEEDED", "hit"] }
]);
addRealWorld("3.2-fail", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Real life: Facebook avoids this risk by deleting keys after writes instead of setting them. A failed or repeated delete is harmless; a failed set leaves wrong data behind.", rename: { db: "MySQL", cache: "memcache" }, set: { cache: "deleted" }, move: ["app", "cache", "DELETE", "warn"], flash: ["cache", "SAFE TO REPEAT", "hit"] }
]);
addRealWorld("4.2-hash", "Microsoft", "Microsoft.Extensions.Caching.StackExchangeRedis source", [
    { say: "Real life: this layout comes from Microsoft's own Redis implementation of IDistributedCache, the package this project uses. Any .NET app using it stores entries exactly like this.", rename: { app: ".NET app" }, set: { hash: "data, absexp, sldexp" }, flash: ["hash", "MICROSOFT'S FORMAT", "accent"] }
]);
addRealWorld("4.3-version", "Google", "Protocol Buffers documentation, updating a message type", [
    { say: "Real life: Google's Protocol Buffers solve this with numbered fields. You may rename a field freely, but never reuse its number, so bytes written by old code still decode correctly.", rename: { app: "New code", redis: "Stored bytes" }, set: { redis: "field 2 = 1200", app: "field 2 = UnitPrice" }, flash: ["app", "STILL WORKS", "hit"] }
]);
addRealWorld("5.1-atomic", "Stripe", "Stripe Engineering, \"Scaling your API with rate limiters\", 2017", [
    { say: "Real life: atomic Redis counters are the backbone of rate limiting at companies like Stripe: every API server increments the same counter, and none of the increments are lost.", rename: { a: "API server", b: "API server", redis: "Redis counter" }, set: { redis: "requests = 46" }, move: [["a", "redis", "INCR", "hit"], ["b", "redis", "INCR", "hit"]] }
]);
addRealWorld("5.2-board", "Game studios", "Common Redis use case", [
    { say: "Real life: many online games keep live rankings in Redis sorted sets, because adding points and reading a player's rank stay fast even with millions of players.", rename: { game: "Game backend" }, flash: ["zset", "MILLIONS OF PLAYERS", "hit"] }
]);
addRealWorld("5.3-token", "Martin Kleppmann", "Martin Kleppmann, \"How to do distributed locking\", 2016", [
    { say: "Real life: Martin Kleppmann went one step further with fencing tokens: each lock comes with an increasing number, and the storage itself rejects writes carrying an older number than it has already seen.", rename: { redis: "Lock + storage" }, set: { redis: "last token seen: 34" }, move: ["w1", "redis", "write, token 33", "danger"], flash: ["redis", "REJECTED: OLD TOKEN", "hit"] }
]);
addRealWorld("5.4-persist", "Amazon", "AWS ElastiCache documentation", [
    { say: "Real life: Amazon ElastiCache for Redis offers both ideas as settings: scheduled snapshot backups and replicas in other availability zones, so a crash does not mean a cold cache.", rename: { redis: "ElastiCache", rdb: "Daily backup", aof: "Multi-AZ replica" }, undim: ["redis"], set: { redis: "1,000 keys", rdb: "scheduled snapshots", aof: "standby in zone b" }, move: [["redis", "rdb", "snapshot"], ["redis", "aof", "replicate"]] }
]);
addRealWorld("6.1-cdc", "LinkedIn", "LinkedIn, \"All Aboard the Databus!\", SoCC 2012", [
    { say: "Real life: LinkedIn built Databus to stream every database change to caches and search indexes, so they stay in sync no matter which application made the change.", rename: { cdc: "Databus", cache: "Caches" }, set: { cache: "in sync" }, move: ["db", "cdc", "change stream", "accent"], then: ["cdc", "cache", "update", "hit"] }
]);
addRealWorld("6.2-ryw", "Facebook", "\"Scaling Memcache at Facebook\", NSDI 2013", [
    { say: "Real life: Facebook's memcache paper describes 'remote markers': after you write data, your next reads are sent to the primary database instead of a possibly stale cache, so you see your own change.", rename: { a: "Facebook web", b: "Replica region", db: "Primary DB" }, set: { b: "marker: read primary" }, move: ["b", "db", "read primary", "hit"], flash: ["b", "YOUR CHANGE", "hit"] }
]);
addRealWorld("7.1-xfetch", "Researchers", "Vattani et al., \"Optimal Probabilistic Cache Stampede Prevention\", VLDB 2015", [
    { say: "Real life: this technique was published as 'XFetch' in a 2015 research paper, which showed how to choose the early-refresh chance so stampedes are prevented with almost no extra work.", flash: ["cache", "XFETCH", "accent"] }
]);
addRealWorld("7.2-bloom", "Google", "Chromium Safe Browsing history", [
    { say: "Real life: early versions of Google Chrome kept a compact Bloom-filter-style list of dangerous website prefixes on your computer. Only URLs that matched were checked with Google's servers.", rename: { id: "Website URL", bits: "Local blocklist filter" }, set: { bits: "compact, on your PC" }, move: ["id", "bits", "check URL"], flash: ["bits", "MOSTLY 'NO'", "hit"] }
]);
addRealWorld("7.4-hotkey", "Redis", "Redis documentation, redis-cli --hotkeys", [
    { say: "Real life: Redis ships a tool for this: redis-cli --hotkeys (with an LFU eviction policy) lists the most accessed keys, so you can find hot keys before they melt a node.", rename: { n2: "Hot key found" }, set: { n2: "redis-cli --hotkeys" }, flash: ["n2", "FOUND IT", "accent"] }
]);
addRealWorld("7.5-otel", "Netflix", "Netflix Tech Blog, Atlas", [
    { say: "Real life: Netflix built its own telemetry system, Atlas, to watch an enormous number of metrics in near real time, including how its caches behave, and to alert engineers when something drifts.", rename: { prom: "Atlas", graf: "Dashboards" }, move: ["prom", "graf", "query"], flash: ["graf", "ALERTING", "warn"] }
]);
