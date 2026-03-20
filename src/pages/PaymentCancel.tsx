import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="text-center max-w-md">
        <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">{t("paymentCancelled")}</h1>
        <p className="text-muted-foreground mb-8">{t("paymentCancelledDesc")}</p>
        <Button onClick={() => navigate("/dashboard")} className="rounded-xl font-bold px-8">{t("goToDashboard")}</Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
