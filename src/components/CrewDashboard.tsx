import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCrewLocationBroadcast } from "@/hooks/useCrewLocationBroadcast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Car, Clock, CheckCircle, HandHelping, Inbox, MessageCircle, Wallet, ArrowDownToLine, History, XCircle } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import BookingChat from "@/components/BookingChat";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import type { BookingStatus, Booking } from "@/types/booking";

interface WalletTransaction { id: string; amount: number; description: string | null; booking_id: string | null; created_at: string; }
interface WithdrawalRequest { id: string; amount: number; status: string; bank_name: string | null; iban: string | null; holder_name: string | null; created_at: string; }

interface CrewDashboardProps { bookings: Booking[]; loading: boolean; onRefresh: () => void; profileName?: string; }

const CrewDashboard = ({ bookings, loading, onRefresh, profileName }: CrewDashboardProps) => {
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const { toast } = useToast();
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);
  const [crewVehicleName, setCrewVehicleName] = useState("");
  const [crewVehiclePlate, setCrewVehiclePlate] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [unableBooking, setUnableBooking] = useState<Booking | null>(null);
  const [unableReason, setUnableReason] = useState<string>("");
  const [unableNote, setUnableNote] = useState("");
  const [unableSubmitting, setUnableSubmitting] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawIban, setWithdrawIban] = useState("");
  const [withdrawHolderName, setWithdrawHolderName] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [walletHistoryLoading, setWalletHistoryLoading] = useState(true);

  const statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("statusPending"), variant: "secondary" },
    approved: { label: t("statusCrewApproved"), variant: "default" },
    rejected: { label: t("statusRejected"), variant: "destructive" },
    completed: { label: t("statusCompleted"), variant: "outline" },
    cancelled: { label: t("statusCancelled"), variant: "destructive" },
  };

  const withdrawalStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("withdrawalPending"), variant: "secondary" },
    approved: { label: t("withdrawalApproved"), variant: "default" },
    rejected: { label: t("withdrawalRejected"), variant: "destructive" },
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const availableBookings = bookings.filter((b) => b.status === "pending" && !b.crew_id && (b as any).payment_status === "paid");
  const myBookings = bookings.filter((b) => b.crew_id === user?.id);
  const activeJobs = myBookings.filter((b) => b.status === "approved");
  const completedJobs = myBookings.filter((b) => b.status === "completed");

  const activeBookingIds = useMemo(() => activeJobs.map((b) => b.id), [activeJobs]);
  const { unreadCounts, markAsRead } = useUnreadMessages(activeBookingIds);

  // Broadcast crew location to spot requesters for active bookings
  useCrewLocationBroadcast(activeBookingIds, activeJobs.length > 0);

  const fetchWallet = async () => {
    if (!user?.id) return;
    setWalletLoading(true);
    const { data } = await supabase.from("crew_wallets").select("id, balance").eq("user_id", user.id).maybeSingle();
    setWalletBalance(data?.balance ?? 0);
    setWalletId(data?.id ?? null);
    setWalletLoading(false);
  };

  const fetchWalletHistory = async () => {
    if (!walletId) return;
    setWalletHistoryLoading(true);
    const [txRes, wdRes] = await Promise.all([
      supabase.from("wallet_transactions").select("id, amount, description, booking_id, created_at").eq("wallet_id", walletId).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawal_requests").select("id, amount, status, bank_name, iban, holder_name, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setTransactions((txRes.data as WalletTransaction[]) ?? []);
    setWithdrawals((wdRes.data as WithdrawalRequest[]) ?? []);
    setWalletHistoryLoading(false);
  };

  useEffect(() => { fetchWallet(); }, [user?.id, bookings]);
  useEffect(() => { if (walletId) fetchWalletHistory(); }, [walletId, bookings]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!walletId || !amount || amount <= 0 || amount > (walletBalance ?? 0)) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); return; }
    if (!withdrawIban.trim() || !withdrawHolderName.trim()) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); return; }
    setWithdrawing(true);
    const { error } = await supabase.from("withdrawal_requests").insert({ wallet_id: walletId, user_id: user?.id, amount, bank_name: withdrawBankName.trim() || null, iban: withdrawIban.trim(), holder_name: withdrawHolderName.trim() });
    setWithdrawing(false);
    if (error) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); return; }
    toast({ title: t("success") });
    setWithdrawOpen(false); setWithdrawAmount(""); setWithdrawBankName(""); setWithdrawIban(""); setWithdrawHolderName("");
    fetchWallet();
  };

  const openAcceptDialog = (bookingId: string) => { setAcceptingBookingId(bookingId); setCrewVehicleName(""); setCrewVehiclePlate(""); setAcceptDialogOpen(true); };

  const handleAccept = async () => {
    if (!acceptingBookingId || !crewVehiclePlate.trim()) { toast({ title: t("error"), variant: "destructive" }); return; }
    setAccepting(true);
    const { error } = await supabase.from("bookings").update({ crew_id: user?.id, status: "approved" as BookingStatus, crew_vehicle_name: crewVehicleName.trim() || null, crew_vehicle_plate: crewVehiclePlate.trim() }).eq("id", acceptingBookingId);
    setAccepting(false);
    if (error) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); return; }
    toast({ title: t("success") });
    setAcceptDialogOpen(false);
    onRefresh();
  };

  const openUnableDialog = (booking: Booking) => { setUnableBooking(booking); setUnableReason(""); setUnableNote(""); };

  const handleUnable = async () => {
    if (!unableBooking || !unableReason) return;
    if (unableReason === "other" && !unableNote.trim()) { toast({ title: t("error"), description: t("cancelReasonNoteRequired"), variant: "destructive" }); return; }
    setUnableSubmitting(true);
    const { data, error } = await supabase.functions.invoke("crew-cancel-booking", {
      body: { bookingId: unableBooking.id, reasonCode: unableReason, reasonNote: unableNote.trim() || undefined },
    });
    setUnableSubmitting(false);
    if (error || (data as any)?.error) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); return; }
    toast({ title: t("success") });
    setUnableBooking(null);
    onRefresh();
  };


  return (
    <>
      <div className="mb-6">
        {profileName && <p className="text-base font-semibold text-foreground">{profileName}</p>}
        <p className="text-sm text-muted-foreground">{t("crewDashLabel")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
              <div>
                {walletLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-primary">{walletBalance?.toFixed(2)} {t("sar")}</p>}
                <p className="text-sm text-muted-foreground">{t("walletBalance")}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10" disabled={!walletBalance || walletBalance <= 0} onClick={() => setWithdrawOpen(true)}>
              <ArrowDownToLine className="w-3.5 h-3.5" />{t("withdraw")}
            </Button>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Inbox className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{availableBookings.length}</p><p className="text-sm text-muted-foreground">{t("availableRequests")}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><HandHelping className="w-5 h-5 text-accent-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{activeJobs.length}</p><p className="text-sm text-muted-foreground">{t("tasksInProgress")}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold text-foreground">{completedJobs.length}</p><p className="text-sm text-muted-foreground">{t("completedTasks")}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="available">{t("availableTab")} ({availableBookings.length})</TabsTrigger>
          <TabsTrigger value="active">{t("myTasks")} ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">{t("completedTab")} ({completedJobs.length})</TabsTrigger>
          <TabsTrigger value="wallet" className="gap-1"><History className="w-3.5 h-3.5" />{t("walletTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="available"><CrewBookingsTable bookings={availableBookings} loading={loading} type="available" onAccept={openAcceptDialog} statusMap={statusMap} formatDate={formatDate} /></TabsContent>
        <TabsContent value="active"><CrewBookingsTable bookings={activeJobs} loading={loading} type="active" onChat={setChatBooking} onUnable={openUnableDialog} unreadCounts={unreadCounts} statusMap={statusMap} formatDate={formatDate} /></TabsContent>
        <TabsContent value="completed"><CrewBookingsTable bookings={completedJobs} loading={loading} type="completed" statusMap={statusMap} formatDate={formatDate} /></TabsContent>
        <TabsContent value="wallet"><WalletHistoryTab transactions={transactions} withdrawals={withdrawals} loading={walletHistoryLoading} withdrawalStatusMap={withdrawalStatusMap} formatDate={formatDate} /></TabsContent>
      </Tabs>

      {chatBooking && <BookingChat open={!!chatBooking} onOpenChange={(open) => !open && setChatBooking(null)} bookingId={chatBooking.id} bookingLocation={chatBooking.location} onMarkAsRead={() => markAsRead(chatBooking.id)} />}

      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("acceptOrder")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>{t("vehicleName")}</Label><Input placeholder={lang === "ar" ? "مثال: كامري 2024" : "e.g. Camry 2024"} value={crewVehicleName} onChange={(e) => setCrewVehicleName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("vehiclePlateLabel")}</Label><Input placeholder={lang === "ar" ? "مثال: أ ب ت 1234" : "e.g. ABC 1234"} value={crewVehiclePlate} onChange={(e) => setCrewVehiclePlate(e.target.value)} required /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleAccept} disabled={accepting || !crewVehiclePlate.trim()}>{accepting ? t("accepting") : t("confirmAccept")}</Button>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>{t("cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent dir={dir} className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("withdrawRequest")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted text-sm text-center">{t("availableBalance")} <span className="font-bold text-primary">{walletBalance?.toFixed(2)} {t("sar")}</span></div>
            <div className="space-y-2"><Label>{t("amount")}</Label><Input type="number" step="0.01" min="1" max={walletBalance ?? 0} placeholder={t("enterAmount")} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("accountHolder")}</Label><Input placeholder={t("accountHolderPlaceholder")} value={withdrawHolderName} onChange={(e) => setWithdrawHolderName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("bankName")}</Label><Input placeholder={lang === "ar" ? "مثال: الراجحي" : "e.g. Al Rajhi"} value={withdrawBankName} onChange={(e) => setWithdrawBankName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("iban")}</Label><Input placeholder="SA..." value={withdrawIban} onChange={(e) => setWithdrawIban(e.target.value)} dir="ltr" className={dir === "rtl" ? "text-left" : ""} /></div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount || !withdrawIban.trim() || !withdrawHolderName.trim()}>{withdrawing ? t("submitting") : t("confirmWithdraw")}</Button>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>{t("cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const WalletHistoryTab = ({ transactions, withdrawals, loading, withdrawalStatusMap, formatDate }: {
  transactions: WalletTransaction[]; withdrawals: WithdrawalRequest[]; loading: boolean;
  withdrawalStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }>;
  formatDate: (date: string) => string;
}) => {
  const { t, dir } = useLanguage();
  const [subTab, setSubTab] = useState<"transactions" | "withdrawals">("transactions");

  if (loading) return <Card><CardContent className="p-6 space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={subTab === "transactions" ? "default" : "outline"} className="rounded-xl" onClick={() => setSubTab("transactions")}>{t("transactionLog")} ({transactions.length})</Button>
        <Button size="sm" variant={subTab === "withdrawals" ? "default" : "outline"} className="rounded-xl" onClick={() => setSubTab("withdrawals")}>{t("withdrawalRequests")} ({withdrawals.length})</Button>
      </div>

      {subTab === "transactions" && (
        <Card><CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-12 text-center"><History className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground font-medium">{t("noTransactions")}</p></div>
          ) : (
            <Table><TableHeader><TableRow><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("description")}</TableHead><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("amountLabel")}</TableHead><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("dateLabel")}</TableHead></TableRow></TableHeader>
              <TableBody>{transactions.map((tx) => (
                <TableRow key={tx.id}><TableCell className="font-medium">{tx.description || "—"}</TableCell>
                  <TableCell><span className={tx.amount >= 0 ? "text-green-600 font-bold" : "text-destructive font-bold"}>{tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)} {t("sar")}</span></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(tx.created_at)}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent></Card>
      )}

      {subTab === "withdrawals" && (
        <Card><CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <div className="p-12 text-center"><ArrowDownToLine className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground font-medium">{t("noWithdrawals")}</p></div>
          ) : (
            <Table><TableHeader><TableRow><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("amountLabel")}</TableHead><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("status")}</TableHead><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("ibanLabel")}</TableHead><TableHead className={dir === "rtl" ? "text-right" : ""}>{t("dateLabel")}</TableHead></TableRow></TableHeader>
              <TableBody>{withdrawals.map((wd) => (
                <TableRow key={wd.id}><TableCell className="font-bold">{wd.amount.toFixed(2)} {t("sar")}</TableCell>
                  <TableCell><Badge variant={withdrawalStatusMap[wd.status]?.variant ?? "secondary"}>{withdrawalStatusMap[wd.status]?.label ?? wd.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm" dir="ltr">{wd.iban || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(wd.created_at)}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent></Card>
      )}
    </div>
  );
};

const CrewBookingsTable = ({ bookings, loading, type, onAccept, onChat, unreadCounts, statusMap, formatDate }: {
  bookings: Booking[]; loading: boolean; type: "available" | "active" | "completed";
  onAccept?: (id: string) => void; onChat?: (booking: Booking) => void; unreadCounts?: Record<string, number>;
  statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }>;
  formatDate: (date: string) => string;
}) => {
  const { t, dir } = useLanguage();

  if (loading) return <Card><CardContent className="p-6 space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>;
  if (bookings.length === 0) return <Card><CardContent className="p-12 text-center"><Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground font-medium">{type === "available" ? t("noAvailable") : type === "active" ? t("noActive") : t("noCompleted")}</p></CardContent></Card>;

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>
          <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("location")}</TableHead>
          <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("vehicle")}</TableHead>
          <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("vehiclePlate")}</TableHead>
          <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("date")}</TableHead>
          <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("status")}</TableHead>
          {(type === "available" || type === "active") && <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("action")}</TableHead>}
        </TableRow></TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <MapPin className="w-4 h-4 shrink-0" /><span className="line-clamp-1">{booking.location}</span>
                </a>
              </TableCell>
              <TableCell>{booking.vehicle_name || "—"}</TableCell>
              <TableCell>{booking.vehicle_plate}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDate(booking.scheduled_at)}</TableCell>
              <TableCell><Badge variant={statusMap[booking.status].variant}>{statusMap[booking.status].label}</Badge></TableCell>
              {type === "available" && onAccept && (
                <TableCell><Button size="sm" className="rounded-xl font-bold gap-1" onClick={() => onAccept(booking.id)}><HandHelping className="w-3.5 h-3.5" />{t("accept")}</Button></TableCell>
              )}
              {type === "active" && (
                <TableCell><div className="flex gap-1">
                  {onChat && <Button size="sm" variant="ghost" className="rounded-xl gap-1 relative" onClick={() => onChat(booking)}>
                    <MessageCircle className="w-3.5 h-3.5" />{t("chat")}
                    {unreadCounts && unreadCounts[booking.id] > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">{unreadCounts[booking.id]}</span>}
                  </Button>}
                </div></TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
};

export default CrewDashboard;
