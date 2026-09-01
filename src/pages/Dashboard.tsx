import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyBookingPayment } from "@/lib/verifyBookingPayment";

import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard } from "lucide-react";
import SeekerDashboard from "@/components/SeekerDashboard";
import CrewDashboard from "@/components/CrewDashboard";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import type { Booking } from "@/types/booking";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ account_type: string; full_name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: profileData } = await supabase.from("profiles").select("account_type, full_name").eq("user_id", user.id).single();
      if (profileData) setProfile(profileData);
      await fetchBookings();
    };
    init();
  }, [user]);

  // Refresh whenever the app/tab regains focus (e.g. returning from Stripe checkout)
  useEffect(() => {
    if (!user) return;
    const refresh = () => { if (document.visibilityState === "visible") fetchBookings(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user]);

  // Live updates: any booking change (e.g. payment confirmed) refreshes the list
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Polling fallback: when another crew accepts a request, row-level security hides
  // that booking from this crew, so no realtime event arrives — refetch periodically
  // so requests taken by someone else drop out of the available list.
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchBookings();
    }, 15000);
    return () => window.clearInterval(id);
  }, [user]);


  // Coming back from a successful payment: verify + refresh right away
  useEffect(() => {
    const paidBookingId = (location.state as { paidBookingId?: string } | null)?.paidBookingId;
    if (!user || !paidBookingId) return;
    navigate("/dashboard", { replace: true, state: null });
    (async () => {
      await verifyBookingPayment(paidBookingId, 4);
      await fetchBookings();
    })();
  }, [user, location.state]);


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
      <main className="pt-20 pb-12 container mx-auto px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("welcome")}{profile ? `, ${profile.full_name}` : ""}
          </h1>
        </div>
        <NotificationPermissionPrompt />
        {profile?.account_type === "crew" ? (
          <CrewDashboard bookings={bookings} loading={loading} onRefresh={fetchBookings} profileName={profile?.full_name} />
        ) : (
          <SeekerDashboard bookings={bookings} loading={loading} onBookingCreated={fetchBookings} profileName={profile?.full_name} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
