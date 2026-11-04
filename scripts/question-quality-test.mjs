/**
 * Samples random questions per category and validates content quality.
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { FORBIDDEN_QUESTION_FRAGMENTS } from "./generate-question-bank.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SAMPLES_PER_CATEGORY = 50;

function loadBank() {
  const code = fs.readFileSync(path.join(root, "question-bank.js"), "utf8");
  const ctx = { QUESTION_BANK: [], CATEGORY_CATALOG: [] };
  vm.runInContext(code, vm.createContext(ctx));
  return ctx;
}

function assertQuestionQuality(q, label) {
  const text = q.question.trim();
  if (!text) throw new Error(`${label}: empty question`);
  if (!text.endsWith(".")) throw new Error(`${label}: missing period: ${text}`);
  const lower = text.toLowerCase();
  const glued = lower.match(/met de letter \{l\}\s+(?!begint\.?$)([^.]+)/);
  if (glued && glued[1].trim()) throw new Error(`${label}: glued suffix in ${text}`);
  for (const bad of FORBIDDEN_QUESTION_FRAGMENTS) {
    if (glued && glued[1].includes(bad)) throw new Error(`${label}: forbidden "${bad}" in ${text}`);
  }
  if (q.categoryId !== "gek") {
    if (!text.includes("{L}")) throw new Error(`${label}: letter category missing {L}: ${text}`);
    if (q.usesLetter === false) throw new Error(`${label}: usesLetter false but has {L}`);
  }
  if (q.categoryId === "gek" && q.usesLetter === false && text.includes("{L}")) {
    throw new Error(`${label}: gek no-letter question contains {L}`);
  }
  // No glued second imperative (legacy double-template bug)
  if (/\.\s*noem/i.test(text)) throw new Error(`${label}: double sentence glue: ${text}`);
}

const { QUESTION_BANK, CATEGORY_CATALOG } = loadBank();
const byCat = {};
for (const q of QUESTION_BANK) {
  (byCat[q.categoryId] ||= []).push(q);
}

for (const cat of CATEGORY_CATALOG) {
  const pool = byCat[cat.id] || [];
  if (pool.length < SAMPLES_PER_CATEGORY) {
    throw new Error(`Category ${cat.id} has only ${pool.length} questions`);
  }
  for (let i = 0; i < SAMPLES_PER_CATEGORY; i++) {
    const q = pool[Math.floor(Math.random() * pool.length)];
    assertQuestionQuality(q, `${cat.id} sample ${i + 1}`);
  }
  console.log(`OK: ${cat.label} — ${SAMPLES_PER_CATEGORY} random samples passed`);
}

console.log("OK: question-quality-test passed");
