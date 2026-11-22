const productSelect = document.getElementById("productId");
const modeSelect = document.getElementById("mode");
const eventsBody = document.getElementById("events");
const prefixes = ["level4:server-a:", "level4:server-b:"];

productSelect.innerHTML = productOptions(10);
renderRedisStatus(document.getElementById("redisStatus"));

document.querySelectorAll("[data-server]").forEach(card => {
    const server = card.dataset.server;

    card.querySelector("[data-role=read]").addEventListener("click", e => withBusy(e.target, async () => {
        const result = await Api.call("GET", `/api/level4/two-servers/${server}/products/${productSelect.value}?distributed=${modeSelect.value}`);
        card.querySelector("[data-role=result]").innerHTML = resultHtml(result.data);
        StoryPlayer.trace("4.1", `${modeSelect.value === "true" ? "shared" : "local"}-${server}`);
        await renderEvents(prefixes, eventsBody);
    }));

    card.querySelector("[data-role=update]").addEventListener("click", e => withBusy(e.target, async () => {
        const current = await databasePrice(productSelect.value);
        const result = await Api.call("PUT", `/api/level4/two-servers/${server}/products/${productSelect.value}/price?distributed=${modeSelect.value}`, { price: randomPrice(current) });
        card.querySelector("[data-role=result]").innerHTML = `Updated: ${resultHtml(result.data)}`;
        await renderEvents(prefixes, eventsBody);
    }));
});

document.getElementById("btnReset").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", `/api/level4/two-servers/products/${productSelect.value}`);
    await Api.call("DELETE", "/api/cache-events");
    document.querySelectorAll("[data-role=result]").forEach(r => r.textContent = "-");
    await renderEvents(prefixes, eventsBody);
}));

document.getElementById("btnDb").addEventListener("click", e => withBusy(e.target, async () => {
    document.getElementById("dbPrice").textContent = `Database price: $${await databasePrice(productSelect.value)}`;
}));

renderEvents(prefixes, eventsBody);
