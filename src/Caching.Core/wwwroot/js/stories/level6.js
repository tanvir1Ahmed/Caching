Stories["6.1"] = {
    title: "One price change, four ways to react",
    height: 300,
    nodes: {
        db: node(95, 150, "🗄️", "Database", "$100"),
        ttl: node(420, 35, "⏳", "TTL only", "$100"),
        del: node(420, 113, "🗑️", "Delete on write", "$100", { w: 170 }),
        ver: node(420, 191, "🔢", "Versioned key", "v1: $100", { w: 170 }),
        grp: node(420, 268, "🏷️", "Group token", "all products", { w: 170 })
    },
    links: [["db", "ttl", { dashed: true }], ["db", "del", { dashed: true }], ["db", "ver", { dashed: true }], ["db", "grp", { dashed: true }]],
    steps: [
        { say: "The same product is cached in four different ways. Then the price in the database changes to $150.", set: { db: "$150" }, flash: ["db", "CHANGED", "warn"] },
        { say: "TTL only: nothing happens. The cache keeps showing $100 until its time runs out.", hi: ["ttl"], flash: ["ttl", "STALE until expiry", "danger"] },
        { say: "Delete on write: the code removes the key right after saving. The next read loads $150.", move: ["db", "del", "delete", "warn"], set: { del: "empty → $150" }, flash: ["del", "FRESH", "hit"] },
        { say: "Versioned key: nothing is deleted. The version number goes from 1 to 2, so readers use a brand-new key. The old one just expires.", move: ["db", "ver", "version++", "accent"], set: { ver: "v2: $150 (v1 ignored)" }, flash: ["ver", "NEW KEY", "hit"] },
        { say: "Group token: one signal clears every product in the group at once. Simple, but it also clears products that did not change.", move: ["db", "grp", "cancel token", "danger"], set: { grp: "all cleared" }, flash: ["grp", "ALL GONE", "warn"] },
        { say: "Best practice: an explicit invalidation for freshness, PLUS a TTL as a safety net in case one is missed.", hi: ["del", "ttl"] }
    ]
};

Stories["6.2"] = {
    title: "The race that puts old data back",
    height: 280,
    nodes: {
        reader: node(90, 60, "🐢", "Slow reader"),
        writer: node(90, 220, "✏️", "Writer"),
        db: node(350, 140, "🗄️", "Database", "$100"),
        cache: node(565, 140, "⚡", "Cache", "empty", { w: 120 })
    },
    links: [["reader", "db"], ["writer", "db"], ["reader", "cache"], ["writer", "cache"]],
    steps: [
        { say: "The cache is empty. A reader misses and reads the database: it gets $100.", move: ["reader", "db", "SELECT", "miss"], then: ["db", "reader", "$100", "miss"], clock: "0.8 s" },
        { say: "The reader is slow for a moment: a network hiccup or a pause. It still holds $100.", hi: ["reader"], flash: ["reader", "holding $100", "warn"], clock: "1.0 s" },
        { say: "Meanwhile a writer saves the new price $150 in the database...", move: ["writer", "db", "UPDATE $150"], set: { db: "$150" }, clock: "1.7 s" },
        { say: "...and deletes the cache key, as it should. But the cache is already empty, so this does nothing.", move: ["writer", "cache", "delete", "warn"], clock: "1.7 s" },
        { say: "Now the slow reader finally writes its OLD $100 into the cache.", move: ["reader", "cache", "$100", "danger"], set: { cache: "$100" }, clock: "2.3 s" },
        { say: "Result: database says $150, cache says $100, and it stays wrong until the TTL ends. All code was 'correct', the order was unlucky.", flash: ["cache", "STALE", "danger"] },
        { say: "Fix: the reader checks a version number before writing. It changed while the reader was busy, so the reader skips the write.", set: { cache: "empty" }, flash: ["reader", "version changed: skip", "hit"], clock: "fix" },
        { say: "Another fix: the writer deletes again a moment later (double delete), removing the old value the slow reader put back.", move: ["writer", "cache", "delete again", "hit"], flash: ["cache", "CLEAN", "hit"] }
    ]
};
