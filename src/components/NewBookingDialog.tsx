import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
}

const NewBookingDialog = ({ open, onOpenChange, onBookingCreated }: NewBookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    location: "",
    vehicle_plate: "",
    scheduled_at: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      seeker_id: user.id,
      location: form.location,
      vehicle_plate: form.vehicle_plate,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء الحجز", variant: "destructive" });
      return;
    }

    toast({ title: "تم بنجاح", description: "تم إنشاء طلب الحجز بنجاح" });
    setForm({ location: "", vehicle_plate: "", scheduled_at: "", notes: "" });
    onOpenChange(false);
    onBookingCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">طلب حجز جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">الموقع</Label>
            <Input
              id="location"
              required
              placeholder="أدخل موقع الحجز"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_plate">لوحة السيارة</Label>
            <Input
              id="vehicle_plate"
              required
              placeholder="مثال: أ ب ج ١٢٣٤"
              value={form.vehicle_plate}
              onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">الموعد</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
