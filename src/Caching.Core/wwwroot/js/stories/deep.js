const deep = scene => ({ tag: "Picture it", ...scene });

Stories["1.1-speed"] = deep({
    title: "A race: where does the answer come from?",
    height: 300,
    nodes: {
        app: node(85, 150, "🖥️", "App"),
        mem: node(470, 35, "⚡", "Memory cache", "~0.001 ms", { w: 170 }),
        redis: node(470, 112, "🟥", "Redis", "~1 ms", { w: 170 }),
        db: node(470, 189, "🗄️", "Database", "~20-800 ms", { w: 170 }),
        api: node(470, 266, "🌍", "External API", "~300 ms+", { w: 170 })
    },
    links: [["app", "mem"], ["app", "redis"], ["app", "db"], ["app", "api"]],
    steps: [
        { say: "Four requests leave at the same moment. Watch which one arrives first.", move: [["app", "mem", "", "hit", 0.25], ["app", "redis", "", "accent", 1], ["app", "db", "", "miss", 3], ["app", "api", "", "danger", 4.5]] },
        { say: "Memory wins by far: it never leaves the process. Redis needs a network trip. The database and remote APIs are the slowest.", set: { mem: "🥇 1st · ~0.001 ms", redis: "🥈 2nd · ~1 ms", db: "🥉 3rd · ~20-800 ms", api: "4th · ~300 ms+" }, hi: ["mem"] },
        { say: "Caching means moving answers from the bottom of this list to the top.", hi: ["mem", "redis"] }
    ]
});

Stories["1.1-key"] = deep({
    title: "A bad cache key mixes up users",
    nodes: {
        anna: node(85, 55, "👩", "Anna"),
        ben: node(85, 205, "👨", "Ben"),
        cache: node(400, 130, "⚡", "Cache", "empty", { w: 190 })
    },
    links: [["anna", "cache"], ["ben", "cache"]],
    steps: [
        { say: "Anna's shopping cart is cached under the key \"cart\".", move: ["anna", "cache", "SET cart"], set: { cache: "cart = Anna's 3 items" } },
        { say: "Ben opens his cart. The key is also \"cart\", so he gets Anna's items. A privacy bug!", move: ["ben", "cache", "GET cart", "danger"], flash: ["cache", "ANNA'S CART!", "danger"] },
        { say: "Fix: put everything that changes the answer into the key, here the user id.", set: { cache: "user:1:cart, user:2:cart" } },
        { say: "Now each user has their own entry.", move: [["anna", "cache", "user:1:cart", "hit"], ["ben", "cache", "user:2:cart", "hit"]], flash: ["cache", "SEPARATE", "hit"] }
    ]
});

Stories["1.2-reference"] = deep({
    title: "IMemoryCache stores the object itself, not a copy",
    nodes: {
        code1: node(95, 55, "🧑‍💻", "Request A"),
        code2: node(95, 205, "🧑‍💻", "Request B"),
        cache: node(420, 130, "⚡", "Cache", "→ product { $1200 }", { w: 200 })
    },
    links: [["code1", "cache"], ["code2", "cache"]],
    steps: [
        { say: "Request A gets the product from the cache. It receives a reference to the very same object that sits in the cache.", move: ["cache", "code1", "same object"] },
        { say: "Request A changes price to 0 for its own calculation, thinking it has a private copy.", move: ["code1", "cache", "price = 0", "danger"], set: { cache: "→ product { $0 }" }, flash: ["cache", "CHANGED!", "danger"] },
        { say: "Request B reads the cache and now sees price $0. Nobody wanted that.", move: ["cache", "code2", "$0 !!", "danger"] },
        { say: "Rule: never modify objects you got from IMemoryCache. Cache read-only DTOs or records.", hi: ["cache"] }
    ]
});

