const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefixes = ["level3:cache-aside:", "level3:read-through:"];

productSelect.innerHTML = productOptions(10);

document.querySelectorAll("[data-strategy]").forEach(card => {
    const strategy = card.dataset.strategy;

    card.querySelector("[data-role=get]").addEventListener("click", e => withBusy(e.target, async () => {
        const result = await Api.call("GET", `/api/level3/${strategy}/products/${productSelect.value}`);
        card.querySelector("[data-role=result]").innerHTML = resultHtml(result.data);
        await renderEvents(prefixes, eventsBody);
    }));

    card.querySelector("[data-role=remove]").addEventListener("click", e => withBusy(e.target, async () => {
        await Api.call("DELETE", `/api/level3/${strategy}/products/${productSelect.value}`);
        card.querySelector("[data-role=result]").textContent = "Removed.";
        await renderEvents(prefixes, eventsBody);
    }));
});

document.getElementById("btnClearLog").addEventListener("click", async () => {
    await Api.call("DELETE", "/api/cache-events");
    await renderEvents(prefixes, eventsBody);
});

renderEvents(prefixes, eventsBody);
