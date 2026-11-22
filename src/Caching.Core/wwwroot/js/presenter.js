(async () => {
    const panels = document.querySelectorAll(".presenter[data-video]");
    if (panels.length === 0) return;
    let videos = {};
    try {
        const response = await fetch("/videos/videos.json", { cache: "no-cache" });
        if (response.ok) videos = await response.json();
    } catch {
        return;
    }
    panels.forEach(panel => {
        const url = videos[panel.dataset.video];
        if (!url) return;
        const audio = /\.mp3$/i.test(url);
        const tag = audio ? "Listen to the instructor" : "Watch the instructor";
        const player = audio
            ? `<audio controls preload="metadata" src="${escapeHtml(url)}"></audio>`
            : `<video controls preload="metadata" playsinline src="${escapeHtml(url)}"></video>`;
        panel.innerHTML = `
            <div class="story-head"><span class="story-tag presenter-tag">${tag}</span><span class="story-title">Lesson ${escapeHtml(panel.dataset.video)} explained</span></div>
            ${player}`;
        panel.hidden = false;
    });
})();
