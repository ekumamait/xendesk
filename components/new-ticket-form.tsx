"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string };

export function NewTicketForm({
  tags,
  onCancel,
  onCreated,
  embedded = false,
}: {
  tags: Tag[];
  onCancel?: () => void;
  onCreated?: (ticketId: string) => void;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, priority, tagIds }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not create ticket. Please try again.");
      return;
    }

    const { ticket } = await res.json();
    onCreated?.(ticket.id);
    router.push(`/tickets/${ticket.id}`);
    router.refresh();
  }

  const content = (
    <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              minLength={3}
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              required
              minLength={5}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in detail…"
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.back();
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create ticket"}
            </Button>
          </div>
        </form>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardContent className="py-6">{content}</CardContent>
    </Card>
  );
}
