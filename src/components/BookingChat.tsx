import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { playNotificationSound } from "@/lib/notificationSound";

interface Message {
  id: string; booking_id: string; sender_id: string; content: string; created_at: string;
}

interface BookingChatProps {
  open: boolean; onOpenChange: (open: boolean) => void; bookingId: string; bookingLocation: string; onMarkAsRead?: () => void;
}

const BookingChat = ({ open, onOpenChange, bookingId, bookingLocation, onMarkAsRead }: BookingChatProps) => {
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !bookingId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    onMarkAsRead?.();
    const channel = supabase.channel(`chat-${bookingId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` }, (payload) => {
      const newMsg = payload.new as Message;
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.sender_id !== user?.id) playNotificationSound();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, bookingId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ booking_id: bookingId, sender_id: user.id, content: newMessage.trim() });
    if (!error) setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0" dir={dir}>
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base">{t("chatTitle")} - {bookingLocation}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef as any}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">{t("noMessages")}</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${dir === "rtl" ? (isMe ? "justify-start" : "justify-end") : (isMe ? "justify-end" : "justify-start")}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-3 border-t flex gap-2">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("typeMessage")} className="flex-1" disabled={sending} />
          <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingChat;
