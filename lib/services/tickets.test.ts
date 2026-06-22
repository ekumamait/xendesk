import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth entrypoint/navigation (imported transitively via auth-helpers)
// and the Prisma singleton so these are pure unit tests with no database.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

// vi.hoisted keeps these mocks available inside the hoisted vi.mock factory.
const { ticket, user, ticketTag } = vi.hoisted(() => ({
  ticket: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn() },
  ticketTag: { deleteMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ticket,
    user,
    ticketTag,
    $transaction: (cb: (tx: unknown) => unknown) => cb({ ticket, ticketTag }),
  },
}));

import type { SessionUser } from "@/lib/auth-helpers";
import {
  getTicketForUser,
  listTickets,
  updateTicket,
} from "@/lib/services/tickets";

const agent: SessionUser = { id: "a1", role: "AGENT" };
const customer: SessionUser = { id: "c1", role: "CUSTOMER" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listTickets", () => {
  it("scopes a customer to their own tickets", async () => {
    ticket.findMany.mockResolvedValue([]);
    await listTickets(customer, {});
    const arg = ticket.findMany.mock.calls[0][0];
    expect(arg.where.customerId).toBe("c1");
  });

  it("does not scope agents and applies filters", async () => {
    ticket.findMany.mockResolvedValue([]);
    await listTickets(agent, { status: "OPEN", priority: "HIGH" });
    const arg = ticket.findMany.mock.calls[0][0];
    expect(arg.where.customerId).toBeUndefined();
    expect(arg.where.status).toBe("OPEN");
    expect(arg.where.priority).toBe("HIGH");
  });
});

describe("getTicketForUser", () => {
  it("returns a customer's own ticket", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1", customerId: "c1" });
    await expect(getTicketForUser(customer, "t1")).resolves.toMatchObject({
      id: "t1",
    });
  });

  it("hides another customer's ticket as 404", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1", customerId: "other" });
    await expect(getTicketForUser(customer, "t1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("lets an agent read any ticket", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1", customerId: "other" });
    await expect(getTicketForUser(agent, "t1")).resolves.toMatchObject({
      id: "t1",
    });
  });

  it("throws 404 when the ticket is missing", async () => {
    ticket.findUnique.mockResolvedValue(null);
    await expect(getTicketForUser(agent, "missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("updateTicket (state changes)", () => {
  it("updates the status of an existing ticket", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1" });
    ticket.update.mockResolvedValue({ id: "t1", status: "RESOLVED" });
    await updateTicket("t1", { status: "RESOLVED" });
    const arg = ticket.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "t1" });
    expect(arg.data.status).toBe("RESOLVED");
  });

  it("rejects updating a missing ticket", async () => {
    ticket.findUnique.mockResolvedValue(null);
    await expect(updateTicket("x", { status: "OPEN" })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects assigning a non-agent user", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1" });
    user.findUnique.mockResolvedValue({ id: "u1", role: "CUSTOMER" });
    await expect(updateTicket("t1", { agentId: "u1" })).rejects.toMatchObject({
      status: 422,
    });
  });

  it("allows assigning an agent user", async () => {
    ticket.findUnique.mockResolvedValue({ id: "t1" });
    user.findUnique.mockResolvedValue({ id: "a2", role: "AGENT" });
    ticket.update.mockResolvedValue({ id: "t1" });
    await updateTicket("t1", { agentId: "a2" });
    expect(ticket.update).toHaveBeenCalled();
  });
});
