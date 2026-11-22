const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const prefixes = ["level7:multi:"];

productSelect.innerHTML = productOptions(10);
renderRedisStatus(document.getElementById("redisStatus"));

const refreshEvents = async () => {
    await delay(200);
    await renderEvents(prefixes, eventsBody);
};

document.getElementById("btnGet").addEventListener("click", e => withBusy(e.target, async () => {
    const result = await Api.call("GET", `/api/level7/multi-level/products/${productSelect.value}`);
    document.getElementById("result").innerHTML = resultHtml(result.data);
    await refreshEvents();
}));

document.getElementById("btnClearL1").addEventListener("click", e => withBusy(e.target, async () => {
    await Api.call("DELETE", "/api/level7/multi-level/local");
    document.getElementById("result").textContent = "L1 cleared.";
    await refreshEvents();
}));

document.getElementById("btnUpdate").addEventListener("click", e => withBusy(e.target, async () => {
    const current = await databasePrice(productSelect.value);
    const result = await Api.call("PUT", `/api/level7/multi-level/products/${productSelect.value}/price`, { price: randomPrice(current) });
    document.getElementById("result").innerHTML = `Updated: ${resultHtml(result.data)}`;
    await refreshEvents();
}));

document.getElementById("btnHammer").addEventListener("click", e => withBusy(e.target, async () => {
    const result = (await Api.call("POST", `/api/level7/multi-level/products/${productSelect.value}/hammer?requests=1000`)).data;
    document.getElementById("hammerStats").style.display = "";
    document.getElementById("l1").textContent = result.l1Hits;
    document.getElementById("l2").textContent = result.l2Hits;
    document.getElementById("db").textContent = result.databaseCalls;
    document.getElementById("result").textContent = `1,000 reads took ${formatMs(result.elapsedMs)} in total on the server.`;
    await refreshEvents();
}));

renderEvents(prefixes, eventsBody);
