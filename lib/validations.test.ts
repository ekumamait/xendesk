import { describe, expect, it } from "vitest";

import {
  createTicketSchema,
  signInSchema,
  updateTicketSchema,
} from "@/lib/validations";

describe("createTicketSchema", () => {
  it("defaults priority to MEDIUM and tagIds to []", () => {
    const result = createTicketSchema.parse({
      title: "Login is broken",
      description: "I cannot sign in to my account",
    });
    expect(result.priority).toBe("MEDIUM");
    expect(result.tagIds).toEqual([]);
  });

  it("rejects a title that is too short", () => {
    expect(() =>
      createTicketSchema.parse({
        title: "ab",
        description: "valid description",
      }),
    ).toThrow();
  });

  it("rejects an invalid priority value", () => {
    expect(() =>
      createTicketSchema.parse({
        title: "valid title",
        description: "valid description",
        priority: "URGENT",
      }),
    ).toThrow();
  });
});

describe("updateTicketSchema", () => {
  it("requires at least one field", () => {
    expect(() => updateTicketSchema.parse({})).toThrow();
  });

  it("accepts a single status change", () => {
    expect(updateTicketSchema.parse({ status: "RESOLVED" })).toEqual({
      status: "RESOLVED",
    });
  });

  it("allows clearing assignment with null", () => {
    expect(updateTicketSchema.parse({ agentId: null })).toEqual({
      agentId: null,
    });
  });
});

describe("signInSchema", () => {
  it("rejects an invalid email", () => {
    expect(() =>
      signInSchema.parse({ email: "nope", password: "x" }),
    ).toThrow();
  });

  it("accepts valid credentials", () => {
    expect(
      signInSchema.parse({ email: "a@b.com", password: "secret" }),
    ).toEqual({ email: "a@b.com", password: "secret" });
  });
});
