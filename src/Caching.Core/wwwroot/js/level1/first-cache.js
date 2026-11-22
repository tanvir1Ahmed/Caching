const productSelect = document.getElementById("productId");
const historyBody = document.getElementById("history");
const eventsBody = document.getElementById("events");
const history = [];

const productId = () => productSelect.value;

function show(mode, result) {
    const data = result.data ?? {};
    const price = data.data ? `$${data.data.price}` : "not found";
    history.unshift({ mode, source: data.source, ms: data.elapsedMs, price });

    document.getElementById("lastSource").innerHTML = badge(data.source ?? "-");
    document.getElementById("lastTime").textContent = formatMs(data.elapsedMs);
    document.getElementById("lastPrice").textContent = price;
    document.getElementById("lastInfo").textContent = data.key
        ? `Key ${data.key}. Cached at ${formatTime(data.cachedAt)}, expires at ${formatTime(data.expiresAt)}. ${data.note ?? ""}`
        : `No cache used. ${data.note ?? ""}`;

    historyBody.innerHTML = history.map((h, i) => `<tr>
        <td>${history.length - i}</td>
        <td>${escapeHtml(h.mode)}</td>
        <td>${badge(h.source)}</td>
        <td class="mono">${formatMs(h.ms)}</td>
        <td>${escapeHtml(h.price)}</td>
    </tr>`).join("");
}

async function refresh() {
    const stats = (await Api.call("GET", "/api/level1/memory-cache/stats")).data;
    document.getElementById("statHits").textContent = stats.hits;
    document.getElementById("statMisses").textContent = stats.misses;
    document.getElementById("statRatio").textContent = `${stats.hitRatio}%`;
    document.getElementById("statEntries").textContent = stats.entryCount;
    await renderEvents("level1:product:", eventsBody);
}

async function getNoCache() {
    show("No cache", await Api.call("GET", `/api/level1/memory-cache/products/${productId()}/no-cache`));
}

async function getCached() {
    show("Cached", await Api.call("GET", `/api/level1/memory-cache/products/${productId()}/cached`));
}

document.getElementById("btnNoCache").addEventListener("click", e => withBusy(e.target, async () => { await getNoCache(); await refresh(); }));

document.getElementById("btnCache").addEventListener("click", e => withBusy(e.target, async () => { await getCached(); await refresh(); }));

document.getElementById("btnBurst").addEventListener("click", e => withBusy(e.target, async () => {
    for (let i = 0; i < 5; i++) await getCached();
    await refresh();
}));

document.getElementById("btnRemove").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", `/api/level1/memory-cache/products/${productId()}`);
    await refresh();
}));

document.getElementById("btnPrice").addEventListener("click", e => withBusy(e.target, async () => {
    const current = await Api.call("GET", `/api/Product/${productId()}`);
    if (!current.ok) return alert("This product does not exist.");
    const newPrice = Math.round((current.data.price + 10 + Math.random() * 90) * 100) / 100;
    await Api.call("PUT", `/api/Product/${productId()}`, { name: current.data.name, price: newPrice });
    alert(`Price in the database changed from $${current.data.price} to $${newPrice}. The cache was not told.`);
    await refresh();
}));

document.getElementById("btnReset").addEventListener("click", async () => {
    history.length = 0;
    historyBody.innerHTML = `<tr><td colspan="5" class="muted">No requests yet.</td></tr>`;
    await Api.call("DELETE", "/api/cache-events");
    await refresh();
});

refresh();