Stories["1.3-lazy"] = deep({
    title: "Expired does not mean deleted (yet)",
    nodes: {
        app: node(110, 130, "🖥️", "App"),
        cache: node(400, 130, "⚡", "Cache", "valid until t = 20 s", { w: 210 })
    },
    links: [["app", "cache"]],
    steps: [
        { say: "An entry is valid until second 20.", clock: "t = 10 s" },
        { say: "At second 20 it expires, but no timer deletes it. It is still in memory, marked as expired.", set: { cache: "expired, still in RAM" }, flash: ["cache", "EXPIRED", "warn"], clock: "t = 20 s" },
        { say: "Only when someone touches it, or when a periodic scan runs, is it really removed. Then the eviction callback fires.", move: ["app", "cache", "read at t = 25 s", "miss"], set: { cache: "removed" }, flash: ["cache", "callback: Expired", "accent"], clock: "t = 25 s" },
        { say: "You can never read an expired value, but memory and callbacks may lag behind the exact expiry time.", hi: ["cache"] }
    ]
});

Stories["1.4-lru"] = deep({
    title: "LRU: throw out what was used longest ago",
    nodes: {
        app: node(100, 130, "🖥️", "App"),
        cache: node(400, 130, "⚡", "Cache (3 slots)", "A, B, C", { w: 210 })
    },
    links: [["app", "cache"]],
    steps: [
        { say: "The cache is full with A, B and C. A is the oldest.", hi: ["cache"] },
        { say: "Someone reads A. Now A is the most recently used, and B is the least recently used.", move: ["app", "cache", "read A", "hit"], set: { cache: "B, C, A (newest)" } },
        { say: "D arrives and there is no room. LRU evicts B, the one nobody touched for the longest time.", move: ["app", "cache", "add D"], flash: ["cache", "evict B", "warn"], after: { cache: "C, A, D" } },
        { say: "LFU would instead evict the entry used the fewest times. Redis offers both, as allkeys-lru and allkeys-lfu.", set: { cache: "C, A, D" } }
    ]
});

Stories["2.1-private"] = deep({
    title: "Why personal pages must be private",
    nodes: {
        anna: node(85, 55, "👩", "Anna"),
        ben: node(85, 205, "👨", "Ben"),
        cdn: node(330, 130, "🌍", "Shared cache", "empty", { w: 150 }),
        server: node(560, 130, "🖥️", "Server", "", { w: 110 })
    },
    links: [["anna", "cdn"], ["ben", "cdn"], ["cdn", "server"]],
    steps: [
        { say: "Anna opens her account page. The server mistakenly marks it public, max-age=60.", move: ["anna", "cdn", "GET /account"], then: ["server", "cdn", "public", "danger"], set: { cdn: "\"Hello Anna\"" } },
        { say: "Ben opens his account page a moment later. The shared cache has a fresh copy and serves it.", move: ["ben", "cdn", "GET /account", "danger"], then: ["cdn", "ben", "Hello Anna", "danger"], flash: ["cdn", "WRONG USER", "danger"] },
        { say: "With Cache-Control: private, shared caches never store it. Only Anna's own browser may keep her page.", set: { cdn: "private: not stored" }, flash: ["cdn", "SAFE", "hit"] }
    ]
});

Stories["2.2-ifmatch"] = deep({
    title: "ETags also stop lost updates",
    nodes: {
        anna: node(85, 55, "👩", "Editor Anna"),
        ben: node(85, 205, "👨", "Editor Ben"),
        server: node(450, 130, "🖥️", "Server", "price $100, ETag v1", { w: 200 })
    },
    links: [["anna", "server"], ["ben", "server"]],
    steps: [
        { say: "Anna and Ben both open the product. Both get ETag v1.", move: [["server", "anna", "v1"], ["server", "ben", "v1"]] },
        { say: "Anna saves first with If-Match: v1. It matches, so the update succeeds and the ETag becomes v2.", move: ["anna", "server", "PUT, If-Match v1", "hit"], set: { server: "price $120, ETag v2" } },
        { say: "Ben saves with If-Match: v1. That version is gone, so the server answers 412 Precondition Failed instead of overwriting Anna's change.", move: ["ben", "server", "PUT, If-Match v1", "danger"], flash: ["server", "412", "danger"] },
        { say: "Ben reloads, sees $120, and decides what to do. No change was silently lost.", move: ["server", "ben", "v2", "hit"] }
    ]
});

