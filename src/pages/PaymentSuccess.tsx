import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [verifying, setVerifying] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("booking_id");
    if (!sessionId || !bookingId) { setVerifying(false); return; }
    let timer: ReturnType<typeof setTimeout>;
    supabase.functions.invoke("verify-payment", { body: { sessionId, bookingId } })
      .then(({ data }) => {
        const ok = data?.paid ?? false;
        setPaid(ok);
        setVerifying(false);
        if (ok) timer = setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      })
      .catch(() => setVerifying(false));
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="text-center max-w-md">
        {verifying ? (
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-3">{paid ? t("paymentSuccess") : t("verifying")}</h1>
            <p className="text-muted-foreground mb-8">{paid ? t("paymentSuccessDesc") : t("paymentErrorDesc")}</p>
            <Button onClick={() => navigate("/dashboard")} className="rounded-xl font-bold px-8">{t("goToDashboard")}</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
