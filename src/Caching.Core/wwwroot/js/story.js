const Stories = {};

const node = (x, y, icon, label, sub = "", extra = {}) => ({ x, y, icon, label, sub, ...extra });

const StoryPlayer = (() => {
    const svgNs = "http://www.w3.org/2000/svg";
    const width = 640;
    const tones = {
        hit: "var(--hit)",
        miss: "var(--miss)",
        accent: "var(--accent)",
        danger: "var(--danger)",
        warn: "var(--warn)",
        muted: "var(--muted)"
    };
    const players = new Map();
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const list = value => value === undefined ? [] : Array.isArray(value) && Array.isArray(value[0]) ? value : [value];

    function svg(name, attributes = {}, parent = null) {
        const element = document.createElementNS(svgNs, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        if (parent) parent.appendChild(element);
        return element;
    }

    class Player {
        constructor(container, scene) {
            this.container = container;
            this.scene = scene;
            this.index = 0;
            this.playing = false;
            this.token = 0;
            this.build();
            this.reset();
        }

        build() {
            const height = this.scene.height ?? 260;
            this.container.innerHTML = `
                <div class="story-head"><span class="story-tag">${this.scene.tag ?? "Watch it"}</span><span class="story-title"></span></div>
                <div class="story-stage"></div>
                <div class="story-real" hidden></div>
                <div class="story-caption"><span class="story-step"></span><span class="story-text"></span></div>
                <div class="story-controls">
                    <button class="btn primary" data-act="play">&#9654; Play</button>
                    <button class="btn" data-act="prev">&#8249; Back</button>
                    <button class="btn" data-act="next">Next &#8250;</button>
                    <button class="btn" data-act="replay">&#8635; Replay</button>
                    <label class="check"><input type="checkbox" data-act="narrate" /> &#128266; Read aloud</label>
                    <div class="story-dots"></div>
                </div>`;
            this.container.querySelector(".story-title").textContent = this.scene.title ?? "";
            this.caption = this.container.querySelector(".story-text");
            this.stepLabel = this.container.querySelector(".story-step");
            this.playButton = this.container.querySelector("[data-act=play]");
            this.narrateBox = this.container.querySelector("[data-act=narrate]");
            this.realBanner = this.container.querySelector(".story-real");

            const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "story-svg", role: "img" }, this.container.querySelector(".story-stage"));
            const defs = svg("defs", {}, root);
            const filter = svg("filter", { id: "story-glow", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
            svg("feGaussianBlur", { stdDeviation: "4", result: "blur" }, filter);
            const merge = svg("feMerge", {}, filter);
            svg("feMergeNode", { in: "blur" }, merge);
            svg("feMergeNode", { in: "SourceGraphic" }, merge);

            const linkLayer = svg("g", {}, root);
            const nodeLayer = svg("g", {}, root);
            this.fxLayer = svg("g", {}, root);
            this.clock = svg("text", { x: 12, y: 24, class: "story-clock" }, root);

            this.nodes = {};
            Object.entries(this.scene.nodes).forEach(([id, n]) => {
                const w = n.w ?? 140;
                const h = n.h ?? 66;
                const group = svg("g", { class: "story-node", transform: `translate(${n.x - w / 2},${n.y - h / 2})` }, nodeLayer);
                const rect = svg("rect", { width: w, height: h, rx: 14, class: "story-box" }, group);
                const icon = svg("text", { x: 22, y: h / 2 + 9, "text-anchor": "middle", class: "story-icon" }, group);
                icon.textContent = n.icon;
                const label = svg("text", { x: 42, y: h / 2 - 4, class: "story-label" }, group);
                label.textContent = n.label;
                const sub = svg("text", { x: 42, y: h / 2 + 14, class: "story-sub" }, group);
                this.nodes[id] = { ...n, initial: n.sub ?? "", w, h, group, rect, sub, labelEl: label };
            });

            (this.scene.links ?? []).forEach(([a, b, options = {}]) => {
                const from = this.nodes[a];
                const to = this.nodes[b];
                svg("line", {
                    x1: from.x, y1: from.y, x2: to.x, y2: to.y,
                    class: "story-link",
                    "stroke-dasharray": options.dashed ? "6 6" : "none"
                }, linkLayer);
            });

            const dots = this.container.querySelector(".story-dots");
            dots.innerHTML = this.scene.steps.map((_, i) => `<button class="story-dot" data-step="${i}" title="Step ${i + 1}"></button>`).join("");
            dots.addEventListener("click", e => {
                if (e.target.dataset.step !== undefined) this.goTo(Number(e.target.dataset.step));
            });

            this.playButton.addEventListener("click", () => this.playing ? this.pause() : this.play());
            this.container.querySelector("[data-act=prev]").addEventListener("click", () => this.goTo(Math.max(0, this.index - 2)));
            this.container.querySelector("[data-act=next]").addEventListener("click", () => this.goTo(Math.min(this.scene.steps.length - 1, this.index)));
            this.container.querySelector("[data-act=replay]").addEventListener("click", () => {
                this.pause();
                this.reset();
                this.play();
            });
            this.narrateBox.addEventListener("change", () => {
                if (!this.narrateBox.checked && window.speechSynthesis) speechSynthesis.cancel();
            });
        }

        reset() {
            Object.values(this.nodes).forEach(n => {
                n.sub.textContent = n.initial;
                n.labelEl.textContent = n.label;
                n.group.classList.remove("dim", "hi");
                n.rect.removeAttribute("style");
            });
            this.fxLayer.innerHTML = "";
            this.realBanner.hidden = true;
            this.clock.textContent = this.scene.clock ?? "";
            this.index = 0;
            this.stepLabel.textContent = "";
            this.caption.textContent = this.scene.intro ?? "Press Play to watch, or use Next to go step by step.";
            this.updateDots();
            this.playButton.innerHTML = "&#9654; Play";
        }

        async play() {
            if (this.index >= this.scene.steps.length) this.reset();
            this.playing = true;
            const token = ++this.token;
            this.playButton.innerHTML = "&#10074;&#10074; Pause";
            while (this.playing && token === this.token && this.index < this.scene.steps.length) {
                await this.run(this.scene.steps[this.index], token);
                if (token !== this.token) return;
                this.index++;
                this.updateDots();
            }
            if (token === this.token) {
                this.playing = false;
                this.playButton.innerHTML = this.index >= this.scene.steps.length ? "&#8635; Play again" : "&#9654; Play";
            }
        }

        pause() {
            this.playing = false;
            this.token++;
            if (window.speechSynthesis) speechSynthesis.cancel();
            this.playButton.innerHTML = "&#9654; Play";
        }

        async goTo(target) {
            this.pause();
            this.reset();
            for (let i = 0; i < target; i++) {
                this.applyState(this.scene.steps[i]);
                if (this.scene.steps[i].after) this.applyState(this.scene.steps[i].after);
            }
            this.index = target;
            const token = ++this.token;
            await this.run(this.scene.steps[target], token, { holdMs: 0 });
            if (token !== this.token) return;
            this.index = target + 1;
            this.updateDots();
        }

        async trace(name) {
            const steps = this.scene.traces?.[name];
            if (!steps) return;
            this.pause();
            const token = ++this.token;
            this.fxLayer.innerHTML = "";
            for (const step of steps) {
                await this.run({ ...step, say: step.say ? `Your request: ${step.say}` : undefined }, token, { speed: 0.55, holdMs: 500, silent: true });
                if (token !== this.token) return;
            }
        }

        applyState(step) {
            list(step.undim).flat().forEach(id => this.nodes[id]?.group.classList.remove("dim"));
            list(step.dim).flat().forEach(id => this.nodes[id]?.group.classList.add("dim"));
            Object.entries(step.set ?? {}).forEach(([id, text]) => this.nodes[id].sub.textContent = text);
            Object.entries(step.rename ?? {}).forEach(([id, text]) => this.nodes[id].labelEl.textContent = text);
            if (step.clock !== undefined) this.clock.textContent = step.clock;
        }

        async run(step, token, options = {}) {
            const speed = options.speed ?? 1;
            this.fxLayer.innerHTML = "";
            Object.values(this.nodes).forEach(n => {
                n.group.classList.remove("hi");
                n.rect.removeAttribute("style");
            });

            if (step.say) {
                this.caption.textContent = step.say;
                this.stepLabel.textContent = options.silent ? "" : `Step ${this.index + 1} of ${this.scene.steps.length}`;
            }
            const speech = !options.silent && step.say ? this.speak(step.say) : Promise.resolve();

            this.applyState(step);
            this.showReal(step.real);
            list(step.hi).flat().forEach(id => this.nodes[id]?.group.classList.add("hi"));

            for (const move of list(step.before)) {
                await this.move(move, speed);
                if (token !== this.token) return;
            }
            await Promise.all(list(step.move).map(move => this.move(move, speed)));
            if (token !== this.token) return;
            for (const move of list(step.then)) {
                await this.move(move, speed);
                if (token !== this.token) return;
            }
            if (step.after) this.applyState(step.after);
            list(step.flash).forEach(flash => this.flash(...flash));

            const hold = options.holdMs ?? step.wait ?? Math.max(1500, 900 + (step.say?.length ?? 0) * 38);
            await Promise.all([sleep(hold), speech]);
        }

        showReal(real) {
            if (!real) {
                this.realBanner.hidden = true;
                return;
            }
            this.realBanner.style.setProperty("--rw", real.color);
            this.realBanner.innerHTML = `<span class="rw-logo">${real.icon}</span><div><b>Real world: ${real.who}</b><small>Source: ${real.source}</small></div>`;
            this.realBanner.hidden = false;
        }

        speak(text) {
            if (!this.narrateBox.checked || !window.speechSynthesis) return Promise.resolve();
            return new Promise(resolve => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.02;
                utterance.onend = resolve;
                utterance.onerror = resolve;
                speechSynthesis.cancel();
                speechSynthesis.speak(utterance);
                setTimeout(resolve, 15000);
            });
        }

        move([fromId, toId, label = "", tone = "accent", factor = 1], speed) {
            const from = this.nodes[fromId];
            const to = this.nodes[toId];
            const color = tones[tone] ?? tone;
            const packet = svg("g", { class: "story-packet" }, this.fxLayer);
            svg("circle", { r: 9, fill: color }, packet);
            const text = svg("text", { y: -15, "text-anchor": "middle", class: "story-packet-label", fill: color }, packet);
            text.textContent = label;
            const duration = 950 * speed * factor;
            const start = performance.now();
            return new Promise(resolve => {
                const frame = now => {
                    const t = Math.min(1, (now - start) / duration);
                    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    const x = from.x + (to.x - from.x) * eased;
                    const y = from.y + (to.y - from.y) * eased;
                    packet.setAttribute("transform", `translate(${x},${y})`);
                    if (t < 1) requestAnimationFrame(frame);
                    else {
                        packet.remove();
                        resolve();
                    }
                };
                requestAnimationFrame(frame);
            });
        }

        flash(id, text, tone = "accent") {
            const n = this.nodes[id];
            const color = tones[tone] ?? tone;
            const widthPx = Math.max(44, text.length * 8 + 20);
            const above = n.y - n.h / 2 - 6;
            const y = above < 26 ? n.y + n.h / 2 + 28 : above;
            const group = svg("g", { class: "story-flash", transform: `translate(${n.x},${y})` }, this.fxLayer);
            svg("rect", { x: -widthPx / 2, y: -22, width: widthPx, height: 22, rx: 11, fill: color }, group);
            const label = svg("text", { y: -7, "text-anchor": "middle", class: "story-flash-text" }, group);
            label.textContent = text;
            n.rect.style.stroke = color;
            n.rect.style.strokeWidth = "3";
        }

        updateDots() {
            this.container.querySelectorAll(".story-dot").forEach((dot, i) => {
                dot.classList.toggle("done", i < this.index);
                dot.classList.toggle("current", i === this.index);
            });
        }
    }

    function mountAll() {
        document.querySelectorAll("[data-story]").forEach(container => {
            const scene = Stories[container.dataset.story];
            if (!scene) return;
            const player = new Player(container, scene);
            players.set(container.dataset.story, player);
            if (!("IntersectionObserver" in window)) return;
            const observer = new IntersectionObserver(entries => {
                if (entries.some(e => e.isIntersecting)) {
                    observer.disconnect();
                    if (player.index === 0 && !player.playing) player.play();
                }
            }, { threshold: 0.5 });
            observer.observe(container);
        });
    }

    function animateFlows() {
        document.querySelectorAll(".flow").forEach(flow => {
            const steps = [...flow.querySelectorAll(".flow-step")];
            if (steps.length < 2) return;
            flow.classList.add("flow-anim");
            let index = -1;
            let visible = false;
            const tick = () => {
                if (!visible) return;
                steps.forEach(s => s.classList.remove("active"));
                flow.querySelectorAll(".flow-arrow").forEach(a => a.classList.remove("active"));
                index = (index + 1) % (steps.length + 1);
                if (index < steps.length) {
                    steps.slice(0, index).forEach(s => s.classList.add("seen"));
                    steps[index].classList.add("active");
                    const arrow = steps[index].nextElementSibling;
                    if (arrow?.classList.contains("flow-arrow")) arrow.classList.add("active");
                } else {
                    steps.forEach(s => s.classList.remove("seen"));
                }
            };
            setInterval(tick, 1300);
            if ("IntersectionObserver" in window) {
                new IntersectionObserver(entries => visible = entries.some(e => e.isIntersecting), { threshold: 0.4 }).observe(flow);
            } else {
                visible = true;
            }
        });
    }

    return {
        mountAll: () => {
            mountAll();
            animateFlows();
        },
        trace: (key, name) => players.get(key)?.trace(name)
    };
})();
