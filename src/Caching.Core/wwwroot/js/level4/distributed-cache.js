const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefix = "level4:distributed:";
const base = () => `/api/level4/distributed/products/${productSelect.value}`;

productSelect.innerHTML = productOptions(10);
renderRedisStatus(document.getElementById("redisStatus"));

async function inspect() {
    const entry = (await Api.call("GET", `${base()}/inspect`)).data;
    const rows = [
        ["key", entry.key],
        ["exists", entry.exists],
        ["type", entry.type || "-"],
        ["TTL", entry.ttlSeconds ? `${entry.ttlSeconds.toFixed(1)} s` : "-"],
        ...Object.entries(entry.fields ?? {}).map(([k, v]) => [`field: ${k}`, v])
    ];
    if (entry.note) rows.push(["note", entry.note]);
    document.getElementById("entry").innerHTML = rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="mono">${escapeHtml(v)}</td></tr>`).join("");
}

document.getElementById("btnGet").addEventListener("click", e => withBusy(e.target, async () => {
    const result = await Api.call("GET", base());
    document.getElementById("result").innerHTML = resultHtml(result.data);
    await renderEvents(prefix, eventsBody);
}));

document.getElementById("btnRefresh").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("POST", `${base()}/refresh`);
    await inspect();
    await renderEvents(prefix, eventsBody);
}));

document.getElementById("btnRemove").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", base());
    document.getElementById("result").textContent = "Removed.";
    await renderEvents(prefix, eventsBody);
}));

document.getElementById("btnInspect").addEventListener("click", e => withBusy(e.target, inspect));

renderEvents(prefix, eventsBody);