Stories["2.3-pieces"] = deep({
    title: "The attribute alone caches nothing on the server",
    nodes: {
        user: node(85, 130, "👤", "Users"),
        mw: node(320, 130, "📦", "Middleware", "not installed", { w: 160 }),
        ctrl: node(555, 130, "⚙️", "Controller", "[ResponseCache]", { w: 150 })
    },
    links: [["user", "mw"], ["mw", "ctrl"]],
    steps: [
        { say: "Only the [ResponseCache] attribute: the controller adds a Cache-Control header, but nothing on the server stores the response.", move: ["user", "mw", "GET"], then: ["mw", "ctrl", "runs", "miss"], dim: ["mw"] },
        { say: "Every request runs the controller again. Only browsers and CDNs benefit from the header.", move: ["user", "ctrl", "GET again", "miss"], flash: ["ctrl", "RAN AGAIN", "miss"] },
        { say: "Add AddResponseCaching() and UseResponseCaching(): now the middleware stores public responses.", undim: ["mw"], set: { mw: "stores responses" }, move: ["user", "mw", "GET", "hit"], flash: ["mw", "HIT", "hit"] }
    ]
});

Stories["2.4-tags"] = deep({
    title: "Tags remove a whole group at once",
    nodes: {
        admin: node(90, 130, "🧑‍💼", "Admin"),
        p1: node(400, 45, "📄", "/products?id=1", "tag: products", { w: 190 }),
        p2: node(400, 130, "📄", "/products?id=2", "tag: products", { w: 190 }),
        p3: node(400, 215, "📄", "/products?id=3", "tag: products", { w: 190 })
    },
    links: [["admin", "p1", { dashed: true }], ["admin", "p2", { dashed: true }], ["admin", "p3", { dashed: true }]],
    steps: [
        { say: "Three product responses are in the output cache. Each carries the tag \"products\".", hi: ["p1", "p2", "p3"] },
        { say: "An admin changes prices. One call: EvictByTagAsync(\"products\").", move: [["admin", "p1", "evict", "danger"], ["admin", "p2", "evict", "danger"], ["admin", "p3", "evict", "danger"]] },
        { say: "All three are gone, without listing their exact URLs. The next requests rebuild them with fresh prices.", dim: ["p1", "p2", "p3"], flash: [["p1", "GONE", "warn"], ["p2", "GONE", "warn"], ["p3", "GONE", "warn"]] }
    ]
});

Stories["2.5-purge"] = deep({
    title: "Purging a CDN does not reach browsers",
    nodes: {
        browser: node(85, 130, "🌐", "Browser", "copy, fresh 1 h"),
        edge: node(330, 130, "🌍", "CDN edge", "copy"),
        you: node(560, 130, "🧑‍💻", "You", "", { w: 110 })
    },
    links: [["browser", "edge"], ["edge", "you", { dashed: true }]],
    steps: [
        { say: "You fix a typo in a page cached with max-age of 1 hour. You purge it from the CDN.", move: ["you", "edge", "PURGE", "warn"], set: { edge: "empty" }, flash: ["edge", "PURGED", "warn"] },
        { say: "New visitors get the fixed page from your server through the CDN.", hi: ["edge"] },
        { say: "But this browser already has a fresh copy and does not even ask. It keeps showing the typo for up to an hour.", flash: ["browser", "STILL OLD", "danger"] },
        { say: "That is why static files use versioned URLs, and HTML often uses short max-age with a longer s-maxage for the CDN.", hi: ["browser", "edge"] }
    ]
});

