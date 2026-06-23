"use client";

import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/lib/generated/prisma/enums";
import { cn, formatDate, initials } from "@/lib/utils";

type ThreadComment = {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { id: string; name: string; role: Role };
};

export function CommentThread({
  ticketId,
  initialComments,
  currentUserId,
}: {
  ticketId: string;
  initialComments: ThreadComment[];
  currentUserId: string;
}) {
  const [comments, setComments] = useState<ThreadComment[]>(initialComments);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  }, [ticketId]);

  // Poll for new replies to keep the thread near real-time.
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    setSending(false);
    if (!res.ok) {
      setError("Could not send your reply. Please try again.");
      return;
    }

    const data = await res.json();
    setComments((prev) => [...prev, data.comment]);
    setBody("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-slate-400">
            No replies yet. Start the conversation below.
          </p>
        )}
        {comments.map((comment) => {
          const isOwn = comment.author.id === currentUserId;
          return (
            <div
              key={comment.id}
              className={cn("flex gap-3", isOwn && "flex-row-reverse")}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
                {initials(comment.author.name)}
              </span>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2",
                  isOwn
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-100",
                )}
              >
                <div
                  className={cn(
                    "mb-0.5 flex items-center gap-2 text-xs",
                    isOwn ? "text-indigo-100" : "text-slate-400",
                  )}
                >
                  <span className="font-medium">{comment.author.name}</span>
                  <span className="capitalize">
                    {comment.author.role.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    isOwn ? "text-indigo-200" : "text-slate-500",
                  )}
                >
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={sending || !body.trim()}>
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
