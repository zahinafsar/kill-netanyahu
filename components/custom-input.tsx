import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function CustomInput({ label, error, className = "", ...props }: CustomInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 