Stories["3.2-fail"] = deep({
    title: "The risk inside write-through",
    nodes: {
        app: node(100, 130, "🖥️", "App"),
        db: node(380, 55, "🗄️", "Database", "$100"),
        cache: node(380, 205, "⚡", "Cache", "$100")
    },
    links: [["app", "db"], ["app", "cache"]],
    steps: [
        { say: "Write-through updates two places. Step 1, the database: success.", move: ["app", "db", "$150", "hit"], set: { db: "$150" } },
        { say: "Step 2, the cache: the network blips and the write fails.", move: ["app", "cache", "$150", "danger"], flash: ["cache", "FAILED", "danger"] },
        { say: "Now the database says $150 and the cache still says $100. Readers see the old price until the TTL ends.", flash: ["cache", "STALE $100", "danger"] },
        { say: "Safer: on a failed cache write, delete the key, and always keep a TTL as the last safety net.", set: { cache: "deleted" }, flash: ["cache", "DELETE + TTL", "hit"] }
    ]
});

Stories["4.2-hash"] = deep({
    title: "Inside Redis: one entry, three fields",
    nodes: {
        app: node(100, 130, "🖥️", "App"),
        hash: node(410, 130, "🗂️", "HASH product:1", "data · absexp · sldexp", { w: 220 })
    },
    links: [["app", "hash"]],
    steps: [
        { say: "IDistributedCache stores each entry as a Redis hash with three fields: your bytes, the absolute expiry, and the sliding window.", move: ["app", "hash", "SET"], hi: ["hash"] },
        { say: "Redis also sets a TTL on the key itself, equal to the sliding window: 30 seconds.", set: { hash: "TTL 30 s" }, clock: "TTL 30 s" },
        { say: "Each read refreshes that TTL, so the entry slides forward...", move: ["app", "hash", "GET", "hit"], clock: "TTL 30 s again" },
        { say: "...but never past the absolute expiry stored in absexp: 120 seconds after it was written.", flash: ["hash", "max 120 s", "warn"] }
    ]
});

Stories["4.3-version"] = deep({
    title: "A renamed property breaks old cached data",
    nodes: {
        app: node(110, 130, "🖥️", "New code", "expects UnitPrice", { w: 170 }),
        redis: node(420, 130, "🟥", "Redis", "{\"Price\": 1200}", { w: 190 })
    },
    links: [["app", "redis"]],
    steps: [
        { say: "Yesterday's code cached products as JSON with a property called Price.", hi: ["redis"] },
        { say: "Today you deploy code that renamed it to UnitPrice. It reads yesterday's JSON from Redis.", move: ["redis", "app", "{\"Price\": 1200}", "warn"] },
        { say: "There is no UnitPrice in that JSON, so it becomes 0. Users see free laptops!", flash: ["app", "UnitPrice = 0", "danger"] },
        { say: "Fix: put a version in the key, like product:v2:1. New code only reads new keys; old ones expire quietly.", set: { redis: "product:v2:1 (new format)" }, flash: ["redis", "v2", "hit"] }
    ]
});

Stories["5.1-atomic"] = deep({
    title: "Why INCR beats read-then-write",
    nodes: {
        a: node(95, 55, "🖥️", "Server A"),
        b: node(95, 205, "🖥️", "Server B"),
        redis: node(430, 130, "🟥", "Redis", "views = 41", { w: 160 })
    },
    links: [["a", "redis"], ["b", "redis"]],
    steps: [
        { say: "Both servers want to add one view. The slow way: read the number, add one in C#, write it back.", move: [["redis", "a", "41"], ["redis", "b", "41"]] },
        { say: "Both computed 42 and both write 42. One view is lost. This is a race condition.", move: [["a", "redis", "SET 42", "danger"], ["b", "redis", "SET 42", "danger"]], set: { redis: "views = 42" }, flash: ["redis", "LOST UPDATE", "danger"] },
        { say: "With INCR, Redis does the addition itself, one command at a time.", move: [["a", "redis", "INCR", "hit"], ["b", "redis", "INCR", "hit"]], set: { redis: "views = 44" } },
        { say: "Two increments, plus two. Correct, even with a thousand servers.", flash: ["redis", "+2 CORRECT", "hit"] }
    ]
});

