Stories["4.1"] = {
    title: "Two servers, two caches, two different answers",
    height: 280,
    nodes: {
        lb: node(85, 140, "🔀", "Load balancer"),
        a: node(300, 55, "🖥️", "Server A", "cache: $100"),
        b: node(300, 225, "🖥️", "Server B", "cache: $100"),
        redis: node(545, 140, "🟥", "Redis (shared)", "not used yet", { w: 160 })
    },
    links: [["lb", "a"], ["lb", "b"], ["a", "redis", { dashed: true }], ["b", "redis", { dashed: true }]],
    steps: [
        { say: "Real apps run several servers. Each one has its own memory cache, and both cached the price $100.", hi: ["a", "b"] },
        { say: "An admin changes the price to $150. The request lands on server A, which clears ITS cache.", move: ["lb", "a", "price = $150", "warn"], set: { a: "cache: empty" } },
        { say: "Server B was never told. Its cache still says $100.", flash: ["b", "STILL $100", "danger"] },
        { say: "Now users see $150 or $100 depending on which server answers. That is the multi-server cache problem.", move: [["lb", "a", "", "hit"], ["lb", "b", "", "danger"]], set: { a: "cache: $150" } },
        { say: "The fix: one shared cache, Redis, that every server uses.", set: { a: "uses Redis", b: "uses Redis", redis: "$100" }, hi: ["redis"] },
        { say: "This time server A updates the price and removes the ONE shared entry in Redis.", move: ["a", "redis", "delete", "warn"], set: { redis: "empty" } },
        { say: "Server B reads, misses, loads $150 and stores it. Every server now sees the same price.", move: ["b", "redis", "read", "miss"], after: { redis: "$150" }, flash: ["redis", "SAME FOR ALL", "hit"] }
    ],
    traces: {
        "local-A": [{ say: "server A used its own memory.", move: ["lb", "a", "read"], hi: ["a"] }],
        "local-B": [{ say: "server B used its own memory.", move: ["lb", "b", "read"], hi: ["b"] }],
        "shared-A": [{ say: "server A asked the shared cache.", move: ["lb", "a", "read"], then: ["a", "redis", "get", "accent"] }],
        "shared-B": [{ say: "server B asked the shared cache.", move: ["lb", "b", "read"], then: ["b", "redis", "get", "accent"] }]
    }
};

Stories["4.2"] = {
    title: "Redis as a shared cache, and what if it fails",
    nodes: {
        app: node(100, 130, "🖥️", "App"),
        redis: node(330, 55, "🟥", "Redis", "empty"),
        db: node(330, 205, "🗄️", "Database"),
        app2: node(555, 55, "🖥️", "Another server")
    },
    links: [["app", "redis"], ["app", "db"], ["app2", "redis"]],
    steps: [
        { say: "Redis lives on another machine, so the app talks to it over the network.", move: ["app", "redis", "GET key", "miss"], flash: ["redis", "MISS", "miss"] },
        { say: "Redis only stores bytes. So the app loads the product, turns it into JSON bytes, and sends them.", before: ["app", "db", "SELECT", "miss"], move: ["app", "redis", "SET {json}"], set: { redis: "product 1 (JSON)" } },
        { say: "Any server can now read it. A hit costs about 1 ms: slower than memory, much faster than the database.", move: ["app2", "redis", "GET key", "hit"], flash: ["redis", "HIT ~1 ms", "hit"] },
        { say: "Redis can break: network issues, restarts, maintenance.", set: { redis: "unreachable" }, flash: ["redis", "DOWN", "danger"], dim: ["redis"] },
        { say: "A good app does not crash. It catches the error and reads the database instead. Slower, but still working. This is called failing open.", move: ["app", "db", "fallback", "warn"], flash: ["app", "STILL WORKING", "hit"] }
    ]
};

Stories["4.3"] = {
    title: "Objects must become bytes",
    nodes: {
        obj: node(85, 130, "📦", "C# object", "100 products"),
        json: node(270, 130, "📝", "JSON", "84 KB"),
        zip: node(455, 130, "🗜️", "GZip", "12 KB"),
        redis: node(560, 225, "🟥", "Redis", "", { w: 120 })
    },
    links: [["obj", "json"], ["json", "zip"], ["zip", "redis"], ["json", "redis", { dashed: true }]],
    steps: [
        { say: "Redis cannot store a C# object. It only stores bytes.", hi: ["obj"] },
        { say: "Serialization turns the object into bytes. JSON is the usual choice: readable and safe.", move: ["obj", "json", "serialize"], hi: ["json"] },
        { say: "Big repeated data compresses very well: GZip makes it about 7 times smaller.", move: ["json", "zip", "compress", "hit"], hi: ["zip"] },
        { say: "Smaller values mean less Redis memory and faster network transfer for every hit.", move: ["zip", "redis", "12 KB", "hit"] },
        { say: "For tiny values, skip compression: the extra header makes them bigger. And when you rename a property, old cached JSON no longer matches your class, so version your keys.", flash: ["json", "keep it compact", "warn"] }
    ]
};

Stories["4.4"] = {
    title: "HybridCache: L1 memory + L2 Redis",
    height: 280,
    nodes: {
        a: node(90, 55, "🖥️", "Server A", "L1: empty"),
        b: node(90, 225, "🖥️", "Server B", "L1: empty"),
        redis: node(340, 140, "🟥", "L2: Redis", "empty"),
        db: node(565, 140, "🗄️", "Database", "", { w: 120 })
    },
    links: [["a", "redis"], ["b", "redis"], ["redis", "db", { dashed: true }]],
    steps: [
        { say: "Server A needs product 1. L1, its own memory, is empty. L2, Redis, is empty too.", move: ["a", "redis", "L1 miss → L2?", "miss"], flash: ["redis", "MISS", "miss"] },
        { say: "So the factory reads the database, and the result is stored in BOTH levels.", move: ["redis", "db", "factory", "miss"], then: ["db", "a", "result", "miss"], set: { a: "L1: product 1", redis: "product 1" } },
        { say: "Next read on server A: L1 hit in microseconds. No network at all.", flash: ["a", "L1 HIT", "hit"] },
        { say: "Server B asks for the first time. Its L1 is empty, but L2 has it: about 1 ms, and B copies it into its own L1.", move: ["b", "redis", "L1 miss → L2", "accent"], then: ["redis", "b", "L2 HIT", "hit"], set: { b: "L1: product 1" } },
        { say: "Ten requests at the same moment for a missing key? HybridCache lets only one of them call the factory.", flash: ["db", "1 call, not 10", "hit"] },
        { say: "Watch out: removing a key clears L2 and this server's L1, but other servers keep their L1 copy until it expires. Keep L1 short.", set: { redis: "empty", a: "L1: empty" }, flash: ["b", "L1 still old!", "danger"] }
    ],
    traces: {
        L1: [{ say: "answered from L1, this server's memory.", flash: ["a", "L1 HIT", "hit"] }],
        L2: [{ say: "L1 missed, answered from L2 (Redis).", move: ["a", "redis", "L2?", "accent"], then: ["redis", "a", "HIT", "hit"] }],
        Database: [{ say: "not cached anywhere, the factory read the database.", move: ["a", "redis", "L2?", "miss"], then: ["redis", "db", "factory", "miss"] }]
    }
};
