import { CheckCircle2, Clock, LayoutDashboard, Ticket } from "lucide-react";

import { NewTicketModal } from "@/components/new-ticket-modal";
import { StatCard } from "@/components/stat-card";
import { TicketList } from "@/components/ticket-list";
import type { SessionUser } from "@/lib/auth-helpers";
import { listTickets } from "@/lib/services/tickets";

export async function CustomerDashboard({ user }: { user: SessionUser }) {
  const tickets = await listTickets(user, {});
  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track the status of your support requests.
          </p>
        </div>
        <NewTicketModal buttonLabel="New ticket" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Open"
          value={open}
          icon={Ticket}
          accent="text-blue-500"
        />
        <StatCard
          label="In progress"
          value={inProgress}
          icon={Clock}
          accent="text-amber-500"
        />
        <StatCard
          label="Resolved"
          value={resolved}
          icon={CheckCircle2}
          accent="text-emerald-500"
        />
      </div>

      <TicketList tickets={tickets} />
    </div>
  );
}