Stories["5.2-board"] = deep({
    title: "A sorted set keeps the ranking for you",
    nodes: {
        game: node(100, 130, "🎮", "Game server"),
        zset: node(420, 130, "🏆", "leaderboard", "1 bob 80 · 2 ann 50 · 3 cy 30", { w: 250 })
    },
    links: [["game", "zset"]],
    steps: [
        { say: "Bob leads with 80 points.", hi: ["zset"] },
        { say: "Cy wins a game: ZINCRBY leaderboard 60 cy.", move: ["game", "zset", "+60 cy"] },
        { say: "Redis re-sorts instantly. Cy jumps to first place, no SQL ORDER BY needed.", set: { zset: "1 cy 90 · 2 bob 80 · 3 ann 50" }, flash: ["zset", "cy #1", "hit"] },
        { say: "Reading the top 10 or one player's rank stays fast even with millions of players.", move: ["zset", "game", "top 3", "hit"] }
    ]
});

Stories["5.3-token"] = deep({
    title: "Why a lock needs a secret token",
    nodes: {
        w1: node(95, 55, "🐢", "Worker 1", "slow"),
        w2: node(95, 205, "🖥️", "Worker 2"),
        redis: node(420, 130, "🟥", "Redis", "lock: free", { w: 160 })
    },
    links: [["w1", "redis"], ["w2", "redis"]],
    steps: [
        { say: "Worker 1 takes the lock for 5 seconds, but its job takes 8.", move: ["w1", "redis", "SET NX token-1"], set: { redis: "lock: token-1" } },
        { say: "The lock expires at 5 seconds. Worker 2 takes it with its own token.", set: { redis: "lock: token-2" }, move: ["w2", "redis", "SET NX token-2", "hit"], clock: "t = 5 s" },
        { say: "Worker 1 finishes and releases. With a plain DEL it would delete Worker 2's lock, letting a third worker in.", move: ["w1", "redis", "DEL ?", "danger"], flash: ["redis", "would delete W2's lock", "danger"], clock: "t = 8 s" },
        { say: "With the token check, Redis sees token-1 is not the owner and refuses. Worker 2's lock stays safe.", flash: ["redis", "REFUSED", "hit"] }
    ]
});

Stories["5.4-persist"] = deep({
    title: "Surviving a restart: snapshots and logs",
    nodes: {
        app: node(90, 130, "🖥️", "App"),
        redis: node(320, 130, "🟥", "Redis (RAM)", "1,000 keys", { w: 160 }),
        rdb: node(555, 55, "📸", "RDB snapshot", "every few minutes", { w: 150 }),
        aof: node(555, 205, "📒", "AOF log", "every write", { w: 150 })
    },
    links: [["app", "redis"], ["redis", "rdb"], ["redis", "aof"]],
    steps: [
        { say: "RAM is lost when Redis restarts. Two ways to keep data on disk.", hi: ["redis"] },
        { say: "RDB: every few minutes Redis saves a full snapshot. Compact, but recent changes can be lost.", move: ["redis", "rdb", "snapshot"] },
        { say: "AOF: every write is also appended to a log file, flushed every second. At most about 1 second lost.", move: ["app", "redis", "SET"], then: ["redis", "aof", "append"] },
        { say: "Redis crashes and restarts. It reloads from disk.", set: { redis: "restarting..." }, flash: ["redis", "RESTART", "danger"] },
        { say: "Data is back. For a pure cache you can skip this: the app simply refills it from the database.", move: ["aof", "redis", "replay", "hit"], set: { redis: "1,000 keys" } }
    ]
});

