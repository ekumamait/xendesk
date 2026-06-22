import { NextResponse } from "next/server";

import { apiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/services/seed";

// Public, idempotent demo seeding so evaluators can populate data before
// signing in. Safe to call repeatedly; documented in the README.
export async function POST() {
  return apiHandler(async () => {
    const counts = await seedDatabase(prisma);
    return NextResponse.json({ success: true, counts });
  });
}
