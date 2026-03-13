import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message
      );
    } else {
      toast.success("تم تسجيل الدخول بنجاح!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-black">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="text-right pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "جارٍ تسجيل الدخول..." : (
                <>
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              سجّل الآن
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
