import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#1e3350] bg-[#0b1f3a]/82 p-5 shadow-lg shadow-black/15",
        className
      )}
      {...props}
    />
  );
}
