import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { showAppNotificationOnce, isNativeApp } from "@/lib/appNotifications";
import { initPushNotifications } from "@/lib/pushNotifications";
import { playNotificationSound } from "@/lib/notificationSound";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/**
 * Delivers real alerts app-wide (any page) once the user granted permission:
 * - booking status / support / withdrawal / new-request notifications (notifications table)
 * - new chat messages on the user's bookings (messages table)
 */
const GlobalNotificationListener = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Register the device with APNs (iOS) / FCM (Android) so alerts arrive
  // even when the app is completely closed.
  useEffect(() => {
    if (!user) return;
    void initPushNotifications((path) => navigate(path));
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`app-alerts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as { id: string; title: string; message: string };
          playNotificationSound();
          toast(n.title, { description: n.message });
          showAppNotificationOnce(`notif-${n.id}`, n.title, n.message, "/dashboard");
        },
      )
      // Chat messages now create a notifications row via a database trigger,
      // so they arrive through the stream above (and as a real push alert).

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, t]);

  return null;
};

export default GlobalNotificationListener;
