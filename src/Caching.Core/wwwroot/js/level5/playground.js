const historyBody = document.getElementById("history");
const keysBody = document.getElementById("keys");
const history = [];

renderRedisStatus(document.getElementById("redisStatus"));

function formatResult(result) {
    if (Array.isArray(result)) return result.length === 0 ? "(empty)" : result.map(escapeHtml).join("<br />");
    if (result && typeof result === "object") return Object.entries(result).map(([k, v]) => `${escapeHtml(k)} = ${escapeHtml(v)}`).join("<br />") || "(empty)";
    return escapeHtml(result);
}

async function refreshKeys() {
    const result = await Api.call("GET", "/api/level5/keys");
    if (!result.ok) {
        keysBody.innerHTML = `<tr><td colspan="3">${redisErrorHtml(result)}</td></tr>`;
        return;
    }
    keysBody.innerHTML = result.data.length === 0
        ? `<tr><td colspan="3" class="muted">No level5 keys.</td></tr>`
        : result.data.map(k => `<tr>
            <td class="mono">${escapeHtml(k.key)}</td>
            <td>${badge(k.type)}</td>
            <td class="mono">${k.ttlSeconds ? `${k.ttlSeconds.toFixed(0)} s` : "none"}</td>
        </tr>`).join("");
}

document.querySelectorAll("[data-op]").forEach(button => button.addEventListener("click", e => withBusy(e.target, async () => {
    const value = encodeURIComponent(document.getElementById("value").value);
    const result = await Api.call("POST", `/api/level5/commands/${button.dataset.op}?value=${value}`);
    const row = result.ok
        ? { command: result.data.command, result: formatResult(result.data.result), ms: result.data.elapsedMs }
        : { command: button.textContent, result: redisErrorHtml(result), ms: null };
    history.unshift(row);
    historyBody.innerHTML = history.slice(0, 15).map(h => `<tr>
        <td class="mono">${escapeHtml(h.command)}</td>
        <td class="mono">${h.result}</td>
        <td class="mono">${formatMs(h.ms)}</td>
    </tr>`).join("");
    await refreshKeys();
})));

document.getElementById("btnDelete").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level5/keys");
    await refreshKeys();
}));

setInterval(refreshKeys, 5000);
refreshKeys();
