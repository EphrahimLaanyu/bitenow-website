import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/15 bg-[var(--badge-bg)] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[var(--accent)]",
        className
      )}
      {...props}
    />
  );
}
