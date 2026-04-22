import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const { t, dir } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir={dir}>
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-lg">
            <img src="/pwa-icon-512.png" alt="Parkplus" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t("installTitle")}</h1>
            <p className="text-muted-foreground">{t("installDesc")}</p>
          </div>
          {installed ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">{t("installed")}</span>
            </div>
          ) : isIOS ? (
            <div className={`space-y-3 bg-muted/50 rounded-xl p-4 text-sm ${dir === "rtl" ? "text-right" : "text-left"}`}>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Smartphone className="w-5 h-5" />
                <span>{t("iosSteps")}</span>
              </div>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>{t("iosStep1")}</li>
                <li>{t("iosStep2")}</li>
                <li>{t("iosStep3")}</li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" className="w-full gap-2 text-base" onClick={handleInstall}>
              <Download className="w-5 h-5" />
              {t("installBtn")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("openInBrowser")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
