import { ReactNode } from "react";

interface FormContainerProps {
  children: ReactNode;
  title: string;
  className?: string;
}

export function FormContainer({ children, title, className = "" }: FormContainerProps) {
  return (
    <div className={`bg-slate-800 p-10 rounded-xl flex flex-col items-center max-w-md w-full mx-4 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
      {children}
    </div>
  );
} 