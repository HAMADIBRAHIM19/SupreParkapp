import { Button } from "@/components/ui/button";
import { Car, LogOut, Settings, ShieldCheck, Globe, HeadsetIcon, LayoutDashboard, Menu, X, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationsBell from "@/components/NotificationsBell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { t, lang, setLang, dir } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const mobileNav = (to: string) => {
    setMobileOpen(false);
    navigate(to);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b" dir={dir}>
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black text-foreground">Parklet</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("howItWorks")}</a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("features")}</a>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    {t("accountSettings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/support")} className="gap-2 cursor-pointer">
                    <HeadsetIcon className="w-4 h-4" />
                    {t("support")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          {user && <NotificationsBell />}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 p-0">
              <SheetHeader className="p-4 pb-2 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-black text-lg">Parklet</span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col py-2">
                {/* Language toggle */}
                <button
                  onClick={() => { setLang(lang === "ar" ? "en" : "ar"); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {lang === "ar" ? "English" : "العربية"}
                </button>

                <div className="h-px bg-border mx-4 my-1" />

                {user ? (
                  <>
                    <button
                      onClick={() => mobileNav("/dashboard")}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t("dashboard")}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => mobileNav("/admin")}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {t("admin")}
                      </button>
                    )}

                    <button
                      onClick={() => mobileNav("/settings")}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t("accountSettings")}
                    </button>

                    <button
                      onClick={() => mobileNav("/support")}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <HeadsetIcon className="w-4 h-4" />
                      {t("support")}
                    </button>

                    <div className="h-px bg-border mx-4 my-1" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("signOut")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => mobileNav("/login")}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      {t("login")}
                    </button>
                    <button
                      onClick={() => mobileNav("/signup")}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary font-bold hover:bg-accent transition-colors"
                    >
                      {t("signupFree")}
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
