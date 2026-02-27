import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, MapPin, Car, Clock, Plus, LayoutDashboard } from "lucide-react";
import NewBookingDialog from "@/components/NewBookingDialog";

type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

interface Booking {
  id: string;
  location: string;
  vehicle_plate: string;
  notes: string | null;
  status: BookingStatus;
  scheduled_at: string;
  created_at: string;
}

const statusMap: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد الانتظار", variant: "secondary" },
  approved: { label: "مقبول", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  completed: { label: "مكتمل", variant: "outline" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ account_type: string; full_name: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("account_type, full_name")
        .eq("user_id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsData) setBookings(bookingsData as Booking[]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleBookingCreated = () => {
    // Refresh bookings
    if (!user) return;
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setBookings(data as Booking[]);
      });
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

  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "approved");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "rejected" || b.status === "cancelled");

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="pt-20 pb-12 container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                مرحباً{profile ? `, ${profile.full_name}` : ""}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile?.account_type === "crew" ? "لوحة تحكم الطاقم" : "لوحة تحكم الباحث"}
              </p>
            </div>
          </div>

          {profile?.account_type === "seeker" && (
            <Button className="rounded-xl font-bold gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              طلب حجز جديد
            </Button>
          )}
        </div>

        {/* Stats Cards */}
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

        {/* Bookings Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">النشطة ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="past">السابقة ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <BookingsTable bookings={activeBookings} loading={loading} formatDate={formatDate} />
          </TabsContent>
          <TabsContent value="past">
            <BookingsTable bookings={pastBookings} loading={loading} formatDate={formatDate} />
          </TabsContent>
        </Tabs>
      </main>

      <NewBookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

const BookingsTable = ({
  bookings,
  loading,
  formatDate,
}: {
  bookings: Booking[];
  loading: boolean;
  formatDate: (d: string) => string;
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Car className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">لا توجد طلبات حجز</p>
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
              <TableHead className="text-right">لوحة السيارة</TableHead>
              <TableHead className="text-right">الموعد</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
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
                <TableCell>{booking.vehicle_plate}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(booking.scheduled_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[booking.status].variant}>
                    {statusMap[booking.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
