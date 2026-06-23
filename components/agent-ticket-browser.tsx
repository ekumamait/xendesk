"use client";

import { useEffect, useMemo, useState } from "react";

import {
  TicketFilters,
  type TicketFilterState,
} from "@/components/ticket-filters";
import { TicketList } from "@/components/ticket-list";
import type { TicketListItem } from "@/lib/services/tickets";

function normalizeFilters(initial: Partial<TicketFilterState>): TicketFilterState {
  return {
    status: initial.status ?? "",
    priority: initial.priority ?? "",
    tagId: initial.tagId ?? "",
    q: initial.q ?? "",
  };
}

export function AgentTicketBrowser({
  initialTickets,
  tags,
  initialFilters,
}: {
  initialTickets: TicketListItem[];
  tags: { id: string; name: string }[];
  initialFilters: Partial<TicketFilterState>;
}) {
  const [sourceTickets, setSourceTickets] = useState<TicketListItem[]>(
    initialTickets,
  );
  const [filters, setFilters] = useState<TicketFilterState>(
    normalizeFilters(initialFilters),
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshTickets() {
      try {
        const res = await fetch("/api/tickets?limit=100", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;

        const data = await res.json().catch(() => null);
        if (!cancelled && Array.isArray(data?.tickets)) {
          setSourceTickets(data.tickets);
        }
      } catch {
        // Ignore transient network errors; next poll will retry.
      }
    }

    const interval = setInterval(refreshTickets, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return sourceTickets.filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.tagId && !ticket.tags.some((t) => t.tag.id === filters.tagId)) {
        return false;
      }
      if (q.length >= 2) {
        const haystack = `${ticket.title} ${ticket.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [filters, sourceTickets]);

  return (
    <>
      <TicketFilters
        tags={tags}
        initial={filters}
        mode="client"
        onFiltersChange={setFilters}
      />
      <TicketList tickets={filteredTickets} showCustomer />
    </>
  );
}
