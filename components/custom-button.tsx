"use client";

import { Button, ButtonProps } from "./ui/button";
import { useFormStatus } from "react-dom";

export const CustomButton = ({ children, ...props }: ButtonProps) => {
  const { pending } = useFormStatus();
  return <Button {...props} disabled={pending}>{children}</Button>;
};
