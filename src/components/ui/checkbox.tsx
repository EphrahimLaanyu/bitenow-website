import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-[#1e3350] bg-[#07111f] px-3 py-3 text-sm text-[#edf4ff]">
      <input
        className="h-4 w-4 accent-[#f97316]"
        type="checkbox"
        {...props}
      />
      {label}
    </label>
  );
}
