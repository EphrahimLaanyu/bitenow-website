import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
};

const variants = {
  primary: "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/20 hover:bg-[var(--accent-hover)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm hover:border-[var(--primary)] hover:bg-[var(--surface-3)]",
  ghost: "text-[var(--muted-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
  accent: "bg-[var(--primary)] text-white shadow-[0_12px_30px_rgba(16,31,63,0.20)] hover:bg-[var(--primary-hover)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-95"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
