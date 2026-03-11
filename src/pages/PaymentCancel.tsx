import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir="rtl">
      <div className="text-center max-w-md">
        <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">تم إلغاء الدفع</h1>
        <p className="text-muted-foreground mb-8">
          تم إلغاء عملية الدفع. طلب الحجز لا يزال محفوظاً ويمكنك إعادة المحاولة من لوحة التحكم.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="rounded-xl font-bold px-8">
          الذهاب للوحة التحكم
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
