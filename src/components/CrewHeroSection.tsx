import { HandHelping, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CrewHeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5" />
      <div className="absolute top-20 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 text-center" dir="rtl">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold mb-8">
          <HandHelping className="w-4 h-4" />
          <span>ابدأ باستقبال الطلبات الآن</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
          كن{" "}
          <span className="text-primary relative">
            الحاجز
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <br />
          واكسب من وقتك
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          استقبل طلبات حجز المواقف من الباحثين القريبين منك، تواصل معهم، واحجز لهم الموقف. اكسب دخل إضافي بكل سهولة!
        </p>

        <Button
          size="lg"
          className="rounded-xl gap-2 px-8 font-bold text-base"
          onClick={() => navigate("/dashboard")}
        >
          افتح لوحة التحكم
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center justify-center gap-8 md:gap-16 mt-14">
          {[
            { value: "+1,200", label: "حاجز نشط" },
            { value: "+5,000", label: "طلب تم إنجازه" },
            { value: "4.9⭐", label: "تقييم الحاجزين" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrewHeroSection;
