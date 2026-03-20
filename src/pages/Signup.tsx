import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, UserPlus, Eye, EyeOff, Search, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Signup = () => {
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();
  const [formData, setFormData] = useState({
    email: "", password: "", username: "", fullName: "", accountType: "seeker" as "seeker" | "crew",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) { toast.error(t("passwordMin")); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email, password: formData.password,
      options: {
        data: { username: formData.username, full_name: formData.fullName, account_type: formData.accountType },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) { toast.error(error.message); } else { toast.success(t("signupSuccess")); navigate("/login"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8" dir={dir}>
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
          <CardTitle className="text-2xl font-black">{t("signupTitle")}</CardTitle>
          <CardDescription>{t("signupDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input id="fullName" placeholder={lang === "ar" ? "محمد أحمد" : "John Doe"} value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input id="username" placeholder="mohammed_99" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" placeholder="example@email.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} required dir="ltr" className={`${dir === "rtl" ? "text-right" : ""} pl-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Label>{t("accountType")}</Label>
              <RadioGroup value={formData.accountType} onValueChange={(val) => handleChange("accountType", val)} className="grid grid-cols-2 gap-3">
                <Label htmlFor="seeker" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.accountType === "seeker" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <RadioGroupItem value="seeker" id="seeker" className="sr-only" />
                  <Search className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold text-center">{t("seekerLabel")}</span>
                </Label>
                <Label htmlFor="crew" className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.accountType === "crew" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <RadioGroupItem value="crew" id="crew" className="sr-only" />
                  <Users className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold text-center">{t("crewLabel")}</span>
                </Label>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? t("creatingAccount") : (<><UserPlus className="w-4 h-4" />{t("createAccount")}</>)}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("hasAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">{t("loginNow")}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
