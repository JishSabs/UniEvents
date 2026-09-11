import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(fieldBase, error ? "border-red-300" : "border-slate-200", className)}
    {...rest}
  />
));
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "resize-none", error ? "border-red-300" : "border-slate-200", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "bg-white", error ? "border-red-300" : "border-slate-200", className)}
    {...rest}
  />
));
Select.displayName = "Select";

export default Input;
