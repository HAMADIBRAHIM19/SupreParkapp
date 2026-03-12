import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Car, Clock, FileText, Send, Loader2 } from "lucide-react";
import LocationPickerMap, { LocationInfo } from "@/components/LocationPickerMap";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
}

// Fixed pricing: 39 SAR per booking
const calculatePrice = (): number => {
  return 39;
};

const NewBookingDialog = ({ open, onOpenChange, onBookingCreated }: NewBookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [form, setForm] = useState({
    vehicle_name: "",
    vehicle_plate: "",
    scheduled_at: "",
    notes: "",
  });

  const price = 39;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedLocation) {
      toast({ title: "خطأ", description: "يرجى تحديد موقع الحجز على الخريطة", variant: "destructive" });
      return;
    }

    setLoading(true);
    const locationText = [selectedLocation.name, selectedLocation.neighborhood, selectedLocation.city]
      .filter(Boolean)
      .join(" - ");

    // 1. Create booking
    const { data: booking, error } = await supabase.from("bookings").insert({
      seeker_id: user.id,
      location: locationText || selectedLocation.fullAddress,
      vehicle_name: form.vehicle_name || null,
      vehicle_plate: form.vehicle_plate,
      contact_number: form.contact_number || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      expected_arrival: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      notes: form.notes || null,
    }).select("id").single();

    if (error || !booking) {
      setLoading(false);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء الحجز", variant: "destructive" });
      return;
    }

    // 2. Redirect to Stripe checkout
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
      "create-booking-payment",
      { body: { bookingId: booking.id, amount: 39 } }
    );

    setLoading(false);

    if (paymentError || !paymentData?.url) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء بدء عملية الدفع", variant: "destructive" });
      return;
    }

    // Reset form and redirect
    setForm({ vehicle_name: "", vehicle_plate: "", contact_number: "", scheduled_at: "", notes: "" });
    setSelectedLocation(null);
    onOpenChange(false);
    onBookingCreated();
    window.open(paymentData.url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">طلب حجز جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Map */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              حدد موقع الحجز على الخريطة
            </Label>
            <LocationPickerMap
              onLocationSelect={setSelectedLocation}
              selectedLocation={selectedLocation}
            />
          </div>

          {/* Vehicle Name */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_name" className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              اسم السيارة
            </Label>
            <Input
              id="vehicle_name"
              required
              placeholder="مثال: تويوتا كامري"
              value={form.vehicle_name}
              onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })}
            />
          </div>

          {/* Vehicle Plate */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_plate" className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              لوحة السيارة
            </Label>
            <Input
              id="vehicle_plate"
              required
              placeholder="مثال: أ ب ج ١٢٣٤"
              value={form.vehicle_plate}
              onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })}
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="contact_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              رقم التواصل
            </Label>
            <Input
              id="contact_number"
              required
              type="tel"
              placeholder="مثال: 05XXXXXXXX"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
            />
          </div>

          {/* Expected Arrival */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              الوقت المتوقع للوصول
            </Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>

          {/* Fixed Price Display */}
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">تكلفة الحجز</p>
            <p className="text-2xl font-black text-primary">39 ر.س</p>
            <p className="text-xs text-muted-foreground mt-1">
              سعر ثابت لجميع الحجوزات
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              ملاحظات (اختياري)
            </Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full rounded-xl font-bold gap-2 text-base" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? "جاري المعالجة..." : `إرسال والدفع${price ? ` (${price} ر.س)` : ""}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
