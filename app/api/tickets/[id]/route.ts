import { type NextRequest, NextResponse } from "next/server";

import { requireApiAgent, requireApiUser } from "@/lib/auth-helpers";
import { apiHandler } from "@/lib/api";
import {
  deleteTicket,
  getTicketForUser,
  updateTicket,
} from "@/lib/services/tickets";
import { updateTicketSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const ticket = await getTicketForUser(user, id);
    return NextResponse.json({ ticket });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return apiHandler(async () => {
    // Only agents can change status, priority, assignment, or tags.
    await requireApiAgent();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const input = updateTicketSchema.parse(body);
    const ticket = await updateTicket(id, input);
    return NextResponse.json({ ticket });
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  return apiHandler(async () => {
    await requireApiAgent();
    const { id } = await params;
    await deleteTicket(id);
    return NextResponse.json({ success: true });
  });
}
