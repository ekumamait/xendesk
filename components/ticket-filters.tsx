"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Filters = { status: string; priority: string; tagId: string; q: string };

export function TicketFilters({
  tags,
  initial,
}: {
  tags: { id: string; name: string }[];
  initial: Partial<Filters>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status ?? "");
  const [priority, setPriority] = useState(initial.priority ?? "");
  const [tagId, setTagId] = useState(initial.tagId ?? "");
  const [q, setQ] = useState(initial.q ?? "");
  const isFirstRender = useRef(true);

  function pushFilters(next: Filters) {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    if (next.tagId) params.set("tagId", next.tagId);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  // Debounce free-text search to avoid a navigation per keystroke.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(
      () => pushFilters({ status, priority, tagId, q }),
      350,
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search tickets…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          pushFilters({ status: e.target.value, priority, tagId, q });
        }}
      >
        <option value="">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </Select>

      <Select
        value={priority}
        onChange={(e) => {
          setPriority(e.target.value);
          pushFilters({ status, priority: e.target.value, tagId, q });
        }}
      >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>

      <Select
        value={tagId}
        onChange={(e) => {
          setTagId(e.target.value);
          pushFilters({ status, priority, tagId: e.target.value, q });
        }}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
