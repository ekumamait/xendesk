import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "@/lib/auth-helpers";

export function apiError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Wraps a route handler so authorization and validation failures are mapped to
 * consistent JSON responses, and unexpected errors never leak internals.
 */
export async function apiHandler(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.status, err.message);
    }
    if (err instanceof ZodError) {
      return apiError(422, "Validation failed", { issues: err.issues });
    }
    console.error("[api] Unhandled error:", err);
    return apiError(500, "Internal server error");
  }
}
