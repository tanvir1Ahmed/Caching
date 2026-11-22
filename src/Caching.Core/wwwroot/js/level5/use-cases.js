const leaderboardBody = document.getElementById("leaderboard");
const rateHistoryBody = document.getElementById("rateHistory");
const players = ["alice", "bob", "carol", "dave", "erin", "frank"];
const rateHistory = [];
let resetAt = null;

renderRedisStatus(document.getElementById("redisStatus"));

async function refreshLeaderboard() {
    const result = await Api.call("GET", "/api/level5/leaderboard");
    if (!result.ok) {
        leaderboardBody.innerHTML = `<tr><td colspan="3">${redisErrorHtml(result)}</td></tr>`;
        return;
    }
    leaderboardBody.innerHTML = result.data.length === 0
        ? `<tr><td colspan="3" class="muted">No scores yet.</td></tr>`
        : result.data.map(e => `<tr><td>#${e.rank}</td><td>${escapeHtml(e.player)}</td><td class="mono">${e.score}</td></tr>`).join("");
}

async function addScore(player, points) {
    const result = await Api.call("POST", `/api/level5/leaderboard/${encodeURIComponent(player)}?points=${points}`);
    if (result.ok) document.getElementById("scoreResult").textContent = `${result.data.player} now has ${result.data.score} points, rank #${result.data.rank}.`;
    else document.getElementById("scoreResult").innerHTML = redisErrorHtml(result);
}

document.getElementById("btnScore").addEventListener("click", e => withBusy(e.target, async () => {
    await addScore(document.getElementById("player").value, Number(document.getElementById("points").value));
    await refreshLeaderboard();
}));

document.getElementById("btnRandom").addEventListener("click", e => withBusy(e.target, async () => {
    for (let i = 0; i < 20; i++) {
        await addScore(players[Math.floor(Math.random() * players.length)], Math.floor(Math.random() * 50) + 1);
    }
    await refreshLeaderboard();
}));

async function sendRequest() {
    const result = await Api.call("GET", `/api/level5/rate-limit/${encodeURIComponent(document.getElementById("client").value)}`);
    if (result.status === 503) {
        rateHistoryBody.innerHTML = `<tr><td colspan="3">${redisErrorHtml(result)}</td></tr>`;
        return;
    }
    const data = result.data;
    resetAt = Date.now() + (data.resetsInSeconds ?? 0) * 1000;
    document.getElementById("rateCount").textContent = `${data.count} / ${data.limit}`;
    rateHistory.unshift({ status: result.status, count: data.count });
    rateHistoryBody.innerHTML = rateHistory.slice(0, 12).map((h, i) => `<tr>
        <td>${rateHistory.length - i}</td>
        <td>${badge(h.status === 200 ? "Allowed" : "Blocked")} ${h.status}</td>
        <td class="mono">${h.count}</td>
    </tr>`).join("");
}

document.getElementById("btnRequest").addEventListener("click", e => withBusy(e.target, sendRequest));

document.getElementById("btnBurst").addEventListener("click", e => withBusy(e.target, async () => {
    for (let i = 0; i < 8; i++) await sendRequest();
}));

setInterval(() => {
    if (!resetAt) return;
    const seconds = Math.max(0, (resetAt - Date.now()) / 1000);
    document.getElementById("rateReset").textContent = `${seconds.toFixed(1)} s`;
}, 200);

refreshLeaderboard();
