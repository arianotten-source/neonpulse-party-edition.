import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const bankCode = fs.readFileSync(path.join(root, "question-bank.js"), "utf8");
const ctx = { QUESTION_BANK: [], CATEGORY_CATALOG: [] };
vm.runInContext(bankCode, vm.createContext(ctx));

const cats = ctx.CATEGORY_CATALOG.length;
const prompts = ctx.QUESTION_BANK.length;
if (cats !== 22) {
  console.error(`FAIL: expected 22 categories got ${cats}`);
  process.exit(1);
}
if (prompts < 3300) {
  console.error(`FAIL: expected >=3300 questions got ${prompts}`);
  process.exit(1);
}

const baseline = fs.readFileSync(
  path.join(root, "backups/stable-version-7-baseline/index.html"),
  "utf8"
);
if (baseline.includes("QUESTION_BANK")) {
  console.log("NOTE: v7 baseline predates external question bank (expected)");
}

console.log("OK: sprint1-check passed");
console.log(`  categories=${cats} questions=${prompts}`);
