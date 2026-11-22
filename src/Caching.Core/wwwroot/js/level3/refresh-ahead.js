const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefixes = ["level3:cache-aside:", "level3:refresh-ahead:"];
const cachedAt = {};
const slowReads = {};

productSelect.innerHTML = productOptions(10);

async function read(card) {
    const strategy = card.dataset.strategy;
    const result = (await Api.call("GET", `/api/level3/${strategy}/products/${productSelect.value}`)).data;
    cachedAt[strategy] = result.cachedAt;
    if (result.source === "Database") slowReads[strategy] = (slowReads[strategy] ?? 0) + 1;
    card.querySelector("[data-role=result]").innerHTML = resultHtml(result);
    card.querySelector("[data-role=slow]").textContent = `Slow reads (user waited for the database): ${slowReads[strategy] ?? 0}`;
}

document.querySelectorAll("[data-strategy]").forEach(card => {
    const strategy = card.dataset.strategy;

    card.querySelector("[data-role=get]").addEventListener("click", e => withBusy(e.target, async () => {
        await read(card);
        await renderEvents(prefixes, eventsBody);
    }));

    card.querySelector("[data-role=remove]").addEventListener("click", e => withBusy(e.target, async () => {
        await Api.call("DELETE", `/api/level3/${strategy}/products/${productSelect.value}`);
        delete cachedAt[strategy];
        card.querySelector("[data-role=result]").textContent = "Removed.";
        await renderEvents(prefixes, eventsBody);
    }));
});

setInterval(() => {
    document.querySelectorAll("[data-strategy]").forEach(card => {
        const at = cachedAt[card.dataset.strategy];
        card.querySelector("[data-role=age]").textContent = at ? `${((Date.now() - new Date(at)) / 1000).toFixed(1)} s` : "-";
    });
}, 200);

setInterval(async () => {
    if (!document.getElementById("auto").checked) return;
    await Promise.all([...document.querySelectorAll("[data-strategy]")].map(read));
    await renderEvents(prefixes, eventsBody);
}, 3000);

productSelect.addEventListener("change", () => {
    Object.keys(cachedAt).forEach(k => delete cachedAt[k]);
    Object.keys(slowReads).forEach(k => delete slowReads[k]);
});

renderEvents(prefixes, eventsBody);
