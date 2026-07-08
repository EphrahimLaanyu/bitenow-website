import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, id, label, name, ...props }: InputProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-[#edf4ff]">{label}</span> : null}
      <input
        id={inputId}
        name={name}
        className={cn(
          "h-11 w-full rounded-md border border-[#1e3350] bg-[#07111f] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#60758f] focus:border-[#f97316]",
          className
        )}
        {...props}
      />
    </label>
  );
}
