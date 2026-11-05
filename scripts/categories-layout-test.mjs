/**
 * Compact categories step: one-screen layout with header + footer visible.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const mustHave = [
  "categories-step",
  "syncCategoriesStepLayout",
  "categories-start-btn",
  "app.categories-step footer",
];
for (const m of mustHave) {
  if (!html.includes(m)) throw new Error("missing layout marker: " + m);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP: Playwright not installed — structural checks only (OK)");
  console.log("OK: categories-layout-test passed (structure)");
  process.exit(0);
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  console.log("SKIP: Playwright browser not available — structural checks only (OK)");
  console.log("OK: categories-layout-test passed (structure)");
  process.exit(0);
}

const viewports = [
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
];

const page = await browser.newPage();
const fileUrl = "file://" + htmlPath;
let failed = false;

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(fileUrl);
  const result = await page.evaluate(() => {
    document.getElementById("introSplash").classList.add("hidden");
    const grid = document.getElementById("categoryGrid");
    grid.innerHTML = CATEGORY_CATALOG.map(
      (c, i) =>
        `<label class="category-option"><input type="checkbox" name="category" value="${c.id}" ${i < 10 ? "checked" : ""}>${c.label}</label>`
    ).join("");
    document.getElementById("setupStep2").classList.remove("hidden");
    document.getElementById("appRoot").classList.add("categories-step");
    document.body.style.overflow = "hidden";
    const doc = document.documentElement;
    const footer = document.querySelector("footer");
    const startBtn = document.getElementById("startGame");
    const footerRect = footer.getBoundingClientRect();
    const startRect = startBtn.getBoundingClientRect();
    return {
      pageScroll: doc.scrollHeight - doc.clientHeight,
      bodyScroll: document.body.scrollHeight - document.body.clientHeight,
      hScroll: doc.scrollWidth - doc.clientWidth,
      footerBottom: footerRect.bottom,
      startVisible: startRect.top >= 0 && startRect.bottom <= window.innerHeight,
      footerVisible: footerRect.top >= 0 && footerRect.bottom <= window.innerHeight + 1,
      vh: window.innerHeight,
    };
  });

  const pageScrollOk = result.pageScroll <= 2 && result.bodyScroll <= 2;
  const hScrollOk = result.hScroll <= 1;
  const chromeOk = result.startVisible && result.footerVisible;

  if (!pageScrollOk || !hScrollOk || !chromeOk) {
    failed = true;
    console.error(`FAIL: ${vp.name}`, result);
  } else {
    console.log(`OK: ${vp.name} — no page/h scroll; start + footer in viewport`);
  }
}

await browser.close();
if (failed) process.exit(1);
console.log("OK: categories-layout-test passed");
