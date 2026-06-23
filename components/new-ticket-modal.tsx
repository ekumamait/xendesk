"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { NewTicketForm } from "@/components/new-ticket-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string };

export function NewTicketModal({
  triggerClassName,
  buttonLabel = "New ticket",
  showLabel = true,
}: {
  triggerClassName?: string;
  buttonLabel?: string;
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadTags() {
      setLoadingTags(true);
      setTagsError(null);
      const res = await fetch("/api/tags", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (cancelled) return;

      setLoadingTags(false);
      if (!res.ok) {
        setTagsError(data?.error ?? "Could not load tags.");
        return;
      }

      setTags(data?.tags ?? []);
    }

    void loadTags();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const title = useMemo(() => "Create a new ticket", []);

  return (
    <>
      <button
        type="button"
        className={cn(buttonVariants(), triggerClassName)}
        onClick={() => setOpen(true)}
        aria-label={buttonLabel}
      >
        <Plus className="h-4 w-4" />
        {showLabel && buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <Card
            className="my-4 w-full max-w-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl">{title}</CardTitle>
              <button
                type="button"
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="max-h-[min(78dvh,44rem)] overflow-y-auto py-6">
              {loadingTags ? (
                <p className="text-sm text-slate-400">Loading tags...</p>
              ) : tagsError ? (
                <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
                  {tagsError}
                </p>
              ) : (
                <NewTicketForm
                  tags={tags}
                  embedded
                  onCancel={() => setOpen(false)}
                  onCreated={() => setOpen(false)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
