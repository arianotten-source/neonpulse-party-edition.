/**
 * Kopieert web-entrybestanden naar www/ voor Capacitor (webDir).
 * Bron blijft in projectroot; productiewebsite gebruikt de root-bestanden.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

const files = ["index.html", "question-bank.js", "assets/branding/pim-pam-pet-logo.png"];
const androidOnly = [
  ["scripts/admob-policy.mjs", "admob-policy.mjs"],
  ["scripts/android-ads.js", "android-ads.js"],
];

export function syncWww(root = defaultRoot) {
  const www = path.join(root, "www");
  fs.mkdirSync(www, { recursive: true });

  for (const name of files) {
    const src = path.join(root, name);
    const dest = path.join(www, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(src)) {
      throw new Error(`bron ontbreekt: ${name}`);
    }
    fs.copyFileSync(src, dest);
    console.log(`OK: ${name} -> www/${name}`);
  }

  let html = fs.readFileSync(path.join(www, "index.html"), "utf8");
  const tag = '<script type="module" src="android-ads.js"></script>';
  if (!html.includes("</body>")) throw new Error("body ontbreekt in index.html");
  if (!html.includes(tag)) {
    html = html.replace("</body>", `${tag}\n</body>`);
    fs.writeFileSync(path.join(www, "index.html"), html);
  }

  for (const [from, to] of androidOnly) {
    const src = path.join(root, from);
    const dest = path.join(www, to);
    if (!fs.existsSync(src)) throw new Error(`bron ontbreekt: ${from}`);
    fs.copyFileSync(src, dest);
    console.log(`OK: ${from} -> www/${to}`);
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  try {
    syncWww();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
