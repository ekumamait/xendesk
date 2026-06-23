import { HttpError, isAgent, type SessionUser } from "@/lib/auth-helpers";
import { Prisma } from "@/lib/generated/prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "@/lib/validations";

// Shared shape returned for list views.
const ticketListInclude = {
  customer: { select: { id: true, name: true, email: true } },
  agent: { select: { id: true, name: true, email: true } },
  tags: { select: { tag: { select: { id: true, name: true } } } },
  _count: { select: { comments: true } },
} satisfies Prisma.TicketInclude;

// Detail view also returns the chronological comment thread.
const ticketDetailInclude = {
  customer: { select: { id: true, name: true, email: true } },
  agent: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
  comments: {
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{
  include: typeof ticketListInclude;
}>;

export type TicketDetail = Prisma.TicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;

/**
 * Lists tickets scoped to the caller's role. Customers only ever see their own
 * tickets; agents see everything and can apply filters/search.
 */
export async function listTickets(
  user: SessionUser,
  query: Partial<ListTicketsQuery>,
): Promise<TicketListItem[]> {
  const where: Prisma.TicketWhereInput = {};

  // Ownership scoping is enforced server-side regardless of query params.
  if (!isAgent(user)) {
    where.customerId = user.id;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.tagId) where.tags = { some: { tagId: query.tagId } };
  if (query.q && query.q.length >= 2) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return prisma.ticket.findMany({
    where,
    include: ticketListInclude,
    orderBy: [{ createdAt: "desc" }],
    take: query.limit ?? 50,
  });
}

/**
 * Fetches a single ticket, enforcing that customers can only read their own.
 * Returns 404 (not 403) for unauthorized access to avoid leaking existence.
 */
export async function getTicketForUser(
  user: SessionUser,
  id: string,
): Promise<TicketDetail> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketDetailInclude,
  });

  if (!ticket || (!isAgent(user) && ticket.customerId !== user.id)) {
    throw new HttpError(404, "Ticket not found");
  }

  return ticket;
}

export async function createTicket(
  user: SessionUser,
  input: CreateTicketInput,
): Promise<TicketDetail> {
  const ticket = await prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      customerId: user.id,
      tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
    },
    include: ticketDetailInclude,
  });

  revalidateTag("ticket-metrics", "max");
  return ticket;
}

/**
 * Updates ticket management fields (status, priority, assignment, tags).
 * Caller must already be authorized as an agent by the route handler.
 */
export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<TicketDetail> {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Ticket not found");

  const data: Prisma.TicketUpdateInput = {};
  if (input.status) data.status = input.status;
  if (input.priority) data.priority = input.priority;

  if (input.agentId !== undefined) {
    if (input.agentId === null) {
      data.agent = { disconnect: true };
    } else {
      const agent = await prisma.user.findUnique({
        where: { id: input.agentId },
      });
      if (!agent || agent.role !== "AGENT") {
        throw new HttpError(422, "Assigned user must be an existing agent");
      }
      data.agent = { connect: { id: input.agentId } };
    }
  }

  // Tag updates fully replace the existing set for predictable behavior.
  return prisma.$transaction(async (tx) => {
    if (input.tagIds) {
      await tx.ticketTag.deleteMany({ where: { ticketId: id } });
      data.tags = { create: input.tagIds.map((tagId) => ({ tagId })) };
    }
    const ticket = await tx.ticket.update({
      where: { id },
      data,
      include: ticketDetailInclude,
    });
    revalidateTag("ticket-metrics", "max");
    return ticket;
  });
}

export async function deleteTicket(id: string): Promise<void> {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Ticket not found");
  // Comments and ticket-tag rows cascade via the schema.
  await prisma.ticket.delete({ where: { id } });
  revalidateTag("ticket-metrics", "max");
}

export type TicketMetrics = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  unassigned: number;
  byPriority: { LOW: number; MEDIUM: number; HIGH: number };
};

const getCachedTicketMetrics = unstable_cache(
  async (): Promise<TicketMetrics> => {
    const [statusGroups, priorityGroups, unassigned] = await Promise.all([
      prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: { _all: true } }),
      prisma.ticket.count({
        where: { agentId: null, status: { not: "RESOLVED" } },
      }),
    ]);

    const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    for (const row of statusGroups) {
      statusCounts[row.status] = row._count._all;
    }

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const row of priorityGroups) {
      priorityCounts[row.priority] = row._count._all;
    }

    return {
      total:
        statusCounts.OPEN +
        statusCounts.IN_PROGRESS +
        statusCounts.RESOLVED,
      open: statusCounts.OPEN,
      inProgress: statusCounts.IN_PROGRESS,
      resolved: statusCounts.RESOLVED,
      unassigned,
      byPriority: priorityCounts,
    };
  },
  ["ticket-metrics"],
  { revalidate: 30, tags: ["ticket-metrics"] },
);

/** Aggregate counts for the agent overview, cached briefly to reduce render latency. */
export async function getTicketMetrics(): Promise<TicketMetrics> {
  return getCachedTicketMetrics();
}
