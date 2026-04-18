import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, LogIn, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? t("invalidCredentials") : error.message);
    } else {
      toast.success(t("loginSuccess"));
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className={`flex ${dir === "rtl" ? "justify-end" : "justify-start"}`}>
            <Button variant="ghost" size="sm" className="gap-1 font-semibold text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
              {t("backToHome")}
              <BackArrow className="w-4 h-4" />
            </Button>
          </div>
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-black">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className={`${dir === "rtl" ? "text-right" : ""} pl-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? t("loggingIn") : (<><LogIn className="w-4 h-4" />{t("loginBtn")}</>)}
            </Button>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("noAccount")}{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">{t("signupNow")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
