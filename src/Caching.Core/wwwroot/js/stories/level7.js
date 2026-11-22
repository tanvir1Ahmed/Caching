Stories["7.1"] = {
    title: "The stampede: everyone rushes the database",
    height: 300,
    nodes: {
        u1: node(80, 35, "👤", "User"),
        u2: node(80, 112, "👤", "User"),
        u3: node(80, 189, "👤", "User"),
        u4: node(80, 266, "👤", "User"),
        app: node(320, 150, "🖥️", "App", "cache just expired"),
        db: node(560, 150, "🗄️", "Database", "", { w: 120 })
    },
    links: [["u1", "app"], ["u2", "app"], ["u3", "app"], ["u4", "app"], ["app", "db"]],
    steps: [
        { say: "A very popular product's cache entry just expired. Four users ask for it at the same moment.", move: [["u1", "app", "GET"], ["u2", "app", "GET"], ["u3", "app", "GET"], ["u4", "app", "GET"]] },
        { say: "Without protection, all four miss and all four query the database for the SAME row. With thousands of users, the database falls over.", move: [["app", "db", "query 1", "danger"], ["app", "db", "query 2", "danger"], ["app", "db", "query 3", "danger"], ["app", "db", "query 4", "danger"]], flash: ["db", "OVERLOADED", "danger"] },
        { say: "With protection, the first request takes a lock for this key and goes to the database alone.", move: [["u1", "app", "GET"], ["u2", "app", "GET"], ["u3", "app", "GET"], ["u4", "app", "GET"]], then: ["app", "db", "1 query", "hit"], flash: ["app", "3 WAITING", "warn"] },
        { say: "When it returns, the value is cached and the three waiting requests use it. One query instead of four.", before: ["db", "app", "result", "hit"], move: [["app", "u1", "", "hit"], ["app", "u2", "", "hit"], ["app", "u3", "", "hit"], ["app", "u4", "", "hit"]], set: { app: "cached again" }, flash: ["db", "1 QUERY", "hit"] },
        { say: "HybridCache and output caching do this for you automatically.", hi: ["app"] }
    ]
};

Stories["7.2"] = {
    title: "Penetration: requests for things that do not exist",
    nodes: {
        bad: node(78, 130, "🦹", "Attacker", "random ids"),
        bloom: node(250, 130, "🧮", "Bloom filter", "off"),
        cache: node(425, 130, "⚡", "Cache", "", { w: 160 }),
        db: node(575, 130, "🗄️", "DB", "", { w: 100 })
    },
    links: [["bad", "bloom"], ["bloom", "cache"], ["cache", "db"]],
    steps: [
        { say: "Someone asks for product 999999, which does not exist.", move: ["bad", "bloom", "id 999999"], then: ["bloom", "cache", "", "accent"] },
        { say: "The cache never stores 'not found', so every request goes all the way to the database. The cache is useless here.", move: ["cache", "db", "miss", "danger"], flash: ["db", "every time!", "danger"] },
        { say: "Fix 1: cache 'NOT FOUND' for a short time. Repeated requests for 999999 now stop at the cache.", set: { cache: "999999: not found" }, move: ["bad", "cache", "id 999999", "hit"], flash: ["cache", "HIT (not found)", "hit"] },
        { say: "But an attacker uses a NEW random id each time, so that cache never hits.", move: ["bad", "cache", "id 482913", "danger"], then: ["cache", "db", "miss", "danger"] },
        { say: "Fix 2: a Bloom filter that knows all real ids. It can say 'definitely not' in microseconds.", set: { bloom: "knows ids 1-10" }, hi: ["bloom"] },
        { say: "Random ids are rejected before they reach the cache or the database.", move: ["bad", "bloom", "id 482913", "danger"], flash: ["bloom", "DEFINITELY NOT", "danger"] },
        { say: "Real ids pass through. Rarely a fake id passes too (a false positive), and it just costs one normal lookup.", move: ["bad", "bloom", "id 5", "hit"], then: ["bloom", "cache", "maybe → check", "hit"] }
    ]
};

