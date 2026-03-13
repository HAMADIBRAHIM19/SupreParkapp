import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate";
  return (
    <section className="py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="relative bg-primary rounded-3xl p-12 md:p-20 text-center overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-primary-foreground mb-6">
              جاهز تحجز موقفك؟
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-10 text-lg">
              انضم لآلاف المستخدمين اللي وفّروا وقتهم وأعصابهم مع Parklet
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl px-8 gap-2 text-base"
              >
                ابدأ الآن
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 font-bold rounded-xl px-8 text-base"
              >
                سجّل كحاجز
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
