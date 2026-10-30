import type { ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Themed tooltip (replaces the browser's native title tooltip, which can't be styled). */
export function Tip({ label, children, side = "top" }: { label: ReactNode; children: ReactElement; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className="rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xl shadow-black/50">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
