import { Wallet, Clock, MapPin, Star, Bell, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CrewFeaturesSection = () => {
  const { t, dir } = useLanguage();

  const features = [
    { icon: Wallet, title: t("crewFeatIncome"), description: t("crewFeatIncomeDesc") },
    { icon: Clock, title: t("crewFeatFlex"), description: t("crewFeatFlexDesc") },
    { icon: MapPin, title: t("crewFeatNearby"), description: t("crewFeatNearbyDesc") },
    { icon: Star, title: t("crewFeatReputation"), description: t("crewFeatReputationDesc") },
    { icon: Bell, title: t("crewFeatNotif"), description: t("crewFeatNotifDesc") },
    { icon: ShieldCheck, title: t("crewFeatProtection"), description: t("crewFeatProtectionDesc") },
  ];

  return (
    <section className="py-24" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm">{t("crewWhyJoin")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">{t("crewFeatTitle")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="group p-6 rounded-2xl border bg-card hover:bg-primary/5 transition-colors cursor-default">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrewFeaturesSection;
