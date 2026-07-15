import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "whatsapp" | "ghost";

// Sage button styles. WhatsApp green is used ONLY for the whatsapp variant.
const styles: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-[#7A2450] hover:shadow active:translate-y-px",
  outline: "border border-primary text-primary hover:bg-[#FAEEF3]",
  whatsapp: "bg-whatsapp text-whatsapp-foreground shadow-sm hover:brightness-95 active:translate-y-px",
  ghost: "text-ink hover:bg-[#F1EFEB]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
