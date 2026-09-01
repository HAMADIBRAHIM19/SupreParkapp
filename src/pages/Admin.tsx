import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, ShieldCheck, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


interface WithdrawalRequest {
  id: string; amount: number; status: string; bank_name: string | null; iban: string | null; holder_name: string | null; created_at: string; user_id: string;
}

interface SupportTicket {
  id: string; user_id: string; subject: string; message: string; status: string; admin_reply: string | null; created_at: string;
}

interface BookingCancellation {
  id: string; booking_id: string; crew_id: string; seeker_id: string; reason_code: string; reason_note: string | null; refund_status: string; created_at: string;
}

interface AdminBooking {
  id: string; seeker_id: string; crew_id: string | null; location: string; status: string;
  payment_status: string; amount_paid: number | null; currency: string | null; paid_at: string | null;
  cancellation_reason: string | null; cancellation_reason_note: string | null; created_at: string; updated_at: string;
  accepted_at: string | null; cancelled_at: string | null;
  vehicle_plate: string | null;
}

interface AdminUser {
  id: string; email: string; created_at: string; full_name: string; username: string; account_type: string;
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

  // Crew cancellations log
  const [cancellations, setCancellations] = useState<BookingCancellation[]>([]);
  const [loadingCancellations, setLoadingCancellations] = useState(true);

