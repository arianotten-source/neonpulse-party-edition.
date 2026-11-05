/**
 * Android-only AdMob policy. Live ads stay off.
 * Requests use Google's official sample interstitial id.
 */

export const LIVE_ADS_ENABLED = false;

/** Google sample app id. Not a production AdMob app id. */
export const GOOGLE_TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";

/** Google sample interstitial. Plugin isTesting also selects this unit. */
export const GOOGLE_TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

/**
 * Placeholder for a later Google UMP consent step.
 * While live ads are off this returns without calling the SDK.
 */
export async function prepareUmpConsent(admob) {
  if (!LIVE_ADS_ENABLED) {
    return { active: false, canRequestAds: true, reason: "test-ads-only" };
  }
  const info = await admob.requestConsentInfo();
  if (info && info.isConsentFormAvailable && info.status === "REQUIRED") {
    return admob.showConsentForm();
  }
  return info;
}

export function roundScreensOpen(flags) {
  return !!(flags.question || flags.winners || flags.timeout || flags.wheel);
}

export function endScreenOpen(flags) {
  return !!(flags.results || flags.splash);
}

export function allowBetweenGamesAd(flags) {
  return endScreenOpen(flags) && !roundScreensOpen(flags);
}

export function createBetweenGamesGate() {
  let inFlight = false;
  let armed = false;
  return {
    arm() {
      armed = true;
    },
    async leave({ allowAd = true, showAd, continueFlow }) {
      if (inFlight) return "ignored";
      inFlight = true;
      const shouldShow = armed && allowAd;
      armed = false;
      try {
        if (shouldShow && showAd) {
          try {
            await showAd();
          } catch (error) {
            /* A missing ad must not block the next screen. */
          }
        }
        if (continueFlow) await continueFlow();
        return shouldShow ? "shown" : "continued";
      } finally {
        inFlight = false;
      }
    },
  };
}
