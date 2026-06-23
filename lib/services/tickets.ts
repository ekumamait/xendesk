import { HttpError, isAgent, type SessionUser } from "@/lib/auth-helpers";
import { Prisma } from "@/lib/generated/prisma/client";
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
  tags: { include: { tag: true } },
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
  query: ListTicketsQuery,
): Promise<TicketListItem[]> {
  const where: Prisma.TicketWhereInput = {};

  // Ownership scoping is enforced server-side regardless of query params.
  if (!isAgent(user)) {
    where.customerId = user.id;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.tagId) where.tags = { some: { tagId: query.tagId } };
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return prisma.ticket.findMany({
    where,
    include: ticketListInclude,
    orderBy: [{ createdAt: "desc" }],
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
  return prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      customerId: user.id,
      tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
    },
    include: ticketDetailInclude,
  });
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
    return tx.ticket.update({
      where: { id },
      data,
      include: ticketDetailInclude,
    });
  });
}

export async function deleteTicket(id: string): Promise<void> {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Ticket not found");
  // Comments and ticket-tag rows cascade via the schema.
  await prisma.ticket.delete({ where: { id } });
}

export type TicketMetrics = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  unassigned: number;
  byPriority: { LOW: number; MEDIUM: number; HIGH: number };
};

/** Aggregate counts for the agent overview, computed with indexed queries. */
export async function getTicketMetrics(): Promise<TicketMetrics> {
  const [total, open, inProgress, resolved, unassigned, low, medium, high] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      // Active tickets without an assigned agent.
      prisma.ticket.count({
        where: { agentId: null, status: { not: "RESOLVED" } },
      }),
      prisma.ticket.count({ where: { priority: "LOW" } }),
      prisma.ticket.count({ where: { priority: "MEDIUM" } }),
      prisma.ticket.count({ where: { priority: "HIGH" } }),
    ]);

  return {
    total,
    open,
    inProgress,
    resolved,
    unassigned,
    byPriority: { LOW: low, MEDIUM: medium, HIGH: high },
  };
}
