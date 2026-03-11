import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("booking_id");
    if (!sessionId || !bookingId) {
      setVerifying(false);
      return;
    }

    supabase.functions
      .invoke("verify-payment", { body: { sessionId, bookingId } })
      .then(({ data }) => {
        setPaid(data?.paid ?? false);
        setVerifying(false);
      })
      .catch(() => setVerifying(false));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir="rtl">
      <div className="text-center max-w-md">
        {verifying ? (
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-3">
              {paid ? "تم الدفع بنجاح!" : "جاري التحقق..."}
            </h1>
            <p className="text-muted-foreground mb-8">
              {paid
                ? "تم تأكيد دفعتك وسيتم معالجة طلب الحجز الخاص بك قريباً"
                : "حدث خطأ أثناء التحقق من الدفع"}
            </p>
            <Button onClick={() => navigate("/dashboard")} className="rounded-xl font-bold px-8">
              الذهاب للوحة التحكم
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
