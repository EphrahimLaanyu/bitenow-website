import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#f97316]/35 bg-[#f97316]/12 px-2.5 py-1 text-xs font-semibold text-[#fdba74]",
        className
      )}
      {...props}
    />
  );
}
