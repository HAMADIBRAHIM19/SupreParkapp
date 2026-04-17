import { useState, useMemo } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, MapPin, Car, Clock, Plus, XCircle, Trash, MessageCircle, CheckCircle, Navigation, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import NewBookingDialog from "@/components/NewBookingDialog";
import BookingChat from "@/components/BookingChat";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import RatingDialog from "@/components/RatingDialog";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import type { BookingStatus, Booking } from "@/types/booking";

interface SeekerDashboardProps {
  bookings: Booking[];
  loading: boolean;
  onBookingCreated: () => void;
  profileName?: string;
}

const SeekerDashboard = ({ bookings, loading, onBookingCreated, profileName }: SeekerDashboardProps) => {
  const { t, lang } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  const isPaid = (b: Booking) => b.payment_status === "paid";
  const activeBookings = bookings.filter((b) => (b.status === "pending" || b.status === "approved") && isPaid(b));
  const unpaidBookings = bookings.filter((b) => b.status === "pending" && !isPaid(b));
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "rejected" || b.status === "cancelled");

  const approvedBookingIds = useMemo(() => bookings.filter((b) => b.status === "approved").map((b) => b.id), [bookings]);
  const { unreadCounts, markAsRead } = useUnreadMessages(approvedBookingIds);

  const statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("statusPending"), variant: "secondary" },
    approved: { label: t("statusApproved"), variant: "default" },
    rejected: { label: t("statusRejected"), variant: "destructive" },
    completed: { label: t("statusCompleted"), variant: "outline" },
    cancelled: { label: t("statusCancelled"), variant: "destructive" },
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          {profileName && <p className="text-base font-semibold text-foreground">{profileName}</p>}
          <p className="text-sm text-muted-foreground">{t("seekerDashLabel")}</p>
        </div>
        <Button className="rounded-xl font-bold gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {t("newBooking")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{activeBookings.length}</p><p className="text-sm text-muted-foreground">{t("activeRequests")}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><CalendarDays className="w-5 h-5 text-accent-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{bookings.length}</p><p className="text-sm text-muted-foreground">{t("totalRequests")}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Car className="w-5 h-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold text-foreground">{pastBookings.length}</p><p className="text-sm text-muted-foreground">{t("pastRequests")}</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">{t("activeTab")} ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="past">{t("pastTab")} ({pastBookings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <BookingsTable bookings={activeBookings} loading={loading} onBookingUpdated={onBookingCreated} onChat={setChatBooking} onTrack={setTrackingBooking} onRate={setRatingBooking} unreadCounts={unreadCounts} statusMap={statusMap} />
        </TabsContent>
        <TabsContent value="past">
          <BookingsTable bookings={pastBookings} loading={loading} onBookingUpdated={onBookingCreated} statusMap={statusMap} />
        </TabsContent>
      </Tabs>

      <NewBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} onBookingCreated={onBookingCreated} />
      {chatBooking && (
        <BookingChat open={!!chatBooking} onOpenChange={(open) => !open && setChatBooking(null)} bookingId={chatBooking.id} bookingLocation={chatBooking.location} onMarkAsRead={() => markAsRead(chatBooking.id)} />
      )}
      {trackingBooking && (
        <LiveTrackingMap open={!!trackingBooking} onOpenChange={(open) => !open && setTrackingBooking(null)} bookingId={trackingBooking.id} bookingLocation={trackingBooking.location} />
      )}
      {ratingBooking && ratingBooking.crew_id && (
        <RatingDialog
          open={!!ratingBooking}
          onOpenChange={(open) => !open && setRatingBooking(null)}
          bookingId={ratingBooking.id}
          seekerId={ratingBooking.seeker_id}
          crewId={ratingBooking.crew_id}
          onRated={onBookingCreated}
        />
      )}
    </>
  );
};

const BookingsTable = ({ bookings, loading, onBookingUpdated, onChat, onTrack, onRate, unreadCounts, statusMap }: {
  bookings: Booking[]; loading: boolean; onBookingUpdated?: () => void; onChat?: (booking: Booking) => void;
  onTrack?: (booking: Booking) => void; onRate?: (booking: Booking) => void; unreadCounts?: Record<string, number>;
  statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }>;
}) => {
  const { t, dir, lang } = useLanguage();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const formatDate = (date: string) => new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleComplete = async (booking: Booking) => {
    setCompletingId(booking.id);
    const { error } = await supabase.from("bookings").update({ status: "completed" as const }).eq("id", booking.id);
    setCompletingId(null);
    if (error) {
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
    } else {
      toast({ title: t("success"), description: t("statusCompleted") });
      if (booking.crew_id && onRate) {
        onRate(booking);
      } else {
        onBookingUpdated?.();
      }
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase.from("bookings").update({ status: "cancelled" as const }).eq("id", id);
    setCancellingId(null);
    if (error) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); } else { toast({ title: t("success") }); onBookingUpdated?.(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    setDeletingId(null);
    if (error) { toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" }); } else { toast({ title: t("success") }); onBookingUpdated?.(); }
  };

  if (loading) return <Card><CardContent className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>;
  if (bookings.length === 0) return <Card><CardContent className="p-12 text-center"><Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground font-medium">{t("noBookings")}</p></CardContent></Card>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("location")}</TableHead>
              <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("vehiclePlate")}</TableHead>
              <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("crewVehicle")}</TableHead>
              <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("date")}</TableHead>
              <TableHead className={dir === "rtl" ? "text-right" : ""}>{t("status")}</TableHead>
              <TableHead className={dir === "rtl" ? "text-right" : ""}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium"><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{booking.location}</div></TableCell>
                <TableCell>{booking.vehicle_plate}</TableCell>
                <TableCell>
                  {booking.status === "approved" && booking.crew_vehicle_plate ? (
                    <div className="text-sm flex items-center gap-1 text-primary font-medium">
                      <Car className="w-3.5 h-3.5" />
                      {booking.crew_vehicle_name && <span>{booking.crew_vehicle_name}</span>}
                      <span className="text-muted-foreground">({booking.crew_vehicle_plate})</span>
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(booking.scheduled_at)}</TableCell>
                <TableCell><Badge variant={statusMap[booking.status].variant}>{statusMap[booking.status].label}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {booking.status === "approved" && onChat && (
                      <>
                        <Button variant="ghost" size="sm" className="gap-1 relative" onClick={() => onChat(booking)}>
                          <MessageCircle className="w-4 h-4" />{t("chat")}
                          {unreadCounts && unreadCounts[booking.id] > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">{unreadCounts[booking.id]}</span>
                          )}
                        </Button>
                        {onTrack && (
                          <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => onTrack(booking)}>
                            <Navigation className="w-4 h-4" />{t("trackCrew")}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 rounded-xl font-bold" disabled={completingId === booking.id}>
                              <CheckCircle className="w-4 h-4" />{completingId === booking.id ? t("completing") : t("completeOrder")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir={dir}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("confirmComplete")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("confirmCompleteDesc")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogAction onClick={() => handleComplete(booking)}>{t("yesComplete")}</AlertDialogAction>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {booking.status === "pending" ? (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1" disabled={cancellingId === booking.id} onClick={() => handleCancel(booking.id)}>
                        <XCircle className="w-4 h-4" />{cancellingId === booking.id ? t("cancelling") : t("cancel")}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1" disabled={deletingId === booking.id} onClick={() => handleDelete(booking.id)}>
                        <Trash className="w-4 h-4" />{deletingId === booking.id ? t("deleting") : t("delete")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SeekerDashboard;
