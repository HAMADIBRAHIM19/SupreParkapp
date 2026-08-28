import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/appNotifications";

const DISMISS_KEY = "notif-prompt-dismissed";

const NotificationPermissionPrompt = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      const perm = await getNotificationPermission();
      if (perm === "default") setVisible(true);
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    const perm = await requestNotificationPermission();
    setBusy(false);
    if (perm === "granted") {
      toast.success(t("notificationsEnabled"));
      setVisible(false);
    } else if (perm === "denied") {
      toast.error(t("notificationsDenied"));
      localStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t("enableNotifications")}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t("notificationsPromptDesc")}</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={enable} disabled={busy}>{t("allowNotifications")}</Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>{t("notNow")}</Button>
        </div>
      </div>
      <button onClick={dismiss} aria-label={t("notNow")} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotificationPermissionPrompt;
