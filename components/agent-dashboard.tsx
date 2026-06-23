import { AlertTriangle, Inbox, Layers, LayoutDashboard, UserX } from "lucide-react";

import { AgentTicketBrowser } from "@/components/agent-ticket-browser";
import { NewTicketModal } from "@/components/new-ticket-modal";
import { StatCard } from "@/components/stat-card";
import type { SessionUser } from "@/lib/auth-helpers";
import { listTags } from "@/lib/services/tags";
import { getTicketMetrics, listTickets } from "@/lib/services/tickets";
import type { ListTicketsQuery } from "@/lib/validations";

export async function AgentDashboard({
  user,
  filters,
}: {
  user: SessionUser;
  filters: ListTicketsQuery;
}) {
  const [metrics, tags, tickets] = await Promise.all([
    getTicketMetrics(),
    listTags(),
    listTickets(user, { limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of all support tickets across XenFi.
          </p>
        </div>
        <NewTicketModal buttonLabel="New ticket" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={metrics.open}
          icon={Inbox}
          accent="text-blue-500"
        />
        <StatCard
          label="Unassigned"
          value={metrics.unassigned}
          icon={UserX}
          accent="text-amber-500"
        />
        <StatCard
          label="High priority"
          value={metrics.byPriority.HIGH}
          icon={AlertTriangle}
          accent="text-red-500"
        />
        <StatCard
          label="Total tickets"
          value={metrics.total}
          icon={Layers}
          accent="text-slate-300"
        />
      </div>

      <AgentTicketBrowser
        initialTickets={tickets}
        tags={tags}
        initialFilters={filters}
      />
    </div>
  );
}
