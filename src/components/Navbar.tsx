import { Button } from "@/components/ui/button";
import { Car, LogOut, Settings, ShieldCheck, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationsBell from "@/components/NotificationsBell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { t, lang, setLang, dir } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b" dir={dir}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black text-foreground">Parklet</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("howItWorks")}</a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("features")}</a>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 font-semibold text-xs"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            <Globe className="w-4 h-4" />
            {lang === "ar" ? "EN" : "عربي"}
          </Button>

          {user ? (
            <>
              <NotificationsBell />
              {isAdmin && (
                <Button variant="ghost" size="sm" className="font-semibold gap-1" asChild>
                  <Link to="/admin"><ShieldCheck className="w-4 h-4" /> {t("admin")}</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="font-semibold" asChild>
                <Link to="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="font-semibold gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                {t("signOut")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-semibold" asChild>
                <Link to="/login">{t("login")}</Link>
              </Button>
              <Button size="sm" className="rounded-xl font-bold" asChild>
                <Link to="/signup">{t("signupFree")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
