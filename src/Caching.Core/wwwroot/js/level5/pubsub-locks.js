const pubsubEvents = document.getElementById("pubsubEvents");
const lockResults = document.getElementById("lockResults");
const timeline = document.getElementById("timeline");

renderRedisStatus(document.getElementById("redisStatus"));

const refreshPubSub = () => renderEvents("level5:pubsub:", pubsubEvents);

document.getElementById("btnPublish").addEventListener("click", e => withBusy(e.target, async () => {
    const message = encodeURIComponent(document.getElementById("message").value);
    const result = await Api.call("POST", `/api/level5/pubsub/publish?message=${message}`);
    document.getElementById("publishResult").innerHTML = result.ok
        ? `Delivered to ${result.data.receivers} subscriber(s).`
        : redisErrorHtml(result);
    await delay(300);
    await refreshPubSub();
}));

function drawTimeline(results, lockMs) {
    const end = Math.max(...results.map(r => r.finishedAtMs ?? r.startedAtMs)) + 300;
    timeline.innerHTML = results.map(r => {
        const left = r.startedAtMs / end * 100;
        const width = r.acquired ? (r.finishedAtMs - r.startedAtMs) / end * 100 : 1.5;
        const lockWidth = r.acquired ? lockMs / end * 100 : 0;
        const color = r.acquired ? "var(--hit)" : "var(--danger)";
        return `<div style="margin:8px 0">
            <div class="muted" style="font-size:0.8rem">${escapeHtml(r.worker)}: ${r.acquired ? "working" : "skipped"}</div>
            <div style="position:relative;height:16px;background:var(--surface-2);border-radius:4px">
                ${r.acquired ? `<div title="lock lifetime" style="position:absolute;left:${left}%;width:${Math.min(lockWidth, 100 - left)}%;height:16px;border:2px dashed var(--warn);border-radius:4px;box-sizing:border-box"></div>` : ""}
                <div style="position:absolute;left:${left}%;width:${width}%;height:16px;background:${color};border-radius:4px;opacity:0.8"></div>
            </div>
        </div>`;
    }).join("") + `<p class="muted" style="font-size:0.8rem">Solid bar: the worker is working. Dashed box: how long its lock lives. Time runs left to right (${Math.round(end)} ms total).</p>`;
}

async function runLocks(workMs, lockMs) {
    document.getElementById("workMs").value = workMs;
    document.getElementById("lockMs").value = lockMs;
    lockResults.innerHTML = `<tr><td colspan="5" class="muted">Running...</td></tr>`;
    const result = await Api.call("POST", `/api/level5/locks/run?workers=4&workMs=${workMs}&lockMs=${lockMs}&startIntervalMs=700`);
    if (!result.ok) {
        lockResults.innerHTML = `<tr><td colspan="5">${redisErrorHtml(result)}</td></tr>`;
        return;
    }
    lockResults.innerHTML = result.data.map(r => `<tr>
        <td>${escapeHtml(r.worker)}</td>
        <td class="mono">${Math.round(r.startedAtMs)} ms</td>
        <td>${badge(r.acquired ? "Acquired" : "Blocked")}</td>
        <td class="mono">${r.finishedAtMs ? `${Math.round(r.finishedAtMs)} ms` : "-"}</td>
        <td>${escapeHtml(r.note)}</td>
    </tr>`).join("");
    drawTimeline(result.data, lockMs);
}

document.getElementById("btnSafe").addEventListener("click", e => withBusy(e.target, () => runLocks(2000, 5000)));
document.getElementById("btnUnsafe").addEventListener("click", e => withBusy(e.target, () => runLocks(2000, 1000)));

refreshPubSub();
