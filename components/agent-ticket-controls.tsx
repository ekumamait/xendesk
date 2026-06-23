"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Label } from "@/components/ui/label";
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
  const [statusValue, setStatusValue] = useState(status);
  const [priorityValue, setPriorityValue] = useState(priority);
  const [agentValue, setAgentValue] = useState(agentId ?? "");

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
        {saving && <span className="text-xs text-slate-500">Saving...</span>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Status</Label>
          <DropdownSelect
            label="Status"
            value={statusValue}
            onChange={(value) => {
              setStatusValue(value);
              patch({ status: value });
            }}
            options={[
              { value: "OPEN", label: "Open" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
          />
        </div>

        <div>
          <Label>Priority</Label>
          <DropdownSelect
            label="Priority"
            value={priorityValue}
            onChange={(value) => {
              setPriorityValue(value);
              patch({ priority: value });
            }}
            options={[
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
            ]}
          />
        </div>

        <div>
          <Label>Assigned agent</Label>
          <DropdownSelect
            label="Assigned agent"
            value={agentValue}
            onChange={(value) => {
              setAgentValue(value);
              patch({ agentId: value ? value : null });
            }}
            options={[
              { value: "", label: "Unassigned" },
              ...agents.map((agent) => ({
                value: agent.id,
                label: agent.name,
              })),
            ]}
          />
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
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800",
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
