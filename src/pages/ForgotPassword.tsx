import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("resetLinkSent"));
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className={`flex ${dir === "rtl" ? "justify-end" : "justify-start"}`}>
            <Button variant="ghost" size="sm" className="gap-1 font-semibold text-muted-foreground hover:text-foreground" onClick={() => navigate("/login")}>
              {t("backToLogin")}
              <BackArrow className="w-4 h-4" />
            </Button>
          </div>
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-black">{t("forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("forgotPasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{t("resetLinkSent")}</p>
              <Button onClick={() => navigate("/login")} className="w-full font-bold">
                {t("backToLogin")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? t("sendingResetLink") : (<><Mail className="w-4 h-4" />{t("sendResetLink")}</>)}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/login" className="text-primary font-semibold hover:underline">{t("backToLogin")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
