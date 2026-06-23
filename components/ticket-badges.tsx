import { Badge } from "@/components/ui/badge";
import type {
  TicketPriority,
  TicketStatus,
} from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: "bg-slate-800 text-slate-300",
  MEDIUM: "bg-indigo-100 text-indigo-700",
  HIGH: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge className={cn(PRIORITY_STYLES[priority])}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}
