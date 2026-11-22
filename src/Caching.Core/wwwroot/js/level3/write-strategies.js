const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefixes = ["level3:write-through:", "level3:write-around:"];

productSelect.innerHTML = productOptions(10);

document.querySelectorAll("[data-strategy]").forEach(card => {
    const strategy = card.dataset.strategy;

    card.querySelector("[data-role=get]").addEventListener("click", e => withBusy(e.target, async () => {
        const result = await Api.call("GET", `/api/level3/${strategy}/products/${productSelect.value}`);
        card.querySelector("[data-role=read]").innerHTML = resultHtml(result.data);
        await renderEvents(prefixes, eventsBody);
    }));

    card.querySelector("[data-role=write]").addEventListener("click", e => withBusy(e.target, async () => {
        const current = await databasePrice(productSelect.value);
        const result = await Api.call("PUT", `/api/level3/${strategy}/products/${productSelect.value}/price`, { price: randomPrice(current) });
        card.querySelector("[data-role=write-result]").innerHTML = resultHtml(result.data);
        await renderEvents(prefixes, eventsBody);
    }));
});

document.getElementById("btnDb").addEventListener("click", e => withBusy(e.target, async () => {
    document.getElementById("dbPrice").textContent = `Database price: $${await databasePrice(productSelect.value)}`;
}));

renderEvents(prefixes, eventsBody);
