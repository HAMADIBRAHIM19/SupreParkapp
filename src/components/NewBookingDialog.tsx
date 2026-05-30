import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Car, Clock, FileText, Send, Loader2 } from "lucide-react";
import LocationPickerMap, { LocationInfo } from "@/components/LocationPickerMap";
import { openCheckout } from "@/lib/openCheckout";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
}

interface LocalPrice {
  currency: string;
  amount: number;
  amountMinor: number;
}

const BASE_PRICE = 29;
const BASE_CURRENCY = "SAR";

const NewBookingDialog = ({ open, onOpenChange, onBookingCreated }: NewBookingDialogProps) => {
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [form, setForm] = useState({ vehicle_name: "", vehicle_plate: "", scheduled_at: "", notes: "" });
  const [localPrice, setLocalPrice] = useState<LocalPrice>({ currency: BASE_CURRENCY, amount: BASE_PRICE, amountMinor: BASE_PRICE * 100 });
  const [priceLoading, setPriceLoading] = useState(false);

  // Detect user location once dialog opens and convert price
  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) return;
    setPriceLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data, error } = await supabase.functions.invoke("convert-price", {
            body: { lat: pos.coords.latitude, lng: pos.coords.longitude, amount: BASE_PRICE, baseCurrency: BASE_CURRENCY },
          });
          if (!error && data?.currency) {
            setLocalPrice({ currency: data.currency, amount: data.amount, amountMinor: data.amountMinor });
          }
        } catch (e) {
          console.error("convert-price failed", e);
        } finally {
          setPriceLoading(false);
        }
      },
      () => setPriceLoading(false),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, [open]);

  const priceLabel = new Intl.NumberFormat(lang === "ar" ? "ar" : "en", {
    style: "currency",
    currency: localPrice.currency,
    maximumFractionDigits: localPrice.amount >= 1000 ? 0 : 2,
  }).format(localPrice.amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedLocation) {
      toast({ title: t("error"), description: t("selectLocationError"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const locationText = [selectedLocation.name, selectedLocation.neighborhood, selectedLocation.city].filter(Boolean).join(" - ");
    const { data: booking, error } = await supabase.from("bookings").insert({
      seeker_id: user.id, location: locationText || selectedLocation.fullAddress,
      vehicle_name: form.vehicle_name || null, vehicle_plate: form.vehicle_plate,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      expected_arrival: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      notes: form.notes || null,
    }).select("id").single();

    if (error || !booking) {
      setLoading(false);
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
      return;
    }

    const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-booking-payment", {
      body: {
        bookingId: booking.id,
        amount: localPrice.amount,
        amountMinor: localPrice.amountMinor,
        currency: localPrice.currency.toLowerCase(),
      },
    });
    setLoading(false);
    if (paymentError || !paymentData?.url) {
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
      return;
    }
    setForm({ vehicle_name: "", vehicle_plate: "", scheduled_at: "", notes: "" });
    setSelectedLocation(null);
    onOpenChange(false);
    onBookingCreated();
    await openCheckout(paymentData.url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className={`${dir === "rtl" ? "text-right" : "text-left"} text-lg font-bold`}>{t("newBookingTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{t("selectLocation")}</Label>
            <LocationPickerMap onLocationSelect={setSelectedLocation} selectedLocation={selectedLocation} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_name" className="flex items-center gap-2"><Car className="w-4 h-4 text-primary" />{t("vehicleNameLabel")}</Label>
            <Input id="vehicle_name" required placeholder={lang === "ar" ? "مثال: تويوتا كامري" : "e.g. Toyota Camry"} value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_plate" className="flex items-center gap-2"><Car className="w-4 h-4 text-primary" />{t("vehiclePlateBooking")}</Label>
            <Input id="vehicle_plate" required placeholder={lang === "ar" ? "مثال: أ ب ج ١٢٣٤" : "e.g. ABC 1234"} value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_at" className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{t("expectedArrival")}</Label>
            <Input id="scheduled_at" type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{t("bookingCost")}</p>
            <p className="text-2xl font-black text-primary">
              {priceLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : priceLabel}
            </p>
            {localPrice.currency !== BASE_CURRENCY && (
              <p className="text-xs text-muted-foreground mt-1">
                {BASE_PRICE} {t("sar")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />{t("notes")}</Label>
            <Textarea id="notes" placeholder={lang === "ar" ? "أي ملاحظات إضافية..." : "Any additional notes..."} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button type="submit" className="w-full rounded-xl font-bold gap-2 text-base" disabled={loading || priceLoading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? t("processing") : `${t("submitAndPay")} (${priceLabel})`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
