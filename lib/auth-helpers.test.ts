import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the NextAuth entrypoint and navigation so importing the helpers does not
// pull in the full auth runtime during unit tests.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { auth } from "@/auth";
import {
  HttpError,
  isAgent,
  requireApiAgent,
  requireApiUser,
} from "@/lib/auth-helpers";

// auth() is overloaded (middleware vs. session getter); cast to a plain mock.
const mockAuth = auth as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isAgent", () => {
  it("is true for agents and false for customers", () => {
    expect(isAgent({ role: "AGENT" })).toBe(true);
    expect(isAgent({ role: "CUSTOMER" })).toBe(false);
  });
});

describe("requireApiUser", () => {
  it("throws 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireApiUser()).rejects.toMatchObject({ status: 401 });
  });

  it("returns the user when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "c1", role: "CUSTOMER" } });
    await expect(requireApiUser()).resolves.toMatchObject({ id: "c1" });
  });
});

describe("requireApiAgent", () => {
  it("throws 403 for a customer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "c1", role: "CUSTOMER" } });
    const error = await requireApiAgent().catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(403);
  });

  it("returns the user for an agent", async () => {
    mockAuth.mockResolvedValue({ user: { id: "a1", role: "AGENT" } });
    await expect(requireApiAgent()).resolves.toMatchObject({ role: "AGENT" });
  });
});
