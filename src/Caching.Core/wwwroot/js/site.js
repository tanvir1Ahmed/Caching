const Api = {
    async call(method, url, body) {
        const started = performance.now();
        const response = await fetch(url, {
            method,
            headers: body ? { "Content-Type": "application/json" } : {},
            body: body ? JSON.stringify(body) : undefined
        });
        const text = await response.text();
        return {
            ok: response.ok,
            status: response.status,
            data: parseJson(text),
            roundTripMs: performance.now() - started
        };
    }
};

function parseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { error: text };
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function formatMs(value) {
    if (value === null || value === undefined) return "-";
    return value < 10 ? `${value.toFixed(3)} ms` : `${Math.round(value)} ms`;
}

function formatTime(iso) {
    return iso ? new Date(iso).toLocaleTimeString() : "-";
}

function badge(text) {
    return `<span class="badge ${escapeHtml(String(text).toLowerCase())}">${escapeHtml(text)}</span>`;
}

async function withBusy(button, action) {
    if (button) button.disabled = true;
    try {
        await action();
    } finally {
        if (button) button.disabled = false;
    }
}

async function renderEvents(prefix, tbody) {
    const prefixes = Array.isArray(prefix) ? prefix : [prefix];
    const query = prefixes.length === 1 ? `?prefix=${encodeURIComponent(prefixes[0])}` : "";
    const result = await Api.call("GET", `/api/cache-events${query}`);
    const events = (result.data ?? []).filter(e => prefixes.some(p => e.key.startsWith(p)));
    tbody.innerHTML = events.length === 0
        ? `<tr><td colspan="4" class="muted">No events yet. Click a button above.</td></tr>`
        : events.map(e => `<tr>
            <td class="mono">${formatTime(e.time)}</td>
            <td>${badge(e.type)}</td>
            <td class="mono">${escapeHtml(e.key)}</td>
            <td>${escapeHtml(e.detail)}</td>
        </tr>`).join("");
}

Api.raw = async function (url, options = {}) {
    const started = performance.now();
    const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers ?? {},
        cache: options.cache ?? "default"
    });
    const text = await response.text();
    const headers = {};
    response.headers.forEach((value, key) => headers[key] = value);
    const isJson = (response.headers.get("content-type") ?? "").includes("json");
    return {
        status: response.status,
        ok: response.ok,
        headers,
        text,
        size: new Blob([text]).size,
        data: text && isJson ? JSON.parse(text) : null,
        roundTripMs: performance.now() - started
    };
};

async function getCounter(scope) {
    const counters = (await Api.call("GET", "/api/level2/counters")).data ?? {};
    return counters[scope] ?? 0;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function resultHtml(result) {
    if (!result) return "-";
    if (result.error) return `${badge("Error")} ${escapeHtml(result.error)}`;
    const product = result.data;
    const details = product ? ` ${escapeHtml(product.name)} <b>$${product.price}</b>` : "";
    const note = result.note ? `<div class="muted">${escapeHtml(result.note)}</div>` : "";
    return `${badge(result.source)} <span class="mono">${formatMs(result.elapsedMs)}</span>${details}${note}`;
}

async function databasePrice(id) {
    const result = await Api.call("GET", `/api/level1/memory-cache/products/${id}/no-cache`);
    return result.data?.data?.price;
}

function randomPrice(base) {
    return Math.round((base + 10 + Math.random() * 90) * 100) / 100;
}

function productOptions(count) {
    const names = ["Laptop", "Mouse", "Keyboard", "Monitor", "Headphones", "Webcam", "Microphone", "Desk Lamp", "USB Hub", "External SSD"];
    return names.slice(0, count).map((name, i) => `<option value="${i + 1}">${i + 1} - ${name}</option>`).join("");
}

function redisErrorHtml(result) {
    return `<div class="callout danger"><strong>Redis is not available</strong>${escapeHtml(result.data?.error ?? "Unknown error")}</div>`;
}
