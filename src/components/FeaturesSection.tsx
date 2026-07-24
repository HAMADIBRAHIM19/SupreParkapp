import { Shield, Clock, Star, Wallet, MessageCircle, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const FeaturesSection = () => {
  const { t, dir } = useLanguage();

  const features = [
    { icon: Clock, title: t("featSaveTime"), description: t("featSaveTimeDesc"), tip: t("featSaveTimeTip") },
    { icon: Shield, title: t("featSafety"), description: t("featSafetyDesc"), tip: t("featSafetyTip") },
    { icon: Wallet, title: t("featPrice"), description: t("featPriceDesc"), tip: t("featPriceTip") },
    { icon: Star, title: t("featRating"), description: t("featRatingDesc"), tip: t("featRatingTip") },
    { icon: MessageCircle, title: t("featChat"), description: t("featChatDesc"), tip: t("featChatTip") },
    { icon: Navigation, title: t("featTracking"), description: t("featTrackingDesc"), tip: t("featTrackingTip") },
  ];

  return (
    <section className="py-24" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm">{t("whySuperParking")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">{t("featuresTitle")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="group p-6 rounded-2xl border bg-card hover:bg-primary/5 transition-colors cursor-default">
              <InfoTooltip tip={feature.tip}>
                <button type="button" aria-label={feature.tip} className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <feature.icon className="w-6 h-6" />
                </button>
              </InfoTooltip>
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
