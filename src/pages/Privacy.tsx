import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  const { lang, dir } = useLanguage();
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const ar = (
    <div className="space-y-6 leading-relaxed text-foreground">
      <p className="text-muted-foreground">آخر تحديث: 11 مايو 2026</p>
      <p>
        نحن في <strong>SuperParking</strong> نهتم بخصوصيتك. توضح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك
        عند استخدامك لتطبيقنا الذي يربط <strong>طالب الموقف</strong> بـ<strong>الطاقم</strong> الذي يحجز
        الموقف نيابةً عنه مقابل رسوم ثابتة.
      </p>

      <section>
        <h2 className="text-xl font-bold mb-2">1. البيانات التي نجمعها</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>بيانات الحساب: الاسم الكامل، البريد الإلكتروني، نوع الحساب (طالب موقف / طاقم).</li>
          <li>بيانات الموقع: إحداثيات GPS والعنوان الذي تختاره لإنشاء أو قبول طلب حجز.</li>
          <li>بيانات الحجز: وقت الطلب، الحالة، تقييمات الخدمة، وملاحظات الدردشة داخل التطبيق.</li>
          <li>بيانات المركبة (للطاقم): اسم السيارة ورقم اللوحة عند قبول الطلب.</li>
          <li>بيانات الدفع: تُعالَج بشكل آمن عبر <strong>Stripe</strong>، ولا نخزّن بيانات البطاقة على خوادمنا.</li>
          <li>بيانات المحفظة والسحب (للطاقم): سجل العمولة ومعلومات الحساب البنكي لطلبات السحب.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">2. كيف نستخدم بياناتك</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>مطابقة طالب الموقف مع الطاقم القريب وإتمام عملية الحجز.</li>
          <li>تتبّع موقع الطاقم لحظيًا لإظهار اقترابه من طالب الموقف.</li>
          <li>تمكين الدردشة داخل التطبيق وإرسال الإشعارات الفورية.</li>
          <li>معالجة المدفوعات (29 ريال للطلب) وصرف عمولة الطاقم (25%).</li>
          <li>تحسين الخدمة، منع الاحتيال، والامتثال للأنظمة.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">3. مشاركة البيانات</h2>
        <p>
          لا نبيع بياناتك. نشارك الحد الأدنى الضروري فقط مع:
        </p>
        <ul className="list-disc pr-6 space-y-1">
          <li>الطرف الآخر للحجز (الاسم وبيانات السيارة للطاقم، والموقع المختار لطالب الموقف).</li>
          <li>مزوّدي الخدمة: Supabase (قواعد البيانات والمصادقة)، Stripe (الدفع)، Google Maps (الخرائط والمواقع).</li>
          <li>الجهات الرسمية عند الطلب القانوني فقط.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">4. التواصل داخل التطبيق</h2>
        <p>
          يتم التواصل بين طالب الموقف والطاقم <strong>حصريًا عبر الدردشة المدمجة</strong>. لا نطلب ولا نعرض
          أرقام الهواتف الشخصية حمايةً لخصوصية المستخدمين.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">5. الموقع الجغرافي</h2>
        <p>
          نستخدم موقعك فقط أثناء استخدامك للتطبيق: لاختيار وجهتك (لطالب الموقف) أو لإظهار قربك من الموقع
          (للطاقم). يمكنك إيقاف صلاحية الموقع من إعدادات جهازك في أي وقت.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">6. حفظ البيانات</h2>
        <p>
          نحتفظ ببيانات الحساب والحجوزات طوال فترة استخدامك للخدمة ولفترة معقولة بعدها للوفاء
          بالمتطلبات القانونية والمحاسبية.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">7. حقوقك</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>الوصول إلى بياناتك وتعديلها من صفحة <Link to="/settings" className="text-primary underline">إعدادات الحساب</Link>.</li>
          <li>حذف حسابك نهائيًا من خلال خيار "حذف الحساب" في الإعدادات.</li>
          <li>إيقاف صلاحيات الموقع والإشعارات من إعدادات جهازك.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">8. أمان البيانات</h2>
        <p>
          نطبّق سياسات Row-Level Security وتشفير الاتصال (HTTPS) وعزل صلاحيات الوصول لحماية بياناتك.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">9. تعديلات على السياسة</h2>
        <p>
          قد نقوم بتحديث هذه السياسة من وقت لآخر، وسيتم إعلامك عند وجود تغييرات جوهرية.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">10. التواصل معنا</h2>
        <p>
          لأي استفسار يخص الخصوصية، يرجى التواصل معنا عبر صفحة{" "}
          <Link to="/support" className="text-primary underline">الدعم الفني</Link> داخل التطبيق.
        </p>
      </section>
    </div>
  );

  const en = (
    <div className="space-y-6 leading-relaxed text-foreground">
      <p className="text-muted-foreground">Last updated: May 11, 2026</p>
      <p>
        At <strong>SuperParking</strong>, we value your privacy. This Policy explains how we collect, use,
        and protect your data when you use our app, which connects a <strong>spot requester</strong> looking for
        a parking spot with a <strong>Crew</strong> member who reserves the spot on their behalf for a
        fixed fee.
      </p>

      <section>
        <h2 className="text-xl font-bold mb-2">1. Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account data: full name, email, account type (Spot requester / Crew).</li>
          <li>Location data: GPS coordinates and selected address used to create or accept a booking.</li>
          <li>Booking data: request time, status, ratings, and in-app chat messages.</li>
          <li>Vehicle data (Crew): car name and plate number provided on acceptance.</li>
          <li>Payment data: securely processed via <strong>Stripe</strong>; we do not store card details on our servers.</li>
          <li>Wallet and withdrawal data (Crew): commission history and bank details for withdrawals.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">2. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Match spot requesters with nearby Crew and complete bookings.</li>
          <li>Track Crew location in real time to show proximity to the spot requester.</li>
          <li>Enable in-app chat and real-time notifications.</li>
          <li>Process payments (29 SAR per booking) and pay Crew commission (25%).</li>
          <li>Improve the service, prevent fraud, and comply with regulations.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">3. Data Sharing</h2>
        <p>We do not sell your data. We share only what is strictly necessary with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>The other party in a booking (Crew name and vehicle for the spot requester; selected location for the Crew).</li>
          <li>Service providers: Supabase (database & auth), Stripe (payments), Google Maps (maps & places).</li>
          <li>Authorities, only when legally required.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">4. In-App Communication</h2>
        <p>
          Communication between spot requester and Crew happens <strong>exclusively through in-app chat</strong>.
          We do not request or display personal phone numbers to protect user privacy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">5. Location</h2>
        <p>
          We use your location only while you use the app: to set your destination (Spot requester) or to show
          your proximity to the spot (Crew). You can disable location permissions in your device
          settings at any time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">6. Data Retention</h2>
        <p>
          We retain account and booking data for the duration of your use of the service and for a
          reasonable period afterwards to meet legal and accounting requirements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">7. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access and edit your data from <Link to="/settings" className="text-primary underline">Account Settings</Link>.</li>
          <li>Permanently delete your account via the "Delete Account" option in Settings.</li>
          <li>Disable location and notification permissions from your device settings.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">8. Security</h2>
        <p>
          We apply Row-Level Security policies, encrypted connections (HTTPS), and strict access
          controls to protect your data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">9. Policy Changes</h2>
        <p>We may update this Policy occasionally and will notify you of any material changes.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">10. Contact Us</h2>
        <p>
          For any privacy questions, please reach us via the{" "}
          <Link to="/support" className="text-primary underline">Support</Link> page inside the app.
        </p>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 pt-24 pb-12">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
          <Link to="/">
            <BackArrow className="w-4 h-4" />
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground">
            {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">{lang === "ar" ? ar : en}</CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
