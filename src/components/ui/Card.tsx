import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof paddingClasses;
  hover?: boolean;
  elevated?: boolean;
}

export default function Card({ padding = "md", hover = false, elevated = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200",
        elevated ? "shadow-[0_2px_10px_rgba(15,23,42,0.06)]" : "shadow-sm",
        hover && "card-hover",
        paddingClasses[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
