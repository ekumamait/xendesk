import { type NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth-helpers";
import { apiHandler } from "@/lib/api";
import { addComment, listComments } from "@/lib/services/comments";
import { createCommentSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const comments = await listComments(user, id);
    return NextResponse.json({ comments });
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return apiHandler(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const input = createCommentSchema.parse(body);
    const comment = await addComment(user, id, input);
    return NextResponse.json({ comment }, { status: 201 });
  });
}