  // All bookings (detailed)
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Users list
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "seeker" | "crew">("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "active" | "accepted" | "cancelled">("all");



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
    fetchCancellations();
    fetchBookings();
    fetchUsers();
  }, [isAdmin]);


  const fetchBookings = async () => {
    setLoadingBookings(true);
    const { data } = await (supabase as any)
      .from("bookings")
      .select("id, seeker_id, crew_id, location, status, payment_status, amount_paid, currency, paid_at, cancellation_reason, cancellation_reason_note, created_at, updated_at, accepted_at, cancelled_at, vehicle_plate")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      setBookings(data as AdminBooking[]);
      const userIds = [...new Set((data as AdminBooking[]).flatMap((b) => [b.seeker_id, b.crew_id]).filter(Boolean) as string[])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        if (profiles) { const map: Record<string, string> = {}; profiles.forEach(p => { map[p.user_id] = p.full_name; }); setProfilesMap(prev => ({ ...prev, ...map })); }
      }
    }
    setLoadingBookings(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-users", { method: "GET" });
      if (error) throw error;
      setUsers((data?.users || []) as AdminUser[]);
    } catch (err: any) {
      toast({ title: t("error"), description: err?.message || t("errorOccurred"), variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userFilter.trim().toLowerCase();
    return users.filter((u) => {
      if (typeFilter !== "all" && u.account_type !== typeFilter) return false;
      if (!term) return true;
      return (
        u.email.toLowerCase().includes(term) ||
        u.full_name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term)
      );
    });
  }, [users, userFilter, typeFilter]);

  const cancelledBookings = useMemo(() => {
    const cancellationMap = new Map(cancellations.map((c) => [c.booking_id, c]));
    return bookings
      .filter((b) => b.status === "cancelled")
      .map((b) => ({ booking: b, cancellation: cancellationMap.get(b.id) || null }));
  }, [bookings, cancellations]);

  const orderStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return t("orderStatusActive");
      case "approved": return t("orderStatusAccepted");
      case "cancelled": return t("orderStatusCancelled");
      case "completed": return t("orderStatusCompleted");
      default: return t(status) || status;
    }
  };

  const orderStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">{t("orderStatusActive")}</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">{t("orderStatusAccepted")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("orderStatusCancelled")}</Badge>;
      case "completed": return <Badge variant="default">{t("orderStatusCompleted")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = useMemo(() => {
    return bookings.filter((b) => {
      if (orderStatusFilter === "all") return true;
      if (orderStatusFilter === "active") return b.status === "pending";
      if (orderStatusFilter === "accepted") return b.status === "approved" || b.status === "completed";
      if (orderStatusFilter === "cancelled") return b.status === "cancelled";
      return true;
    });
  }, [bookings, orderStatusFilter]);




  const fetchCancellations = async () => {
    setLoadingCancellations(true);
    const { data } = await (supabase as any)
      .from("booking_cancellations")
      .select("id, booking_id, crew_id, seeker_id, reason_code, reason_note, refund_status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setCancellations(data as BookingCancellation[]);
      const userIds = [...new Set((data as BookingCancellation[]).map((c) => c.crew_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        if (profiles) { const map: Record<string, string> = {}; profiles.forEach(p => { map[p.user_id] = p.full_name; }); setProfilesMap(prev => ({ ...prev, ...map })); }
      }
    }
    setLoadingCancellations(false);
  };


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

  const bookingStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline">{t("statusPending")}</Badge>;
      case "approved": return <Badge variant="default">{t("approved")}</Badge>;
      case "rejected": return <Badge variant="destructive">{t("statusRejected")}</Badge>;
      case "completed": return <Badge variant="default">{t("statusCompleted")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("statusCancelled")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const paymentBadge = (payment: string) => {
    switch (payment) {
      case "paid": return <Badge variant="default">{t("payPaid")}</Badge>;
      case "refunded": return <Badge variant="secondary">{t("payRefunded")}</Badge>;
      case "refund_pending": return <Badge variant="outline">{t("payRefundPending")}</Badge>;
      default: return <Badge variant="outline">{t("payUnpaid")}</Badge>;
    }
  };

  const fmtDateTime = (value: string) =>
    new Date(value).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });


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
          <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="withdrawals">{t("withdrawalRequestsTitle")}</TabsTrigger>
            <TabsTrigger value="support">{t("supportTickets")} {tickets.filter(t => t.status === "open").length > 0 && `(${tickets.filter(t => t.status === "open").length})`}</TabsTrigger>
            <TabsTrigger value="cancellations">{t("cancellationsLog")} ({cancelledBookings.length})</TabsTrigger>
            <TabsTrigger value="bookings">{t("bookingsLog")} ({bookings.length})</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-3.5 h-3.5 me-1" />{t("usersTab")} ({users.length})</TabsTrigger>
          </TabsList>


          <TabsContent value="bookings">
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("bookingsLog")}</CardTitle></CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("noBookingsAdmin")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("seekerLabel")}</TableHead>
                          <TableHead>{t("crewLabel")}</TableHead>
                          <TableHead>{t("location")}</TableHead>
                          <TableHead>{t("amountPaidLabel")}</TableHead>
                          <TableHead>{t("paymentStatusLabel")}</TableHead>
                          <TableHead>{t("paymentDateLabel")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead>{t("refundReasonLabel")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{profilesMap[b.seeker_id] || b.seeker_id.slice(0, 8)}</TableCell>
                            <TableCell>{b.crew_id ? (profilesMap[b.crew_id] || b.crew_id.slice(0, 8)) : "—"}</TableCell>
                            <TableCell className="max-w-[220px] truncate" title={b.location}>{b.location}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {b.amount_paid != null ? `${b.amount_paid} ${b.currency || t("sar")}` : (b.payment_status === "paid" ? `29 ${t("sar")}` : "—")}
                            </TableCell>
                            <TableCell>{paymentBadge(b.payment_status)}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{b.paid_at ? fmtDateTime(b.paid_at) : (b.payment_status === "paid" ? fmtDateTime(b.created_at) : <span className="text-muted-foreground">{t("notPaidYet")}</span>)}</TableCell>
                            <TableCell>{bookingStatusBadge(b.status)}</TableCell>
                            <TableCell className="text-xs max-w-[240px]">
                              {b.cancellation_reason ? (
                                <span>
                                  {t(`reason_${b.cancellation_reason}` as any)}
                                  {b.cancellation_reason_note ? ` — ${b.cancellation_reason_note}` : ""}
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
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


          <TabsContent value="cancellations">
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("cancellationsLog")}</CardTitle></CardHeader>
              <CardContent>
                {loadingCancellations || loadingBookings ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : cancelledBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("noCancelledBookings")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("seekerLabel")}</TableHead>
                          <TableHead>{t("location")}</TableHead>
                          <TableHead>{t("amountPaidLabel")}</TableHead>
                          <TableHead>{t("paymentStatusLabel")}</TableHead>
                          <TableHead>{t("cancellationDateLabel")}</TableHead>
                          <TableHead>{t("cancelledByLabel")}</TableHead>
                          <TableHead>{t("reasonLabel")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cancelledBookings.map(({ booking: b, cancellation: c }) => {
                          const cancelDate = c ? c.created_at : b.updated_at;
                          const reasonCode = c?.reason_code ?? b.cancellation_reason;
                          const reasonNote = c?.reason_note ?? b.cancellation_reason_note;
                          const cancelledBy = c ? t("cancelledByCrewLabel") : t("cancelledBySeekerLabel");
                          return (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium whitespace-nowrap">{profilesMap[b.seeker_id] || b.seeker_id.slice(0, 8)}</TableCell>
                              <TableCell className="max-w-[220px] truncate" title={b.location}>{b.location}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {b.amount_paid != null ? `${b.amount_paid} ${b.currency || t("sar")}` : "—"}
                              </TableCell>
                              <TableCell>{paymentBadge(b.payment_status)}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{cancelDate ? fmtDateTime(cancelDate) : "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{cancelledBy}</TableCell>
                              <TableCell className="text-xs max-w-[260px]">
                                {reasonCode ? (
                                  <span>
                                    {t(`reason_${reasonCode}` as any)}
                                    {reasonNote ? ` — ${reasonNote}` : ""}
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


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

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-4 h-4" />{t("usersTitle")}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Input
                    placeholder={t("usersSearchPlaceholder")}
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="sm:flex-1"
                  />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="all">{t("usersFilterTypeAll")}</option>
                    <option value="seeker">{t("usersFilterSeeker")}</option>
                    <option value="crew">{t("usersFilterCrew")}</option>
                  </select>
                </div>
                {loadingUsers ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t("noUsers")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("userEmail")}</TableHead>
                          <TableHead>{t("userFullName")}</TableHead>
                          <TableHead>{t("userUsername")}</TableHead>
                          <TableHead>{t("userAccountType")}</TableHead>
                          <TableHead>{t("userCreatedAt")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium text-xs">{u.email || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>{u.full_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{u.username || "—"}</TableCell>
                            <TableCell>{u.account_type === "crew" ? <Badge variant="default">{t("crewLabel")}</Badge> : <Badge variant="outline">{t("seekerLabel")}</Badge>}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(u.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
