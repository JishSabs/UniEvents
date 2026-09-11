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
}

export default function Card({ padding = "md", hover = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm",
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
