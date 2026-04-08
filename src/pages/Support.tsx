import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { HeadsetIcon, Send } from "lucide-react";

const Support = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTickets(data);
    setLoadingTickets(false);
  };

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
    } else {
      toast({ title: t("success"), description: t("supportSent") });
      setSubject("");
      setMessage("");
      fetchTickets();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 container mx-auto px-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="pt-20 pb-12 container mx-auto px-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <HeadsetIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("supportTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("supportDesc")}</p>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("supportSubject")}</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("supportSubjectPlaceholder")}
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("supportMessage")}</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("supportMessagePlaceholder")}
                  required
                  maxLength={1000}
                  rows={5}
                />
              </div>
              <Button type="submit" disabled={sending || !subject.trim() || !message.trim()} className="w-full gap-2">
                <Send className="w-4 h-4" />
                {sending ? t("supportSending") : t("supportSend")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-lg font-bold mb-4">{t("supportMyTickets")}</h2>
        {loadingTickets ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">{t("supportNoTickets")}</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{ticket.subject}</h3>
                    <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                      {ticket.status === "open" ? t("supportOpen") : t("supportClosed")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  {ticket.admin_reply && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-semibold text-primary mb-1">{t("supportAdminReply")}</p>
                      <p className="text-sm">{ticket.admin_reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Support;
