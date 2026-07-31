import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
};

const variants = {
  primary: "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/20 hover:bg-[var(--accent-hover)] hover:shadow-[0_12px_26px_rgba(255,98,8,0.28)] active:bg-[#cf4e04]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm hover:border-[var(--accent)]/40 hover:bg-[#fff7f2] hover:text-[var(--accent-hover)]",
  ghost: "text-[var(--muted-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
  accent: "bg-[var(--primary)] text-white shadow-[0_12px_30px_rgba(16,31,63,0.20)] hover:bg-[var(--primary-hover)] hover:shadow-[0_15px_32px_rgba(16,31,63,0.28)]",
  danger: "bg-[var(--danger)] text-white shadow-sm hover:brightness-95 hover:shadow-md"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
