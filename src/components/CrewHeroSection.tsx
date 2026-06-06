import { useState, useEffect } from "react";
import { HandHelping, ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const CrewHeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .is("crew_id", null)
      .eq("status", "pending")
      .then(({ count }) => {
        if (count !== null) setPendingCount(count);
      });
  }, [user]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5" />
      <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 text-center" dir={dir}>
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold mb-8">
          <HandHelping className="w-4 h-4" />
          <span>{t("crewBadge")}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
          {t("crewHeroTitle1")}{" "}
          <span className="text-primary relative">
            {t("crewHeroSpot")}
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <br />
          {t("crewHeroTitle2")}
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("crewHeroDesc")}
        </p>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-3 rounded-2xl text-base font-bold mb-6">
            <Inbox className="w-5 h-5" />
            <span>{pendingCount} {t("crewAvailable")}</span>
          </div>
        )}

        <div>
          <Button size="lg" className="rounded-xl gap-2 px-8 font-bold text-base" onClick={() => navigate("/dashboard")}>
            {t("openDashboard")}
            <Arrow className="w-5 h-5" />
          </Button>
        </div>

      </div>
    </section>
  );
};

export default CrewHeroSection;
