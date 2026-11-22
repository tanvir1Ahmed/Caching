Stories["3.1"] = {
    title: "Who loads the data?",
    nodes: {
        app: node(100, 130, "🖥️", "Your code"),
        cache: node(330, 130, "⚡", "Cache", "empty"),
        db: node(555, 130, "🗄️", "Database")
    },
    links: [["app", "cache"], ["cache", "db", { dashed: true }]],
    steps: [
        { say: "Cache-aside: your code asks the cache. It is a miss.", move: ["app", "cache", "get", "miss"], flash: ["cache", "MISS", "miss"], hi: ["app"] },
        { say: "Your code goes to the database itself...", move: ["app", "db", "SELECT", "miss"], hi: ["app"] },
        { say: "...and puts the result into the cache. Your code does all the work.", before: ["db", "app", "result", "miss"], move: ["app", "cache", "set"], set: { cache: "product 1" }, hi: ["app"] },
        { say: "Read-through: your code only ever talks to the cache. Nothing else.", set: { cache: "empty" }, move: ["app", "cache", "get(1)"], hi: ["cache"] },
        { say: "On a miss, the cache calls the database by itself, using a loader you configured once.", move: ["cache", "db", "loader", "miss"], then: ["db", "cache", "result", "miss"], set: { cache: "product 1" }, hi: ["cache"] },
        { say: "Then it hands the value back. Same result, but your code stays short and clean.", move: ["cache", "app", "product 1", "hit"] }
    ]
};

Stories["3.2"] = {
    title: "Writing: update the cache, or step around it",
    nodes: {
        app: node(100, 130, "🖥️", "App"),
        cache: node(330, 55, "⚡", "Cache", "$100"),
        db: node(330, 205, "🗄️", "Database", "$100"),
        reader: node(555, 55, "👤", "Next reader")
    },
    links: [["app", "cache"], ["app", "db"], ["reader", "cache"]],
    steps: [
        { say: "Write-through: a new price arrives. First the database is updated.", move: ["app", "db", "$150"], set: { db: "$150" } },
        { say: "Then the cache is updated in the same request. Both now say $150.", move: ["app", "cache", "$150"], set: { cache: "$150" }, flash: ["cache", "UPDATED", "hit"] },
        { say: "The next reader gets a fast HIT with the new price.", move: ["reader", "cache", "read", "hit"], flash: ["cache", "HIT $150", "hit"] },
        { say: "Write-around: another new price. Again, the database is updated first.", move: ["app", "db", "$200"], set: { db: "$200" } },
        { say: "But this time the cache entry is simply deleted.", move: ["app", "cache", "delete", "warn"], set: { cache: "empty" }, flash: ["cache", "DELETED", "warn"] },
        { say: "The next reader misses once and loads the fresh $200. Simple, and it never caches data that nobody reads.", move: ["reader", "cache", "read", "miss"], flash: ["cache", "MISS → load $200", "miss"], after: { cache: "$200" } }
    ]
};

Stories["3.3"] = {
    title: "Write-behind: fast now, database later",
    nodes: {
        app: node(90, 130, "🖥️", "App"),
        cache: node(310, 55, "⚡", "Cache", "$100"),
        queue: node(310, 205, "📋", "Queue", "empty", { w: 180 }),
        db: node(550, 205, "🗄️", "Database", "$100")
    },
    links: [["app", "cache"], ["app", "queue"], ["queue", "db"]],
    steps: [
        { say: "A user changes the price. The cache is updated immediately. The user waits about 1 ms.", move: ["app", "cache", "$110", "hit"], set: { cache: "$110" }, clock: "t = 0 s" },
        { say: "The database write is not done now. It goes into a queue.", move: ["app", "queue", "write $110"], set: { queue: "1 change waiting" } },
        { say: "Two more quick changes. The queue keeps only the latest price per product.", move: ["app", "cache", "$120 then $130", "hit"], set: { cache: "$130", queue: "1 change (3 updates)" }, clock: "t = 3 s" },
        { say: "Meanwhile the database is behind: it still says $100.", flash: ["db", "BEHIND", "warn"] },
        { say: "Every 10 seconds a background worker writes the queue to the database. Three updates became ONE write.", move: ["queue", "db", "1 write: $130", "accent"], set: { queue: "empty", db: "$130" }, clock: "t = 10 s" },
        { say: "Risk: if the server crashes before the flush, queued changes are lost. Use it for views and likes, not money.", flash: ["queue", "crash = lost", "danger"] }
    ]
};

Stories["3.4"] = {
    title: "Refresh-ahead: reload before it expires",
    nodes: {
        user: node(90, 130, "👤", "Users"),
        cache: node(330, 130, "⚡", "Cache", "fresh"),
        db: node(555, 130, "🗄️", "Database")
    },
    links: [["user", "cache"], ["cache", "db", { dashed: true }]],
    steps: [
        { say: "The product is cached for 20 seconds. Users get fast hits.", move: ["user", "cache", "read", "hit"], flash: ["cache", "HIT", "hit"], clock: "age 5 s" },
        { say: "At 15 seconds, the entry is close to expiring. A user reads it and still gets an instant HIT...", move: ["user", "cache", "read", "hit"], flash: ["cache", "HIT", "hit"], clock: "age 15 s" },
        { say: "...and at the same time the cache starts a reload in the background. Nobody waits for it.", move: ["cache", "db", "background reload", "accent"], then: ["db", "cache", "fresh copy", "accent"], set: { cache: "refreshed" }, flash: ["cache", "REFRESHED", "accent"] },
        { say: "The copy is fresh again and the 20-second clock restarts. Users never hit the slow path.", clock: "age 0 s" },
        { say: "Without refresh-ahead, at 20 seconds the entry expires and the next user waits 800 ms for the database.", set: { cache: "expired" }, flash: ["cache", "user waits 800 ms", "danger"], clock: "age 20 s" }
    ]
};
