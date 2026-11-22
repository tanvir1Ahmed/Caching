Stories["5.1"] = {
    title: "Redis stores data structures, not just text",
    height: 300,
    nodes: {
        app: node(85, 150, "🖥️", "App"),
        str: node(330, 35, "🔤", "String", "page-views = 41"),
        hash: node(330, 115, "🗂️", "Hash", "name, price, stock=5"),
        list: node(330, 195, "📜", "List", "[c, b, a]"),
        set: node(330, 270, "🎯", "Set", "{ann, bob}"),
        zset: node(560, 150, "🏆", "Sorted set", "bob 80, ann 50", { w: 150 })
    },
    links: [["app", "str"], ["app", "hash"], ["app", "list"], ["app", "set"], ["app", "zset"]],
    steps: [
        { say: "String: one value. INCR adds 1 inside Redis, safely, even if 100 servers do it at the same moment.", move: ["app", "str", "INCR page-views"], set: { str: "page-views = 42" }, flash: ["str", "42", "hit"] },
        { say: "Hash: an object with fields. You can change one field without rewriting the whole object.", move: ["app", "hash", "HINCRBY stock -1"], set: { hash: "name, price, stock=4" }, flash: ["hash", "stock 4", "hit"] },
        { say: "List: an ordered list. Push the newest activity to the front and trim to keep only the last few.", move: ["app", "list", "LPUSH d"], set: { list: "[d, c, b, a]" } },
        { say: "Set: unique members only. Adding the same visitor twice does nothing.", move: ["app", "set", "SADD ann"], flash: ["set", "already there", "warn"] },
        { say: "Sorted set: members always kept in order by score. Perfect for leaderboards.", move: ["app", "zset", "ZINCRBY ann +40"], set: { zset: "ann 90, bob 80" }, flash: ["zset", "ann #1", "hit"] }
    ]
};

Stories["5.2"] = {
    title: "A rate limiter in two Redis commands",
    nodes: {
        client: node(90, 130, "📱", "Mobile app"),
        api: node(320, 130, "🖥️", "API"),
        redis: node(550, 130, "🟥", "Redis", "counter: none")
    },
    links: [["client", "api"], ["api", "redis"]],
    steps: [
        { say: "Rule: at most 5 requests every 10 seconds. Request 1 arrives.", move: ["client", "api", "request 1"], clock: "window 0-10 s" },
        { say: "The API runs INCR on a counter for this client and this 10-second window. Redis creates it at 1 and gives it a 10-second expiry.", move: ["api", "redis", "INCR", "accent"], set: { redis: "counter: 1 / 5" }, flash: ["redis", "ALLOWED", "hit"] },
        { say: "Requests 2 to 5: the counter goes up. All allowed.", move: ["client", "api", "2, 3, 4, 5"], then: ["api", "redis", "INCR ×4", "accent"], set: { redis: "counter: 5 / 5" } },
        { say: "Request 6: the counter becomes 6, which is over the limit.", move: ["client", "api", "request 6", "danger"], then: ["api", "redis", "INCR", "danger"], set: { redis: "counter: 6 / 5" } },
        { say: "The API answers 429 Too Many Requests. Because the counter is in Redis, the limit holds across ALL servers.", move: ["api", "client", "429", "danger"], flash: ["api", "BLOCKED", "danger"] },
        { say: "After 10 seconds the key expires by itself. A new window starts at zero.", set: { redis: "counter: none" }, clock: "window 10-20 s", flash: ["redis", "EXPIRED", "muted"] }
    ]
};

Stories["5.3"] = {
    title: "Broadcast with Pub/Sub, coordinate with a lock",
    height: 280,
    nodes: {
        a: node(90, 60, "🖥️", "Server A"),
        b: node(90, 220, "🖥️", "Server B"),
        redis: node(330, 140, "🟥", "Redis", "", { w: 120 }),
        c: node(560, 60, "🖥️", "Server C"),
        d: node(560, 220, "🖥️", "Server D")
    },
    links: [["a", "redis"], ["b", "redis"], ["c", "redis"], ["d", "redis"]],
    steps: [
        { say: "Pub/Sub: server A publishes a message on a channel: product 42 changed.", move: ["a", "redis", "PUBLISH", "accent"] },
        { say: "Redis instantly pushes it to every subscribed server, so each one can clear its local copy.", move: [["redis", "b", "msg", "accent"], ["redis", "c", "msg", "accent"], ["redis", "d", "msg", "accent"]], flash: [["b", "got it", "hit"], ["c", "got it", "hit"], ["d", "got it", "hit"]] },
        { say: "Lock: now B, C and D all want to run the same nightly job. Only one should.", move: [["b", "redis", "SET NX", "warn"], ["c", "redis", "SET NX", "warn"], ["d", "redis", "SET NX", "warn"]] },
        { say: "SET NX succeeds for only one caller. C wins the lock. B and D see it is taken and skip the job.", flash: [["c", "GOT LOCK", "hit"], ["b", "SKIP", "danger"], ["d", "SKIP", "danger"]], set: { redis: "lock: C (5 s)" } },
        { say: "The lock has a timeout, so a crashed worker cannot block everyone forever. When C finishes, it releases only ITS OWN lock, checked with a secret token.", move: ["c", "redis", "release", "hit"], set: { redis: "" } },
        { say: "Trap: if the job takes longer than the timeout, the lock expires while C is still working, and someone else can start. Make the timeout longer than the work.", flash: ["redis", "timeout > work!", "danger"] }
    ]
};

Stories["5.4"] = {
    title: "Keeping Redis healthy",
    height: 280,
    nodes: {
        app: node(90, 140, "🖥️", "App"),
        primary: node(330, 140, "🟥", "Primary", "memory 95%"),
        r1: node(560, 60, "🟧", "Replica 1"),
        r2: node(560, 220, "🟧", "Replica 2")
    },
    links: [["app", "primary"], ["primary", "r1"], ["primary", "r2"]],
    steps: [
        { say: "Redis keeps everything in RAM, and RAM fills up.", flash: ["primary", "ALMOST FULL", "warn"] },
        { say: "With the allkeys-lru policy, Redis removes the least recently used keys to make room. That is right for a cache.", set: { primary: "memory 80%" }, flash: ["primary", "evicted old keys", "accent"] },
        { say: "Replicas keep a copy of the data. Every write is copied to them.", move: ["app", "primary", "SET"], then: [["primary", "r1", "copy"], ["primary", "r2", "copy"]] },
        { say: "The primary crashes.", dim: ["primary"], flash: ["primary", "CRASHED", "danger"] },
        { say: "A replica is promoted to be the new primary, and the app reconnects. Very recent writes can be lost, because copying happens in the background.", flash: ["r1", "NEW PRIMARY", "hit"], move: ["app", "r1", "reconnect", "hit"] },
        { say: "Bigger data than one machine? Redis Cluster splits keys across many primaries, using 16,384 hash slots.", undim: ["primary"], set: { primary: "slots 0-8191", r1: "slots 8192-16383" } }
    ]
};
