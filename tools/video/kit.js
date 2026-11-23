const params = new URLSearchParams(location.search);
const vertical = params.get("shape") !== "horizontal";
const W = vertical ? 1080 : 1920;
const H = vertical ? 1920 : 1080;
const C = { bg: "#0b1726", grid: "#13263b", cyan: "#3fd0d4", orange: "#f5a142", text: "#e9eef5", muted: "#7f93aa", note: "#f7d65a", red: "#ff6b6b", green: "#4cd98a", blue: "#5aa0ff" };
const ns = "http://www.w3.org/2000/svg";
const stage = document.getElementById("stage");
stage.setAttribute("width", W);
stage.setAttribute("height", H);
stage.setAttribute("viewBox", `0 0 ${W} ${H}`);

function el(name, attrs = {}, parent = stage) {
    const e = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
}
function txt(parent, x, y, text, attrs = {}) {
    const t = el("text", { x, y, "text-anchor": "middle", class: "mono", fill: C.text, "font-size": 30, ...attrs }, parent);
    t.textContent = text;
    return t;
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const fade = (t, a, b, d = 0.5) => clamp(Math.min((t - a) / d, (b - t) / d));
const show = (node, o) => node.setAttribute("opacity", o);

const defs = el("defs");
const glowFilter = el("filter", { id: "glow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
el("feGaussianBlur", { stdDeviation: "6", result: "b" }, glowFilter);
const glowMerge = el("feMerge", {}, glowFilter);
el("feMergeNode", { in: "b" }, glowMerge);
el("feMergeNode", { in: "SourceGraphic" }, glowMerge);
const vig = el("radialGradient", { id: "vig", cx: "50%", cy: "45%", r: "75%" }, defs);
el("stop", { offset: "0%", "stop-color": "#10223a" }, vig);
el("stop", { offset: "100%", "stop-color": "#08111d" }, vig);
el("rect", { width: W, height: H, fill: "url(#vig)" });
const gridG = el("g", { stroke: C.grid, "stroke-width": 1, opacity: 0.6 });
for (let x = 0; x <= W; x += 60) el("line", { x1: x, y1: 0, x2: x, y2: H }, gridG);
for (let y = 0; y <= H; y += 60) el("line", { x1: 0, y1: y, x2: W, y2: y }, gridG);

const L = vertical
    ? { pad: 70, headY: 110, titleY: 270, titleSize: 76, diagram: { x: 40, y: 500, s: 1.0 }, capY: 1640, capSize: 46, capW: 940, statY: 960 }
    : { pad: 90, headY: 90, titleY: 210, titleSize: 72, diagram: { x: 960, y: 150, s: 0.8 }, capY: 975, capSize: 40, capW: 1740, statY: 540 };

let titleEl, subtitleEl, titleText = "", subtitleText = "";
function header(lesson, title, subtitle, tags) {
    titleText = title;
    subtitleText = subtitle;
    const head = el("g", { class: "mono" });
    el("text", { x: L.pad, y: L.headY, fill: C.cyan, "font-size": 30, "letter-spacing": 3 }, head).textContent = "CACHING ACADEMY";
    el("text", { x: L.pad + (vertical ? 350 : 360), y: L.headY, fill: C.text, "font-size": 30 }, head).textContent = lesson;
    let x = vertical ? W - L.pad : W - L.pad;
    [...tags].reverse().forEach((label, ri) => {
        const i = tags.length - 1 - ri;
        const w = label.length * 19 + 36;
        x -= w;
        el("rect", { x, y: L.headY - 32, width: w, height: 46, rx: 23, fill: i === 0 ? "#0f3a40" : "none", stroke: i === 0 ? C.cyan : "#2c4258", "stroke-width": 2 }, head);
        el("text", { x: x + w / 2, y: L.headY - 1, fill: i === 0 ? C.cyan : C.muted, "font-size": 24, "text-anchor": "middle", "letter-spacing": 1 }, head).textContent = label;
        x -= 14;
    });
    titleEl = el("text", { x: L.pad, y: L.titleY, fill: C.text, "font-size": L.titleSize, "font-weight": 700, class: "sans" });
    subtitleEl = el("text", { x: L.pad, y: L.titleY + 70, fill: C.muted, "font-size": vertical ? 36 : 34, class: "sans" });
}

const D = el("g", { transform: `translate(${L.diagram.x},${L.diagram.y}) scale(${L.diagram.s})` });

function cube(parent, cx, cy, s, color = C.cyan) {
    const g = el("g", {}, parent);
    const k = 0.87 * s;
    el("polygon", { points: `${cx},${cy - s} ${cx + k},${cy - s / 2} ${cx},${cy} ${cx - k},${cy - s / 2}`, fill: "#16304a", stroke: color, "stroke-width": 2.5 }, g);
    el("polygon", { points: `${cx - k},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx - k},${cy + s / 2}`, fill: "#0f2236", stroke: color, "stroke-width": 2.5 }, g);
    el("polygon", { points: `${cx + k},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx + k},${cy + s / 2}`, fill: "#12283f", stroke: color, "stroke-width": 2.5 }, g);
    for (let i = 0; i < 3; i++) el("circle", { cx: cx - k + s * 0.2, cy: cy - s / 2 + s * 0.31 + i * s * 0.24, r: Math.max(3, s * 0.036), fill: C.blue }, g);
    return g;
}
function cylinder(parent, cx, ty, rx, ry, h, color, n) {
    const g = el("g", {}, parent);
    el("path", { d: `M ${cx - rx} ${ty} L ${cx - rx} ${ty + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${ty + h} L ${cx + rx} ${ty}`, fill: color === C.orange ? "#2a2416" : "#10303a", stroke: color, "stroke-width": 3 }, g);
    for (let i = 1; i < n; i++) el("path", { d: `M ${cx - rx} ${ty + (h * i) / n} A ${rx} ${ry} 0 0 0 ${cx + rx} ${ty + (h * i) / n}`, fill: "none", stroke: color, "stroke-width": 1.5, opacity: 0.55 }, g);
    for (let i = 1; i < n; i++) el("circle", { cx, cy: ty + (h * i) / n + ry * 0.55, r: 4.5, fill: color }, g);
    el("ellipse", { cx, cy: ty, rx, ry, fill: "#14304a", stroke: color, "stroke-width": 3 }, g);
    return g;
}
function badge(parent, x, y, text, color, dark = "#06232a") {
    const g = el("g", { opacity: 0 }, parent);
    const w = text.length * 15 + 40;
    el("rect", { x: x - w / 2, y: y - 30, width: w, height: 44, rx: 22, fill: color }, g);
    el("text", { x, y: y + 1, fill: dark, "font-size": 24, "font-weight": 800, "text-anchor": "middle", class: "sans" }, g).textContent = text;
    return g;
}
function pill(parent, text, color, dark = "#06232a", size = 22) {
    const g = el("g", { opacity: 0 }, parent);
    const w = text.length * size * 0.62 + 30;
    el("rect", { x: -w / 2, y: -size - 8, width: w, height: size + 20, rx: (size + 20) / 2, fill: color }, g);
    const label = el("text", { x: 0, y: 0, fill: dark, "font-size": size, "font-weight": 700, "text-anchor": "middle", class: "mono" }, g);
    label.textContent = text;
    return g;
}
function place(g, x, y, o = 1) {
    g.setAttribute("transform", `translate(${x},${y})`);
    g.setAttribute("opacity", o);
}
function ride(g, path, p, o = 1, dy = -26) {
    const q = pointOn(path, p);
    place(g, q.x, q.y + dy, o);
}
function link(parent, d, color) {
    return el("path", { d, fill: "none", stroke: color, "stroke-width": 3, "stroke-dasharray": "10 12", opacity: 0 }, parent);
}
function pointOn(path, p) {
    return path.getPointAtLength(path.getTotalLength() * clamp(p));
}
const packetLayer = el("g", {}, D);
const pool = Array.from({ length: 30 }, () => el("circle", { r: 9, fill: C.cyan, filter: "url(#glow)", opacity: 0 }, packetLayer));
let poolIndex = 0;
function packet(path, p, color, r = 9, opacity = 1) {
    const c = pool[poolIndex++];
    if (!c) return;
    const q = pointOn(path, p);
    c.setAttribute("cx", q.x);
    c.setAttribute("cy", q.y);
    c.setAttribute("fill", color);
    c.setAttribute("r", r);
    c.setAttribute("opacity", opacity);
}
function trip(path, t, a, b, color, back = true) {
    if (t <= a || t >= b) return;
    const p = seg(t, a, b);
    packet(path, back ? (p < 0.5 ? ease(p * 2) : 1 - ease((p - 0.5) * 2)) : ease(p), color);
}

function card(title, bigColor) {
    const g = el("g", { opacity: 0 });
    const sx = W / 2;
    el("rect", { x: sx - (vertical ? 450 : 520), y: L.statY - 230, width: vertical ? 900 : 1040, height: 430, rx: 28, fill: "#0e1d2f", stroke: "#2c4258", "stroke-width": 2 }, g);
    el("text", { x: sx, y: L.statY - 150, fill: C.muted, "font-size": 34, "text-anchor": "middle", class: "mono", "letter-spacing": 3 }, g).textContent = title;
    const big = el("text", { x: sx, y: L.statY - 20, fill: bigColor, "font-size": 110, "font-weight": 800, "text-anchor": "middle", class: "sans", filter: "url(#glow)" }, g);
    const small = el("text", { x: sx, y: L.statY + 60, fill: C.text, "font-size": 42, "text-anchor": "middle", class: "sans" }, g);
    const source = el("text", { x: sx, y: L.statY + 150, fill: C.muted, "font-size": 24, "text-anchor": "middle", class: "mono" }, g);
    return { g, big, small, source };
}

let endGroup, endStart = 999;
function endCard(title, line, start) {
    endStart = start;
    endGroup = el("g", { opacity: 0 });
    el("rect", { width: W, height: H, fill: "#08111d", opacity: 0.92 }, endGroup);
    txt(endGroup, W / 2, H / 2 - 60, "CACHING ACADEMY", { fill: C.cyan, "font-size": 34, "letter-spacing": 4 });
    txt(endGroup, W / 2, H / 2 + 40, title, { class: "sans", "font-size": vertical ? 76 : 90, "font-weight": 800 });
    txt(endGroup, W / 2, H / 2 + 110, line, { class: "sans", fill: C.muted, "font-size": 36 });
}

let captions = [];
let capBox, capText;
function wrap(text, maxChars) {
    const lines = [""];
    for (const w of text.split(" ")) {
        if ((lines[lines.length - 1] + " " + w).trim().length > maxChars) lines.push(w);
        else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim();
    }
    return lines;
}
function drawCaption(t) {
    if (!capBox) {
        capBox = el("rect", { rx: 18, fill: "#000", opacity: 0 });
        capText = el("text", { x: W / 2, y: L.capY, fill: C.text, "font-size": L.capSize, "text-anchor": "middle", class: "sans", "font-weight": 600 });
    }
    const cap = captions.find(c => t >= c[0] && t < c[1]);
    capText.innerHTML = "";
    if (!cap || t >= endStart) {
        capBox.setAttribute("opacity", 0);
        return;
    }
    const lines = wrap(cap[2], vertical ? 30 : 64);
    lines.forEach((line, i) => {
        const ts = el("tspan", { x: W / 2, dy: i === 0 ? 0 : L.capSize * 1.3 }, capText);
        ts.textContent = line;
    });
    capBox.setAttribute("x", (W - L.capW) / 2);
    capBox.setAttribute("y", L.capY - L.capSize - 14);
    capBox.setAttribute("width", L.capW);
    capBox.setAttribute("height", lines.length * L.capSize * 1.3 + 36);
    const o = fade(t, cap[0], cap[1], 0.2);
    capBox.setAttribute("opacity", 0.55 * o);
    capText.setAttribute("opacity", o);
}

function play(scene) {
    D.appendChild(packetLayer);
    window.render = t => {
        poolIndex = 0;
        pool.forEach(p => p.setAttribute("opacity", 0));
        titleEl.textContent = titleText.slice(0, Math.floor(seg(t, 0.4, 2.0) * titleText.length));
        subtitleEl.textContent = t > 2.2 ? subtitleText : "";
        show(subtitleEl, seg(t, 2.2, 3.0));
        scene(t);
        if (endGroup) show(endGroup, seg(t, endStart, endStart + 0.8));
        drawCaption(t);
    };
    window.render(params.has("t") ? +params.get("t") : 0);
}
