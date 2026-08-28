import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Save, User, Mail, Lock, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user, loading: authLoading, profile, refreshProfile, signOut } = useAuth();
  const { t, dir, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success(t("accountDeleted"));
      await signOut();
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || t("deleteError"));
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      if (profile) setFullName(profile.full_name);
    }
  }, [user, profile]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error(t("nameRequired")); return; }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("user_id", user!.id);
    if (error) { toast.error(t("nameUpdateError")); } else { toast.success(t("nameUpdated")); await refreshProfile(); }
    setSavingName(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error(t("emailRequired")); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) { toast.error(error.message); } else { toast.success(t("emailConfirmSent")); }
    setSavingEmail(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error(t("passwordMinSetting")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("passwordMismatch")); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); } else { toast.success(t("passwordUpdated")); setNewPassword(""); setConfirmPassword(""); }
    setSavingPassword(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir={dir}>
      <div className="container mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black text-foreground">{t("accountSettings")}</h1>
        </div>

        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t("language")}</CardTitle>
            </div>
            <CardDescription>{t("languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant={lang === "ar" ? "default" : "outline"} size="sm" onClick={() => setLang("ar")} className="font-semibold">
                {t("arabic")}
              </Button>
              <Button variant={lang === "en" ? "default" : "outline"} size="sm" onClick={() => setLang("en")} className="font-semibold">
                {t("english")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t("notificationsSection")}</CardTitle>
            </div>
            <CardDescription>{t("notificationsPromptDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {notifPerm === "granted" ? (
              <p className="text-sm text-muted-foreground">{t("notificationsAlreadyEnabled")}</p>
            ) : notifPerm === "denied" ? (
              <p className="text-sm text-muted-foreground">{t("notificationsDenied")}</p>
            ) : notifPerm === "unsupported" ? (
              <p className="text-sm text-muted-foreground">{t("notificationsUnsupported")}</p>
            ) : (
              <Button size="sm" onClick={handleEnableNotifications} className="gap-2">
                <Bell className="w-4 h-4" />
                {t("enableNotifications")}
              </Button>
            )}
          </CardContent>
        </Card>


        {/* Full Name */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t("fullNameSetting")}</CardTitle>
            </div>
            <CardDescription>{t("fullNameDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("fullName")} required />
              <Button type="submit" size="sm" disabled={savingName} className="gap-2">
                <Save className="w-4 h-4" />
                {savingName ? t("saving") : t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t("emailSetting")}</CardTitle>
            </div>
            <CardDescription>{t("emailDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
              <Button type="submit" size="sm" disabled={savingEmail} className="gap-2">
                <Save className="w-4 h-4" />
                {savingEmail ? t("saving") : t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Password */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t("passwordSetting")}</CardTitle>
            </div>
            <CardDescription>{t("passwordDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="space-y-2">
                <Label>{t("newPassword")}</Label>
                <div className="relative">
                  <Input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required dir="ltr" className={`${dir === "rtl" ? "text-right" : ""} pl-10`} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("confirmPassword")}</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required dir="ltr" className={dir === "rtl" ? "text-right" : ""} />
              </div>
              <Button type="submit" size="sm" disabled={savingPassword} className="gap-2">
                <Save className="w-4 h-4" />
                {savingPassword ? t("saving") : t("updatePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Delete Account */}
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              <CardTitle className="text-lg text-destructive">{t("deleteAccount")}</CardTitle>
            </div>
            <CardDescription>{t("deleteAccountDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2" disabled={deleting}>
                  <Trash2 className="w-4 h-4" />
                  {deleting ? t("deletingAccount") : t("deleteAccountBtn")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={dir}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteAccountConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("deleteAccountConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("confirmDeleteAccount")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
