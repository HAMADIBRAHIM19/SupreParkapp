import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Car, Clock, CheckCircle, HandHelping, Inbox, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BookingChat from "@/components/BookingChat";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import type { BookingStatus, Booking } from "@/types/booking";

const statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "secondary" },
  approved: { label: "تم القبول", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  completed: { label: "مكتمل", variant: "outline" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface CrewDashboardProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
  profileName?: string;
}

const CrewDashboard = ({ bookings, loading, onRefresh, profileName }: CrewDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const availableBookings = bookings.filter((b) => b.status === "pending" && !b.crew_id);
  const myBookings = bookings.filter((b) => b.crew_id === user?.id);
  const activeJobs = myBookings.filter((b) => b.status === "approved");
  const completedJobs = myBookings.filter((b) => b.status === "completed");

  const activeBookingIds = useMemo(() => activeJobs.map((b) => b.id), [activeJobs]);
  const { unreadCounts, markAsRead } = useUnreadMessages(activeBookingIds);
  const handleAccept = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ crew_id: user?.id, status: "approved" as BookingStatus })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء قبول الطلب", variant: "destructive" });
      return;
    }
    toast({ title: "تم القبول", description: "تم قبول الطلب بنجاح" });
    onRefresh();
  };

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" as BookingStatus })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إكمال الطلب", variant: "destructive" });
      return;
    }
    toast({ title: "تم الإكمال", description: "تم تحديث حالة الطلب" });
    onRefresh();
  };

  return (
    <>
      <div className="mb-6">
        {profileName && <p className="text-base font-semibold text-foreground">{profileName}</p>}
        <p className="text-sm text-muted-foreground">لوحة تحكم الطاقم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{availableBookings.length}</p>
              <p className="text-sm text-muted-foreground">طلبات متاحة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <HandHelping className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeJobs.length}</p>
              <p className="text-sm text-muted-foreground">مهام قيد التنفيذ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedJobs.length}</p>
              <p className="text-sm text-muted-foreground">مهام مكتملة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="available">المتاحة ({availableBookings.length})</TabsTrigger>
          <TabsTrigger value="active">مهامي ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">المكتملة ({completedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <CrewBookingsTable bookings={availableBookings} loading={loading} type="available" onAccept={handleAccept} />
        </TabsContent>
        <TabsContent value="active">
          <CrewBookingsTable bookings={activeJobs} loading={loading} type="active" onComplete={handleComplete} onChat={setChatBooking} unreadCounts={unreadCounts} />
        </TabsContent>
        <TabsContent value="completed">
          <CrewBookingsTable bookings={completedJobs} loading={loading} type="completed" />
        </TabsContent>
      </Tabs>

      {chatBooking && (
        <BookingChat
          open={!!chatBooking}
          onOpenChange={(open) => !open && setChatBooking(null)}
          bookingId={chatBooking.id}
          bookingLocation={chatBooking.location}
          onMarkAsRead={() => markAsRead(chatBooking.id)}
        />
      )}
    </>
  );
};

const CrewBookingsTable = ({
  bookings,
  loading,
  type,
  onAccept,
  onComplete,
  onChat,
}: {
  bookings: Booking[];
  loading: boolean;
  type: "available" | "active" | "completed";
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  onChat?: (booking: Booking) => void;
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">
            {type === "available" ? "لا توجد طلبات متاحة حالياً" : type === "active" ? "لا توجد مهام قيد التنفيذ" : "لا توجد مهام مكتملة"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموقع</TableHead>
              <TableHead className="text-right">السيارة</TableHead>
              <TableHead className="text-right">لوحة السيارة</TableHead>
              <TableHead className="text-right">رقم التواصل</TableHead>
              <TableHead className="text-right">الموعد</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              {(type === "available" || type === "active") && <TableHead className="text-right">إجراء</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {booking.location}
                  </div>
                </TableCell>
                <TableCell>{booking.vehicle_name || "—"}</TableCell>
                <TableCell>{booking.vehicle_plate}</TableCell>
                <TableCell dir="ltr" className="text-sm">{booking.contact_number || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(booking.scheduled_at)}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[booking.status].variant}>{statusMap[booking.status].label}</Badge>
                </TableCell>
                {type === "available" && onAccept && (
                  <TableCell>
                    <Button size="sm" className="rounded-xl font-bold gap-1" onClick={() => onAccept(booking.id)}>
                      <HandHelping className="w-3.5 h-3.5" />
                      قبول
                    </Button>
                  </TableCell>
                )}
                {type === "active" && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onChat && (
                        <Button size="sm" variant="ghost" className="rounded-xl gap-1" onClick={() => onChat(booking)}>
                          <MessageCircle className="w-3.5 h-3.5" />
                          محادثة
                        </Button>
                      )}
                      {onComplete && (
                        <Button size="sm" variant="outline" className="rounded-xl font-bold gap-1" onClick={() => onComplete(booking.id)}>
                          <CheckCircle className="w-3.5 h-3.5" />
                          إكمال
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CrewDashboard;
