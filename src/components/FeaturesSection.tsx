import { Shield, Clock, Star, Wallet, MessageCircle, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = () => {
  const { t, dir } = useLanguage();

  const features = [
    { icon: Clock, title: t("featSaveTime"), description: t("featSaveTimeDesc") },
    { icon: Shield, title: t("featSafety"), description: t("featSafetyDesc") },
    { icon: Wallet, title: t("featPrice"), description: t("featPriceDesc") },
    { icon: Star, title: t("featRating"), description: t("featRatingDesc") },
    { icon: MessageCircle, title: t("featChat"), description: t("featChatDesc") },
    { icon: Navigation, title: t("featTracking"), description: t("featTrackingDesc") },
  ];

  return (
    <section className="py-24" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm">{t("whyParklet")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">{t("featuresTitle")}</h2>
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

export default FeaturesSection;
