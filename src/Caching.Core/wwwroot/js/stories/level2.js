Stories["2.1"] = {
    title: "The browser keeps its own copy",
    nodes: {
        page: node(85, 130, "👤", "Your page"),
        browser: node(285, 130, "🌐", "Browser cache", "empty", { w: 160 }),
        server: node(540, 130, "🖥️", "Server")
    },
    links: [["page", "browser"], ["browser", "server"]],
    steps: [
        { say: "Your page asks for a product. The browser cache has nothing, so the request goes to the server.", move: ["page", "browser", "GET"], then: ["browser", "server", "GET /product/1"], clock: "t = 0 s" },
        { say: "The server answers and adds a note: Cache-Control: max-age=15. It means: you may reuse this for 15 seconds.", move: ["server", "browser", "200 + max-age=15", "miss"], set: { browser: "fresh for 15 s" }, hi: ["browser"] },
        { say: "At 5 seconds the page asks again. The copy is still fresh, so the browser answers by itself. No network at all.", move: ["page", "browser", "GET", "hit"], flash: ["browser", "FRESH: no request", "hit"], dim: ["server"], clock: "t = 5 s" },
        { say: "At 20 seconds the copy is stale. The browser does not throw it away. It asks the server: has it changed?", undim: ["server"], set: { browser: "stale, keep it" }, move: ["browser", "server", "If-None-Match", "warn"], clock: "t = 20 s" },
        { say: "Not changed: the server answers 304 with no body. Tiny and fast. The browser reuses its copy for 15 more seconds.", move: ["server", "browser", "304", "hit"], set: { browser: "fresh again" }, flash: ["browser", "REUSED", "hit"] },
        { say: "With no-store, nothing is ever kept, and every request travels to the server.", set: { browser: "no-store: nothing kept" }, move: ["page", "browser", "GET"], then: ["browser", "server", "every time", "miss"], clock: "" }
    ]
};

Stories["2.2"] = {
    title: "ETag: a fingerprint of the response",
    nodes: {
        browser: node(110, 130, "🌐", "Browser", "no copy"),
        server: node(520, 130, "🖥️", "Server", "ETag \"abc\"")
    },
    links: [["browser", "server"]],
    steps: [
        { say: "First request. The browser has nothing, so it asks normally.", move: ["browser", "server", "GET"] },
        { say: "The server sends the full answer (2 KB) and a fingerprint called an ETag: \"abc\".", move: ["server", "browser", "200 · 2 KB · ETag abc", "miss"], set: { browser: "copy + ETag abc" } },
        { say: "Later the browser asks: I have version \"abc\". Is it still the latest?", move: ["browser", "server", "If-None-Match: abc", "warn"] },
        { say: "Same fingerprint, so the server says 304 Not Modified, with an empty body. 0 KB instead of 2 KB.", move: ["server", "browser", "304 · 0 KB", "hit"], flash: ["browser", "REUSE COPY", "hit"] },
        { say: "Now the product price changes. The content is different, so the fingerprint changes to \"def\".", set: { server: "ETag \"def\"" }, flash: ["server", "CHANGED", "warn"] },
        { say: "The browser asks with \"abc\" again. It does not match, so the server sends the new data and the new ETag.", move: ["browser", "server", "If-None-Match: abc", "warn"], then: ["server", "browser", "200 · new · ETag def", "miss"], set: { browser: "copy + ETag def" } }
    ]
};

Stories["2.3"] = {
    title: "A response cache inside the server",
    nodes: {
        user1: node(85, 55, "👤", "User 1"),
        user2: node(85, 205, "👤", "User 2"),
        middleware: node(330, 130, "📦", "Response cache", "empty", { w: 170 }),
        controller: node(560, 130, "⚙️", "Controller", "800 ms work")
    },
    links: [["user1", "middleware"], ["user2", "middleware"], ["middleware", "controller"]],
    steps: [
        { say: "User 1 asks for product 1. The response cache sits in front of your controller. It is empty.", move: ["user1", "middleware", "GET ?id=1"], flash: ["middleware", "MISS", "miss"] },
        { say: "So the controller runs and does the slow work.", move: ["middleware", "controller", "run", "miss"], hi: ["controller"] },
        { say: "The response says public, max-age=20, so the middleware keeps a copy for everyone.", move: ["controller", "middleware", "public, 20 s", "miss"], set: { middleware: "copy of ?id=1" }, then: ["middleware", "user1", "answer"] },
        { say: "User 2 asks for the same thing. The middleware answers from its copy. Your controller does not even run.", move: ["user2", "middleware", "GET ?id=1", "hit"], flash: ["middleware", "HIT", "hit"], dim: ["controller"], then: ["middleware", "user2", "answer", "hit"] },
        { say: "Catch: a client can send Cache-Control: no-cache. Then the middleware skips its copy and the controller runs again.", undim: ["controller"], move: ["user2", "middleware", "no-cache!", "danger"], then: ["middleware", "controller", "run", "danger"], flash: ["middleware", "BYPASSED", "danger"] }
    ]
};

