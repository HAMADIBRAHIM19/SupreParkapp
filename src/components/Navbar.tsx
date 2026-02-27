import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b" dir="rtl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black text-foreground">Parklet</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">كيف يعمل؟</a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">المميزات</a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">الأسعار</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="font-semibold">
            تسجيل دخول
          </Button>
          <Button size="sm" className="rounded-xl font-bold">
            سجّل مجاناً
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
