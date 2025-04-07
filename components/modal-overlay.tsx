import { ReactNode } from "react";

interface ModalOverlayProps {
  children: ReactNode;
  className?: string;
}

export function ModalOverlay({ children, className = "" }: ModalOverlayProps) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-black/50 z-50 ${className}`}>
      {children}
    </div>
  );
} 