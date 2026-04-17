import { useState, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  tip: string;
  children: ReactNode;
}

/**
 * Tooltip that works on both desktop (hover) and mobile (tap).
 * Uses controlled state to toggle on click for touch devices.
 */
export const InfoTooltip = ({ tip, children }: InfoTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onClick={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
