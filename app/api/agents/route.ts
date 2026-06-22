import { NextResponse } from "next/server";

import { requireApiAgent } from "@/lib/auth-helpers";
import { apiHandler } from "@/lib/api";
import { listAgents } from "@/lib/services/tags";

// Used by the agent dashboard to populate the ticket assignment dropdown.
export async function GET() {
  return apiHandler(async () => {
    await requireApiAgent();
    const agents = await listAgents();
    return NextResponse.json({ agents });
  });
}
