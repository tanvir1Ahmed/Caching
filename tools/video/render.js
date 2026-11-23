const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const [lesson = "1.1", shape = "vertical", output] = process.argv.slice(2);
const root = path.resolve(__dirname, "../..");
const audio = path.join(root, "src/Caching.Core/wwwroot/audio", `${lesson}.mp3`);
const out = path.resolve(output ?? path.join(root, "media", `${lesson}-${shape}.mp4`));
const vertical = shape === "vertical";
const fps = 30;

(async () => {
    const seconds = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio]).toString()) + 1.5;
    const frames = Math.ceil(seconds * fps);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: vertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
    await page.goto(`file://${path.join(__dirname, `lesson-${lesson}.html`)}?shape=${shape}`);
    await page.waitForTimeout(300);
    for (let i = 0; i < frames; i++) {
        await page.evaluate(t => window.render(t), i / fps);
        await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
    }
    await browser.close();
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "f%05d.jpg"), "-i", audio,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`${out} (${frames} frames)`);
})();
