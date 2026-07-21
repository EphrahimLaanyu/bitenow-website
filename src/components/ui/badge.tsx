import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles for all badges
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
        
        // Variants
        variant === "default" && "bg-slate-900 text-slate-50 border border-transparent",
        variant === "secondary" && "bg-slate-100 text-slate-700 border border-transparent",
        variant === "outline" && "text-slate-600 border border-slate-200",
        variant === "destructive" && "bg-red-50 text-red-700 border border-red-200",
        
        // Allow custom classes to override when needed
        className
      )}
      {...props}
    />
  );
}