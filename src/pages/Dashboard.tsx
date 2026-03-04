import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard } from "lucide-react";
import SeekerDashboard from "@/components/SeekerDashboard";
import CrewDashboard from "@/components/CrewDashboard";
import type { Booking } from "@/types/booking";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ account_type: string; full_name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("account_type, full_name")
        .eq("user_id", user.id)
        .single();
      if (profileData) setProfile(profileData);
      await fetchBookings();
    };

    init();
  }, [user]);

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
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="pt-20 pb-12 container mx-auto px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            مرحباً{profile ? `, ${profile.full_name}` : ""}
          </h1>
        </div>

        {profile?.account_type === "crew" ? (
          <CrewDashboard bookings={bookings} loading={loading} onRefresh={fetchBookings} />
        ) : (
          <SeekerDashboard bookings={bookings} loading={loading} onBookingCreated={fetchBookings} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
