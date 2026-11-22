const productSelect = document.getElementById("productId");
const eventsBody = document.getElementById("events");
const expiresAt = {};

const refreshEvents = () => renderEvents("level1:expiration:", eventsBody);

function updateCountdowns() {
    document.querySelectorAll("[data-type]").forEach(card => {
        const type = card.dataset.type;
        const element = card.querySelector("[data-role=countdown]");
        if (!expiresAt[type]) {
            element.textContent = "not cached";
            element.classList.remove("expired");
            return;
        }
        const seconds = (new Date(expiresAt[type]) - Date.now()) / 1000;
        element.textContent = seconds > 0 ? `${seconds.toFixed(1)} s` : "expired";
        element.classList.toggle("expired", seconds <= 0);
    });
}

document.querySelectorAll("[data-type]").forEach(card => {
    const type = card.dataset.type;

    card.querySelector("[data-role=get]").addEventListener("click", e => withBusy(e.target, async () => {
        const result = (await Api.call("GET", `/api/level1/expiration/${type}/products/${productSelect.value}`)).data;
        expiresAt[type] = result.expiresAt;
        card.querySelector("[data-role=detail]").innerHTML =
            `Cached at ${formatTime(result.cachedAt)}<br />Expires at ${formatTime(result.expiresAt)}`;
        card.querySelector("[data-role=last]").innerHTML =
            `Last request: ${badge(result.source)} in ${formatMs(result.elapsedMs)}`;
        await refreshEvents();
    }));

    card.querySelector("[data-role=remove]").addEventListener("click", e => withBusy(e.target, async () => {
        await Api.call("DELETE", `/api/level1/expiration/${type}/products/${productSelect.value}`);
        delete expiresAt[type];
        card.querySelector("[data-role=detail]").textContent = "Removed. Click Get to load it again.";
        await refreshEvents();
    }));
});

productSelect.addEventListener("change", () => {
    Object.keys(expiresAt).forEach(k => delete expiresAt[k]);
    document.querySelectorAll("[data-role=detail]").forEach(d => d.textContent = "Click Get to load it.");
    document.querySelectorAll("[data-role=last]").forEach(d => d.textContent = "");
});

document.getElementById("btnClearLog").addEventListener("click", async () => {
    await Api.call("DELETE", "/api/cache-events");
    await refreshEvents();
});

setInterval(updateCountdowns, 200);
setInterval(refreshEvents, 2000);
refreshEvents();
