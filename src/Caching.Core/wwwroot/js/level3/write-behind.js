const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefix = "level3:write-behind:";
let nextFlushAt = null;
let lastCachePrice = null;

productSelect.innerHTML = productOptions(10);

async function refreshState() {
    const state = (await Api.call("GET", "/api/level3/write-behind/state")).data;
    nextFlushAt = state.nextFlushAt;
    document.getElementById("updates").textContent = state.totalUpdatesReceived;
    document.getElementById("writes").textContent = state.totalDatabaseWrites;
    document.getElementById("pending").innerHTML = state.pending.length === 0
        ? `<tr><td colspan="4" class="muted">Nothing queued. The database is up to date.</td></tr>`
        : state.pending.map(p => `<tr>
            <td>${p.productId}</td>
            <td>$${p.price}</td>
            <td>${p.updates}</td>
            <td class="mono">${formatTime(p.firstQueuedAt)}</td>
        </tr>`).join("");
    await renderEvents(prefix, eventsBody);
}

async function updateOnce() {
    const base = lastCachePrice ?? 100;
    const result = await Api.call("PUT", `/api/level3/write-behind/products/${productSelect.value}/price`, { price: randomPrice(base) });
    lastCachePrice = result.data?.data?.price ?? lastCachePrice;
    document.getElementById("cachePrice").textContent = lastCachePrice ? `$${lastCachePrice}` : "-";
}

document.getElementById("btnUpdate").addEventListener("click", e => withBusy(e.target, async () => {
    await updateOnce();
    await refreshState();
}));

document.getElementById("btnFive").addEventListener("click", e => withBusy(e.target, async () => {
    for (let i = 0; i < 5; i++) await updateOnce();
    await refreshState();
}));

document.getElementById("btnRead").addEventListener("click", e => withBusy(e.target, async () => {
    const result = await Api.call("GET", `/api/level3/write-behind/products/${productSelect.value}`);
    lastCachePrice = result.data?.data?.price ?? null;
    document.getElementById("cachePrice").textContent = lastCachePrice ? `$${lastCachePrice}` : "-";
    await refreshState();
}));

document.getElementById("btnDb").addEventListener("click", e => withBusy(e.target, async () => {
    document.getElementById("dbPrice").textContent = `$${await databasePrice(productSelect.value)}`;
}));

document.getElementById("btnFlush").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("POST", "/api/level3/write-behind/flush");
    await refreshState();
}));

productSelect.addEventListener("change", () => {
    lastCachePrice = null;
    document.getElementById("cachePrice").textContent = "-";
    document.getElementById("dbPrice").textContent = "-";
});

setInterval(() => {
    if (!nextFlushAt) return;
    const seconds = Math.max(0, (new Date(nextFlushAt) - Date.now()) / 1000);
    document.getElementById("nextFlush").textContent = `${seconds.toFixed(0)} s`;
}, 250);

setInterval(refreshState, 2000);
refreshState();
