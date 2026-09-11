import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  className?: string;
}

export default function StatTile({ label, value, sublabel, className }: StatTileProps) {
  return (
    <div className={cn(className)}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {sublabel && <p className="text-sm text-slate-500 mt-1">{sublabel}</p>}
    </div>
  );
}
