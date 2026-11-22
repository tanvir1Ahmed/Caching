const scope = "output-cache";
const productSelect = document.getElementById("productId");
const noCache = document.getElementById("noCache");
const historyBody = document.getElementById("history");
const eventsBody = document.getElementById("events");
const history = [];
let sent = 0;

const request = () => Api.raw(`/api/level2/output-cache/products?id=${productSelect.value}`, {
    headers: noCache.checked ? { "Cache-Control": "no-cache" } : {},
    cache: "no-store"
});

function addHistory(label, result, price, ms) {
    history.unshift({ label, result, price, ms });
    historyBody.innerHTML = history.map((h, i) => `<tr>
        <td>${history.length - i}</td>
        <td>${escapeHtml(h.label)}</td>
        <td>${h.result}</td>
        <td>${escapeHtml(h.price)}</td>
        <td class="mono">${formatMs(h.ms)}</td>
    </tr>`).join("");
}

async function refresh() {
    const executed = await getCounter(scope);
    document.getElementById("sent").textContent = sent;
    document.getElementById("executed").textContent = executed;
    document.getElementById("saved").textContent = Math.max(0, sent - executed);
    await renderEvents("level2:output-cache:", eventsBody);
}

document.getElementById("btnSend").addEventListener("click", e => withBusy(e.target, async () => {
    const before = await getCounter(scope);
    const result = await request();
    const after = await getCounter(scope);
    sent++;
    const outcome = after === before ? `${badge("Hit")} Output cache` : `${badge("Executed")} Action ran`;
    addHistory(`id ${productSelect.value}${noCache.checked ? " + no-cache" : ""}`, outcome, `$${result.data?.product.price}`, result.roundTripMs);
    await refresh();
}));

document.getElementById("btnParallel").addEventListener("click", e => withBusy(e.target, async () => {
    const before = await getCounter(scope);
    const started = performance.now();
    const results = await Promise.all(Array.from({ length: 10 }, request));
    const after = await getCounter(scope);
    sent += 10;
    const runs = after - before;
    addHistory(`10 parallel, id ${productSelect.value}`, `${badge(runs === 0 ? "Hit" : "Executed")} Action ran ${runs} time${runs === 1 ? "" : "s"} for 10 requests`, `$${results[0].data?.product.price}`, performance.now() - started);
    await refresh();
}));

document.getElementById("btnEvict").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level2/output-cache/tags/products");
    addHistory("Evict tag 'products'", badge("Evicted"), "-", null);
    await refresh();
}));

document.getElementById("btnPrice").addEventListener("click", e => withBusy(e.target, async () => {
    const current = await Api.call("GET", `/api/Product/${productSelect.value}`);
    const newPrice = Math.round((current.data.price + 10 + Math.random() * 90) * 100) / 100;
    await Api.call("PUT", `/api/Product/${productSelect.value}`, { name: current.data.name, price: newPrice });
    addHistory(`Price changed to $${newPrice} in database`, badge("Set"), `$${newPrice}`, null);
}));

document.getElementById("btnReset").addEventListener("click", async () => {
    await Api.call("DELETE", "/api/level2/counters");
    await Api.call("DELETE", "/api/cache-events");
    sent = 0;
    history.length = 0;
    historyBody.innerHTML = `<tr><td colspan="5" class="muted">No requests yet.</td></tr>`;
    await refresh();
});

refresh();
