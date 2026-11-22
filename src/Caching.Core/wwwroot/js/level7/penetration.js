const resultsBody = document.getElementById("results");
const names = { none: "None", "null-cache": "Cache \"not found\"", bloom: "Bloom filter" };
const rows = [];

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", e => withBusy(e.target, async () => {
    const pattern = document.getElementById("pattern").value;
    const result = (await Api.call("POST", `/api/level7/penetration/${button.dataset.mode}?pattern=${pattern}&requests=10`)).data;
    rows.unshift(result);
    resultsBody.innerHTML = rows.map(r => `<tr>
        <td>${escapeHtml(names[r.mode])}</td>
        <td>${escapeHtml(r.pattern)}</td>
        <td>${r.requests}</td>
        <td>${badge(r.databaseCalls > 1 ? "Miss" : "Hit")} <b>${r.databaseCalls}</b></td>
        <td>${r.cacheHits}</td>
        <td>${r.rejected}</td>
        <td class="mono">${formatMs(r.elapsedMs)}</td>
    </tr>`).join("");
})));

function renderBloom(state) {
    const highlighted = new Set(state.checkedPositions);
    document.getElementById("bloomBits").innerHTML = [...state.bits].map((bit, i) => {
        const style = highlighted.has(i)
            ? `background:${bit === "1" ? "var(--hit)" : "var(--danger)"};color:#fff;`
            : bit === "1" ? "background:var(--accent-soft);color:var(--accent);" : "color:var(--muted);";
        return `<span title="bit ${i}" style="display:inline-block;width:1.4em;text-align:center;border-radius:3px;${style}">${bit}</span>`;
    }).join("");
    document.getElementById("bloomInfo").textContent =
        `${state.sizeInBits} bits, ${state.hashFunctions} hash functions, ${state.itemsAdded} ids added, ${state.bitsSet} bits set. Estimated false positive rate: ${state.estimatedFalsePositiveRate}%.`;
    if (!state.checked) return;
    const verdict = state.mightContain ? "Probably present" : "Definitely not present";
    const truth = state.actuallyExists ? "it really exists" : "it does not exist";
    const kind = state.mightContain && !state.actuallyExists ? " This is a false positive." : "";
    document.getElementById("bloomAnswer").innerHTML =
        `${badge(state.mightContain ? "Allowed" : "Blocked")} Id ${escapeHtml(state.checked)}: bits ${state.checkedPositions.join(", ")}. ${verdict}, and ${truth}.${kind}`;
}

async function check(id) {
    const state = (await Api.call("GET", `/api/level7/penetration/bloom?check=${encodeURIComponent(id)}`)).data;
    renderBloom(state);
    return state;
}

document.getElementById("btnCheck").addEventListener("click", e => withBusy(e.target, () => check(document.getElementById("checkId").value)));

document.getElementById("btnFalsePositive").addEventListener("click", e => withBusy(e.target, async () => {
    for (let id = 11; id < 2000; id++) {
        const state = (await Api.call("GET", `/api/level7/penetration/bloom?check=${id}`)).data;
        if (state.mightContain && !state.actuallyExists) {
            document.getElementById("checkId").value = id;
            renderBloom(state);
            return;
        }
    }
    document.getElementById("bloomAnswer").textContent = "No false positive found below 2000.";
}));

check("");
