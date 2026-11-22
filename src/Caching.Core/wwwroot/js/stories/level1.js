Stories["1.1"] = {
    title: "Caching in 30 seconds",
    nodes: {
        user: node(75, 130, "👤", "You"),
        app: node(265, 130, "🖥️", "App"),
        cache: node(530, 50, "⚡", "Cache", "empty"),
        db: node(530, 210, "🗄️", "Database", "slow: 800 ms")
    },
    links: [["user", "app"], ["app", "cache"], ["app", "db"]],
    steps: [
        { say: "You ask the app for product 1.", move: ["user", "app", "product 1?"] },
        { say: "The app has never seen it, so it must go to the database. The database is slow: 800 ms.", hi: ["db"], move: ["app", "db", "SELECT...", "miss"], clock: "⏱ 800 ms" },
        { say: "The database answers.", move: ["db", "app", "$1200", "miss"] },
        { say: "Smart move: the app keeps a copy in the cache, like writing the answer on a sticky note.", move: ["app", "cache", "save copy", "accent"], set: { cache: "product 1 = $1200" }, hi: ["cache"] },
        { say: "You get your answer, after waiting 800 ms.", move: ["app", "user", "$1200"] },
        { say: "Later, you ask for product 1 again.", move: ["user", "app", "product 1?"], clock: "" },
        { say: "This time the app finds the copy in the cache. That is a cache HIT.", move: ["app", "cache", "have it?", "hit"], flash: ["cache", "HIT", "hit"], clock: "⏱ 0.01 ms" },
        { say: "The answer comes back almost instantly, and the slow database is not touched at all.", move: ["cache", "app", "$1200", "hit"], dim: ["db"] },
        { say: "That is the whole idea of caching: keep a fast copy of slow answers.", move: ["app", "user", "$1200", "hit"], hi: ["cache"] }
    ]
};

Stories["1.2"] = {
    title: "Cache-aside: check the cache first",
    nodes: {
        user: node(75, 130, "👤", "You"),
        app: node(265, 130, "🖥️", "App"),
        cache: node(530, 50, "⚡", "IMemoryCache", "empty"),
        db: node(530, 210, "🗄️", "Database", "price $1200")
    },
    links: [["user", "app"], ["app", "cache"], ["app", "db"]],
    steps: [
        { say: "Request 1: you ask for product 1.", move: ["user", "app", "product 1?"] },
        { say: "Rule number one of cache-aside: always look in the cache first. It is empty, so this is a MISS.", move: ["app", "cache", "have it?", "miss"], flash: ["cache", "MISS", "miss"] },
        { say: "On a miss, the app reads the slow database itself.", move: ["app", "db", "SELECT", "miss"], clock: "⏱ 800 ms" },
        { say: "Then it stores the answer in the cache for 60 seconds.", before: ["db", "app", "$1200", "miss"], move: ["app", "cache", "save 60 s"], set: { cache: "product 1 = $1200" } },
        { say: "Request 2: same product. Cache HIT, about 0.01 ms.", before: ["user", "app", "product 1?"], move: ["app", "cache", "have it?", "hit"], flash: ["cache", "HIT", "hit"], clock: "⏱ 0.01 ms" },
        { say: "Now somebody changes the price in the database to $1300.", set: { db: "price $1300" }, flash: ["db", "CHANGED", "warn"], clock: "" },
        { say: "Request 3: the cache still says $1200. Nobody told it. This is called STALE data.", before: ["user", "app", "product 1?"], move: ["app", "cache", "have it?", "danger"], flash: ["cache", "STALE: $1200", "danger"] },
        { say: "The fix: remove the key from the cache when the data changes.", set: { cache: "empty" }, flash: ["cache", "REMOVED", "warn"] },
        { say: "Request 4 misses, loads $1300 from the database and caches the fresh value.", move: ["app", "db", "SELECT", "miss"], then: ["app", "cache", "save"], set: { cache: "product 1 = $1300" }, flash: ["cache", "FRESH", "hit"] }
    ],
    traces: {
        Cache: [
            { say: "found it in the cache. HIT.", move: ["app", "cache", "have it?", "hit"], flash: ["cache", "HIT", "hit"] },
            { move: ["cache", "app", "answer", "hit"] }
        ],
        Database: [
            { say: "not in the cache. MISS.", move: ["app", "cache", "have it?", "miss"], flash: ["cache", "MISS", "miss"] },
            { say: "read from the database (slow).", move: ["app", "db", "SELECT", "miss"] },
            { say: "stored in the cache for next time.", before: ["db", "app", "answer", "miss"], move: ["app", "cache", "save"] }
        ]
    }
};

