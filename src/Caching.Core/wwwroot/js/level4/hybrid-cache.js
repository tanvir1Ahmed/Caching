const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const historyBody = document.getElementById("history");
const prefix = "level4:hybrid:";
const history = [];

productSelect.innerHTML = productOptions(10);
renderRedisStatus(document.getElementById("redisStatus"));

function addHistory(action, source, ms) {
    history.unshift({ action, source, ms });
    historyBody.innerHTML = history.map((h, i) => `<tr>
        <td>${history.length - i}</td>
        <td>${escapeHtml(h.action)}</td>
        <td>${h.source}</td>
        <td class="mono">${formatMs(h.ms)}</td>
    </tr>`).join("");
}

async function get(skipLocal) {
    const result = (await Api.call("GET", `/api/level4/hybrid/products/${productSelect.value}?skipLocal=${skipLocal}`)).data;
    document.getElementById("result").innerHTML = resultHtml(result);
    addHistory(`Get product ${productSelect.value}${skipLocal ? " (skip L1)" : ""}`, badge(result.source), result.elapsedMs);
    await renderEvents(prefix, eventsBody);
}

document.getElementById("btnGet").addEventListener("click", e => withBusy(e.target, () => get(false)));
document.getElementById("btnL2").addEventListener("click", e => withBusy(e.target, () => get(true)));

document.getElementById("btnParallel").addEventListener("click", e => withBusy(e.target, async () => {
    const result = (await Api.call("GET", `/api/level4/hybrid/products/${productSelect.value}/parallel?requests=10`)).data;
    document.getElementById("result").textContent = result.note;
    addHistory("10 parallel requests", `${badge(result.loaderRuns === 0 ? "Hit" : "Miss")} factory ran ${result.loaderRuns} time(s)`, result.elapsedMs);
    await renderEvents(prefix, eventsBody);
}));

document.getElementById("btnRemove").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", `/api/level4/hybrid/products/${productSelect.value}`);
    addHistory(`Remove product ${productSelect.value}`, badge("Remove"), null);
    await renderEvents(prefix, eventsBody);
}));

document.getElementById("btnTag").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level4/hybrid/tags/products");
    addHistory("Remove tag 'products'", badge("Remove"), null);
    await renderEvents(prefix, eventsBody);
}));

renderEvents(prefix, eventsBody);
