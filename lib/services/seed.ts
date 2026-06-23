import bcrypt from "bcryptjs";

import type { PrismaClient } from "@/lib/generated/prisma/client";

// Shared demo password for every seeded account (documented in the README).
export const DEMO_PASSWORD = "Password123!";

export type SeedCounts = {
  users: number;
  tickets: number;
  tags: number;
  comments: number;
};

/**
 * Populates a deterministic demo dataset. Users are upserted so reseeding never
 * wipes accounts; ticket-related data is reset for a clean, predictable set.
 * Accepts a PrismaClient so both the CLI script and the API route can reuse it.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<SeedCounts> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [agentAda, agentGrace, alice, bob, carol] = await Promise.all([
    prisma.user.upsert({
      where: { email: "ada@xenfi.dev" },
      update: {
        name: "Ada Agent",
        passwordHash,
        role: "AGENT",
      },
      create: {
        name: "Ada Agent",
        email: "ada@xenfi.dev",
        passwordHash,
        role: "AGENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "grace@xenfi.dev" },
      update: {
        name: "Grace Agent",
        passwordHash,
        role: "AGENT",
      },
      create: {
        name: "Grace Agent",
        email: "grace@xenfi.dev",
        passwordHash,
        role: "AGENT",
      },
    }),
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {
        name: "Alice Customer",
        passwordHash,
        role: "CUSTOMER",
      },
      create: {
        name: "Alice Customer",
        email: "alice@example.com",
        passwordHash,
        role: "CUSTOMER",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {
        name: "Bob Customer",
        passwordHash,
        role: "CUSTOMER",
      },
      create: {
        name: "Bob Customer",
        email: "bob@example.com",
        passwordHash,
        role: "CUSTOMER",
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@example.com" },
      update: {
        name: "Carol Customer",
        passwordHash,
        role: "CUSTOMER",
      },
      create: {
        name: "Carol Customer",
        email: "carol@example.com",
        passwordHash,
        role: "CUSTOMER",
      },
    }),
  ]);

  // Reset ticket-related data for a clean, deterministic demo dataset.
  await prisma.comment.deleteMany();
  await prisma.ticketTag.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.tag.deleteMany();

  const tagNames = ["Billing", "Network", "Account", "Bug", "Feature"];
  await prisma.tag.createMany({ data: tagNames.map((name) => ({ name })) });
  const tags = await prisma.tag.findMany();
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t.id]));

  type SeedTicket = {
    title: string;
    description: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    priority: "LOW" | "MEDIUM" | "HIGH";
    customerId: string;
    agentId: string | null;
    tags: string[];
    comments: { authorId: string; body: string }[];
  };

  const tickets: SeedTicket[] = [
    {
      title: "Cannot log into my account",
      description:
        "I keep getting an 'invalid credentials' error even after resetting my password twice.",
      status: "OPEN",
      priority: "HIGH",
      customerId: alice.id,
      agentId: null,
      tags: ["Account"],
      comments: [
        {
          authorId: alice.id,
          body: "This started after the maintenance window last night.",
        },
      ],
    },
    {
      title: "Double charged on my latest invoice",
      description:
        "My June invoice shows two identical charges of $49. Please refund the duplicate.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      customerId: bob.id,
      agentId: agentAda.id,
      tags: ["Billing"],
      comments: [
        {
          authorId: bob.id,
          body: "Attaching the invoice number: INV-20260612.",
        },
        {
          authorId: agentAda.id,
          body: "Thanks Bob, I can see the duplicate and have started a refund.",
        },
      ],
    },
    {
      title: "Intermittent network timeouts",
      description:
        "The dashboard times out roughly every 10 minutes for about 30 seconds.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      customerId: carol.id,
      agentId: agentGrace.id,
      tags: ["Network", "Bug"],
      comments: [
        {
          authorId: agentGrace.id,
          body: "Could you share your region? We are checking upstream latency.",
        },
      ],
    },
    {
      title: "Feature request: dark mode",
      description: "Would love a dark theme for the customer portal.",
      status: "OPEN",
      priority: "LOW",
      customerId: alice.id,
      agentId: null,
      tags: ["Feature"],
      comments: [],
    },
    {
      title: "Password reset email never arrives",
      description:
        "I requested a reset 5 times today and none of the emails arrived.",
      status: "RESOLVED",
      priority: "MEDIUM",
      customerId: bob.id,
      agentId: agentAda.id,
      tags: ["Account"],
      comments: [
        {
          authorId: agentAda.id,
          body: "Your address was on a suppression list. I have removed it — please retry.",
        },
        { authorId: bob.id, body: "Got it now, thank you!" },
      ],
    },
    {
      title: "API returns 500 on bulk export",
      description:
        "Exporting more than 1,000 rows returns a 500 error every time.",
      status: "OPEN",
      priority: "HIGH",
      customerId: carol.id,
      agentId: null,
      tags: ["Bug", "Network"],
      comments: [],
    },
  ];

  for (const t of tickets) {
    await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        customerId: t.customerId,
        agentId: t.agentId,
        tags: { create: t.tags.map((name) => ({ tagId: tagByName[name] })) },
        comments: {
          create: t.comments.map((c) => ({
            authorId: c.authorId,
            body: c.body,
          })),
        },
      },
    });
  }

  return {
    users: await prisma.user.count(),
    tickets: await prisma.ticket.count(),
    tags: await prisma.tag.count(),
    comments: await prisma.comment.count(),
  };
}
