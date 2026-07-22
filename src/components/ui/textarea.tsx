import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, id, label, name, ...props }: TextareaProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-bold text-[var(--foreground)]">{label}</span> : null}
      <textarea
        id={inputId}
        name={name}
        className={cn(
          "min-h-28 w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
    </label>
  );
}
