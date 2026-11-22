const entriesBody = document.getElementById("entries");
const eventsBody = document.getElementById("events");
const message = document.getElementById("message");
let counter = 1;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function refresh() {
    const state = (await Api.call("GET", "/api/level1/eviction")).data;
    document.getElementById("usage").textContent = `${state.currentSize} / ${state.sizeLimit}`;
    document.getElementById("meter").style.width = `${Math.min(100, state.currentSize / state.sizeLimit * 100)}%`;
    entriesBody.innerHTML = state.entries.length === 0
        ? `<tr><td colspan="5" class="muted">The cache is empty.</td></tr>`
        : state.entries.map(e => `<tr>
            <td class="mono">${escapeHtml(e.key)}</td>
            <td>${e.size}</td>
            <td>${badge(e.priority)}</td>
            <td class="mono">${formatTime(e.lastAccessedAt)}</td>
            <td><button class="btn" data-touch="${escapeHtml(e.key)}">Use</button></td>
        </tr>`).join("");
    await renderEvents("level1:eviction:", eventsBody);
}

async function add(key, size, priority) {
    const result = (await Api.call("POST", "/api/level1/eviction/entries", { key, size, priority })).data;
    message.innerHTML = `${badge(result.stored ? "Set" : "Rejected")} ${escapeHtml(result.message)}`;
}

document.getElementById("btnAdd").addEventListener("click", e => withBusy(e.target, async () => {
    const keyInput = document.getElementById("key");
    await add(keyInput.value, Number(document.getElementById("size").value), document.getElementById("priority").value);
    keyInput.value = `item-${++counter}`;
    await delay(300);
    await refresh();
}));

document.getElementById("btnFill").addEventListener("click", e => withBusy(e.target, async () => {
    const samples = [["low-1", "Low"], ["normal-1", "Normal"], ["normal-2", "Normal"], ["normal-3", "Normal"], ["high-1", "High"]];
    for (const [key, priority] of samples) {
        await add(key, 2, priority);
        await delay(50);
    }
    message.textContent = "Added 5 entries of size 2. The cache is full.";
    await refresh();
}));

document.getElementById("btnCompact").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("POST", "/api/level1/eviction/compact?percentage=0.5");
    message.textContent = "Compaction of 50% requested.";
    await delay(300);
    await refresh();
}));

document.getElementById("btnClear").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level1/eviction");
    await Api.call("DELETE", "/api/cache-events");
    message.textContent = "Cache cleared.";
    counter = 1;
    document.getElementById("key").value = "item-1";
    await refresh();
}));

document.getElementById("btnRefresh").addEventListener("click", refresh);

entriesBody.addEventListener("click", async e => {
    const key = e.target.dataset.touch;
    if (!key) return;
    await Api.call("POST", `/api/level1/eviction/entries/${encodeURIComponent(key)}/touch`);
    message.textContent = `'${key}' was read, so it is now the most recently used.`;
    await refresh();
});

refresh();
