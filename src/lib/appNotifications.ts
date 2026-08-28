import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type NotifPermission = "granted" | "denied" | "default" | "unsupported";

const isNative = () => Capacitor.isNativePlatform();

export const getNotificationPermission = async (): Promise<NotifPermission> => {
  try {
    if (isNative()) {
      const res = await LocalNotifications.checkPermissions();
      if (res.display === "granted") return "granted";
      if (res.display === "denied") return "denied";
      return "default";
    }
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as NotifPermission;
  } catch {
    return "unsupported";
  }
};

export const requestNotificationPermission = async (): Promise<NotifPermission> => {
  try {
    if (isNative()) {
      const res = await LocalNotifications.requestPermissions();
      return res.display === "granted" ? "granted" : res.display === "denied" ? "denied" : "default";
    }
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    const perm = await Notification.requestPermission();
    return perm as NotifPermission;
  } catch {
    return "unsupported";
  }
};

let nativeId = 1;

export const showAppNotification = async (title: string, body: string) => {
  try {
    if ((await getNotificationPermission()) !== "granted") return;
    if (isNative()) {
      await LocalNotifications.schedule({
        notifications: [{ id: nativeId++, title, body, smallIcon: "ic_launcher" }],
      });
      return;
    }
    new Notification(title, { body, icon: "/pwa-icon-192.png", badge: "/pwa-icon-192.png" });
  } catch {
    // ignore
  }
};
