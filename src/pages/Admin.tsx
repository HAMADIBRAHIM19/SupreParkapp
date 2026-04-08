import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, ShieldCheck, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface WithdrawalRequest {
  id: string; amount: number; status: string; bank_name: string | null; iban: string | null; holder_name: string | null; created_at: string; user_id: string;
}

interface SupportTicket {
  id: string; user_id: string; subject: string; message: string; status: string; admin_reply: string | null; created_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  // Support tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const checkAdmin = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (data && data.length > 0) { setIsAdmin(true); } else { navigate("/dashboard"); }
      setChecking(false);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRequests();
    fetchTickets();
  }, [isAdmin]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
    if (data) {
      setRequests(data);
      const userIds = [...new Set(data.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        if (profiles) { const map: Record<string, string> = {}; profiles.forEach(p => { map[p.user_id] = p.full_name; }); setProfilesMap(prev => ({ ...prev, ...map })); }
      }
    }
    setLoadingRequests(false);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    if (data) {
      setTickets(data);
      const userIds = [...new Set(data.map(t => t.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        if (profiles) { const map: Record<string, string> = {}; profiles.forEach(p => { map[p.user_id] = p.full_name; }); setProfilesMap(prev => ({ ...prev, ...map })); }
      }
    }
    setLoadingTickets(false);
  };

  const handleAction = async (id: string, newStatus: "approved" | "rejected") => {
    setProcessing(id);
    const { error } = await supabase.from("withdrawal_requests").update({ status: newStatus }).eq("id", id);
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); } else { toast({ title: newStatus === "approved" ? t("approved") : t("rejected") }); fetchRequests(); }
    setProcessing(null);
  };

  const handleReply = async (ticketId: string) => {
    const reply = replyText[ticketId]?.trim();
    if (!reply) return;
    setReplying(ticketId);
    const { error } = await supabase.from("support_tickets").update({ admin_reply: reply, status: "closed" }).eq("id", ticketId);
    setReplying(null);
    if (error) {
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
    } else {
      toast({ title: t("success") });
      setReplyText(prev => ({ ...prev, [ticketId]: "" }));
      fetchTickets();
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
    if (error) { toast({ title: t("error"), variant: "destructive" }); } else { toast({ title: t("success") }); fetchTickets(); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline">{t("statusPending")}</Badge>;
      case "approved": return <Badge variant="default">{t("approved")}</Badge>;
      case "rejected": return <Badge variant="destructive">{t("statusRejected")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || checking) {
    return (<div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 pt-24"><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-64 w-full" /></div></div>);
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">{t("adminDashboard")}</h1>
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="withdrawals">{t("withdrawalRequestsTitle")}</TabsTrigger>
            <TabsTrigger value="support">{t("supportTickets")} {tickets.filter(t => t.status === "open").length > 0 && `(${tickets.filter(t => t.status === "open").length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("withdrawalRequestsTitle")}</CardTitle></CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : requests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("noWithdrawalRequests")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("member")}</TableHead>
                          <TableHead>{t("amountLabel")}</TableHead>
                          <TableHead>{t("bank")}</TableHead>
                          <TableHead>{t("ibanLabel")}</TableHead>
                          <TableHead>{t("accountHolderName")}</TableHead>
                          <TableHead>{t("dateLabel")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead>{t("action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{profilesMap[req.user_id] || "—"}</TableCell>
                            <TableCell>{req.amount} {t("sar")}</TableCell>
                            <TableCell>{req.bank_name || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{req.iban || "—"}</TableCell>
                            <TableCell>{req.holder_name || "—"}</TableCell>
                            <TableCell className="text-xs">{new Date(req.created_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}</TableCell>
                            <TableCell>{statusBadge(req.status)}</TableCell>
                            <TableCell>
                              {req.status === "pending" ? (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="default" className="gap-1" disabled={processing === req.id} onClick={() => handleAction(req.id, "approved")}>
                                    {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}{t("approve")}
                                  </Button>
                                  <Button size="sm" variant="destructive" className="gap-1" disabled={processing === req.id} onClick={() => handleAction(req.id, "rejected")}>
                                    {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}{t("reject")}
                                  </Button>
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("supportTickets")}</CardTitle></CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : tickets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("supportNoTicketsAdmin")}</p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("supportUser")}: <span className="font-medium text-foreground">{profilesMap[ticket.user_id] || "—"}</span></p>
                            <h3 className="font-semibold text-sm">{ticket.subject}</h3>
                          </div>
                          <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                            {ticket.status === "open" ? t("supportOpen") : t("supportClosed")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {new Date(ticket.created_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {ticket.admin_reply && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                            <p className="text-xs font-semibold text-primary mb-1">{t("supportAdminReply")}</p>
                            <p className="text-sm">{ticket.admin_reply}</p>
                          </div>
                        )}
                        {ticket.status === "open" && (
                          <div className="flex gap-2 items-end">
                            <Textarea
                              value={replyText[ticket.id] || ""}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              placeholder={t("supportReplyPlaceholder")}
                              rows={2}
                              className="flex-1"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" className="gap-1" disabled={replying === ticket.id || !replyText[ticket.id]?.trim()} onClick={() => handleReply(ticket.id)}>
                                {replying === ticket.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                {t("supportSendReply")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCloseTicket(ticket.id)}>
                                {t("supportClose")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
