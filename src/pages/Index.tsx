import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import CrewHeroSection from "@/components/CrewHeroSection";
import CrewHowItWorks from "@/components/CrewHowItWorks";
import CrewFeaturesSection from "@/components/CrewFeaturesSection";
import NewBookingDialog from "@/components/NewBookingDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setAccountType(null);
      return;
    }
    supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setAccountType(data.account_type);
      });
  }, [user]);

  const isCrew = accountType === "crew";
  const isSeeker = user && accountType === "seeker";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {isCrew ? (
          <>
            <CrewHeroSection />
            <CrewHowItWorks />
            <CrewFeaturesSection />
          </>
        ) : (
          <>
            <HeroSection />
            <HowItWorks />
            <FeaturesSection />
            <CTASection />
          </>
        )}
      </main>
      <Footer />

      {/* Floating New Booking Button for Seeker */}
      {isSeeker && (
        <Button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-xl gap-2 px-5 h-14"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-base">طلب حجز جديد</span>
        </Button>
      )}

      {isSeeker && (
        <NewBookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onBookingCreated={() => {}}
        />
      )}
    </div>
  );
};

export default Index;
