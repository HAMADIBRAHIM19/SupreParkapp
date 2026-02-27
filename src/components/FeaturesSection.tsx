import { Shield, Clock, Star, Wallet, MessageCircle, Navigation } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "توفير الوقت",
    description: "ما تحتاج تلف وتدور، موقفك جاهز قبل ما توصل.",
  },
  {
    icon: Shield,
    title: "أمان وثقة",
    description: "جميع الحاجزين موثقين ومقيّمين من المستخدمين.",
  },
  {
    icon: Wallet,
    title: "أسعار معقولة",
    description: "ادفع فقط مبلغ بسيط مقابل راحة بالك.",
  },
  {
    icon: Star,
    title: "نظام تقييم",
    description: "قيّم تجربتك واختر الحاجزين الأعلى تقييماً.",
  },
  {
    icon: MessageCircle,
    title: "تواصل مباشر",
    description: "تواصل مع الحاجز مباشرة عبر الدردشة داخل التطبيق.",
  },
  {
    icon: Navigation,
    title: "تتبع مباشر",
    description: "تابع موقع الحاجز والموقف على الخريطة في الوقت الفعلي.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm">ليش Parklet؟</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">
            مميزات تخلّيك ترتاح
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

export default FeaturesSection;
