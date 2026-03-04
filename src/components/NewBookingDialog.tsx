import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Car, Phone, Clock, FileText, Send } from "lucide-react";
import LocationPickerMap, { LocationInfo } from "@/components/LocationPickerMap";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
}

const NewBookingDialog = ({ open, onOpenChange, onBookingCreated }: NewBookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [form, setForm] = useState({
    vehicle_name: "",
    vehicle_plate: "",
    contact_number: "",
    scheduled_at: "",
    notes: "",
  });

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

    const { error } = await supabase.from("bookings").insert({
      seeker_id: user.id,
      location: locationText || selectedLocation.fullAddress,
      vehicle_name: form.vehicle_name || null,
      vehicle_plate: form.vehicle_plate,
      contact_number: form.contact_number || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      expected_arrival: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      notes: form.notes || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء الحجز", variant: "destructive" });
      return;
    }

    toast({ title: "تم بنجاح", description: "تم إنشاء طلب الحجز بنجاح" });
    setForm({ vehicle_name: "", vehicle_plate: "", contact_number: "", scheduled_at: "", notes: "" });
    setSelectedLocation(null);
    onOpenChange(false);
    onBookingCreated();
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
            <Send className="w-4 h-4" />
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