Stories["6.1-cdc"] = deep({
    title: "Writes that bypass your app",
    nodes: {
        script: node(90, 55, "📜", "Import script"),
        db: node(320, 130, "🗄️", "Database"),
        cdc: node(90, 205, "👀", "Change capture"),
        cache: node(545, 130, "⚡", "Cache", "$100", { w: 150 })
    },
    links: [["script", "db"], ["db", "cdc", { dashed: true }], ["cdc", "cache", { dashed: true }]],
    steps: [
        { say: "A nightly import script updates prices directly in the database. Your app's invalidation code never runs.", move: ["script", "db", "UPDATE 5,000 rows", "warn"] },
        { say: "The cache keeps the old prices.", flash: ["cache", "STALE", "danger"] },
        { say: "Change data capture watches the database's change log and turns every change into an event.", move: ["db", "cdc", "row changed", "accent"] },
        { say: "A handler receives the event and invalidates the right keys, no matter who made the change.", move: ["cdc", "cache", "invalidate", "hit"], set: { cache: "fresh" }, flash: ["cache", "FRESH", "hit"] }
    ]
});

Stories["6.2-ryw"] = deep({
    title: "Read your own writes",
    nodes: {
        user: node(90, 130, "👤", "You"),
        a: node(330, 55, "🖥️", "Server A"),
        b: node(330, 205, "🖥️", "Server B", "cached: old name", { w: 170 }),
        db: node(560, 130, "🗄️", "Database", "", { w: 120 })
    },
    links: [["user", "a"], ["user", "b"], ["a", "db"], ["b", "db"]],
    steps: [
        { say: "You change your display name. Server A saves it.", move: ["user", "a", "new name"], then: ["a", "db", "UPDATE"] },
        { say: "You refresh. Server B answers from a cache that still has your old name. You think the save failed.", move: ["user", "b", "refresh", "danger"], flash: ["b", "OLD NAME", "danger"] },
        { say: "Other people seeing the old name for a few seconds is fine. YOU seeing it is confusing.", hi: ["user"] },
        { say: "Fix: for a short time after your own write, read your data from the database (or invalidate everywhere).", move: ["b", "db", "bypass cache", "hit"], set: { b: "fresh for you" }, flash: ["b", "NEW NAME", "hit"] }
    ]
});

Stories["7.1-xfetch"] = deep({
    title: "Refresh early, at random",
    nodes: {
        users: node(90, 130, "👥", "Many requests"),
        cache: node(330, 130, "⚡", "Cache", "expires in 10 s"),
        db: node(560, 130, "🗄️", "Database", "", { w: 120 })
    },
    links: [["users", "cache"], ["cache", "db", { dashed: true }]],
    steps: [
        { say: "Far from expiry, every request is a normal hit.", move: ["users", "cache", "reads", "hit"], clock: "10 s left" },
        { say: "Close to expiry, each request rolls a dice. The closer the deadline, the higher the chance to refresh early.", move: ["users", "cache", "reads", "hit"], set: { cache: "expires in 2 s" }, clock: "2 s left" },
        { say: "One lucky request refreshes BEFORE expiry. Only one, so there is no rush.", move: ["cache", "db", "early refresh", "accent"], then: ["db", "cache", "fresh", "accent"], set: { cache: "expires in 60 s" }, flash: ["cache", "REFRESHED", "accent"] },
        { say: "The entry never actually expires under load, so the stampede never starts.", clock: "60 s left", flash: ["db", "1 query", "hit"] }
    ]
});

Stories["7.2-bloom"] = deep({
    title: "How a Bloom filter answers",
    nodes: {
        id: node(95, 130, "🔢", "Id to check"),
        bits: node(420, 130, "🧮", "Bits", "0 1 0 0 1 0 1 0 0 1", { w: 230 })
    },
    links: [["id", "bits"]],
    steps: [
        { say: "When id 5 is added, three hash functions pick three bit positions and set them to 1.", move: ["id", "bits", "add 5 → 1, 4, 6"], hi: ["bits"] },
        { say: "Checking id 5: all three of its bits are 1, so it is probably present.", move: ["id", "bits", "check 5", "hit"], flash: ["bits", "MAYBE (yes)", "hit"] },
        { say: "Checking id 999: one of its bits is 0. It was definitely never added. No database call needed.", move: ["id", "bits", "check 999", "danger"], flash: ["bits", "DEFINITELY NOT", "danger"] },
        { say: "Sometimes another id's bits happen to cover all three positions: a false positive. It only costs one normal lookup.", move: ["id", "bits", "check 23", "warn"], flash: ["bits", "MAYBE (wrong)", "warn"] }
    ]
});

