const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");

productSelect.innerHTML = productOptions(10);

async function refresh() {
    const state = (await Api.call("GET", "/api/level6/state")).data;
    const version = state.versions[productSelect.value] ?? 1;
    document.getElementById("state").textContent = `Current version of product ${productSelect.value}: v${version}. Group generation: ${state.groupGeneration}.`;
    await renderEvents("level6:", eventsBody);
}

async function read(card) {
    const result = (await Api.call("GET", `/api/level6/${card.dataset.strategy}/products/${productSelect.value}`)).data;
    card.querySelector("[data-role=result]").innerHTML = resultHtml(result);
    card.querySelector("[data-role=key]").textContent = result.key;
}

document.querySelectorAll("[data-strategy]").forEach(card =>
    card.querySelector("[data-role=read]").addEventListener("click", e => withBusy(e.target, async () => {
        await read(card);
        await refresh();
    })));

document.getElementById("btnReadAll").addEventListener("click", e => withBusy(e.target, async () => {
    await Promise.all([...document.querySelectorAll("[data-strategy]")].map(read));
    await refresh();
}));

document.getElementById("btnUpdate").addEventListener("click", e => withBusy(e.target, async () => {
    const current = await databasePrice(productSelect.value);
    const result = (await Api.call("PUT", `/api/level6/products/${productSelect.value}/price`, { price: randomPrice(current) })).data;
    document.getElementById("dbPrice").textContent = `Database price is now $${result.data.price}`;
    await refresh();
}));

document.getElementById("btnReset").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level6/cache");
    await Api.call("DELETE", "/api/cache-events");
    document.querySelectorAll("[data-role=result]").forEach(r => r.textContent = "-");
    document.querySelectorAll("[data-role=key]").forEach(r => r.textContent = "");
    await refresh();
}));

productSelect.addEventListener("change", refresh);
refresh();
