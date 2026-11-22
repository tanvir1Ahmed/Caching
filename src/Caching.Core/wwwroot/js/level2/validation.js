const productSelect = document.getElementById("productId");
const historyBody = document.getElementById("history");
const eventsBody = document.getElementById("events");
const history = [];
let savedEtag = null;
let savedDate = null;

const url = () => `/api/level2/validation/products/${productSelect.value}`;

function resetValidators() {
    savedEtag = null;
    savedDate = null;
    document.getElementById("savedEtag").textContent = "none yet";
    document.getElementById("savedDate").textContent = "none yet";
}

async function send(label, headers) {
    const result = await Api.raw(url(), { headers, cache: "no-store" });
    if (result.headers.etag) {
        savedEtag = result.headers.etag;
        document.getElementById("savedEtag").textContent = savedEtag;
    }
    if (result.headers["last-modified"]) {
        savedDate = result.headers["last-modified"];
        document.getElementById("savedDate").textContent = savedDate;
    }

    const requestHeader = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join(", ") || "(no validator)";
    document.getElementById("lastRequest").textContent = requestHeader;
    document.getElementById("lastStatus").innerHTML = `<span class="status-${result.status}">${result.status}</span>`;
    document.getElementById("lastSize").textContent = `${result.size} bytes`;
    document.getElementById("lastEtag").textContent = result.headers.etag ?? "-";

    history.unshift({ label, status: result.status, size: result.size, ms: result.roundTripMs, price: result.data ? `$${result.data.product.price}` : "(your copy)" });
    historyBody.innerHTML = history.map((h, i) => `<tr>
        <td>${history.length - i}</td>
        <td>${escapeHtml(h.label)}</td>
        <td><span class="status-${h.status}">${h.status}</span></td>
        <td class="mono">${h.size} bytes</td>
        <td class="mono">${formatMs(h.ms)}</td>
        <td>${escapeHtml(h.price)}</td>
    </tr>`).join("");
    await renderEvents("level2:validation:", eventsBody);
}

document.getElementById("btnPlain").addEventListener("click", e => withBusy(e.target, () => send("Normal request", {})));

document.getElementById("btnEtag").addEventListener("click", e => withBusy(e.target, async () => {
    if (!savedEtag) return alert("Send a normal request first to get an ETag.");
    await send("If-None-Match", { "If-None-Match": savedEtag });
}));

document.getElementById("btnDate").addEventListener("click", e => withBusy(e.target, async () => {
    if (!savedDate) return alert("Send a normal request first to get a Last-Modified date.");
    await send("If-Modified-Since", { "If-Modified-Since": savedDate });
}));

document.getElementById("btnPrice").addEventListener("click", e => withBusy(e.target, async () => {
    const current = await Api.call("GET", `/api/Product/${productSelect.value}`);
    const newPrice = Math.round((current.data.price + 10 + Math.random() * 90) * 100) / 100;
    await Api.call("PUT", `/api/Product/${productSelect.value}`, { name: current.data.name, price: newPrice });
    alert(`Price changed from $${current.data.price} to $${newPrice}. The saved validators are now out of date.`);
}));

document.getElementById("btnClear").addEventListener("click", async () => {
    history.length = 0;
    historyBody.innerHTML = `<tr><td colspan="6" class="muted">No requests yet.</td></tr>`;
    resetValidators();
    await Api.call("DELETE", "/api/cache-events");
    await renderEvents("level2:validation:", eventsBody);
});

productSelect.addEventListener("change", resetValidators);
renderEvents("level2:validation:", eventsBody);
