import { Inbox, MessageCircle, Navigation, ParkingSquare } from "lucide-react";

const steps = [
  {
    icon: Inbox,
    title: "استقبل الطلب",
    description: "تصلك طلبات حجز المواقف من الباحثين حسب الوجهة المختارة. اختر الطلب المناسب لك واقبله.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageCircle,
    title: "تواصل مع الباحث",
    description: "بعد قبول الطلب، تواصل مع الباحث لتنسيق التفاصيل وتأكيد الموقع والوقت المتوقع للوصول.",
    color: "bg-accent/15 text-accent-foreground",
  },
  {
    icon: Navigation,
    title: "توجّه للموقع",
    description: "انطلق إلى الوجهة المحددة قبل وصول الباحث وابحث عن موقف مناسب في المنطقة.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ParkingSquare,
    title: "احجز الموقف",
    description: "احجز الموقف وانتظر وصول الباحث. بمجرد وصوله واستلامه للموقف، أكمل الطلب واحصل على مكافأتك!",
    color: "bg-accent/15 text-accent-foreground",
  },
];

const CrewHowItWorks = () => {
  return (
    <section className="py-24 bg-muted/30" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-wide">كيف تعمل كحاجز؟</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">
            أربع خطوات بسيطة
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            عملية واضحة وسهلة تخلّيك تبدأ تكسب من وقتك
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative bg-card rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow group"
            >
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

export default CrewHowItWorks;
