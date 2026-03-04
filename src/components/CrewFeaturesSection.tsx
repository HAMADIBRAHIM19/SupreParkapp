import { Wallet, Clock, MapPin, Star, Bell, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "دخل إضافي",
    description: "اكسب مبلغ مقابل كل موقف تحجزه للباحثين.",
  },
  {
    icon: Clock,
    title: "مرونة الوقت",
    description: "اشتغل بالوقت اللي يناسبك بدون التزام.",
  },
  {
    icon: MapPin,
    title: "طلبات قريبة",
    description: "استقبل طلبات من مواقع قريبة منك.",
  },
  {
    icon: Star,
    title: "بناء سمعة",
    description: "كل طلب مكتمل يرفع تقييمك ويزيد فرصك.",
  },
  {
    icon: Bell,
    title: "إشعارات فورية",
    description: "تنبيهات مباشرة عند وصول طلبات جديدة.",
  },
  {
    icon: ShieldCheck,
    title: "حماية وضمان",
    description: "نظام آمن يحفظ حقوقك كحاجز.",
  },
];

const CrewFeaturesSection = () => {
  return (
    <section className="py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm">ليش تنضم كحاجز؟</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">
            مميزات تخلّيك تبدأ اليوم
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border bg-card hover:bg-primary/5 transition-colors cursor-default"
            >
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
