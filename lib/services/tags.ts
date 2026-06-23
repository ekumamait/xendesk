import { prisma } from "@/lib/prisma";

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

/**
 * Creates a tag, upserting on the unique name so repeated submissions are
 * idempotent rather than failing on a constraint violation.
 */
export async function createTag(name: string) {
  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

export async function listAgents() {
  return prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
