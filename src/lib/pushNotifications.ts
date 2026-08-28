import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Native push notifications (APNs on iOS, FCM on Android).
 * These are delivered by the OS, so they arrive even when the app is
 * fully closed (not running in the background).
 */

const isNative = () => Capacitor.isNativePlatform();

let initialized = false;

const saveToken = async (token: string) => {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

  await supabase
    .from("push_tokens")
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: "token" },
    );
};

/** Asks the OS for push permission (native only). */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isNative()) return false;
  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    return perm.receive === "granted";
  } catch {
    return false;
  }
};

/**
 * Registers the device with APNs/FCM and stores the token so the backend
 * can push alerts to this device.
 */
export const initPushNotifications = async (navigate?: (path: string) => void) => {
  if (!isNative() || initialized) return;
  initialized = true;

  try {
    const granted = await requestPushPermission();
    if (!granted) {
      initialized = false;
      return;
    }

    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener("registration", (token) => {
      void saveToken(token.value);
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration failed:", err);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification.data?.url as string) || "/dashboard";
      if (navigate) navigate(url);
      else window.location.assign(url);
    });

    await PushNotifications.register();
  } catch (e) {
    initialized = false;
    console.error("Push init error:", e);
  }
};

/** Removes this device's token (e.g. on sign out). */
export const unregisterPushToken = async () => {
  if (!isNative()) return;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await supabase.from("push_tokens").delete().eq("user_id", userId);
  } catch {
    // ignore
  }
};
