const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const versions = {};

const urlFor = mode => `/api/level2/headers/${mode}/products/${productSelect.value}?v=${versions[mode] ?? 1}`;
const refreshEvents = () => renderEvents("level2:headers:", eventsBody);

async function refreshCounts() {
    const counters = (await Api.call("GET", "/api/level2/counters")).data ?? {};
    document.querySelectorAll("[data-mode]").forEach(card => {
        const count = counters[`headers:${card.dataset.mode}`] ?? 0;
        card.querySelector("[data-role=count]").textContent = `${count} time${count === 1 ? "" : "s"}`;
        card.querySelector("[data-role=url]").textContent = urlFor(card.dataset.mode);
    });
}

document.querySelectorAll("[data-mode]").forEach(card => {
    const mode = card.dataset.mode;
    const scope = `headers:${mode}`;

    card.querySelector("[data-role=send]").addEventListener("click", e => withBusy(e.target, async () => {
        const before = await getCounter(scope);
        const result = await Api.raw(urlFor(mode));
        const after = await getCounter(scope);

        let outcome;
        if (after === before) outcome = `${badge("Hit")} Browser cache, server not contacted`;
        else if (result.data?.requestNumber === after) outcome = `${badge("Executed")} Full response from the server (200)`;
        else outcome = `${badge("NotModified")} Revalidated: server said 304, browser reused its copy`;

        card.querySelector("[data-role=outcome]").innerHTML = outcome;
        card.querySelector("[data-role=time]").textContent = formatMs(result.roundTripMs);
        card.querySelector("[data-role=generated]").textContent = formatTime(result.data?.generatedAt);
        await refreshCounts();
        await refreshEvents();
    }));

    card.querySelector("[data-role=newUrl]").addEventListener("click", async () => {
        versions[mode] = (versions[mode] ?? 1) + 1;
        card.querySelector("[data-role=outcome]").textContent = "New URL, the browser has no copy of it yet.";
        await refreshCounts();
    });
});

productSelect.addEventListener("change", refreshCounts);

document.getElementById("btnReset").addEventListener("click", async () => {
    await Api.call("DELETE", "/api/level2/counters");
    await Api.call("DELETE", "/api/cache-events");
    document.querySelectorAll("[data-role=outcome]").forEach(o => o.textContent = "-");
    await refreshCounts();
    await refreshEvents();
});

setInterval(() => { refreshCounts(); refreshEvents(); }, 3000);
refreshCounts();
refreshEvents();
