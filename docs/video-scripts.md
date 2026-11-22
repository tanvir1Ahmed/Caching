# Presenter video scripts

One short video per lesson, 60 to 90 seconds, spoken by the same AI presenter.

## Presenter

- A friendly software engineer in their early thirties, casual smart clothes, standing in a bright modern office with a whiteboard behind them.
- Speaks slowly and clearly to a complete beginner, smiles, uses simple hand gestures.
- Same person, outfit and background in every video.
- Voice: warm, calm, clear English, medium pace.

## Production notes

- Each video is uploaded and its URL added to `src/Caching.Core/wwwroot/videos/videos.json` as `"N.M": "https://..."`.
- The lesson page shows it automatically in the "Watch the instructor" panel.
- Keep sentences short. One idea per sentence.

---

## 1.1 What is caching?

Hi, and welcome to the caching course. Let's start with a simple idea.
Imagine you are writing an essay and you need a fact from a library across town. The first time, you travel all the way there. That is slow. So you write the fact on a sticky note on your desk. Next time, you just read the note. That sticky note is a cache.
In software, the library is your database, and the sticky note is a copy kept in fast memory.
Why does it matter? Amazon found that every extra tenth of a second of loading time cost them about one percent of sales. Facebook answers billions of requests every second from a cache, because no database could keep up.
In this lesson, watch the animation, then play with the calculator to see why the hit ratio decides everything.

## 1.2 Your first cache

In this lesson you build your first real cache with IMemoryCache, using a pattern called cache-aside.
The rule is simple. First, look in the cache. If the answer is there, that's a hit, and you are done in a fraction of a millisecond. If it's not there, that's a miss. You read the database, then you save the answer in the cache for next time.
Facebook uses exactly this pattern across thousands of servers.
But here's the catch: the cache is a copy. If someone changes the price in the database, your cache still shows the old one. That is called stale data. The fix is to remove the cached copy when the data changes.
Try it in the live demo: watch the time drop from 800 milliseconds to almost zero.

## 1.3 Expiration

A cached copy should not live forever. Expiration gives every copy a deadline.
With absolute expiration, the copy dies at a fixed time, no matter how often you read it. With sliding expiration, every read gives it more time, so popular data stays. And the best choice is usually both: sliding, with a maximum age.
You use expiration every day without knowing it. Every website address your phone looks up is cached with a timer called a TTL. In 2021, when Facebook's address servers became unreachable, cached answers kept people connected for a little while. Then the timers ran out, and Facebook, Instagram and WhatsApp disappeared for six hours.
Try the three countdown cards in the demo.

## 1.4 Size limits and eviction

Memory is limited, so every serious cache needs a size limit.
When the cache is full, something has to go. That's called eviction. The most common rule is "least recently used": throw out whatever nobody has touched for the longest time.
In .NET, you can also give entries a priority. Low priority entries go first, high priority ones last.
Big systems like memcached at Facebook and Wikipedia get a fixed amount of memory too, and engineers watch the eviction counter closely. If it keeps rising, the cache is too small.
In the demo, fill the cache, push one more item in, and watch which entries get removed.

## 2.1 Cache-Control headers

The fastest request is the one you never send.
Your browser has its own cache. When a server answers, it can add a header called Cache-Control that says how long the browser may reuse the answer. During that time, the browser doesn't even ask the server.
Facebook found browsers wasting millions of requests asking about files that never change, so they proposed a new setting called immutable.
But be careful. On Christmas Day 2015, a caching mistake at Steam let some users see other people's account pages. Personal pages must always be marked private.
In the demo, compare no-store, no-cache and max-age, and watch which requests never reach the server.

## 2.2 ETag and 304

What happens when a cached copy is old, but probably still correct?
The browser asks the server: "I have version abc. Has it changed?" That version label is called an ETag.
If nothing changed, the server answers 304 Not Modified, with an empty body. Instead of downloading everything again, you get a tiny "it's still the same".
GitHub uses this in its API, and a 304 answer doesn't even count against your rate limit. Tools that check GitHub every minute save huge amounts of traffic this way.
In the demo, send a normal request, then send the ETag back, and watch the body size drop to zero bytes.

## 2.3 Response caching

Now let's cache whole responses on the server.
ASP.NET Core's response caching middleware stores a complete HTTP response and gives it to the next visitor without running your code at all.
It works best for public pages that everybody sees the same way. Hacker News, for example, serves cached pages to logged-out visitors when it's busy.
But it has a weakness: a client can send a "no-cache" header and skip it completely, forcing your expensive code to run.
In the demo, send five requests and see your controller run only once. Then tick the no-cache box and see what happens.

## 2.4 Output caching

Output caching is the modern server-side response cache in .NET.
The big difference: you are in control, not the client. A client cannot bypass it.
It also has two superpowers. Tags: you can remove a whole group of cached pages with one call when data changes. And protection against rushes: if a hundred requests arrive for something that isn't cached, only one runs the code, and the others wait for its result.
Wikipedia works in a similar way: most article views come from cached HTML, and an edit purges that page's cached copies.
In the demo, send ten requests at the same moment and count how many times your code really runs.

