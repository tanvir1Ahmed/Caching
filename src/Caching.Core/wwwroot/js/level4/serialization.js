function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

document.getElementById("btnCompare").addEventListener("click", e => withBusy(e.target, async () => {
    const count = document.getElementById("count").value;
    const results = (await Api.call("GET", `/api/level4/serialization?count=${count}`)).data;
    const max = Math.max(...results.map(r => r.bytes));
    document.getElementById("results").innerHTML = results.map(r => `<tr>
        <td><b>${escapeHtml(r.format)}</b></td>
        <td class="mono">${formatBytes(r.bytes)}</td>
        <td class="mono">${r.percentOfJson}%</td>
        <td class="mono">${formatMs(r.serializeMs)}</td>
        <td class="mono">${formatMs(r.deserializeMs)}</td>
        <td style="width:30%"><div class="meter"><div style="width:${(r.bytes / max * 100).toFixed(1)}%"></div></div></td>
    </tr>`).join("");
}));
