/**
 * Test interstitial only after a finished game, and never in the website files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  GOOGLE_TEST_APP_ID,
  GOOGLE_TEST_INTERSTITIAL_ID,
  LIVE_ADS_ENABLED,
  allowBetweenGamesAd,
  createBetweenGamesGate,
  prepareUmpConsent,
} from "./admob-policy.mjs";
import { syncWww } from "./sync-www.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

if (LIVE_ADS_ENABLED) throw new Error("live ads must stay off");
if (!GOOGLE_TEST_APP_ID.startsWith("ca-app-pub-3940256099942544~")) throw new Error("test app id");
if (GOOGLE_TEST_INTERSTITIAL_ID !== "ca-app-pub-3940256099942544/1033173712") {
  throw new Error("test interstitial id");
}

const consent = await prepareUmpConsent({
  requestConsentInfo() {
    throw new Error("UMP must not run while live ads are off");
  },
});
if (consent.active !== false || consent.reason !== "test-ads-only") throw new Error("consent stub");

const end = { results: true, splash: false, question: false, winners: false, timeout: false, wheel: false };
const round = { results: false, splash: false, question: true, winners: false, timeout: false, wheel: false };
if (!allowBetweenGamesAd(end)) throw new Error("end screen should allow one ad");
if (allowBetweenGamesAd(round)) throw new Error("question screen must not allow an ad");
if (allowBetweenGamesAd({ ...end, wheel: true })) throw new Error("wheel must block the ad");

const gate = createBetweenGamesGate();
let shows = 0;
await gate.leave({
  allowAd: true,
  showAd: async () => {
    shows += 1;
  },
  continueFlow: async () => {},
});
if (shows !== 0) throw new Error("ad before the game finished");

gate.arm();
let continued = false;
const first = gate.leave({
  allowAd: true,
  showAd: () =>
    new Promise((resolve) => {
      shows += 1;
      setTimeout(resolve, 30);
    }),
  continueFlow: async () => {
    continued = true;
  },
});
const second = await gate.leave({
  allowAd: true,
  showAd: async () => {
    shows += 1;
  },
  continueFlow: async () => {
    continued = true;
  },
});
if (second !== "ignored") throw new Error("double click was not ignored");
await first;
if (shows !== 1 || !continued) throw new Error("one ad then continue");

gate.arm();
continued = false;
const failed = await gate.leave({
  allowAd: true,
  showAd: async () => {
    throw new Error("no fill");
  },
  continueFlow: async () => {
    continued = true;
  },
});
if (failed !== "shown" || !continued) throw new Error("missing ad should still continue");

gate.arm();
shows = 0;
await gate.leave({
  allowAd: false,
  showAd: async () => {
    shows += 1;
  },
  continueFlow: async () => {},
});
if (shows !== 0) throw new Error("active round showed an ad");

const indexBefore = read("index.html");
const bankBefore = read("question-bank.js");
syncWww(root);
if (read("index.html") !== indexBefore) throw new Error("website index.html changed");
if (read("question-bank.js") !== bankBefore) throw new Error("question bank changed");

const wwwHtml = read("www/index.html");
if (!wwwHtml.includes('<script type="module" src="android-ads.js"></script>')) {
  throw new Error("android copy missing ads module");
}
if (indexBefore.includes("android-ads.js") || indexBefore.includes("ca-app-pub-")) {
  throw new Error("website contains ad code");
}

const ads = read("scripts/android-ads.js");
const policy = read("scripts/admob-policy.mjs");
const manifest = read("android/app/src/main/AndroidManifest.xml");
const strings = read("android/app/src/main/res/values/strings.xml");
for (const text of [ads, policy, manifest, strings, indexBefore, bankBefore]) {
  if (text.includes("4705136036733502")) throw new Error("live ad id present");
}
if (!ads.includes("playAgain") || !ads.includes("editPlayers")) throw new Error("leave buttons");
if (!ads.includes("isTesting: true") || !ads.includes("npa: true")) throw new Error("test request flags");
if (!ads.includes("GOOGLE_TEST_INTERSTITIAL_ID") || !policy.includes(GOOGLE_TEST_INTERSTITIAL_ID)) {
  throw new Error("android script test unit");
}
if (!strings.includes(GOOGLE_TEST_APP_ID)) throw new Error("manifest app id string");
for (const id of ["answerKnown", "confirmWinners", "spin"]) {
  if (ads.includes(`bindLeave("${id}")`)) throw new Error("ad bound to " + id);
}

console.log("OK: admob-between-games-test passed");
