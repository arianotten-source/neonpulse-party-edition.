import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const requiredIds = [
  "wheel",
  "challenge",
  "letter",
  "task",
  "timer",
  "wrong",
  "correct",
  "spin",
  "taskCategory",
  "scoreboard",
  "endGame",
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: missing #${id}`);
    process.exit(1);
  }
}
const layoutMarkers = [
  "100dvh",
  "in-game",
  "game-play-panel",
  "challenge-zone",
  "syncInGameLayout",
];
for (const m of layoutMarkers) {
  if (!html.includes(m)) {
    console.error(`FAIL: missing layout marker ${m}`);
    process.exit(1);
  }
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP: Playwright not installed — structural checks only (OK)");
  console.log("OK: layout structure checks passed");
  process.exit(0);
}

const viewports = [
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet", width: 834, height: 1194 },
  { name: "laptop", width: 1366, height: 768 },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const fileUrl = "file://" + htmlPath;

function inViewport(r, vw, vh) {
  return (
    r.width > 0 &&
    r.height > 0 &&
    r.bottom <= vh + 1 &&
    r.right <= vw + 1 &&
    r.top >= -1 &&
    r.left >= -1
  );
}

let failed = false;
for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(fileUrl);
  await page.evaluate(() => {
    document.getElementById("introSplash").classList.add("hidden");
    const task = document.getElementById("task");
    task.textContent =
      "Noem een voorbeeld met de letter M voor een compacte layouttest.";
    document.getElementById("letter").textContent = "M";
    document.getElementById("timer").textContent = "00:12";
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("challenge").classList.remove("hidden");
    document.getElementById("appRoot").classList.add("in-game");
    document.body.style.overflow = "hidden";
  });

  const result = await page.evaluate(
    ({ vw, vh }) => {
      const doc = document.documentElement;
      const ids = ["wheel", "letter", "task", "timer", "wrong", "correct", "spin"];
      const rects = Object.fromEntries(
        ids.map((id) => [id, document.getElementById(id).getBoundingClientRect()])
      );
      return {
        pageScroll: doc.scrollHeight - doc.clientHeight,
        bodyScroll: document.body.scrollHeight - document.body.clientHeight,
        rects,
        vw,
        vh,
      };
    },
    { vw: vp.width, vh: vp.height }
  );

  const scrollOk = result.pageScroll <= 1 && result.bodyScroll <= 1;
  const visOk = ["wheel", "letter", "task", "timer", "wrong", "correct", "spin"].every(
    (id) => inViewport(result.rects[id], vp.width, vp.height)
  );

  if (!scrollOk || !visOk) {
    failed = true;
    console.error(`FAIL: ${vp.name}`, { scrollOk, visOk, result });
  } else {
    console.log(`OK: ${vp.name} — no page scroll; core controls visible`);
  }
}

await browser.close();
if (failed) process.exit(1);
console.log("OK: layout playtest passed for all viewports");
