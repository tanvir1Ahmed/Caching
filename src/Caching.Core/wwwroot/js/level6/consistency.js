const productSelect = document.getElementById("productId");
productSelect.innerHTML = productOptions(10);

async function run(mode) {
    document.getElementById("steps").innerHTML = `<tr><td colspan="3" class="muted">Running, about 4 seconds...</td></tr>`;
    const result = (await Api.call("POST", `/api/level6/race/${mode}/products/${productSelect.value}`)).data;
    document.getElementById("cached").textContent = result.cachedPriceAtEnd === null ? "empty" : `$${result.cachedPriceAtEnd}`;
    document.getElementById("database").textContent = `$${result.databasePriceAtEnd}`;
    document.getElementById("verdict").innerHTML = badge(result.consistent ? "Fresh" : "Stale");
    document.getElementById("steps").innerHTML = result.steps.map(s => `<tr>
        <td class="mono">${(s.atMs / 1000).toFixed(2)} s</td>
        <td>${badge(s.actor === "Writer" ? "DbWrite" : s.actor === "Reader" ? "Miss" : "Set")} ${escapeHtml(s.actor)}</td>
        <td>${escapeHtml(s.action)}</td>
    </tr>`).join("");
}

document.getElementById("btnNaive").addEventListener("click", e => withBusy(e.target, () => run("naive")));
document.getElementById("btnVersion").addEventListener("click", e => withBusy(e.target, () => run("version-check")));
document.getElementById("btnDouble").addEventListener("click", e => withBusy(e.target, () => run("double-delete")));
