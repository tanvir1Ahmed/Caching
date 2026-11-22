function rows(values) {
    const entries = Object.entries(values ?? {});
    if (entries.length === 0) return `<tr><td class="muted">No events yet.</td></tr>`;
    const max = Math.max(...entries.map(([, v]) => v));
    return entries.map(([key, value]) => `<tr>
        <td style="width:30%">${badge(key)}</td>
        <td class="mono" style="width:15%">${value}</td>
        <td><div class="meter"><div style="width:${(value / max * 100).toFixed(1)}%"></div></div></td>
    </tr>`).join("");
}

async function refresh() {
    const data = (await Api.call("GET", "/api/level7/metrics")).data;
    document.getElementById("memRatio").textContent = `${data.memoryCache.hitRatio}%`;
    document.getElementById("memEntries").textContent = data.memoryCache.entryCount;
    document.getElementById("redisRatio").textContent = data.redisAvailable ? `${data.redisHitRatio}%` : "n/a";
    document.getElementById("byType").innerHTML = rows(data.eventsByType);
    document.getElementById("byLevel").innerHTML = rows(data.eventsByLevel);
    document.getElementById("redisDetails").textContent = data.redisAvailable
        ? `Redis: ${data.redisHits} hits, ${data.redisMisses} misses, ${data.redisMemory} used, ${data.redisEvictedKeys} keys evicted.`
        : `Redis: ${data.redisError}`;
}

document.getElementById("btnRefresh").addEventListener("click", e => withBusy(e.target, refresh));
setInterval(() => { if (document.getElementById("auto").checked) refresh(); }, 3000);
refresh();
