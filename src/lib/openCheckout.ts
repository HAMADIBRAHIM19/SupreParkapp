import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Opens a Stripe checkout URL. On native (iOS/Android) uses the in-app browser
 * via @capacitor/browser, which works inside the Capacitor WebView. On web,
 * navigates the current tab to avoid popup blockers.
 */
export async function openCheckout(url: string) {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    }
  } catch (e) {
    console.error("Browser.open failed, falling back", e);
  }
  // Web fallback: navigate same tab (more reliable than window.open which can be blocked)
  window.location.href = url;
}
