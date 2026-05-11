import { Car } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t, dir } = useLanguage();

  return (
    <footer className="border-t py-12 bg-muted/20" dir={dir}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
             <span className="font-bold text-foreground">SuperPark</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("privacyPolicy")}
            </Link>
            <span className="text-muted-foreground">{t("allRightsReserved")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
