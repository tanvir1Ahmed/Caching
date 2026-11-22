const scope = "response-cache";
const productSelect = document.getElementById("productId");
const noCache = document.getElementById("noCache");
const historyBody = document.getElementById("history");
const history = [];
let sent = 0;

async function refreshStats() {
    const executed = await getCounter(scope);
    document.getElementById("sent").textContent = sent;
    document.getElementById("executed").textContent = executed;
    document.getElementById("saved").textContent = Math.max(0, sent - executed);
}

async function sendOne() {
    const id = productSelect.value;
    const before = await getCounter(scope);
    const headers = noCache.checked ? { "Cache-Control": "no-cache" } : {};
    const result = await Api.raw(`/api/level2/response-cache/products?id=${id}&_=${Date.now()}${Math.random()}`, { headers });
    const after = await getCounter(scope);
    sent++;

    history.unshift({
        id,
        header: noCache.checked ? "no-cache" : "-",
        result: after === before ? badge("Hit") + " Server cache" : badge("Executed") + " Action ran",
        age: result.headers.age ?? "-",
        ms: result.roundTripMs
    });
    historyBody.innerHTML = history.map((h, i) => `<tr>
        <td>${history.length - i}</td>
        <td>${h.id}</td>
        <td class="mono">${h.header}</td>
        <td>${h.result}</td>
        <td class="mono">${escapeHtml(h.age)}</td>
        <td class="mono">${formatMs(h.ms)}</td>
    </tr>`).join("");
}

document.getElementById("btnSend").addEventListener("click", e => withBusy(e.target, async () => {
    await sendOne();
    await refreshStats();
}));

document.getElementById("btnFive").addEventListener("click", e => withBusy(e.target, async () => {
    for (let i = 0; i < 5; i++) await sendOne();
    await refreshStats();
}));

document.getElementById("btnReset").addEventListener("click", async () => {
    await Api.call("DELETE", "/api/level2/counters");
    sent = 0;
    history.length = 0;
    historyBody.innerHTML = `<tr><td colspan="6" class="muted">No requests yet.</td></tr>`;
    await refreshStats();
});

refreshStats();
