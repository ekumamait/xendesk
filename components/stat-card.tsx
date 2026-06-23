import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-slate-300",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <Icon className={cn("h-5 w-5", accent)} />
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
    </Card>
  );
}