## 2.5 CDNs and static files

A CDN is a network of cache servers in cities all around the world.
When someone in Tokyo opens your site, they connect to a nearby server, which keeps copies of your files. Only the first request travels to your own server.
Netflix took this so far that it puts its own cache boxes inside internet providers. Nearly every show you watch streams from a box close to your home.
CDNs can fail too. In June 2021, a bug at the CDN Fastly took down sites like Amazon and Reddit for about an hour.
For your own files, put a version in the file name and cache it forever. A new version means a new name, so users always get the latest file.

## 3.1 Read strategies

There are two main ways to load data into a cache.
With cache-aside, your own code does the work: check the cache, read the database on a miss, store the result.
With read-through, your code only talks to the cache. The cache itself knows how to load missing data.
Amazon's DynamoDB Accelerator works like this: your code asks DAX, and DAX fetches anything it doesn't have from DynamoDB.
Both give the same result. The difference is who is responsible for loading, and how clean your code stays.
In the demo, read the event log and see who did the loading.

## 3.2 Write-through and write-around

When data changes, what should happen to the cache?
With write-through, you update the database and the cache at the same time. The next reader gets a fast, fresh answer. Amazon's DynamoDB Accelerator works this way.
With write-around, you update the database and simply delete the cached copy. The next reader misses once and loads the new value. Facebook chose this approach, because with thousands of places writing data, deleting is simpler and safer.
Either way, always write the database first. It is the source of truth.
Try both in the demo and compare the next read.

## 3.3 Write-behind

Write-behind makes writes almost instant.
The new value goes into the cache right away, and the database is updated later by a background worker, often combining many changes into one.
Remember YouTube's famous view counter that seemed stuck around 301? Views were counted quickly, verified, and then added to the official number in batches.
The risk: if the server crashes before the flush, the queued changes are lost. So use write-behind for things like views and likes, never for money or orders.
In the demo, change a price five times and watch it become one database write.

## 3.4 Refresh-ahead

With normal expiration, somebody always has to wait when a popular entry expires.
Refresh-ahead fixes that. When an entry is close to expiring, the next reader still gets the cached answer instantly, and at the same time a background task loads a fresh copy.
Netflix uses the same idea on a bigger scale: much of your personalized homepage is computed before you even open the app, so it's ready the moment you need it.
In the demo, turn on automatic reads and compare the two cards for a minute. Count the slow reads on each side.

## 4.1 Why distributed caching?

Real websites run on many servers at the same time.
If each server has its own memory cache, they disagree. Update a price through server A, and server B still shows the old one. Users see a different price every time they refresh.
The fix is a shared cache that all servers use, usually Redis.
Stack Overflow, one of the busiest sites on the internet, runs on only around nine web servers, and they all share Redis.
In the demo, update a price through server A and read through server B, first with separate caches, then with the shared one.

## 4.2 IDistributedCache and Redis

IDistributedCache is the .NET way to talk to a shared cache like Redis.
Redis lives on another machine, so a hit takes about a millisecond: slower than memory, but much faster than a database. And because it's separate, the cache survives when your app restarts.
Twitter has described keeping everyone's home timeline in Redis, so opening your timeline is one fast read.
One golden rule: a cache must fail open. If Redis goes down, your app should slow down, not crash. It should simply read the database instead.
In the demo, look inside Redis and see exactly how your product is stored.

## 4.3 Serialization

Redis cannot store a C# object. It only stores bytes.
Serialization turns your object into bytes, usually JSON. For big data, compressing it can make it seven times smaller, which saves memory and network time on every single read.
Google invented Protocol Buffers and Facebook invented Thrift for exactly this reason: at billions of messages, every byte counts.
Be careful when you change your classes. If you rename a property, old cached data may not match anymore. Putting a version in your cache keys keeps you safe.
In the demo, compare the sizes of different formats.

## 4.4 HybridCache

HybridCache gives you the best of both worlds.
Level one is your server's own memory: microseconds. Level two is Redis: shared by every server. If both miss, your code loads the data once and both levels are filled.
It also protects you from rushes: if ten requests ask for the same missing data at the same moment, the database is asked only once.
Stack Overflow uses exactly this two-level design, with a message system to tell every server when its local copy is out of date.
In the demo, watch the same product come from the database, then level one, then level two.

## 5.1 Redis data types

Redis is much more than a key-value store.
It has strings for simple values and counters, hashes for objects, lists for recent activity, sets for unique things, and sorted sets for rankings.
Choosing the right type matters. Instagram needed to store 300 million photo-to-user mappings. With plain keys it would have needed about 21 gigabytes of memory. With hashes, it needed about 5.
And every Redis command is atomic. If a thousand servers increment the same counter at once, not a single update is lost.
Try every type in the playground.

## 5.2 Leaderboards and rate limiting

