import { Inbox, MessageCircle, Navigation, ParkingSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CrewHowItWorks = () => {
  const { t, dir } = useLanguage();

  const steps = [
    { icon: Inbox, title: t("crewStep1Title"), description: t("crewStep1Desc"), color: "bg-primary/10 text-primary" },
    { icon: MessageCircle, title: t("crewStep2Title"), description: t("crewStep2Desc"), color: "bg-accent/15 text-accent-foreground" },
    { icon: Navigation, title: t("crewStep3Title"), description: t("crewStep3Desc"), color: "bg-primary/10 text-primary" },
    { icon: ParkingSquare, title: t("crewStep4Title"), description: t("crewStep4Desc"), color: "bg-accent/15 text-accent-foreground" },
  ];

  return (
    <section className="py-24 bg-muted/30" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-wide">{t("crewHowLabel")}</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">{t("crewHowTitle")}</h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">{t("crewHowDesc")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="relative bg-card rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow group">
              <div className={`absolute -top-4 ${dir === "rtl" ? "-right-4" : "-left-4"} w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-lg shadow-md`}>
                {index + 1}
              </div>
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrewHowItWorks;
