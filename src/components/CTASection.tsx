import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const CTASection = () => {
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="relative bg-primary rounded-3xl p-12 md:p-20 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-primary-foreground mb-6">{t("ctaTitle")}</h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-10 text-lg">{t("ctaDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/signup")} className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl px-8 gap-2 text-base">
                {t("ctaStart")}
                <Arrow className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/signup")} className="border-green-500 text-green-600 hover:bg-green-50 font-bold rounded-xl px-8 text-base">
                {t("ctaSignupCrew")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
