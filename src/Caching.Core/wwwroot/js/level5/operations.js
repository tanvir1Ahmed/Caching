renderRedisStatus(document.getElementById("redisStatus"));

async function refresh() {
    const result = await Api.call("GET", "/api/level5/info");
    if (!result.ok) {
        document.getElementById("info").innerHTML = `<tr><td>${redisErrorHtml(result)}</td></tr>`;
        return;
    }
    const data = result.data;
    document.getElementById("hits").textContent = data.keyspaceHits.toLocaleString();
    document.getElementById("misses").textContent = data.keyspaceMisses.toLocaleString();
    document.getElementById("ratio").textContent = `${data.hitRatio}%`;
    document.getElementById("info").innerHTML = Object.entries(data.server)
        .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="mono">${escapeHtml(v)}</td></tr>`).join("");
    document.getElementById("keys").innerHTML = data.courseKeys.length === 0
        ? `<tr><td colspan="3" class="muted">No keys yet.</td></tr>`
        : data.courseKeys.map(k => `<tr>
            <td class="mono">${escapeHtml(k.key)}</td>
            <td>${badge(k.type)}</td>
            <td class="mono">${k.ttlSeconds ? `${k.ttlSeconds.toFixed(0)} s` : "none"}</td>
        </tr>`).join("");
}

document.getElementById("btnRefresh").addEventListener("click", e => withBusy(e.target, refresh));
refresh();
