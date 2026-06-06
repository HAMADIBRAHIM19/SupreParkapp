import { MapPin } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const [search, setSearch] = useState("");
  const { t, dir } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 text-center" dir={dir}>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8">
          <MapPin className="w-4 h-4" />
          <span>{t("heroBadge")}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
          {t("heroTitle1")}{" "}
          <span className="text-primary relative">
            {t("heroSpot")}
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <br />
          {t("heroTitle2")}
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("heroDesc")}
        </p>

      </div>
    </section>
  );
};

export default HeroSection;
