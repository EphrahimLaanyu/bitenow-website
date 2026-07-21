import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, id, label, name, ...props }: InputProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-bold text-[var(--foreground)]">{label}</span> : null}
      <input
        id={inputId}
        name={name}
        className={cn(
          "h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
    </label>
  );
}