Stories["7.3"] = {
    title: "The avalanche: many keys expire together",
    nodes: {
        app: node(90, 130, "🖥️", "App"),
        cache: node(320, 130, "⚡", "Cache", "200 entries, TTL 20 s", { w: 170 }),
        db: node(560, 130, "🗄️", "Database", "", { w: 120 })
    },
    links: [["app", "cache"], ["cache", "db"]],
    steps: [
        { say: "A job caches 200 products at once, all with exactly 20 seconds to live.", move: ["app", "cache", "200 × SET 20 s"], clock: "t = 0 s" },
        { say: "For 20 seconds everything is fast.", flash: ["cache", "ALL HITS", "hit"], clock: "t = 10 s" },
        { say: "At second 20, all 200 expire in the same instant.", set: { cache: "0 entries" }, flash: ["cache", "ALL EXPIRED", "danger"], clock: "t = 20 s" },
        { say: "The next requests all miss together, and the database suddenly gets 200 queries in one second.", move: [["cache", "db", "", "danger"], ["cache", "db", "", "danger"], ["cache", "db", "", "danger"], ["cache", "db", "", "danger"], ["cache", "db", "", "danger"]], flash: ["db", "200 / second!", "danger"] },
        { say: "Fix: add jitter, a random extra amount to each TTL (20 s ± 50%). Now expiries spread from 10 to 30 seconds.", set: { cache: "200 entries, TTL 10-30 s" }, clock: "t = 0 s" },
        { say: "Only about 10 entries expire each second. Same total work, but a calm, steady load the database can handle.", move: ["cache", "db", "~10 / s", "hit"], flash: ["db", "calm", "hit"], clock: "t = 10-30 s" }
    ]
};

Stories["7.4"] = {
    title: "Two cache levels, kept in sync by messages",
    height: 290,
    nodes: {
        a: node(95, 60, "🖥️", "Server A", "L1: product 3"),
        b: node(95, 230, "🖥️", "Server B", "L1: product 3"),
        redis: node(345, 145, "🟥", "L2: Redis", "product 3"),
        db: node(565, 145, "🗄️", "Database", "", { w: 120 })
    },
    links: [["a", "redis"], ["b", "redis"], ["redis", "db", { dashed: true }], ["a", "db", { dashed: true }]],
    steps: [
        { say: "A hot product is read thousands of times per second. Each server answers from its own L1 memory, so Redis is barely touched.", flash: [["a", "L1 HIT", "hit"], ["b", "L1 HIT", "hit"]] },
        { say: "Server A changes the price and saves it in the database.", move: ["a", "db", "UPDATE", "warn"] },
        { say: "Then it deletes the shared copy in Redis (L2).", move: ["a", "redis", "DEL", "warn"], set: { redis: "empty" } },
        { say: "But server B still has the old price in L1! So A publishes a message: product 3 changed.", move: ["a", "redis", "PUBLISH 3", "accent"], flash: ["b", "old in L1", "danger"] },
        { say: "Redis delivers it to every server, including A itself. Each removes product 3 from its L1.", move: [["redis", "a", "msg", "accent"], ["redis", "b", "msg", "accent"]], set: { a: "L1: empty", b: "L1: empty" } },
        { say: "The next read loads the new price once, into L2 and L1. Everyone is consistent again.", move: ["b", "redis", "read", "miss"], then: ["redis", "db", "load", "miss"], set: { redis: "product 3 (new)", b: "L1: product 3 (new)" }, flash: ["b", "FRESH", "hit"] }
    ],
    traces: {
        L1: [{ say: "answered from L1 memory, no network.", flash: ["a", "L1 HIT", "hit"] }],
        L2: [{ say: "L1 missed, Redis (L2) answered.", move: ["a", "redis", "GET", "accent"], then: ["redis", "a", "HIT", "hit"] }],
        Database: [{ say: "missed both levels, loaded from the database.", move: ["a", "redis", "GET", "miss"], then: ["a", "db", "SELECT", "miss"] }]
    }
};

Stories["7.5"] = {
    title: "You can only fix what you can see",
    nodes: {
        app: node(90, 130, "🖥️", "App", "cache events"),
        meter: node(300, 130, "📈", "Metrics", "hits, misses"),
        dash: node(530, 60, "📊", "Dashboard", "hit ratio 92%"),
        alert: node(530, 200, "🚨", "Alert")
    },
    links: [["app", "meter"], ["meter", "dash"], ["meter", "alert", { dashed: true }]],
    steps: [
        { say: "Every hit, miss and eviction in the app increases a counter.", move: ["app", "meter", "+1 hit", "hit"] },
        { say: "Counters are collected (for example with OpenTelemetry) and drawn on a dashboard.", move: ["meter", "dash", "metrics"], hi: ["dash"] },
        { say: "The number to watch first: the hit ratio. Here, 92% of reads never touch the database.", flash: ["dash", "92% hits", "hit"] },
        { say: "After a bad deploy, the hit ratio drops to 40%. Maybe a key changed by mistake.", set: { dash: "hit ratio 40%" }, flash: ["dash", "DROPPED", "danger"] },
        { say: "An alert fires before users notice the slowdown. Also watch latency, evictions, memory and errors.", move: ["meter", "alert", "hit ratio < 80%", "danger"], flash: ["alert", "WAKE UP!", "danger"] }
    ]
};
