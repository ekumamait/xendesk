"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";

export type TicketFilterState = {
  status: string;
  priority: string;
  tagId: string;
  q: string;
};

type TicketFiltersMode = "server" | "client";

function normalizeFilters(filters: TicketFilterState): TicketFilterState {
  const q = filters.q.trim();
  return {
    ...filters,
    q: q.length >= 2 ? q : "",
  };
}

export function TicketFilters({
  tags,
  initial,
  mode = "server",
  onFiltersChange,
}: {
  tags: { id: string; name: string }[];
  initial: Partial<TicketFilterState>;
  mode?: TicketFiltersMode;
  onFiltersChange?: (filters: TicketFilterState) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status ?? "");
  const [priority, setPriority] = useState(initial.priority ?? "");
  const [tagId, setTagId] = useState(initial.tagId ?? "");
  const [q, setQ] = useState(initial.q ?? "");
  const isFirstRender = useRef(true);

  function pushFilters(next: TicketFilterState) {
    const normalized = normalizeFilters(next);
    const params = new URLSearchParams();
    if (normalized.status) params.set("status", normalized.status);
    if (normalized.priority) params.set("priority", normalized.priority);
    if (normalized.tagId) params.set("tagId", normalized.tagId);
    if (normalized.q) params.set("q", normalized.q);
    const qs = params.toString();
    const nextPath = qs ? `/dashboard?${qs}` : "/dashboard";

    if (mode === "server") {
      router.replace(nextPath);
    } else {
      window.history.replaceState(null, "", nextPath);
      onFiltersChange?.(normalized);
    }
  }

  // Keep status/priority/tag changes immediate for snappy dropdown UX.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    pushFilters({ status, priority, tagId, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, tagId]);

  // Debounce text search so typing does not trigger a navigation on every key press.
  useEffect(() => {
    if (isFirstRender.current) return;
    const timeout = setTimeout(() => {
      pushFilters({ status, priority, tagId, q });
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          className="pl-9"
          placeholder="Search tickets…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <DropdownSelect
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: "", label: "All statuses" },
          { value: "OPEN", label: "Open" },
          { value: "IN_PROGRESS", label: "In Progress" },
          { value: "RESOLVED", label: "Resolved" },
        ]}
      />

      <DropdownSelect
        label="Priority"
        value={priority}
        onChange={setPriority}
        options={[
          { value: "", label: "All priorities" },
          { value: "LOW", label: "Low" },
          { value: "MEDIUM", label: "Medium" },
          { value: "HIGH", label: "High" },
        ]}
      />

      <DropdownSelect
        label="Tags"
        value={tagId}
        onChange={setTagId}
        options={[
          { value: "", label: "All tags" },
          ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
        ]}
      />
    </div>
  );
}
