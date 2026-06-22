import { type NextRequest, NextResponse } from "next/server";

import { requireApiAgent, requireApiUser } from "@/lib/auth-helpers";
import { apiHandler } from "@/lib/api";
import { createTag, listTags } from "@/lib/services/tags";
import { createTagSchema } from "@/lib/validations";

export async function GET() {
  return apiHandler(async () => {
    await requireApiUser();
    const tags = await listTags();
    return NextResponse.json({ tags });
  });
}

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    await requireApiAgent();
    const body = await request.json().catch(() => ({}));
    const { name } = createTagSchema.parse(body);
    const tag = await createTag(name);
    return NextResponse.json({ tag }, { status: 201 });
  });
}