Stories["1.3"] = {
    title: "Expiration: every copy has a deadline",
    nodes: {
        app: node(110, 130, "🖥️", "App"),
        cache: node(330, 130, "⚡", "Cache", "empty"),
        db: node(550, 130, "🗄️", "Database")
    },
    links: [["app", "cache"], ["cache", "db", { dashed: true }]],
    steps: [
        { say: "Absolute expiration: the app stores product 1 with a 20-second lifetime.", move: ["app", "cache", "save, TTL 20 s"], set: { cache: "dies at t = 20 s" }, clock: "t = 0 s" },
        { say: "At 10 seconds someone reads it: HIT. The deadline does not move.", move: ["app", "cache", "read", "hit"], flash: ["cache", "HIT", "hit"], clock: "t = 10 s" },
        { say: "At 20 seconds the time is up. The copy is no longer valid.", set: { cache: "expired" }, flash: ["cache", "EXPIRED", "danger"], clock: "t = 20 s" },
        { say: "The next read is a MISS, so the fresh value is loaded from the database. Old data can never live longer than 20 seconds.", move: ["app", "cache", "read", "miss"], then: ["app", "db", "reload", "miss"], set: { cache: "fresh copy" }, clock: "t = 21 s" },
        { say: "Sliding expiration is different: the entry dies only if nobody reads it for 8 seconds.", set: { cache: "idle limit 8 s" }, clock: "t = 0 s" },
        { say: "Every read restarts the 8-second countdown, so popular data stays.", move: ["app", "cache", "read", "hit"], flash: ["cache", "TIMER RESET", "hit"], clock: "t = 6 s" },
        { say: "Danger: if people keep reading, it never expires and can be stale forever. So we add a maximum age too: that is combined expiration.", flash: ["cache", "MAX 30 s", "warn"], clock: "t = 30 s" }
    ]
};

Stories["1.4"] = {
    title: "When the cache is full",
    nodes: {
        app: node(110, 130, "🖥️", "App"),
        cache: node(400, 130, "⚡", "Cache (limit 10)", "▮▮▮▮▮▮▮▮▮▮ 10/10", { w: 190 })
    },
    links: [["app", "cache"]],
    steps: [
        { say: "This cache has room for 10 units, and it is completely full.", hi: ["cache"] },
        { say: "A new entry of size 2 arrives.", move: ["app", "cache", "new item (2)"] },
        { say: "In .NET, the new entry is REJECTED. It does not fit, so it is not stored.", flash: ["cache", "REJECTED", "danger"] },
        { say: "Then a cleanup called compaction starts and frees space. Low priority entries go first.", set: { cache: "▮▮▮▮▮▮▮▮ 8/10" }, flash: ["cache", "removed: Low", "warn"] },
        { say: "Then the least recently used Normal entries, until half the space is free.", set: { cache: "▮▮▮▮ 4/10" }, flash: ["cache", "removed: old Normal", "warn"] },
        { say: "High priority survives longer, and NeverRemove entries are never compacted.", flash: ["cache", "High stays", "hit"] },
        { say: "Now there is room again. Without a size limit, a cache can grow until the server runs out of memory.", move: ["app", "cache", "new item (2)", "hit"], set: { cache: "▮▮▮▮▮▮ 6/10" } }
    ]
};
