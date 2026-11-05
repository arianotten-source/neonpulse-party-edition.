/**
 * Loaded only from the Capacitor www copy, after the game script.
 * The website index.html does not reference this file.
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

function errorText(error) {
  if (!error) return "";
  const code = error.code != null ? String(error.code) : "";
  const message = error.message || String(error);
  return `${code} ${message}`.trim();
}

function logAd(event, detail) {
  console.log(detail ? `${event} ${detail}` : event);
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
  let preparePromise = null;
  let loadedAdId = null;
  let preloadStarted = false;

  async function prepareTestInterstitial() {
    if (preparePromise) return preparePromise;
    preparePromise = (async () => {
      try {
        logAd("INTERSTITIAL_PREPARING");
        await prepareUmpConsent(AdMob);
        if (!initialized) {
          await AdMob.initialize({ initializeForTesting: true });
          initialized = true;
          logAd("ADMOB_INITIALIZED");
        }
        const info = await AdMob.prepareInterstitial({
          adId: GOOGLE_TEST_INTERSTITIAL_ID,
          isTesting: true,
          npa: true,
        });
        loadedAdId = (info && (info.adUnitId || info.adId)) || GOOGLE_TEST_INTERSTITIAL_ID;
        logAd("INTERSTITIAL_LOADED");
        return true;
      } catch (error) {
        loadedAdId = null;
        logAd("INTERSTITIAL_LOAD_FAILED", errorText(error));
        return false;
      } finally {
        preparePromise = null;
      }
    })();
    return preparePromise;
  }

  async function showTestInterstitial() {
    const ready = loadedAdId || (await prepareTestInterstitial());
    if (!ready || !loadedAdId) {
      logAd("INTERSTITIAL_SHOW_FAILED", "not loaded");
      return;
    }
    const adId = loadedAdId;
    logAd("INTERSTITIAL_SHOW_REQUESTED");
    let resolveClosed = () => {};
    const closed = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const onDismiss = () => {
      logAd("INTERSTITIAL_DISMISSED");
      resolveClosed();
    };
    const onFail = (error) => {
      logAd("INTERSTITIAL_SHOW_FAILED", errorText(error));
      resolveClosed();
    };
    const dismissed = await AdMob.addListener("interstitialAdDismissed", onDismiss);
    const failed = await AdMob.addListener("interstitialAdFailedToShow", onFail);
    try {
      await AdMob.showInterstitial({ adId });
      await withTimeout(closed, 90000);
    } catch (error) {
      logAd("INTERSTITIAL_SHOW_FAILED", errorText(error));
    } finally {
      loadedAdId = null;
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
      if (!allowBetweenGamesAd(screenFlags())) {
        preloadStarted = false;
        return;
      }
      gate.arm();
      if (!preloadStarted) {
        preloadStarted = true;
        prepareTestInterstitial();
      }
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
    el.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        gate.leave({
          allowAd: allowBetweenGamesAd(screenFlags()),
          showAd: () => withTimeout(showTestInterstitial(), 90000),
          continueFlow: () => {
            if (typeof el.onclick === "function") el.onclick();
          },
        });
      },
      true
    );
  }

  watchEndScreen();
  bindLeave("playAgain");
  bindLeave("editPlayers");
}
