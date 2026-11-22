const urlInput = document.getElementById("url");
const versionedCss = new URL(document.querySelector("link[rel=stylesheet]").href).pathname + new URL(document.querySelector("link[rel=stylesheet]").href).search;

const presets = [
    ["site.css with version", versionedCss],
    ["site.css without version", "/css/site.css"],
    ["2.1 max-age", "/api/level2/headers/MaxAge/products/1"],
    ["2.1 no-store", "/api/level2/headers/NoStore/products/1"],
    ["2.2 validation", "/api/level2/validation/products/1"],
    ["2.3 response cache", "/api/level2/response-cache/products?id=1"],
    ["2.4 output cache", "/api/level2/output-cache/products?id=1"]
];

const interesting = ["cache-control", "etag", "last-modified", "age", "expires", "vary", "content-type", "content-length"];

function explain(headers) {
    const lines = [];
    const cacheControl = headers["cache-control"];
    if (!cacheControl) {
        lines.push("No Cache-Control header. Browsers and CDNs are not told how long to keep it. With a Last-Modified header, a browser may guess a lifetime (heuristic caching).");
    } else {
        for (const part of cacheControl.split(",").map(p => p.trim().toLowerCase())) {
            const [name, value] = part.split("=");
            const seconds = Number(value);
            const readable = seconds >= 86400 ? `${Math.round(seconds / 86400)} days` : `${seconds} seconds`;
            switch (name) {
                case "public": lines.push("public: any cache may store it, including CDNs and proxies."); break;
                case "private": lines.push("private: only the user's browser may store it. CDNs and proxies must not."); break;
                case "no-store": lines.push("no-store: nobody may store it. Every request goes to the server."); break;
                case "no-cache": lines.push("no-cache: may be stored, but must be revalidated with the server before every use."); break;
                case "max-age": lines.push(`max-age: fresh for ${readable}. During that time it is reused without contacting the server.`); break;
                case "s-maxage": lines.push(`s-maxage: shared caches keep it for ${readable}.`); break;
                case "immutable": lines.push("immutable: will never change, so it is not revalidated even on reload while fresh."); break;
                case "must-revalidate": lines.push("must-revalidate: once stale, it must not be used without checking with the server."); break;
                case "stale-while-revalidate": lines.push(`stale-while-revalidate: after expiring it may be served for ${readable} more while refreshing in the background.`); break;
                default: lines.push(`${part}`);
            }
        }
    }
    if (headers.etag) lines.push(`ETag ${headers.etag}: the browser can revalidate with If-None-Match and get a 304.`);
    if (headers["last-modified"]) lines.push("Last-Modified: the browser can revalidate with If-Modified-Since.");
    if (headers.age) lines.push(`Age ${headers.age}: this response came from a cache and is ${headers.age} second(s) old.`);
    if (headers.vary) lines.push(`Vary ${headers.vary}: caches keep a separate copy for each value of these request headers.`);
    return lines;
}

async function inspect() {
    const result = await Api.raw(urlInput.value, { cache: "no-store" });
    const rows = Object.entries(result.headers)
        .filter(([key]) => interesting.includes(key))
        .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td class="mono">${escapeHtml(value)}</td></tr>`);
    document.getElementById("headers").innerHTML =
        `<tr><td>status</td><td class="mono">${result.status}</td></tr>` + rows.join("");
    document.getElementById("explanation").innerHTML = explain(result.headers).map(l => `<li>${escapeHtml(l)}</li>`).join("");
}

document.getElementById("presets").innerHTML = presets
    .map(([label, url]) => `<button class="btn" data-url="${escapeHtml(url)}">${escapeHtml(label)}</button>`).join("");

document.getElementById("presets").addEventListener("click", e => {
    if (!e.target.dataset.url) return;
    urlInput.value = e.target.dataset.url;
    inspect();
});

document.getElementById("btnInspect").addEventListener("click", e => withBusy(e.target, inspect));
urlInput.value = versionedCss;
