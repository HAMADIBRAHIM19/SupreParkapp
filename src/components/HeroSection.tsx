import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const HeroSection = () => {
  const [search, setSearch] = useState("");

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6 text-center" dir="rtl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8">
          <MapPin className="w-4 h-4" />
          <span>احجز موقفك قبل ما توصل</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
          ما تدور على{" "}
          <span className="text-primary relative">
            موقف
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <br />
          خلّ أحد يحجزه لك
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          تطبيق Parklet يربطك بأشخاص قريبين من وجهتك يحجزون لك موقف سيارة حتى توصل. وفّر وقتك وأعصابك!
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mt-14">
          {[
            { value: "+5,000", label: "موقف تم حجزه" },
            { value: "+1,200", label: "حاجز نشط" },
            { value: "4.9⭐", label: "تقييم المستخدمين" },
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

export default HeroSection;
