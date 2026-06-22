import { type NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth-helpers";
import { apiHandler } from "@/lib/api";
import { createTicket, listTickets } from "@/lib/services/tickets";
import { createTicketSchema, listTicketsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const user = await requireApiUser();

    // Only forward params that are actually present so enums validate cleanly.
    const sp = request.nextUrl.searchParams;
    const raw: Record<string, string> = {};
    for (const key of ["status", "priority", "tagId", "q"]) {
      const value = sp.get(key);
      if (value) raw[key] = value;
    }

    const query = listTicketsQuerySchema.parse(raw);
    const tickets = await listTickets(user, query);
    return NextResponse.json({ tickets });
  });
}

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const body = await request.json().catch(() => ({}));
    const input = createTicketSchema.parse(body);
    const ticket = await createTicket(user, input);
    return NextResponse.json({ ticket }, { status: 201 });
  });
}
