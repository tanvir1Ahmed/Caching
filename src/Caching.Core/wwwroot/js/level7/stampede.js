const resultsBody = document.getElementById("results");
const names = { none: "None", lock: "Lock per key", hybrid: "HybridCache" };
const rows = [];

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", e => withBusy(e.target, async () => {
    const requests = document.getElementById("requests").value;
    const product = Math.floor(Math.random() * 10) + 1;
    const result = (await Api.call("POST", `/api/level7/stampede/${button.dataset.mode}/products/${product}?requests=${requests}`)).data;
    rows.unshift(result);
    resultsBody.innerHTML = rows.map(r => `<tr>
        <td>${escapeHtml(names[r.mode])}</td>
        <td>${r.requests}</td>
        <td>${badge(r.databaseCalls > 1 ? "Miss" : "Hit")} <b>${r.databaseCalls}</b></td>
        <td>${r.cacheHits}</td>
        <td class="mono">${formatMs(r.elapsedMs)}</td>
    </tr>`).join("");
})));
