import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/lib/generated/prisma/enums";

export type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
};

/**
 * Error carrying an HTTP status, mapped to a JSON response by the API route
 * wrapper. Lets authorization checks fail loudly without leaking internals.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

export function isAgent(user: { role: Role }): boolean {
  return user.role === "AGENT";
}

// --- Page guards (Server Components): redirect on failure ---

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireAgent(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAgent(user)) redirect("/dashboard");
  return user;
}

// --- API guards (Route Handlers): throw HttpError on failure ---

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You must be signed in");
  return user;
}

export async function requireApiAgent(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (!isAgent(user)) throw new HttpError(403, "Agent access required");
  return user;
}
