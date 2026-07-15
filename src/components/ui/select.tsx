import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ children, className, id, label, name, ...props }: SelectProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-bold text-[var(--foreground)]">{label}</span> : null}
      <select
        className={cn(
          "h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        id={inputId}
        name={name}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
