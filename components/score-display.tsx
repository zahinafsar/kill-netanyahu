import { ReactNode } from "react";

interface ScoreDisplayProps {
  label: string;
  value: number;
  className?: string;
}

export function ScoreDisplay({ label, value, className = "" }: ScoreDisplayProps) {
  return (
    <div className={`bg-slate-700 p-4 rounded-lg flex justify-between items-center ${className}`}>
      <span className="text-slate-300">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
} 