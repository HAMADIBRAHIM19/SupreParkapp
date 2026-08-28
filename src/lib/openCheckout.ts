import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface OpenCheckoutOptions {
  /** Called when the native in-app browser is dismissed (native only). */
  onClosed?: () => void;
}

/**
 * Opens a Stripe checkout URL. On native (iOS/Android) uses the in-app browser
 * via @capacitor/browser, which works inside the Capacitor WebView. On web,
 * navigates the current tab to avoid popup blockers.
 */
export async function openCheckout(url: string, options: OpenCheckoutOptions = {}) {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      const handle = await Browser.addListener("browserFinished", () => {
        handle.remove();
        options.onClosed?.();
      });
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    }
  } catch (e) {
    console.error("Browser.open failed, falling back", e);
  }
  // Web fallback: navigate same tab (more reliable than window.open which can be blocked)
  window.location.href = url;
}