Two classic problems become easy with Redis.
A leaderboard is a sorted set: add points with one command, and Redis keeps everyone in order. Many online games do exactly this.
A rate limiter counts requests per user per time window. When the count goes over the limit, you answer "too many requests". Because the counter lives in Redis, the limit works across all your servers at once.
Stripe protects its payments API with Redis-based rate limiters, and GitHub tells you exactly how many requests you have left every hour.
In the demo, send eight requests quickly and watch request six get blocked.

## 5.3 Pub/Sub and distributed locks

Two ways for servers to coordinate.
Pub/Sub is a broadcast: one server publishes a message, and every listening server receives it instantly. Stack Overflow uses this to tell all its servers to drop an outdated cached copy.
A distributed lock makes sure only one server does a job at a time, like a nightly report. Redis gives the lock to exactly one caller, with a timeout so a crashed server can't block everyone forever.
But be careful: if the job takes longer than the timeout, a second worker can start. Engineer Martin Kleppmann wrote a famous warning about exactly this.
In the demo, run the lock with a short timeout and watch the workers overlap.

## 5.4 Running Redis

Running Redis in production means planning for full memory, crashes and growth.
When memory is full, an eviction policy decides what goes. For a pure cache, "least recently used" is the usual choice.
To survive restarts, Redis can save snapshots or log every write to disk.
For availability, replicas keep copies, and one takes over if the main server dies. Amazon, Microsoft and Google all sell managed Redis that does this for you.
In the demo, look at your own Redis server's memory, policy and hit ratio.

## 6.1 Invalidation strategies

There's a famous saying: there are only two hard things in computer science, cache invalidation and naming things.
When data changes, you have four main options. Wait for the timer to expire. Delete the cached copy. Change the key by adding a version number. Or clear a whole group at once.
MySQL once had a query cache that cleared every cached result for a table on any write. Under heavy load it became so slow that MySQL removed it.
Facebook does it smarter: a program reads the database's change log and deletes exactly the right cache keys.
In the demo, change one price and see how each strategy reacts.

## 6.2 Race conditions and consistency

Here's a bug that hides in perfectly correct code.
A slow reader loads the old price from the database. Meanwhile, a writer saves the new price and deletes the cache. Then the slow reader finally writes the old price into the cache. Now the cache is wrong, and it stays wrong.
Facebook hit exactly this problem. Their fix, called leases, makes sure a late, outdated write is rejected.
The lesson: caches are "eventually consistent". Decide how stale each piece of data is allowed to be.
In the demo, run the race three ways and see which ones end with the right price.

## 7.1 Cache stampede

What happens when a very popular cache entry expires while thousands of people are asking for it?
They all miss at the same moment, and they all hit the database for the same data. That's a stampede, and it can take a database down.
When Michael Jackson died in 2009, millions opened his Wikipedia article while editors kept changing it. Each edit cleared the cache, and servers rushed to rebuild the same page. Wikipedia fixed it so only one server rebuilds while the others wait.
In the demo, send twenty requests at once with and without protection, and count the database queries.

## 7.2 Penetration and Bloom filters

Caches only store things that exist. So requests for things that don't exist go straight to the database, every time.
An attacker can use this to bypass your cache completely, just by asking for random ids.
Two fixes. Cache "not found" for a short time. And use a Bloom filter: a tiny structure that can say "this definitely doesn't exist" in microseconds.
Google Bigtable and Apache Cassandra use Bloom filters to skip reading files from disk that can't contain the data you want.
In the demo, attack with random ids and watch the Bloom filter block them.

## 7.3 Cache avalanche

A stampede is one key. An avalanche is many keys at once.
If you cache thousands of items at the same moment with the same timer, they all expire together, and the database gets flooded.
In 2010, Facebook was down for about two and a half hours after every server decided its cached value was bad and asked the database at the same time.
The simplest fix is called jitter: add a small random amount to each timer, so expiries spread out over time.
In the demo, compare the two charts: one cliff, versus a gentle slope.

## 7.4 Hot keys and multi-level caching

Sometimes a single key gets a huge share of all traffic, like a tweet from someone with a hundred million followers.
In a Redis cluster, that key lives on one machine, and that machine gets overloaded while the others sit idle.
The cure is a small memory cache on every web server in front of Redis. Most reads never leave the server. And when data changes, a broadcast message tells every server to drop its local copy.
That's exactly how Stack Overflow absorbs its busiest pages.
In the demo, read one hot key a thousand times and see where the answers come from.

## 7.5 Monitoring and other technologies

You can only fix what you can see.
Measure your hit ratio, your latency, evictions, memory and errors. Put them on a dashboard and set alerts, so you know before your users do.
PostgreSQL watches its own cache hit ratio, and engineers expect about ninety-nine percent. Netflix built its own monitoring system to watch millions of numbers in real time.
Technologies change: memcached, Redis, Valkey, Garnet. But the ideas you learned in this course stay the same.
Congratulations, you've finished the course. Now go back, change the numbers in the code, and see what happens.