Stories["7.3-restart"] = deep({
    title: "When the whole cache goes cold",
    nodes: {
        users: node(90, 130, "👥", "Traffic"),
        redis: node(330, 130, "🟥", "Redis", "warm: 95% hits"),
        db: node(560, 130, "🗄️", "Database", "5% load", { w: 120 })
    },
    links: [["users", "redis"], ["redis", "db"]],
    steps: [
        { say: "Normally Redis answers 95% of reads and the database is relaxed.", move: ["users", "redis", "reads", "hit"] },
        { say: "Redis restarts without persistence. Every key is gone.", set: { redis: "cold: 0 keys" }, flash: ["redis", "RESTARTED", "danger"] },
        { say: "Suddenly 100% of traffic hits the database, 20 times its normal load.", move: [["redis", "db", "", "danger"], ["redis", "db", "", "danger"], ["redis", "db", "", "danger"]], set: { db: "100% load" }, flash: ["db", "OVERLOAD", "danger"] },
        { say: "Protect yourself: replicas so a restart is not cold, gradual warm-up of the hottest keys, and limits on database concurrency.", set: { redis: "warming up", db: "manageable" }, flash: ["db", "PROTECTED", "hit"] }
    ]
});

Stories["7.4-hotkey"] = deep({
    title: "One hot key overloads one Redis node",
    nodes: {
        app: node(90, 130, "🖥️", "Servers"),
        n1: node(420, 45, "🟥", "Redis node 1", "quiet", { w: 170 }),
        n2: node(420, 130, "🟥", "Redis node 2", "holds hot key", { w: 170 }),
        n3: node(420, 215, "🟥", "Redis node 3", "quiet", { w: 170 })
    },
    links: [["app", "n1"], ["app", "n2"], ["app", "n3"]],
    steps: [
        { say: "In a cluster, each key lives on exactly one node. The flash-sale product lives on node 2.", hi: ["n2"] },
        { say: "Everyone reads it. All that traffic goes to node 2 while nodes 1 and 3 sit idle.", move: [["app", "n2", "", "danger"], ["app", "n2", "", "danger"], ["app", "n2", "", "danger"]], flash: ["n2", "100% CPU", "danger"] },
        { say: "Fix: each server keeps the hot key in its own L1 memory for a few seconds. Node 2 now gets a request every few seconds per server.", set: { app: "L1: hot key" }, flash: [["app", "L1 HITS", "hit"], ["n2", "calm", "hit"]] }
    ]
});

Stories["7.5-otel"] = deep({
    title: "From a counter in code to a graph on a screen",
    nodes: {
        app: node(85, 130, "🖥️", "App", "Meter + Counter"),
        otel: node(280, 130, "📡", "OpenTelemetry", "exporter", { w: 175 }),
        prom: node(480, 130, "🗃️", "Prometheus", "stores numbers", { w: 160 }),
        graf: node(560, 225, "📊", "Grafana", "", { w: 120 })
    },
    links: [["app", "otel"], ["otel", "prom"], ["prom", "graf"]],
    steps: [
        { say: "Your code increments a counter on every cache hit and miss: cache_events{type=Hit}.", flash: ["app", "+1 Hit", "hit"] },
        { say: "OpenTelemetry collects all counters and sends them out regularly.", move: ["app", "otel", "metrics"] },
        { say: "A time-series database such as Prometheus stores the numbers over time.", move: ["otel", "prom", "every 15 s"] },
        { say: "Grafana draws the hit ratio, latency and evictions as graphs, and can alert you when they look wrong.", move: ["prom", "graf", "query"], flash: ["graf", "hit ratio 92%", "hit"] }
    ]
});
