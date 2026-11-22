let warmedAt = null;

function drawChart(result) {
    const max = Math.max(...result.expiriesPerSecond, 1);
    document.getElementById(`chart-${result.mode}`).innerHTML = result.expiriesPerSecond.map((count, second) =>
        `<div title="second ${second}: ${count} expiries" style="flex:1;height:${(count / max * 100).toFixed(1)}%;min-height:${count ? 2 : 0}px;background:${result.mode === "fixed" ? "var(--danger)" : "var(--hit)"};border-radius:2px 2px 0 0"></div>`
    ).join("");
    document.getElementById(`peak-${result.mode}`).textContent = `Peak: ${result.peakPerSecond} entries expire in a single second.`;
}

document.getElementById("btnWarm").addEventListener("click", e => withBusy(e.target, async () => {
    const results = (await Api.call("POST", "/api/level7/avalanche/warm")).data;
    results.forEach(drawChart);
    warmedAt = Date.now();
}));

setInterval(async () => {
    if (!warmedAt) return;
    const seconds = (Date.now() - warmedAt) / 1000;
    document.getElementById("elapsed").textContent = `${seconds.toFixed(0)} s since caching`;
    if (seconds > 35) return;
    const alive = (await Api.call("GET", "/api/level7/avalanche/alive")).data;
    document.getElementById("alive-fixed").textContent = alive.fixed;
    document.getElementById("alive-jitter").textContent = alive.jitter;
}, 1000);
