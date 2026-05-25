import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  booking_id: string | null;
  created_at: string;
}

const NotificationsBell = () => {
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("now");
    if (minutes < 60) return `${t("ago")} ${minutes} ${t("minutesAgo")}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${t("ago")} ${hours} ${t("hoursAgo")}`;
    const days = Math.floor(hours / 24);
    return `${t("ago")} ${days} ${t("daysAgo")}`;
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`notifications-${user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
      setNotifications((prev) => [payload.new as Notification, ...prev]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" dir={dir}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-bold text-sm">{t("notifications")}</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">{t("markAllRead")}</button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("noNotifications")}</div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div key={n.id} className={cn("px-4 py-3 border-b last:border-b-0 transition-colors", !n.is_read && "bg-primary/5")}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTimeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
