/**
 * Loaded only from the Capacitor www copy. The website index.html does not reference this file.
 */
import {
  GOOGLE_TEST_INTERSTITIAL_ID,
  allowBetweenGamesAd,
  createBetweenGamesGate,
  prepareUmpConsent,
} from "./admob-policy.mjs";

function isAndroidApp() {
  const cap = window.Capacitor;
  return !!(
    cap &&
    typeof cap.isNativePlatform === "function" &&
    cap.isNativePlatform() &&
    typeof cap.getPlatform === "function" &&
    cap.getPlatform() === "android"
  );
}

function screenFlags() {
  const open = (id) => {
    const el = document.getElementById(id);
    return !!(el && !el.classList.contains("hidden"));
  };
  return {
    results: open("results"),
    splash: open("winnerSplash"),
    question: open("questionScreen"),
    winners: open("winnerSelectScreen"),
    timeout: open("noWinnerScreen"),
    wheel: open("game"),
  };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("ad-timeout")), ms);
    }),
  ]);
}

if (isAndroidApp()) {
  const AdMob = window.Capacitor.registerPlugin("AdMob");
  const gate = createBetweenGamesGate();
  let initialized = false;
  let prepared = false;

  async function prepareTestInterstitial() {
    await prepareUmpConsent(AdMob);
    if (!initialized) {
      await AdMob.initialize({ initializeForTesting: true });
      initialized = true;
    }
    await AdMob.prepareInterstitial({
      adId: GOOGLE_TEST_INTERSTITIAL_ID,
      isTesting: true,
      npa: true,
    });
    prepared = true;
  }

  async function showTestInterstitial() {
    if (!prepared) await prepareTestInterstitial();
    let resolveClosed = () => {};
    const closed = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const dismissed = await AdMob.addListener("interstitialAdDismissed", () => resolveClosed());
    const failed = await AdMob.addListener("interstitialAdFailedToShow", () => resolveClosed());
    try {
      await AdMob.showInterstitial();
      await withTimeout(closed, 90000);
    } finally {
      prepared = false;
      try {
        await dismissed.remove();
      } catch (error) {}
      try {
        await failed.remove();
      } catch (error) {}
    }
  }

  function watchEndScreen() {
    const armIfEnded = () => {
      if (allowBetweenGamesAd(screenFlags())) gate.arm();
    };
    const observer = new MutationObserver(armIfEnded);
    for (const id of ["results", "winnerSplash", "game", "questionScreen", "winnerSelectScreen", "noWinnerScreen"]) {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
    armIfEnded();
  }

  function bindLeave(id) {
    const el = document.getElementById(id);
    if (!el || el.dataset.nppAdsBound === "1") return;
    el.dataset.nppAdsBound = "1";
    const original = el.onclick;
    el.onclick = () => {
      gate.leave({
        allowAd: allowBetweenGamesAd(screenFlags()),
        showAd: () => withTimeout(showTestInterstitial(), 90000),
        continueFlow: () => {
          if (typeof original === "function") original.call(el);
        },
      });
    };
  }

  watchEndScreen();
  bindLeave("playAgain");
  bindLeave("editPlayers");
}
