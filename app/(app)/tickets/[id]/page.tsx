import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentTicketControls } from "@/components/agent-ticket-controls";
import { AutoRefresh } from "@/components/auto-refresh";
import { CommentThread } from "@/components/comment-thread";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAgent, requireUser } from "@/lib/auth-helpers";
import { listAgents, listTags } from "@/lib/services/tags";
import { getTicketForUser } from "@/lib/services/tickets";
import { formatDate } from "@/lib/utils";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const ticket = await getTicketForUser(user, id).catch(() => null);
  if (!ticket) notFound();

  const agentView = isAgent(user);
  const [agents, tags] = agentView
    ? await Promise.all([listAgents(), listTags()])
    : [[], []];

  return (
    <div className="space-y-6">
      <AutoRefresh />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-slate-200">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                ticketId={ticket.id}
                initialComments={ticket.comments}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Ticket" value={`#${ticket.id.slice(-6)}`} />
              <Detail label="Customer" value={ticket.customer.name} />
              <Detail
                label="Assigned agent"
                value={ticket.agent?.name ?? "Unassigned"}
              />
              <Detail label="Created" value={formatDate(ticket.createdAt)} />
              <Detail label="Updated" value={formatDate(ticket.updatedAt)} />
            </CardContent>
          </Card>

          {agentView && (
            <AgentTicketControls
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
              agentId={ticket.agentId}
              agents={agents}
              tags={tags}
              selectedTagIds={ticket.tags.map(({ tag }) => tag.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}
