import { HttpError, isAgent, type SessionUser } from "@/lib/auth-helpers";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateCommentInput } from "@/lib/validations";

const commentInclude = {
  author: { select: { id: true, name: true, role: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

/**
 * Ensures the caller may access the ticket before reading/writing comments.
 * Customers may only touch their own tickets; agents may touch any.
 */
async function assertTicketAccess(user: SessionUser, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, customerId: true },
  });

  if (!ticket || (!isAgent(user) && ticket.customerId !== user.id)) {
    throw new HttpError(404, "Ticket not found");
  }

  return ticket;
}

export async function listComments(
  user: SessionUser,
  ticketId: string,
): Promise<CommentWithAuthor[]> {
  await assertTicketAccess(user, ticketId);
  return prisma.comment.findMany({
    where: { ticketId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(
  user: SessionUser,
  ticketId: string,
  input: CreateCommentInput,
): Promise<CommentWithAuthor> {
  await assertTicketAccess(user, ticketId);
  return prisma.comment.create({
    data: { body: input.body, ticketId, authorId: user.id },
    include: commentInclude,
  });
}
