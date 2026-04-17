import { MapPin, UserCheck, Car } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const HowItWorks = () => {
  const { t, dir } = useLanguage();

  const steps = [
    { icon: MapPin, title: t("step1Title"), description: t("step1Desc"), tip: t("step1Tip"), color: "bg-primary/10 text-primary" },
    { icon: UserCheck, title: t("step2Title"), description: t("step2Desc"), tip: t("step2Tip"), color: "bg-accent/15 text-accent-foreground" },
    { icon: Car, title: t("step3Title"), description: t("step3Desc"), tip: t("step3Tip"), color: "bg-primary/10 text-primary" },
  ];

  return (
    <section className="py-24 bg-muted/30" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-wide">{t("howLabel")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">{t("howTitle")}</h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">{t("howDesc")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="relative bg-card rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow group">
              <div className={`absolute -top-4 ${dir === "rtl" ? "-right-4" : "-left-4"} w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-lg shadow-md`}>
                {index + 1}
              </div>
              <InfoTooltip tip={step.tip}>
                <button type="button" aria-label={step.tip} className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary`}>
                  <step.icon className="w-8 h-8" />
                </button>
              </InfoTooltip>
              <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
