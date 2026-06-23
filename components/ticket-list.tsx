import { Inbox, MessageSquare } from "lucide-react";
import Link from "next/link";

import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import type { TicketListItem } from "@/lib/services/tickets";
import { formatDate } from "@/lib/utils";

export function TicketList({
  tickets,
  showCustomer = false,
}: {
  tickets: TicketListItem[];
  showCustomer?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Inbox className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          No tickets found
        </p>
        <p className="text-sm text-slate-500">
          Tickets will appear here once created.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            href={`/tickets/${ticket.id}`}
            className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-slate-900">
                  {ticket.title}
                </p>
              </div>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                {ticket.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>#{ticket.id.slice(-6)}</span>
                <span>{formatDate(ticket.createdAt)}</span>
                {showCustomer && <span>by {ticket.customer.name}</span>}
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {ticket._count.comments}
                </span>
                {ticket.agent ? (
                  <span>Assigned: {ticket.agent.name}</span>
                ) : (
                  <span className="text-amber-600">Unassigned</span>
                )}
                {ticket.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
