import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ children, className, id, label, name, ...props }: SelectProps) {
  const inputId = id ?? name;

  return (
    <label className="block space-y-2" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-[#edf4ff]">{label}</span> : null}
      <select
        className={cn(
          "h-11 w-full rounded-md border border-[#1e3350] bg-[#07111f] px-3 text-sm text-white outline-none transition-colors focus:border-[#f97316] disabled:cursor-not-allowed disabled:opacity-60",
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
