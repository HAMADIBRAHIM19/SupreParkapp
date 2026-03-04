import { MapPin, UserCheck, Car } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "حدد وجهتك",
    description: "اكتب الموقع اللي تبي تروحه وحدد الوقت المتوقع لوصولك.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: UserCheck,
    title: "اختر الحاجز",
    description: "تصفح قائمة الحاجزين القريبين واختر الأنسب حسب التقييم والسعر.",
    color: "bg-accent/15 text-accent-foreground",
  },
  {
    icon: Car,
    title: "وصّل واركن",
    description: "الحاجز يحفظ لك الموقف حتى توصل. استلم موقفك بكل راحة!",
    color: "bg-primary/10 text-primary",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-muted/30" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-wide">كيف يعمل؟</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">
            ثلاث خطوات بس
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            عملية سهلة وسريعة تخلّيك تحصل موقف بدون عناء
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative bg-card rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow group"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-lg shadow-md">
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

export default HowItWorks;
