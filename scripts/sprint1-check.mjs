import fs from "fs";

const html = fs.readFileSync("index.html", "utf8");
const baseline = fs.readFileSync("backups/stable-version-7-baseline/index.html", "utf8");

function extractTaskCategories(src) {
  const m = src.match(/const taskCategories=(\{[\s\S]*?\});/);
  if (!m) throw new Error("taskCategories not found");
  return m[1];
}

const baseTc = extractTaskCategories(baseline);
const curTc = extractTaskCategories(html);
if (baseTc !== curTc) {
  console.error("FAIL: taskCategories changed from baseline");
  process.exit(1);
}

const taskCategories = eval("(" + baseTc + ")");
const cats = Object.keys(taskCategories).length;
const prompts = Object.values(taskCategories).reduce((a, v) => a + v.length, 0);
if (cats !== 22 || prompts !== 132) {
  console.error(`FAIL: expected 22/132 got ${cats}/${prompts}`);
  process.exit(1);
}

if (!html.includes("const WHEEL_SPIN_MS=5200")) {
  console.error("FAIL: WHEEL_SPIN_MS missing or wrong");
  process.exit(1);
}
if (!html.includes("transition:transform 5.2s")) {
  console.error("FAIL: CSS wheel transition not 5.2s");
  process.exit(1);
}
if (!html.includes("function clearGameTimers")) {
  console.error("FAIL: clearGameTimers missing");
  process.exit(1);
}
if (!html.includes("function restoreNavReturn")) {
  console.error("FAIL: restoreNavReturn missing");
  process.exit(1);
}
if (html.includes(",5350)")) {
  console.error("FAIL: old 5350ms spin timeout still present");
  process.exit(1);
}

const backupHash =
  "ed88828a68722cbdbab67f344bb44327ed8684d007e049079a1a3a9f743e5e6b";
const { createHash } = await import("crypto");
const got = createHash("sha256").update(baseline).digest("hex");
if (got !== backupHash) {
  console.error("FAIL: baseline backup file hash changed");
  process.exit(1);
}

console.log("OK: sprint1-check passed");
console.log(`  categories=${cats} prompts=${prompts}`);
console.log(`  baseline backup sha256=${got} (unchanged)`);
console.log(`  taskCategories byte-identical to baseline backup`);
