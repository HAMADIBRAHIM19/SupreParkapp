import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

const Index = () => {
  const { user, loading } = useAuth();
  const [accountType, setAccountType] = useState<string | null>(null);

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
    </div>
  );
};

export default Index;
