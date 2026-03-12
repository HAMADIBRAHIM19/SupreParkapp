import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, MapPin, Car, Clock, Plus, XCircle, Trash, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NewBookingDialog from "@/components/NewBookingDialog";
import BookingChat from "@/components/BookingChat";
import type { BookingStatus, Booking } from "@/types/booking";

const statusMap: Record<BookingStatus, {label: string;variant: "default" | "secondary" | "destructive" | "outline";}> = {
  pending: { label: "قيد الانتظار", variant: "secondary" },
  approved: { label: "مقبول", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  completed: { label: "مكتمل", variant: "outline" },
  cancelled: { label: "ملغي", variant: "destructive" }
};

const formatDate = (date: string) =>
new Date(date).toLocaleDateString("ar-SA", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

interface SeekerDashboardProps {
  bookings: Booking[];
  loading: boolean;
  onBookingCreated: () => void;
  profileName?: string;
}

const SeekerDashboard = ({ bookings, loading, onBookingCreated, profileName }: SeekerDashboardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "approved");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "rejected" || b.status === "cancelled");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          {profileName && <p className="text-base font-semibold text-foreground">{profileName}</p>}
          <p className="text-sm text-muted-foreground">لوحة تحكم الباحث عن موقف</p>
        </div>
        <Button className="rounded-xl font-bold gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          طلب حجز جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeBookings.length}</p>
              <p className="text-sm text-muted-foreground">طلبات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pastBookings.length}</p>
              <p className="text-sm text-muted-foreground">طلبات سابقة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">النشطة ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="past">السابقة ({pastBookings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <BookingsTable bookings={activeBookings} loading={loading} onBookingUpdated={onBookingCreated} />
        </TabsContent>
        <TabsContent value="past">
          <BookingsTable bookings={pastBookings} loading={loading} />
        </TabsContent>
      </Tabs>

      <NewBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} onBookingCreated={onBookingCreated} />
    </>);

};

const BookingsTable = ({ bookings, loading, onBookingUpdated }: {bookings: Booking[];loading: boolean; onBookingUpdated?: () => void;}) => {
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" as const })
      .eq("id", id);
    setCancellingId(null);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إلغاء الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم إلغاء الطلب بنجاح" });
      onBookingUpdated?.();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    setDeletingId(id);
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم حذف الطلب بنجاح" });
      onBookingUpdated?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>);

  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">لا توجد طلبات حجز</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموقع</TableHead>
              <TableHead className="text-right">لوحة السيارة</TableHead>
              <TableHead className="text-right">الموعد</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) =>
            <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {booking.location}
                  </div>
                </TableCell>
                <TableCell>{booking.vehicle_plate}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(booking.scheduled_at)}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[booking.status].variant}>{statusMap[booking.status].label}</Badge>
                </TableCell>
                <TableCell>
                  {booking.status === "pending" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                    >
                      <XCircle className="w-4 h-4" />
                      {cancellingId === booking.id ? "جاري الإلغاء..." : "إلغاء"}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                      disabled={deletingId === booking.id}
                      onClick={() => handleDelete(booking.id)}
                    >
                      <Trash className="w-4 h-4" />
                      {deletingId === booking.id ? "جاري الحذف..." : "حذف"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>);

};

export default SeekerDashboard;