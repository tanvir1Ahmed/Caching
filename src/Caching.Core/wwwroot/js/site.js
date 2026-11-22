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
            data: text ? JSON.parse(text) : null,
            roundTripMs: performance.now() - started
        };
    }
};

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
    const result = await Api.call("GET", `/api/cache-events?prefix=${encodeURIComponent(prefix)}`);
    const events = result.data ?? [];
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
