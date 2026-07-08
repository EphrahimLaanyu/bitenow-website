import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, id, label, name, ...props }: TextareaProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-[#edf4ff]">{label}</span> : null}
      <textarea
        id={inputId}
        name={name}
        className={cn(
          "min-h-28 w-full resize-y rounded-md border border-[#1e3350] bg-[#07111f] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#60758f] focus:border-[#f97316] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
    </label>
  );
}
