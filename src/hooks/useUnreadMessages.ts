import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNotificationSound } from "@/lib/notificationSound";

export const useUnreadMessages = (bookingIds: string[]) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchUnreadCounts = async () => {
    if (!user || bookingIds.length === 0) return;

    // Get read statuses for all bookings
    const { data: readStatuses } = await supabase
      .from("chat_read_status")
      .select("booking_id, last_read_at")
      .eq("user_id", user.id)
      .in("booking_id", bookingIds);

    const readMap: Record<string, string> = {};
    readStatuses?.forEach((rs: any) => {
      readMap[rs.booking_id] = rs.last_read_at;
    });

    // For each booking, count messages from other users after last_read_at
    const counts: Record<string, number> = {};
    
    for (const bookingId of bookingIds) {
      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId)
        .neq("sender_id", user.id);

      if (readMap[bookingId]) {
        query = query.gt("created_at", readMap[bookingId]);
      }

      const { count } = await query;
      counts[bookingId] = count || 0;
    }

    setUnreadCounts(counts);
  };

  useEffect(() => {
    fetchUnreadCounts();

    if (bookingIds.length === 0) return;

    // Listen for new messages in real-time
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (bookingIds.includes(msg.booking_id) && msg.sender_id !== user?.id) {
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.booking_id]: (prev[msg.booking_id] || 0) + 1,
            }));
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, bookingIds.join(",")]);

  const markAsRead = async (bookingId: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("chat_read_status")
      .select("id")
      .eq("user_id", user.id)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("chat_read_status")
        .update({ last_read_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("chat_read_status")
        .insert({ user_id: user.id, booking_id: bookingId, last_read_at: new Date().toISOString() });
    }

    setUnreadCounts((prev) => ({ ...prev, [bookingId]: 0 }));
  };

  return { unreadCounts, markAsRead, refetch: fetchUnreadCounts };
};
