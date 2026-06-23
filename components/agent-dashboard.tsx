import { AlertTriangle, Inbox, Layers, UserX } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { TicketFilters } from "@/components/ticket-filters";
import { TicketList } from "@/components/ticket-list";
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
    listTickets(user, filters),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Agent dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of all support tickets across XenFi.
        </p>
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
          accent="text-slate-500"
        />
      </div>

      <TicketFilters tags={tags} initial={filters} />

      <TicketList tickets={tickets} showCustomer />
    </div>
  );
}
