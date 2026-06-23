"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Agent = { id: string; name: string };
type Tag = { id: string; name: string };

export function AgentTicketControls({
  ticketId,
  status,
  priority,
  agentId,
  agents,
  tags,
  selectedTagIds,
}: {
  ticketId: string;
  status: string;
  priority: string;
  agentId: string | null;
  agents: Agent[];
  tags: Tag[];
  selectedTagIds: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    router.refresh();
  }

  function toggleTag(id: string) {
    const next = tagIds.includes(id)
      ? tagIds.filter((t) => t !== id)
      : [...tagIds, id];
    setTagIds(next);
    patch({ tagIds: next });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Manage ticket</CardTitle>
        {saving && <span className="text-xs text-slate-400">Saving…</span>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            defaultValue={status}
            onChange={(e) => patch({ status: e.target.value })}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            defaultValue={priority}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="agent">Assigned agent</Label>
          <Select
            id="agent"
            defaultValue={agentId ?? ""}
            onChange={(e) =>
              patch({ agentId: e.target.value ? e.target.value : null })
            }
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </div>

        {tags.length > 0 && (
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      selected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
