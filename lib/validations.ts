import { z } from "zod";

// Auth
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

// Enum validators shared with the database enums.
export const ticketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]);
export const ticketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

// Tickets
export const createTicketSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(140),
  description: z.string().trim().min(5, "Description is too short").max(5000),
  priority: ticketPriorityEnum.default("MEDIUM"),
  tagIds: z.array(z.string().min(1)).max(10).optional().default([]),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z
  .object({
    status: ticketStatusEnum.optional(),
    priority: ticketPriorityEnum.optional(),
    agentId: z.string().min(1).nullable().optional(),
    tagIds: z.array(z.string().min(1)).max(10).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

// Comments
export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(5000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Ticket list filters (agent dashboard / search).
export const listTicketsQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  tagId: z.string().optional(),
  q: z.string().trim().max(140).optional(),
});
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
