import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  seekerId: string;
  crewId: string;
  onRated: () => void;
}

const RatingDialog = ({ open, onOpenChange, bookingId, seekerId, crewId, onRated }: RatingDialogProps) => {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("ratings").insert({
      booking_id: bookingId,
      seeker_id: seekerId,
      crew_id: crewId,
      rating,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t("error"), description: t("errorOccurred"), variant: "destructive" });
    } else {
      toast({ title: t("success"), description: t("ratingSubmitted") });
      onRated();
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onRated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t("rateCrewTitle")}</DialogTitle>
          <DialogDescription className="text-center">{t("rateCrewDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 my-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  "w-10 h-10 transition-colors",
                  (hoveredStar || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-muted-foreground mb-2">
            {rating} / 5
          </p>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={rating === 0 || submitting} onClick={handleSubmit}>
            {submitting ? t("submitting") : t("submitRating")}
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            {t("skipRating")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