Stories["2.4"] = {
    title: "Output caching: the server is in charge",
    nodes: {
        u1: node(85, 40, "👤", "User 1"),
        u2: node(85, 130, "👤", "User 2"),
        u3: node(85, 220, "👤", "User 3"),
        cache: node(330, 130, "📦", "Output cache", "empty", { w: 160 }),
        controller: node(560, 130, "⚙️", "Controller")
    },
    links: [["u1", "cache"], ["u2", "cache"], ["u3", "cache"], ["cache", "controller"]],
    steps: [
        { say: "Three users ask for the same product at the same moment, and the cache is empty.", move: [["u1", "cache", "GET"], ["u2", "cache", "GET"], ["u3", "cache", "GET"]] },
        { say: "Only ONE request is allowed to run the controller. The other two wait. This protects your database from a rush.", move: ["cache", "controller", "1 run only", "miss"], flash: ["cache", "2 WAITING", "warn"] },
        { say: "The result is stored with the tag \"products\" and shared with all three users.", before: ["controller", "cache", "result", "miss"], move: [["cache", "u1", "", "hit"], ["cache", "u2", "", "hit"], ["cache", "u3", "", "hit"]], set: { cache: "tag: products" } },
        { say: "Even if a user sends no-cache, the output cache still answers. The client cannot bypass it.", move: ["u2", "cache", "no-cache", "hit"], flash: ["cache", "STILL HIT", "hit"], dim: ["controller"] },
        { say: "The price changes. Your code evicts the tag \"products\", and every product response is removed at once.", undim: ["controller"], set: { cache: "empty" }, flash: ["cache", "EVICT TAG products", "danger"] }
    ]
};

Stories["2.5"] = {
    title: "A CDN: copies close to your users",
    nodes: {
        tokyo: node(85, 55, "👤", "User in Tokyo"),
        tokyo2: node(85, 205, "👤", "2nd user, Tokyo"),
        edge: node(320, 130, "🌍", "Tokyo edge", "empty"),
        origin: node(555, 130, "🖥️", "Your server", "far away")
    },
    links: [["tokyo", "edge"], ["tokyo2", "edge"], ["edge", "origin"]],
    steps: [
        { say: "A CDN has servers, called edges, in many cities. A user in Tokyo connects to the Tokyo edge.", move: ["tokyo", "edge", "GET site.css"], flash: ["edge", "MISS", "miss"] },
        { say: "The edge does not have the file yet, so it fetches it once from your server, far away.", move: ["edge", "origin", "fetch", "miss"], then: ["origin", "edge", "public, 1 year", "miss"], set: { edge: "site.css?v=1" } },
        { say: "The next user in Tokyo gets it straight from the edge in about 10 ms. Your server is not involved.", move: ["tokyo2", "edge", "GET site.css", "hit"], flash: ["edge", "HIT ~10 ms", "hit"], dim: ["origin"], then: ["edge", "tokyo2", "", "hit"] },
        { say: "You deploy a new CSS file. Its URL gets a new version: site.css?v=2. A new URL is a new file for every cache, so users get it immediately.", undim: ["origin"], move: ["tokyo", "edge", "GET ?v=2"], then: ["edge", "origin", "fetch v2", "miss"], set: { edge: "site.css?v=2" } },
        { say: "Never put personal pages on a CDN as public: everyone would see the first user's page.", flash: ["edge", "public data only", "danger"] }
    ]
};
